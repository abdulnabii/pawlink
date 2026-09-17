Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path 'public/icons' | Out-Null
$srcPath = Join-Path (Get-Location) 'public/images/pawlink-official-logo.jpg'
$img = [System.Drawing.Image]::FromFile($srcPath)

foreach ($s in @(192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $s, $s)
    
    $outPath = Join-Path (Get-Location) "public/icons/icon-$s.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outPath"
}

$img.Dispose()
Write-Host "All icons generated successfully"
