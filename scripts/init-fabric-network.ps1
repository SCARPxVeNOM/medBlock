# PowerShell script to initialize Fabric network
# This is a simplified version - full setup requires bash/Linux tools

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MedBlock Fabric Network Initialization" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

Write-Host "Note: Full Fabric setup requires Linux/WSL or Docker Desktop with WSL2" -ForegroundColor Yellow
Write-Host "For Windows, consider using WSL2 or Git Bash" -ForegroundColor Yellow
Write-Host ""

# Check if crypto materials exist
$cryptoPath = "fabric-network\crypto-config"
if (-not (Test-Path $cryptoPath)) {
    Write-Host "Step 2: Crypto materials not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the following in WSL2 or Git Bash:" -ForegroundColor Yellow
    Write-Host "  ./scripts/init-fabric-network.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "OR use the online Fabric setup tools:" -ForegroundColor Yellow
    Write-Host "  https://hyperledger.github.io/fabric-samples/" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "✓ Crypto materials found" -ForegroundColor Green
}
Write-Host ""

# Check if channel artifacts exist
$channelPath = "fabric-network\channel-artifacts"
if (-not (Test-Path $channelPath)) {
    Write-Host "Step 3: Channel artifacts not found!" -ForegroundColor Red
    Write-Host "Please generate them using generate-genesis.sh" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Channel artifacts found" -ForegroundColor Green
}
Write-Host ""

# Start Fabric network
Write-Host "Step 4: Starting Fabric network..." -ForegroundColor Yellow
docker-compose -f fabric-network/docker-compose-fabric.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Fabric network started" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start Fabric network" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Waiting for network to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Fabric Network Started!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps (run in WSL2/Git Bash):" -ForegroundColor Yellow
Write-Host "1. Create channel: docker exec cli peer channel create ..." -ForegroundColor White
Write-Host "2. Install chaincode: ./scripts/install-chaincode.sh" -ForegroundColor White
Write-Host ""

