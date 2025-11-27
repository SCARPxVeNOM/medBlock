# Start all MedBlock services (PowerShell script for Windows)
# Usage: .\start-all.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting MedBlock Application" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start Docker services
Write-Host "Step 1: Starting Docker services (Blockchain, MinIO, Vault)..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Docker compose may have issues. Continuing..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 5

# Step 2: Start Backend services
Write-Host ""
Write-Host "Step 2: Starting Backend services..." -ForegroundColor Yellow

# Start Uploader
Write-Host "Starting Backend Uploader on port 3001..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PORT='3001'; node uploader.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Key Service
Write-Host "Starting Backend Key Service on port 3002..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PORT='3002'; node keyservice.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# Step 3: Start Frontend
Write-Host ""
Write-Host "Step 3: Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal

Start-Sleep -Seconds 4

# Step 4: Show status
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✓ MedBlock Application Started!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Backend Uploader API: http://localhost:3001" -ForegroundColor Green
Write-Host "  - Backend Key Service API: http://localhost:3002" -ForegroundColor Green
Write-Host "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor Green
Write-Host "  - Vault Mock: http://localhost:8200" -ForegroundColor Green
Write-Host ""
Write-Host "To stop services, close the PowerShell windows or run: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""

