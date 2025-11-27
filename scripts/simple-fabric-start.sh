#!/bin/bash

# Simplified Fabric network startup using test-network
# Disables TLS for easier development

set -e

echo "=========================================="
echo "  Simple Fabric Network Setup"
echo "=========================================="
echo ""

cd fabric-samples/test-network

# Clean everything
echo "Cleaning previous network..."
./network.sh down 2>/dev/null || true

# Create a custom docker-compose override to disable TLS
cat > docker/docker-compose-test-net-no-tls.yaml <<'EOF'
version: '3.7'

services:
  peer0.org1.example.com:
    environment:
      - CORE_PEER_TLS_ENABLED=false
      
  peer0.org2.example.com:
    environment:
      - CORE_PEER_TLS_ENABLED=false
      
  orderer.example.com:
    environment:
      - ORDERER_GENERAL_TLS_ENABLED=false
EOF

echo "✓ Created TLS override configuration"
echo ""

# Start network with our override
echo "Starting network..."
IMAGE_TAG=latest docker-compose \
  -f compose/compose-test-net.yaml \
  -f docker/docker-compose-test-net-no-tls.yaml \
  up -d

if [ $? -eq 0 ]; then
    echo "✓ Network containers started"
else
    echo "✗ Failed to start network"
    exit 1
fi

# Wait for containers to be ready
echo "Waiting for containers to be ready..."
sleep 10

# Verify
echo ""
echo "Checking containers..."
docker ps --filter "name=orderer\|peer" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "✓ Network is running (without TLS)"

# Now create channel without TLS
echo ""
echo "Creating channel (no TLS)..."

export CORE_PEER_TLS_ENABLED=false
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Create channel
../bin/peer channel create -o localhost:7050 -c mychannel \
  -f ./channel-artifacts/mychannel.tx \
  --outputBlock ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Channel created"
else
    echo "Creating channel using configtxgen..."
    ../bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/mychannel.tx -channelID mychannel
    ../bin/peer channel create -o localhost:7050 -c mychannel -f ./channel-artifacts/mychannel.tx --outputBlock ./channel-artifacts/mychannel.block
fi

# Join Org1 peer
echo "Joining Org1 peer to channel..."
../bin/peer channel join -b ./channel-artifacts/mychannel.block

# Join Org2 peer
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

echo "Joining Org2 peer to channel..."
../bin/peer channel join -b ./channel-artifacts/mychannel.block

cd ../..

echo ""
echo "=========================================="
echo "  Network Setup Complete!"
echo "=========================================="
echo ""
echo "Network is running without TLS (simpler for development)"
echo ""
echo "Next: Deploy chaincode with bash scripts/deploy-chaincode-simple.sh"

