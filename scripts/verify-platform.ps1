param(
    [string]$BaseUrl = 'http://localhost:8081',
    [string]$StorefrontUrl = 'http://localhost:3000',
    [string]$BackupDirectory = '.platform-verification'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $projectRoot $BackupDirectory
$backupFile = Join-Path $backupRoot 'production-like.sql'
$containerBackupFile = '/tmp/vondo-platform-verification.sql'
$evidenceFile = Join-Path $backupRoot 'evidence.json'

function Assert-NativeSuccess([string]$Operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Operation failed with exit code $LASTEXITCODE."
    }
}

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
Push-Location $projectRoot
try {
    docker compose stop queue scheduler | Out-Null
    Assert-NativeSuccess 'Stopping background workers before the migration rehearsal'
    docker compose up -d --build --force-recreate --wait --wait-timeout 180 db redis app webserver storefront
    Assert-NativeSuccess 'Starting the production-like Compose stack'

    docker compose exec -T db sh -lc 'mysqldump --single-transaction --routines --triggers --no-tablespaces -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > /tmp/vondo-platform-verification.sql'
    Assert-NativeSuccess 'Creating the database backup'
    docker compose cp "db:$containerBackupFile" $backupFile
    Assert-NativeSuccess 'Copying the database backup to the evidence directory'
    docker compose exec -T db rm -f $containerBackupFile
    Assert-NativeSuccess 'Removing the temporary database-container backup'

    if ((Get-Item -LiteralPath $backupFile).Length -lt 1024) { throw 'Database backup is unexpectedly small.' }
    $checksum = (Get-FileHash -LiteralPath $backupFile -Algorithm SHA256).Hash

    docker compose --profile verification rm -sf db_clean | Out-Null
    Assert-NativeSuccess 'Resetting the disposable verification database'
    docker compose --profile verification up -d --wait --wait-timeout 180 db_clean
    Assert-NativeSuccess 'Starting the disposable verification database'
    docker compose cp $backupFile "db_clean:$containerBackupFile"
    Assert-NativeSuccess 'Copying the backup into the disposable verification database'
    docker compose exec -T db_clean sh -lc 'exec mysql -uvondo_clean -pverification-only vondo_clean < /tmp/vondo-platform-verification.sql'
    Assert-NativeSuccess 'Restoring the production-like database backup'
    docker compose exec -T db_clean rm -f $containerBackupFile
    Assert-NativeSuccess 'Removing the temporary restore file'

    docker compose run --rm -e DB_HOST=db_clean -e DB_PORT=3306 -e DB_DATABASE=vondo_clean -e DB_USERNAME=vondo_clean -e DB_PASSWORD=verification-only app php artisan migrate --force
    Assert-NativeSuccess 'Migrating the restored database copy'
    docker compose run --rm -e DB_HOST=db_clean -e DB_PORT=3306 -e DB_DATABASE=vondo_clean -e DB_USERNAME=vondo_clean -e DB_PASSWORD=verification-only app php artisan vondo:finalize-schema --restaurant=default
    Assert-NativeSuccess 'Finalizing tenant ownership on the restored database copy'

    docker compose run --rm app php artisan migrate --force
    Assert-NativeSuccess 'Migrating the primary database after the restored-copy rehearsal'
    docker compose run --rm app php artisan vondo:finalize-schema --restaurant=default
    Assert-NativeSuccess 'Finalizing tenant ownership on the primary database'
    docker compose up -d --force-recreate --wait --wait-timeout 180 queue scheduler
    Assert-NativeSuccess 'Starting queue and scheduler workers after migration'
    docker compose exec -T app php artisan schedule:run
    Assert-NativeSuccess 'Dispatching scheduled health jobs'
    Start-Sleep -Seconds 5
    $monitorPassed = $false
    foreach ($attempt in 1..3) {
        docker compose exec -T app php artisan vondo:monitor
        if ($LASTEXITCODE -eq 0) {
            $monitorPassed = $true
            break
        }
        if ($attempt -lt 3) { Start-Sleep -Seconds 10 }
    }
    if (!$monitorPassed) { throw 'Monitoring the migrated production-like stack failed after three attempts.' }

    $featureTests = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'tests\Feature') -Filter '*Test.php' -File |
        Sort-Object Name
    foreach ($test in $featureTests) {
        $relativeTest = 'tests/Feature/'+$test.Name
        docker compose exec -T app php artisan test $relativeTest
        Assert-NativeSuccess "Running $relativeTest"
    }

    docker compose exec -T app php artisan db:seed --class='Database\Seeders\VondoDemoAccountSeeder' --force
    Assert-NativeSuccess 'Seeding the idempotent platform verification accounts'

    & (Join-Path $PSScriptRoot 'smoke-platform.ps1') -BaseUrl $BaseUrl -Restaurant 'default' -EvidenceDirectory $BackupDirectory
    if (!$?) { throw 'Production smoke testing failed.' }
    $smokeEvidenceFile = Join-Path $backupRoot 'smoke.json'
    if (!(Test-Path -LiteralPath $smokeEvidenceFile)) { throw 'Production smoke evidence was not created.' }

    $live = Invoke-RestMethod -TimeoutSec 30 "$BaseUrl/api/v1/health/live"
    $ready = Invoke-RestMethod -TimeoutSec 30 "$BaseUrl/api/v1/health/ready"
    $storefront = Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 $StorefrontUrl
    if ($storefront.StatusCode -ne 200) { throw 'Storefront did not return HTTP 200.' }

    $evidence = [ordered]@{
        completed_at = (Get-Date).ToString('o')
        backup_file = $backupFile
        backup_sha256 = $checksum
        live = $live
        ready = $ready
        storefront_status = $storefront.StatusCode
        smoke_evidence = $smokeEvidenceFile
    } | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($evidenceFile, $evidence, [System.Text.UTF8Encoding]::new($false))
    Write-Output "Platform verification passed. Evidence: $evidenceFile"
}
finally {
    docker compose --profile verification rm -sf db_clean | Out-Null
    Pop-Location
}
