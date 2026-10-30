# One-shot Sirraya REA browser recon (CLI). Requires Chrome + Node; REA MCP optional.
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Captures = Join-Path $Root "docs\references\sirraya-captures"
$Rea = "npx -y rea-agents@6.8.0"

if (-not (Test-Path $Captures)) { New-Item -ItemType Directory -Path $Captures | Out-Null }

function Invoke-ReaScenario([string]$ScenarioFile, [string]$OutName) {
  $out = Join-Path $Captures $OutName
  Write-Host ">> $OutName"
  & npx -y rea-agents@6.8.0 capture-browser-scenario $ScenarioFile --format json 2>&1 |
    Set-Content -Path $out -Encoding Ascii
  if ($LASTEXITCODE -ne 0) { throw "Scenario failed: $OutName" }
  python (Join-Path $PSScriptRoot "sirraya-parse-scenario.py") $out | Out-Host
}

Invoke-ReaScenario (Join-Path $PSScriptRoot "sirraya-full-capture-scenario.json") "2026-10-25-rea-browser-scenario-v3.json"
Invoke-ReaScenario (Join-Path $PSScriptRoot "sirraya-capture-document-pro.json") "2026-10-25-rea-document-pro.json"
Invoke-ReaScenario (Join-Path $PSScriptRoot "sirraya-capture-academy.json") "2026-10-25-rea-academy-v2.json"
Invoke-ReaScenario (Join-Path $PSScriptRoot "sirraya-capture-check-status.json") "2026-10-25-rea-check-status.json"

Write-Host "Done. See docs/references/sirraya-captures/ and 2026-10-25-comprehensive-recon-report.md"
