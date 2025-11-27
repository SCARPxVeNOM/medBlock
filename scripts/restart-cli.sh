#!/bin/bash

# Simple script to restart CLI container with correct crypto mounts

set -e

echo "=== Restarting CLI Container ==="

# Stop and remove CLI
docker stop cli 2>/dev/null || true
docker rm cli 2>/dev/null || true

echo "Starting CLI container..."

# Get the absolute path to fabric-network
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
FABRIC_NETWORK="$PROJECT_ROOT/fabric-network"

# Start CLI container manually with correct mounts
docker run -itd \
  --name cli \
  --network medblock_fabric-network \
  -e GOPATH=/opt/gopath \
  -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock \
  -e FABRIC_LOGGING_SPEC=INFO \
  -e CORE_PEER_ID=cli \
  -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ENABLED=false \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
  -v /var/run/:/host/var/run/ \
  -v "$PROJECT_ROOT/chaincode":/opt/gopath/src/github.com/chaincode \
  -v "$FABRIC_NETWORK/crypto-config":/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto \
  -v "$FABRIC_NETWORK/channel-artifacts":/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts \
  -w /opt/gopath/src/github.com/hyperledger/fabric/peer \
  hyperledger/fabric-tools:2.5 \
  /bin/bash

if [ $? -eq 0 ]; then
    echo "✓ CLI container started"
    sleep 3
    
    # Verify crypto access
    echo "Verifying crypto materials access..."
    docker exec cli ls /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/ 2>&1 | head -5
    
    if [ $? -eq 0 ]; then
        echo "✓ Crypto materials are accessible"
        echo ""
        echo "You can now run:"
        echo "  docker exec cli peer channel create -o orderer.example.com:7050 -c mychannel -f ./channel-artifacts/channel.tx --outputBlock ./channel-artifacts/mychannel.block"
    else
        echo "✗ Crypto materials are NOT accessible"
    fi
else
    echo "✗ Failed to start CLI container"
    exit 1
fi

