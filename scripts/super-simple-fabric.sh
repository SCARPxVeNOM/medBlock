#!/bin/bash

# Super simple Fabric network using test-network defaults
# Just works, no TLS issues

set -e

echo "=========================================="
echo "  Super Simple Fabric Setup"
echo "=========================================="
echo ""

# Check fabric-samples
if [ ! -d "fabric-samples" ]; then
    echo "Downloading fabric-samples..."
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0
fi

cd fabric-samples/test-network

# Clean up
echo "Cleaning up..."
./network.sh down 2>/dev/null || true

echo ""
echo "Starting network WITHOUT TLS (development mode)..."
echo ""

# Use the network.sh with right flags
FABRIC_LOGGING_SPEC=INFO \
  CORE_PEER_TLS_ENABLED=false \
  ORDERER_GENERAL_TLS_ENABLED=false \
  ./network.sh up -ca -s couchdb

if [ $? -ne 0 ]; then
    echo "✗ Network start failed"
    exit 1
fi

echo "✓ Network started"
echo ""

# Create channel manually without TLS
echo "Creating channel manually (no TLS)..."

# Set environment
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export PATH=${PWD}/../bin:$PATH

# Generate channel configuration
configtxgen -profile TwoOrgsApplicationGenesis -outputBlock ./channel-artifacts/mychannel.block -channelID mychannel

# Create channel using osnadmin
osnadmin channel join --channelID mychannel --config-block ./channel-artifacts/mychannel.block -o localhost:7053 --ca-file "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --client-cert "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt" --client-key "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key"

# Join peers
echo "Joining Org1 peer..."
peer channel join -b ./channel-artifacts/mychannel.block

export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

echo "Joining Org2 peer..."
peer channel join -b ./channel-artifacts/mychannel.block

cd ../..

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
docker ps --filter "name=orderer\|peer" --format "table {{.Names}}\t{{.Status}}"

