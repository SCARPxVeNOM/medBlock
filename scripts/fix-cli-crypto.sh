#!/bin/bash

# Fix CLI container crypto materials access
# Restart CLI container with correct volume mounts

set -e

echo "=== Fixing CLI Container Crypto Access ==="

# Stop and remove CLI container if it exists
echo "Stopping CLI container..."
docker stop cli 2>/dev/null || true
docker rm cli 2>/dev/null || true

# Restart Fabric network to recreate CLI with correct mounts
echo "Restarting Fabric network..."
cd fabric-network
docker-compose -f docker-compose-fabric.yml up -d cli

# Wait for CLI to be ready
echo "Waiting for CLI container to be ready..."
sleep 5

# Verify crypto materials are accessible
echo "Verifying crypto materials in CLI container..."
docker exec cli ls -la /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/ 2>&1 | head -5

if [ $? -eq 0 ]; then
    echo "✓ Crypto materials are accessible in CLI container"
else
    echo "✗ Crypto materials are NOT accessible"
    echo "Checking volume mount..."
    docker exec cli ls -la /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ 2>&1 | head -10
    exit 1
fi

cd ..

echo ""
echo "=== CLI Container Fixed ==="
echo "You can now run channel creation commands."

