#!/bin/bash

# Start MedBlock application without blockchain (for demo)

set -e

echo "=========================================="
echo "  Starting MedBlock Application"
echo "=========================================="
echo ""

cd /mnt/c/Users/aryan/Desktop/medblock

# Start infrastructure
echo "Step 1: Starting MinIO and Vault..."
docker-compose up -d minio vault-mock

sleep 5

# Install dependencies if needed
echo ""
echo "Step 2: Installing dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..

echo ""
echo "Step 3: Starting backend services..."
cd backend

# Start uploader
PORT=3001 node uploader.js > ../logs/uploader.log 2>&1 &
UPLOADER_PID=$!
echo "✓ Uploader running on port 3001 (PID: $UPLOADER_PID)"

# Start key-service  
PORT=3002 node keyservice.js > ../logs/keyservice.log 2>&1 &
KEYSERVICE_PID=$!
echo "✓ Key-service running on port 3002 (PID: $KEYSERVICE_PID)"

cd ../frontend

echo ""
echo "Step 4: Starting frontend..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

echo ""
echo "=========================================="
echo "  ✓ MedBlock Application Started!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend: http://localhost:5173"
echo "  - Uploader API: http://localhost:3001"
echo "  - Key Service API: http://localhost:3002"
echo "  - MinIO Console: http://localhost:9001 (admin/password123)"
echo "  - Vault Mock: http://localhost:8200"
echo ""
echo "Process IDs (to stop later):"
echo "  - Uploader: $UPLOADER_PID"
echo "  - Key Service: $KEYSERVICE_PID"
echo "  - Frontend: $FRONTEND_PID"
echo ""
echo "To stop: kill $UPLOADER_PID $KEYSERVICE_PID $FRONTEND_PID"
echo ""
echo "Logs are in: logs/"
echo ""

