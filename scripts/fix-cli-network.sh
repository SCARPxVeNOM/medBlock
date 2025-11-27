#!/bin/bash

# Fix CLI container network connectivity

set -e

echo "=== Fixing CLI Container Network ==="

# Get the network that orderer is on
ORDERER_NETWORK=$(docker inspect orderer.example.com --format '{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null || echo "")

if [ -z "$ORDERER_NETWORK" ]; then
    echo "✗ Orderer container not found!"
    echo "Please start Fabric network first:"
    echo "  cd fabric-network"
    echo "  docker-compose -f docker-compose-fabric.yml up -d"
    exit 1
fi

echo "Orderer is on network: $ORDERER_NETWORK"

# Stop and remove CLI
echo "Removing old CLI container..."
docker stop cli 2>/dev/null || true
docker rm cli 2>/dev/null || true

# Get project paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
FABRIC_NETWORK="$PROJECT_ROOT/fabric-network"

echo "Starting CLI container on network: $ORDERER_NETWORK"

# Start CLI on the same network as orderer
docker run -itd \
  --name cli \
  --network "$ORDERER_NETWORK" \
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
    echo "✓ CLI container started on correct network"
    sleep 3
    
    # Test connectivity
    echo "Testing connectivity to orderer..."
    if docker exec cli ping -c 1 orderer.example.com > /dev/null 2>&1; then
        echo "✓ Can reach orderer.example.com"
    else
        echo "⚠ Cannot ping orderer (may still work for gRPC)"
    fi
    
    echo ""
    echo "=== Network Fix Complete ==="
    echo "You can now run: bash scripts/create-channel.sh"
else
    echo "✗ Failed to start CLI container"
    exit 1
fi

