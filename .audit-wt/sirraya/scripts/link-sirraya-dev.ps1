# Dev links so TypeScript/Next resolve deps for sirraya/web outside web/.
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$webNm = Join-Path $root "web\node_modules"
$sirrayaNm = Join-Path $root "sirraya\web\node_modules"

if (-not (Test-Path $webNm)) {
  Write-Error "Run npm install in web/ first."
}

if (Test-Path $sirrayaNm) {
  Write-Host "Already linked: $sirrayaNm"
} else {
  cmd /c "mklink /J `"$sirrayaNm`" `"$webNm`""
  Write-Host "Created junction $sirrayaNm -> $webNm"
}
