# Renders tools/icon.html to the PNG app icons in icons/ using Microsoft Edge.
# Usage: powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$page = (Resolve-Path "$PSScriptRoot\icon.html").Path -replace '\\', '/'
$tmp = Join-Path ([IO.Path]::GetTempPath()) 'arcade-icons'
New-Item -ItemType Directory -Force $tmp | Out-Null
New-Item -ItemType Directory -Force "$root\icons" | Out-Null

function Render([string]$query, [string]$out) {
  $url = "file:///$page$query"
  $edgeArgs = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1024,1024', "--screenshot=`"$out`"", "`"$url`"")
  Start-Process -FilePath $edge -ArgumentList $edgeArgs -Wait -WindowStyle Hidden `
    -RedirectStandardError "$tmp\edge.log" -RedirectStandardOutput "$tmp\edge.out"
  $deadline = (Get-Date).AddSeconds(20)
  while (-not (Test-Path $out) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 200 }
  if (-not (Test-Path $out)) { throw "Edge did not write $out" }
}

function Shrink([string]$src, [int]$size, [string]$dst) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $size, $size)
  $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

$full = "$tmp\icon-1024.png"
$safe = "$tmp\icon-maskable-1024.png"
Remove-Item $full, $safe -ErrorAction SilentlyContinue
Render '' $full
Render '?s=58%25' $safe

Shrink $full 180 "$root\icons\apple-touch-icon.png"
Shrink $full 192 "$root\icons\icon-192.png"
Shrink $full 512 "$root\icons\icon-512.png"
Shrink $safe 512 "$root\icons\icon-maskable-512.png"
Get-ChildItem "$root\icons" | Select-Object Name, Length
