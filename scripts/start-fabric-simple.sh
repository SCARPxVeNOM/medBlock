#!/bin/bash

# Simple Fabric startup WITHOUT Certificate Authorities (faster, simpler)

set -e

echo "=========================================="
echo "  Starting Fabric Network (Simple Mode)"
echo "=========================================="
echo ""

cd fabric-samples/test-network

echo "Cleaning previous network..."
./network.sh down 2>/dev/null || true

# Remove old network
docker network rm fabric_test 2>/dev/null || true

echo ""
echo "Starting network WITHOUT CA (uses cryptogen - simpler)..."
echo ""

# Start without CA using cryptogen (simpler, no fabric-ca-client needed)
IMAGE_TAG=2.5 ./network.sh up createChannel -c mychannel -s couchdb

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✓ Network Started Successfully!"
    echo "=========================================="
    echo ""
    docker ps --filter "name=orderer\|peer" --format "table {{.Names}}\t{{.Status}}"
    echo ""
    echo "Next: Deploy chaincode"
    echo "  bash scripts/deploy-chaincode.sh"
else
    echo ""
    echo "✗ Network failed to start"
    echo ""
    echo "Check logs:"
    echo "  docker logs orderer.example.com"
    echo "  docker logs peer0.org1.example.com"
    exit 1
fi

cd ../..

