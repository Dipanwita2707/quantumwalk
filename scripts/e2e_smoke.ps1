# QuantumWalk end-to-end smoke (local)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "== API tests =="
Push-Location "$root\api"
& "$root\.venv\Scripts\python.exe" -m pytest tests -q
$pytestOk = $LASTEXITCODE
Pop-Location
if ($pytestOk -ne 0) { exit $pytestOk }

Write-Host "== Web typecheck =="
Push-Location "$root\web"
npm run typecheck
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }

Write-Host "== Web production build =="
npm run build
$buildOk = $LASTEXITCODE
if ($buildOk -ne 0) {
  Write-Host "Build failed once (Next.js may require a security-advisory retry); retrying..."
  npm run build
  $buildOk = $LASTEXITCODE
}
Pop-Location
if ($buildOk -ne 0) { exit $buildOk }

Write-Host "== Live API smoke (optional) =="
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 3
  Write-Host "API health:" ($health | ConvertTo-Json -Compress)
} catch {
  Write-Host "API not running on :8000 (skip live check). Start uvicorn to include this step."
}

Write-Host "== Playwright smoke (optional) =="
Push-Location "$root\web"
if (Test-Path "node_modules\@playwright\test") {
  npx playwright test --reporter=line
  if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
} else {
  Write-Host "Skip Playwright (run npm install in web/ first)."
}
Pop-Location

Write-Host "All automated smoke checks passed."
