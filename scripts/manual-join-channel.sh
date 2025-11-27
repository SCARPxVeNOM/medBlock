#!/bin/bash

# Manually join peers to channel with correct TLS settings

set -e

echo "=========================================="
echo "  Manually Joining Peers to Channel"
echo "=========================================="
echo ""

cd fabric-samples/test-network

# Check if channel block exists
if [ ! -f "./channel-artifacts/mychannel.block" ]; then
    echo "Error: Channel block not found!"
    echo "Run the network.sh up command first"
    exit 1
fi

# Set environment
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

echo "Step 1: Join Org1 peer (with TLS disabled)..."
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer channel join -b ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Org1 peer joined channel"
else
    echo "✗ Org1 peer failed to join"
    exit 1
fi

echo ""
echo "Step 2: Join Org2 peer (with TLS disabled)..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

peer channel join -b ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Org2 peer joined channel"
else
    echo "✗ Org2 peer failed to join"
    exit 1
fi

echo ""
echo "Step 3: Update anchor peers..."

# Org1 anchor peer
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer channel update -o localhost:7050 -c mychannel -f ./channel-artifacts/Org1MSPanchors.tx

echo "✓ Org1 anchor peer updated"

# Org2 anchor peer
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

peer channel update -o localhost:7050 -c mychannel -f ./channel-artifacts/Org2MSPanchors.tx

echo "✓ Org2 anchor peer updated"

echo ""
echo "=========================================="
echo "  ✓ Peers Joined Successfully!"
echo "=========================================="
echo ""
echo "Verify with:"
echo "  peer channel list"
echo ""
echo "Next: Deploy chaincode"
echo "  cd ../.."
echo "  bash scripts/deploy-chaincode.sh"

cd ../..

