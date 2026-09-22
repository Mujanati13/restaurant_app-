Add-Type -AssemblyName System.Drawing

$sizes = @{ 'mipmap-mdpi' = 48; 'mipmap-hdpi' = 72; 'mipmap-xhdpi' = 96; 'mipmap-xxhdpi' = 144; 'mipmap-xxxhdpi' = 192 }
$root = Split-Path -Parent $PSScriptRoot

function New-Canvas([int]$size, [System.Drawing.Color]$background) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear($background)
    return @($bitmap, $graphics)
}

function Save-CustomerIcon([string]$path, [int]$size) {
    $canvas = New-Canvas $size ([System.Drawing.Color]::FromArgb(255, 25, 118, 210))
    $bitmap, $g = $canvas
    $plate = [System.Drawing.RectangleF]::new($size * .17, $size * .17, $size * .66, $size * .66)
    $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::White), $plate)
    $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 187, 222, 251)), [System.Drawing.RectangleF]::new($size * .28, $size * .28, $size * .44, $size * .44))
    $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, $size * .055)
    $g.DrawLine($pen, $size * .21, $size * .22, $size * .21, $size * .77)
    foreach ($x in @(.15, .21, .27)) { $g.DrawLine($pen, $size * $x, $size * .22, $size * $x, $size * .39) }
    $g.DrawLine($pen, $size * .79, $size * .22, $size * .79, $size * .77)
    $g.DrawLine($pen, $size * .79, $size * .22, $size * .86, $size * .36)
    $pen.Dispose(); $g.Dispose(); $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bitmap.Dispose()
}

function Save-VendorIcon([string]$path, [int]$size) {
    $canvas = New-Canvas $size ([System.Drawing.Color]::FromArgb(255, 46, 125, 50))
    $bitmap, $g = $canvas
    $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::White), $size * .21, $size * .43, $size * .58, $size * .37)
    $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 27, 94, 32)), $size * .42, $size * .58, $size * .16, $size * .22)
    $awning = [System.Drawing.RectangleF]::new($size * .14, $size * .24, $size * .72, $size * .25)
    $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 235, 59)), $awning)
    for ($i = 0; $i -lt 4; $i++) {
        $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 239, 83, 80)), $size * (.14 + .18 * $i), $size * .24, $size * .09, $size * .25)
    }
    $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 46, 125, 50)), [System.Drawing.RectangleF]::new($size * .25, $size * .60, $size * .11, $size * .11))
    $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 46, 125, 50)), [System.Drawing.RectangleF]::new($size * .64, $size * .60, $size * .11, $size * .11))
    $g.Dispose(); $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bitmap.Dispose()
}

foreach ($entry in $sizes.GetEnumerator()) {
    $customerPath = Join-Path $root "customer_app\\android\\app\\src\\main\\res\\$($entry.Key)\\ic_launcher.png"
    $vendorPath = Join-Path $root "mobile_app\\android\\app\\src\\main\\res\\$($entry.Key)\\ic_launcher.png"
    Save-CustomerIcon $customerPath $entry.Value
    Save-VendorIcon $vendorPath $entry.Value
}
