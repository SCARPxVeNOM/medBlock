# Stop all MedBlock services (PowerShell script for Windows)
# Usage: .\stop-all.ps1

Write-Host "Stopping all MedBlock services..." -ForegroundColor Yellow
Write-Host ""

# Stop Docker services
Write-Host "Stopping Docker services..." -ForegroundColor Blue
docker-compose down

# Kill Node processes (backend and frontend)
Write-Host "Stopping Node.js processes..." -ForegroundColor Blue
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*medblock*" } | Stop-Process -Force

Write-Host ""
Write-Host "✓ All services stopped." -ForegroundColor Green

