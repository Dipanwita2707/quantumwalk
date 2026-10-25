# Creates web/sirraya junction -> sirraya/web (required for Next.js on Windows).
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $root) { $root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }
$link = Join-Path $root "web\sirraya"
$target = Join-Path $root "sirraya\web"
if (Test-Path $link) {
  Write-Host "Already linked: $link"
  exit 0
}
cmd /c "mklink /J `"$link`" `"$target`""
Write-Host "Created junction $link -> $target"
