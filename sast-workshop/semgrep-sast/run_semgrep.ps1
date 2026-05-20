Param(
  [string]$RepoRoot = "..\.."
)

$ErrorActionPreference = "Stop"

$ResultsDir = Join-Path $PSScriptRoot "..\results"
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

$TargetBackend = Join-Path $RepoRoot "app"
$TargetFrontend = Join-Path $RepoRoot "app\frontend\src"
$RulesDir = Join-Path $PSScriptRoot "rules"

Write-Host "Running Semgrep custom rules against backend and frontend..."

semgrep --config $RulesDir `
  --json `
  --output (Join-Path $ResultsDir "semgrep_custom_results.json") `
  $TargetBackend $TargetFrontend

Write-Host "Running Semgrep Python registry rules..."

semgrep --config p/python `
  --json `
  --output (Join-Path $ResultsDir "semgrep_python_results.json") `
  $TargetBackend

Write-Host "Running Semgrep JavaScript registry rules..."

semgrep --config p/javascript `
  --json `
  --output (Join-Path $ResultsDir "semgrep_javascript_results.json") `
  $TargetFrontend

Write-Host "Running Semgrep OWASP Top 10 rules..."

semgrep --config p/owasp-top-ten `
  --json `
  --output (Join-Path $ResultsDir "semgrep_owasp_results.json") `
  $TargetBackend $TargetFrontend
