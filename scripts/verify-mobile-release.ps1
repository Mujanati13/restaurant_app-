[CmdletBinding()]
param(
    [ValidateSet('universal', 'whiteLabel')]
    [string]$Flavor = 'universal',

    [ValidateSet('apk', 'appbundle')]
    [string]$ArtifactType = 'apk',

    [string]$Flutter = 'flutter',

    [string]$EvidencePath
)

$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$startedAt = Get-Date
if (-not $EvidencePath) {
    $EvidencePath = Join-Path $workspace '.platform-verification\mobile-release.json'
}
$applications = @(
    @{ Name = 'customer'; Path = Join-Path $workspace 'customer_app' },
    @{ Name = 'vendor'; Path = Join-Path $workspace 'mobile_app' }
)
$evidence = @()

foreach ($application in $applications) {
    $appPath = $application.Path
    $env:APPDATA = Join-Path $appPath '.appdata-release'
    $env:GRADLE_USER_HOME = Join-Path $appPath '.gradle-release'

    New-Item -ItemType Directory -Force -Path $env:APPDATA | Out-Null
    New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null

    Push-Location $appPath
    try {
        & $Flutter build $ArtifactType --release --flavor $Flavor --no-pub
        if ($LASTEXITCODE -ne 0) {
            throw "$($application.Name) Android $ArtifactType build failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }

    $extension = if ($ArtifactType -eq 'apk') { '.apk' } else { '.aab' }
    $artifact = Get-ChildItem -Path (Join-Path $appPath 'build\app\outputs') -Recurse -File |
        Where-Object { $_.Extension -eq $extension -and $_.LastWriteTime -ge $startedAt } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $artifact) {
        throw "$($application.Name) build completed but no newly generated $extension artifact was found. Older artifacts are never accepted as release evidence."
    }

    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $artifact.FullName
    $evidence += [pscustomobject]@{
        App = $application.Name
        Flavor = $Flavor
        Type = $ArtifactType
        Artifact = $artifact.FullName
        Bytes = $artifact.Length
        SHA256 = $hash.Hash
        BuiltAt = $artifact.LastWriteTime.ToString('o')
    }
}

$evidenceDirectory = Split-Path -Parent $EvidencePath
New-Item -ItemType Directory -Force -Path $evidenceDirectory | Out-Null
$evidence | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $EvidencePath -Encoding utf8
$evidence | Format-Table -AutoSize
Write-Host "Release evidence written to $EvidencePath"
