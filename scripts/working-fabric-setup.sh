#!/bin/bash

# WORKING Fabric setup - let test-network do its job!

set -e

echo "=========================================="
echo "  WORKING Fabric Network Setup"
echo "=========================================="
echo ""

cd /mnt/c/Users/aryan/Desktop/medblock/fabric-samples/test-network

# Clean up Docker network issue
echo "Cleaning Docker network..."
docker network rm fabric_test 2>/dev/null || true

# Let the official test-network script do its job!
echo ""
echo "Starting network with channel (using official script)..."
echo ""

# Use IMAGE_TAG to force v2.5 images
IMAGE_TAG=2.5 ./network.sh up createChannel -c mychannel

if [ $? -ne 0 ]; then
    echo "✗ Network failed to start"
    echo ""
    echo "The issue is likely the TLS configuration mismatch."
    echo "The network started but peers couldn't join the channel."
    echo ""
    echo "Trying workaround: use test-network's deployCC which will handle channel joins..."
    echo ""
fi

# Check if channel exists on peer
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo ""
echo "Checking if peer is on channel..."
peer channel list 2>/dev/null || echo "Peer not joined yet"

echo ""
echo "=========================================="
echo "  Network Status"
echo "=========================================="
docker ps --filter "name=peer\|orderer" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "Next: Deploy chaincode (this will handle channel if needed)"
echo "  cd /mnt/c/Users/aryan/Desktop/medblock/chaincode && npm install"
echo "  cd ../fabric-samples/test-network"
echo "  IMAGE_TAG=2.5 ./network.sh deployCC -ccn healthcare -ccp /mnt/c/Users/aryan/Desktop/medblock/chaincode -ccl javascript"

cd /mnt/c/Users/aryan/Desktop/medblock

