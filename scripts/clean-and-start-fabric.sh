#!/bin/bash

# Clean everything and start fresh

set -e

echo "=========================================="
echo "  Clean Start - Fabric Test Network"
echo "=========================================="
echo ""

cd fabric-samples/test-network

echo "Step 1: Stop all Fabric containers..."
./network.sh down

echo ""
echo "Step 2: Remove Docker network..."
docker network rm fabric_test 2>/dev/null || true

echo ""
echo "Step 3: Remove volumes..."
docker volume prune -f

echo ""
echo "Step 4: Clean artifacts..."
rm -rf channel-artifacts/* organizations/peerOrganizations organizations/ordererOrganizations

echo ""
echo "Step 5: Starting network with IMAGE_TAG=2.5..."
IMAGE_TAG=2.5 ./network.sh up -ca -s couchdb

echo ""
echo "Step 6: Verify containers are running..."
docker ps --filter "name=orderer\|peer" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Step 7: Create channel..."
IMAGE_TAG=2.5 ./network.sh createChannel -c mychannel

echo ""
echo "=========================================="
echo "  Network Started Successfully!"
echo "=========================================="
echo ""
echo "Next: Deploy chaincode with:"
echo "  cd fabric-samples/test-network"
echo "  IMAGE_TAG=2.5 ./network.sh deployCC -ccn healthcare-chaincode -ccp ../../chaincode -ccl javascript"

cd ../..

