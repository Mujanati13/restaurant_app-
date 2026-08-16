param(
    [string]$BaseUrl = 'http://localhost:8081',
    [string]$Restaurant = 'default',
    [string]$EvidenceDirectory = '.platform-verification'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$evidenceRoot = Join-Path $projectRoot $EvidenceDirectory
$evidenceFile = Join-Path $evidenceRoot 'smoke.json'
$ownerEmail = 'owner@vondo.local'
$ownerPassword = 'RestaurantOwner!2026'

function Invoke-PlatformJson {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body,
        [string]$Token,
        [hashtable]$AdditionalHeaders = @{}
    )

    $headers = @{
        Accept = 'application/json'
        'X-Restaurant' = $Restaurant
    }
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    foreach ($key in $AdditionalHeaders.Keys) { $headers[$key] = $AdditionalHeaders[$key] }

    $arguments = @{
        Method = $Method
        Uri = $BaseUrl.TrimEnd('/') + $Path
        Headers = $headers
        TimeoutSec = 30
    }
    if ($null -ne $Body) {
        $arguments.ContentType = 'application/json'
        $arguments.Body = $Body | ConvertTo-Json -Depth 30 -Compress
    }

    try {
        Invoke-RestMethod @arguments
    }
    catch {
        $details = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                if (![string]::IsNullOrWhiteSpace($responseBody)) { $details = $responseBody }
            }
            catch {}
        }
        throw "$Method $Path failed: $details"
    }
}

function Assert-Value([bool]$Condition, [string]$Message) {
    if (!$Condition) { throw $Message }
}

New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null

$live = Invoke-PlatformJson -Method GET -Path '/api/v1/health/live'
$ready = Invoke-PlatformJson -Method GET -Path '/api/v1/health/ready'
Assert-Value ($live.status -eq 'ok') 'The liveness endpoint did not report ok.'
Assert-Value ($ready.status -eq 'healthy') 'The readiness endpoint did not report healthy.'

$ownerSession = Invoke-PlatformJson -Method POST -Path '/api/v1/owner/token' -Body @{
    email = $ownerEmail
    password = $ownerPassword
    device_name = 'platform-smoke-owner'
}
Assert-Value (![string]::IsNullOrWhiteSpace($ownerSession.token)) 'Owner login did not return an access token.'
Assert-Value ($ownerSession.refresh_token.Length -eq 80) 'Owner login did not return a valid refresh token.'

$ownerSession = Invoke-PlatformJson -Method POST -Path '/api/v1/owner/refresh' -Body @{
    refresh_token = $ownerSession.refresh_token
}
$ownerToken = $ownerSession.token
Assert-Value (![string]::IsNullOrWhiteSpace($ownerToken)) 'Owner refresh did not rotate the access token.'

$ownerBootstrap = Invoke-PlatformJson -Method GET -Path '/api/v1/owner/bootstrap' -Token $ownerToken
$ownerMenus = Invoke-PlatformJson -Method GET -Path '/api/v1/owner/menus' -Token $ownerToken
Assert-Value ($null -ne $ownerBootstrap.data) 'Owner bootstrap returned no data.'
Assert-Value ($null -ne $ownerMenus.data) 'Owner menu list returned no data.'

$revisions = Invoke-PlatformJson -Method GET -Path '/api/v1/owner/brand-revisions' -Token $ownerToken
$sourceRevision = @($revisions.data) | Select-Object -First 1
Assert-Value ($null -ne $sourceRevision.configuration) 'No brand configuration is available for the publish smoke test.'
$brandConfiguration = $sourceRevision.configuration
if ($null -eq $brandConfiguration.navigation) {
    $brandConfiguration | Add-Member -NotePropertyName navigation -NotePropertyValue @(
        @{ label = 'Home'; href = '#/' }
        @{ label = 'Menu'; href = '#/menu' }
        @{ label = 'Reserve Table'; href = '#/reservations' }
        @{ label = 'Locations'; href = '#/locations' }
    )
}
$draft = Invoke-PlatformJson -Method POST -Path '/api/v1/owner/brand-revisions' -Token $ownerToken -Body $brandConfiguration
Assert-Value ($draft.data.id -gt 0) 'Brand draft creation did not return a revision ID.'
$published = Invoke-PlatformJson -Method POST -Path ("/api/v1/owner/brand-revisions/{0}/publish" -f $draft.data.id) -Token $ownerToken
Assert-Value ($null -ne $published.data.published_at) 'Brand revision was not published.'

$uploadPath = Join-Path $projectRoot 'public/vendor/igniter/images/no_photo.png'
Assert-Value (Test-Path -LiteralPath $uploadPath) 'The smoke-test image fixture is missing.'
$uploadOutput = & curl.exe -sS --fail-with-body --max-time 30 `
    -H 'Accept: application/json' `
    -H "Authorization: Bearer $ownerToken" `
    -H "X-Restaurant: $Restaurant" `
    -F "image=@$uploadPath;type=image/png" `
    ($BaseUrl.TrimEnd('/') + '/api/v1/owner/media')
if ($LASTEXITCODE -ne 0) { throw "Owner media upload failed: $($uploadOutput -join [Environment]::NewLine)" }
$uploaded = ($uploadOutput -join [Environment]::NewLine) | ConvertFrom-Json
Assert-Value (![string]::IsNullOrWhiteSpace($uploaded.data.id)) 'Owner media upload returned no asset ID.'
$mediaAssetId = $uploaded.data.id
$mediaResponse = Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 -Headers @{
    Accept = 'image/png,image/*'
    'X-Restaurant' = $Restaurant
} -Uri ($BaseUrl.TrimEnd('/') + '/api/v1/storefront/media/' + $mediaAssetId)
Assert-Value ($mediaResponse.StatusCode -eq 200) 'The uploaded storefront media is not publicly readable.'

$locations = Invoke-PlatformJson -Method GET -Path '/api/v1/storefront/locations'
$menus = Invoke-PlatformJson -Method GET -Path '/api/v1/storefront/menus'
$location = @($locations.data) | Select-Object -First 1
$menuSummary = @($menus.data) | Select-Object -First 1
Assert-Value ($location.id -gt 0) 'The storefront has no active location.'
Assert-Value ($menuSummary.id -gt 0) 'The storefront has no active menu item.'
$menu = Invoke-PlatformJson -Method GET -Path ("/api/v1/storefront/menus/{0}" -f $menuSummary.id)
$selectedOptions = @()
foreach ($option in @($menu.data.options)) {
    if ($option.required) {
        $value = @($option.values) | Select-Object -First 1
        Assert-Value ($value.id -gt 0) ("Required menu option '{0}' has no selectable value." -f $option.name)
        $selectedOptions += @{
            option_id = [int]$option.id
            values = @(@{ value_id = [int]$value.id; quantity = 1 })
        }
    }
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$customerEmail = "platform-smoke-$stamp@example.test"
$customerPassword = 'PlatformSmoke!2026'
$null = Invoke-PlatformJson -Method POST -Path '/api/v1/storefront/register' -Body @{
    first_name = 'Platform'
    last_name = 'Smoke'
    email = $customerEmail
    telephone = '+15550001111'
    password = $customerPassword
    password_confirm = $customerPassword
}
$customerSession = Invoke-PlatformJson -Method POST -Path '/api/v1/storefront/token' -Body @{
    email = $customerEmail
    password = $customerPassword
    device_name = 'platform-smoke-storefront'
}
$customerToken = $customerSession.token
Assert-Value (![string]::IsNullOrWhiteSpace($customerToken)) 'Customer login did not return an access token.'
$account = Invoke-PlatformJson -Method GET -Path '/api/v1/storefront/account' -Token $customerToken
Assert-Value ($account.data.email -eq $customerEmail) 'The customer account response does not match the authenticated customer.'

$orderItem = @{ menu_id = [int]$menu.data.id; quantity = 1 }
if ($selectedOptions.Count -gt 0) { $orderItem.options = $selectedOptions }
$order = Invoke-PlatformJson -Method POST -Path '/api/v1/storefront/orders' -Token $customerToken `
    -AdditionalHeaders @{ 'Idempotency-Key' = "smoke-order-$stamp" } -Body @{
        location_id = [int]$location.id
        order_type = 'collection'
        first_name = 'Platform'
        last_name = 'Smoke'
        telephone = '+15550001111'
        items = @($orderItem)
    }
Assert-Value ($order.data.id -gt 0) 'Storefront order creation returned no order ID.'
$createdOrderId = [int]$order.data.id

$reservationDate = (Get-Date).Date.AddDays(30).ToString('yyyy-MM-dd')
$reservationTime = '14:00'
$availability = Invoke-PlatformJson -Method GET -Path ("/api/storefront/tables/availability?location_id={0}&date={1}&time={2}&guest_num=2" -f $location.id, $reservationDate, $reservationTime)
$table = @($availability.data) | Select-Object -First 1
Assert-Value ($table.id -gt 0) 'No dining table is available for the reservation smoke test.'
$reservation = Invoke-PlatformJson -Method POST -Path '/api/v1/storefront/reservations' -Token $customerToken `
    -AdditionalHeaders @{ 'Idempotency-Key' = "smoke-reservation-$stamp" } -Body @{
        location_id = [int]$location.id
        table_id = [int]$table.id
        guest_num = 2
        reserve_date = $reservationDate
        reserve_time = $reservationTime
        first_name = 'Platform'
        last_name = 'Smoke'
        telephone = '+15550001111'
    }
Assert-Value ($reservation.data.id -gt 0) 'Storefront reservation creation returned no reservation ID.'
$createdReservationId = [int]$reservation.data.id

$vendorSession = Invoke-PlatformJson -Method POST -Path '/api/v1/vendor/token' -Body @{
    email = $ownerEmail
    password = $ownerPassword
    device_name = 'platform-smoke-vendor'
}
$vendorToken = $vendorSession.token
$vendorBootstrap = Invoke-PlatformJson -Method GET -Path '/api/vendor/bootstrap' -Token $vendorToken
$orderStatuses = @($vendorBootstrap.data.order_statuses)
$reservationStatuses = @($vendorBootstrap.data.reservation_statuses)
Assert-Value ($orderStatuses.Count -gt 0) 'Vendor bootstrap returned no order statuses.'
Assert-Value ($reservationStatuses.Count -gt 0) 'Vendor bootstrap returned no reservation statuses.'
$vendorOrders = Invoke-PlatformJson -Method GET -Path ("/api/vendor/orders?location_id={0}&limit=100" -f $location.id) -Token $vendorToken
$vendorReservations = Invoke-PlatformJson -Method GET -Path ("/api/vendor/reservations?location_id={0}&limit=100&from_date={1}" -f $location.id, $reservationDate) -Token $vendorToken
$vendorOrderIds = @($vendorOrders.data | ForEach-Object { [int]$_.id })
$vendorReservationIds = @($vendorReservations.data | ForEach-Object { [int]$_.id })
Assert-Value ($vendorOrderIds -contains $createdOrderId) ("The vendor order list does not contain new order {0}; returned IDs: {1}." -f $createdOrderId, ($vendorOrderIds -join ','))
Assert-Value ($vendorReservationIds -contains $createdReservationId) ("The vendor reservation list does not contain new reservation {0}; returned IDs: {1}." -f $createdReservationId, ($vendorReservationIds -join ','))
$orderStatus = $orderStatuses | Where-Object { $_.id -ne $order.data.status.id } | Select-Object -First 1
if ($null -eq $orderStatus) { $orderStatus = $orderStatuses | Select-Object -First 1 }
$updatedOrder = Invoke-PlatformJson -Method PATCH -Path ("/api/vendor/orders/{0}/status" -f $createdOrderId) -Token $vendorToken -Body @{
    location_id = [int]$location.id
    status_id = [int]$orderStatus.id
    comment = 'Automated production smoke test'
    notify = $false
}
Assert-Value ($updatedOrder.data.status_id -eq $orderStatus.id) 'Vendor order status update did not persist.'
$reservationStatus = $reservationStatuses | Where-Object { $_.id -ne $reservation.data.status.id } | Select-Object -First 1
if ($null -eq $reservationStatus) { $reservationStatus = $reservationStatuses | Select-Object -First 1 }
$updatedReservation = Invoke-PlatformJson -Method PATCH -Path ("/api/vendor/reservations/{0}/status" -f $createdReservationId) -Token $vendorToken -Body @{
    location_id = [int]$location.id
    status_id = [int]$reservationStatus.id
    comment = 'Automated production smoke test'
    notify = $false
}
Assert-Value ($updatedReservation.data.status_id -eq $reservationStatus.id) 'Vendor reservation status update did not persist.'

$null = Invoke-PlatformJson -Method DELETE -Path ("/api/v1/owner/media/{0}" -f $mediaAssetId) -Token $ownerToken
Start-Sleep -Seconds 3
$finalReady = Invoke-PlatformJson -Method GET -Path '/api/v1/health/ready'
Assert-Value ($finalReady.status -eq 'healthy') 'The platform became unhealthy while processing smoke-test background jobs.'

$evidence = [ordered]@{
    completed_at = (Get-Date).ToString('o')
    base_url = $BaseUrl
    restaurant = $Restaurant
    health = [ordered]@{ live = $live.status; ready = $ready.status }
    post_write_health = $finalReady.status
    owner = [ordered]@{
        email = $ownerEmail
        login = 'passed'
        refresh = 'passed'
        list = 'passed'
        brand_revision_id = [int]$draft.data.id
        brand_publish = 'passed'
        media_upload_and_delivery = 'passed'
        media_cleanup = 'passed'
    }
    storefront = [ordered]@{
        customer_email = $customerEmail
        account = 'passed'
        order_id = $createdOrderId
        reservation_id = $createdReservationId
    }
    vendor = [ordered]@{
        list = 'passed'
        order_status_update = 'passed'
        reservation_status_update = 'passed'
    }
} | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($evidenceFile, $evidence, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Production smoke tests passed. Evidence: $evidenceFile"
