# REA readiness check — run setup interactively when doctor fails.
$ErrorActionPreference = "Stop"
Write-Host "Checking REA CLI..."
npx -y rea-agents@latest doctor
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Run: npx rea-agents setup"
  Write-Host "Then restart Cursor. See sirraya/docs/operations/rea-mcp-setup.md"
  exit $LASTEXITCODE
}
Write-Host "REA doctor OK."
