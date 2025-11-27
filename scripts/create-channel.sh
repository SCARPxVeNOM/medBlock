#!/bin/bash

# Script to create Fabric channel
# Run this after Fabric network is started

set -e

echo "=== Creating Fabric Channel ==="

# Check if CLI container is running
if ! docker ps | grep -q "cli"; then
    echo "✗ CLI container is not running!"
    echo "Please start Fabric network first:"
    echo "  cd fabric-network"
    echo "  docker-compose -f docker-compose-fabric.yml up -d"
    exit 1
fi

# Check if orderer is running
if ! docker ps | grep -q "orderer"; then
    echo "✗ Orderer container is not running!"
    echo "Please start Fabric network first:"
    echo "  cd fabric-network"
    echo "  docker-compose -f docker-compose-fabric.yml up -d"
    exit 1
fi

# Verify CLI is on the correct network
CLI_NETWORK=$(docker inspect cli --format '{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null || echo "")
ORDERER_NETWORK=$(docker inspect orderer.example.com --format '{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null || echo "")

if [ -z "$CLI_NETWORK" ] || [ -z "$ORDERER_NETWORK" ]; then
    echo "⚠ Warning: Could not verify network configuration"
elif [ "$CLI_NETWORK" != "$ORDERER_NETWORK" ]; then
    echo "✗ CLI and Orderer are on different networks!"
    echo "CLI network: $CLI_NETWORK"
    echo "Orderer network: $ORDERER_NETWORK"
    echo "Restarting CLI container on correct network..."
    
    # Get the network name
    NETWORK_NAME="$ORDERER_NETWORK"
    
    # Stop and remove CLI
    docker stop cli 2>/dev/null || true
    docker rm cli 2>/dev/null || true
    
    # Restart CLI on correct network
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
    FABRIC_NETWORK="$PROJECT_ROOT/fabric-network"
    
    docker run -itd \
      --name cli \
      --network "$NETWORK_NAME" \
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
    
    echo "Waiting for CLI to be ready..."
    sleep 5
fi

# Check if crypto materials are accessible
echo "Verifying crypto materials access..."
if docker exec cli ls /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/ > /dev/null 2>&1; then
    echo "✓ Crypto materials are accessible"
else
    echo "✗ Crypto materials are NOT accessible in CLI container"
    echo "Restarting CLI container..."
    docker stop cli 2>/dev/null || true
    docker rm cli 2>/dev/null || true
    
    # Get network name
    NETWORK_NAME=$(docker network ls | grep fabric | awk '{print $1}' | head -1)
    if [ -z "$NETWORK_NAME" ]; then
        NETWORK_NAME="fabric-network_fabric-network"
    fi
    
    # Restart CLI with correct mounts
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
    FABRIC_NETWORK="$PROJECT_ROOT/fabric-network"
    
    docker run -itd \
      --name cli \
      --network "$NETWORK_NAME" \
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
    
    echo "Waiting for CLI to be ready..."
    sleep 5
fi

# Create channel
echo "Creating channel 'mychannel'..."
docker exec cli peer channel create \
  -o orderer.example.com:7050 \
  -c mychannel \
  -f ./channel-artifacts/channel.tx \
  --outputBlock ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Channel created successfully"
else
    echo "⚠ Channel creation failed (may already exist)"
    echo "Continuing with join..."
fi

# Join peer to channel
echo "Joining peer to channel..."
docker exec cli peer channel join -b ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Peer joined channel"
else
    echo "⚠ Peer join failed (may already be joined)"
fi

# Update anchor peer
echo "Updating anchor peer..."
docker exec cli peer channel update \
  -o orderer.example.com:7050 \
  -c mychannel \
  -f ./channel-artifacts/Org1MSPanchors.tx

if [ $? -eq 0 ]; then
    echo "✓ Anchor peer updated"
else
    echo "⚠ Anchor peer update failed"
fi

echo ""
echo "=== Channel Setup Complete ==="

