#!/bin/bash

# Start Fabric network with cleanup

set -e

echo "=== Starting Fabric Network ==="

# Cleanup old CLI container first
echo "Cleaning up old containers..."
docker stop cli 2>/dev/null || true
docker rm cli 2>/dev/null || true

# Remove any other CLI containers
OLD_CLI=$(docker ps -a --filter "name=cli" --format "{{.ID}}" 2>/dev/null || true)
if [ -n "$OLD_CLI" ]; then
    echo "Removing additional CLI containers..."
    echo "$OLD_CLI" | xargs -r docker rm -f 2>/dev/null || true
fi

# Start network
echo "Starting Fabric network..."
cd fabric-network
docker-compose -f docker-compose-fabric.yml up -d

if [ $? -eq 0 ]; then
    echo "✓ Fabric network started"
    echo ""
    echo "Waiting for containers to be ready..."
    sleep 10
    
    # Verify containers are running
    echo "Checking container status..."
    docker ps --filter "name=orderer\|peer\|cli" --format "table {{.Names}}\t{{.Status}}"
    
    echo ""
    echo "=== Network Started Successfully ==="
    echo ""
    echo "Next steps:"
    echo "1. Create channel: bash ../scripts/create-channel.sh"
    echo "2. Install chaincode: bash ../scripts/install-chaincode.sh"
else
    echo "✗ Failed to start Fabric network"
    exit 1
fi

