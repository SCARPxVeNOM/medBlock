#!/bin/bash

# Restart orderer container

set -e

echo "=== Restarting Orderer ==="

cd fabric-network

# Stop and remove orderer
echo "Stopping orderer..."
docker stop orderer.example.com 2>/dev/null || true
docker rm orderer.example.com 2>/dev/null || true

# Start orderer
echo "Starting orderer..."
docker-compose -f docker-compose-fabric.yml up -d orderer.example.com

# Wait for orderer to be ready
echo "Waiting for orderer to start..."
sleep 5

# Check orderer status
if docker ps | grep -q "orderer"; then
    echo "✓ Orderer is running"
    
    # Check orderer logs
    echo "Checking orderer logs..."
    docker logs orderer.example.com --tail 5
    
    echo ""
    echo "=== Orderer Restarted ==="
else
    echo "✗ Orderer failed to start"
    echo "Checking logs..."
    docker logs orderer.example.com --tail 20
    exit 1
fi

cd ..

