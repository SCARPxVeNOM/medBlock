#!/bin/bash

# Bash script to start all development services
# Run this after Docker Desktop is started

echo "=== MedBlock Development Startup ==="
echo ""

# Check if Docker is running
echo "Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo "✓ Docker is running"
else
    echo "✗ Docker Desktop is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Start Docker services
echo ""
echo "Starting Docker services (MinIO, Vault-mock)..."
docker-compose -f docker-compose.simple.yml up -d

if [ $? -eq 0 ]; then
    echo "✓ Docker services started"
else
    echo "✗ Failed to start Docker services"
    exit 1
fi

# Wait for services to be ready
echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check if Node.js is installed
echo ""
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION installed"
else
    echo "✗ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Install backend dependencies if needed
echo ""
echo "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✓ Backend dependencies installed"
else
    echo "✓ Backend dependencies already installed"
fi

# Install frontend dependencies if needed
echo ""
echo "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi

# Summary
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Start backend uploader service:"
echo "   cd backend"
echo "   npm run start:uploader"
echo ""
echo "2. Start backend key service (in another terminal):"
echo "   cd backend"
echo "   npm run start:keyservice"
echo ""
echo "3. Start frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "Services will be available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Uploader API: http://localhost:3001"
echo "  - Key Service: http://localhost:3002"
echo "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo ""

