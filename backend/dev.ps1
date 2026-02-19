param(
  [switch]$Fresh,
  [switch]$InstallOnly
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 1) Ensure venv exists
$venvDir = Join-Path $PSScriptRoot "venv"
$pythonVenv = Join-Path $venvDir "Scripts\python.exe"
$pipVenv = Join-Path $venvDir "Scripts\pip.exe"

if ($Fresh -and (Test-Path $venvDir)) {
  Remove-Item -Recurse -Force $venvDir
}

if (-not (Test-Path $pythonVenv)) {
  python -m venv $venvDir
}

# 2) Create .env once if missing (you can also maintain it manually)
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
  Write-Host "Creating .env (edit it if needed)..."
  @"
MONGODB_URI=mongodb+srv://rv-copilot-backend:YrMNQV6Ga2n2WwGw@rv-copilot-db.ahaowvw.mongodb.net/?appName=rv-copilot-db
DATABASE_NAME=rv_copilot
"@ | Out-File -Encoding utf8 $envPath
}

# 3) Load .env into this process so app.py sees it
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $k,$v = $_ -split '=',2
  $k = $k.Trim()
  $v = $v.Trim().Trim('"')
  [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
}

# 4) Install deps
& $pipVenv install -r (Join-Path $PSScriptRoot "requirements.txt") | Out-Null

# 4b) Ensure CORS support is installed (needed for Expo web calling Flask)
& $pipVenv install flask-cors | Out-Null

if ($InstallOnly) { 
  Write-Host "Done (deps installed)."
  exit 0
}

# 5) Run backend
& $pythonVenv (Join-Path $PSScriptRoot "app.py")
