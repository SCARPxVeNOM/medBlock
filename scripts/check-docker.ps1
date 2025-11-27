# Quick script to check if Docker Desktop is running

Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow

try {
    $result = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker Desktop is running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Running containers:" -ForegroundColor Cyan
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        exit 0
    } else {
        Write-Host "✗ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Open Docker Desktop application" -ForegroundColor White
        Write-Host "2. Wait for it to fully start" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "✗ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "2. Start Docker Desktop" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    exit 1
}

