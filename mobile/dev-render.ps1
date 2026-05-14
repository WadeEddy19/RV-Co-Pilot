param(
  [string]$ApiBaseUrl = "https://rv-gateway.onrender.com",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$envPath    = Join-Path $PSScriptRoot ".env"
$backupPath = Join-Path $PSScriptRoot ".env.local-backup"

if (Test-Path $envPath) {
  Copy-Item $envPath $backupPath -Force
  Write-Host "Backed up existing .env -> .env.local-backup" -ForegroundColor DarkGray
}

$auth0Domain   = ""
$auth0ClientId = ""
$auth0Audience = ""

if (Test-Path $backupPath) {
  Get-Content $backupPath | ForEach-Object {
    if ($_ -match '^\s*EXPO_PUBLIC_AUTH0_DOMAIN\s*=\s*(.+)$')    { $auth0Domain   = $Matches[1].Trim() }
    if ($_ -match '^\s*EXPO_PUBLIC_AUTH0_CLIENT_ID\s*=\s*(.+)$') { $auth0ClientId = $Matches[1].Trim() }
    if ($_ -match '^\s*EXPO_PUBLIC_AUTH0_AUDIENCE\s*=\s*(.+)$')  { $auth0Audience = $Matches[1].Trim() }
  }
}

@"
EXPO_PUBLIC_AUTH0_DOMAIN=$auth0Domain
EXPO_PUBLIC_AUTH0_CLIENT_ID=$auth0ClientId
EXPO_PUBLIC_AUTH0_AUDIENCE=$auth0Audience
EXPO_PUBLIC_API_BASE_URL=$ApiBaseUrl
"@ | Out-File -Encoding utf8 $envPath

Write-Host "Pointing mobile app at: $ApiBaseUrl" -ForegroundColor Cyan

if (-not $SkipInstall) {
  if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules"))) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
  }
}

$restore = {
  if (Test-Path $backupPath) {
    Copy-Item $backupPath $envPath -Force
    Remove-Item $backupPath -Force
    Write-Host "`nRestored original .env" -ForegroundColor DarkGray
  }
}
try {
  npm run web
}
finally {
  & $restore
}
