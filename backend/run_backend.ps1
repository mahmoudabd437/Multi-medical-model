$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $backendDir
$python = Join-Path $projectDir ".venv310\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Expected Python virtual environment was not found at: $python"
}

Set-Location $backendDir
& $python manage.py runserver
