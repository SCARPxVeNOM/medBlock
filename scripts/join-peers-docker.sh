#!/bin/bash

# Join peers to channel using docker exec (more reliable)

set -e

echo "=========================================="
echo "  Joining Peers via Docker Exec"
echo "=========================================="
echo ""

cd fabric-samples/test-network

# Check if channel block exists
if [ ! -f "./channel-artifacts/mychannel.block" ]; then
    echo "Error: Channel block not found!"
    exit 1
fi

echo "Step 1: Join Org1 peer..."
docker exec peer0.org1.example.com peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Org1 peer joined"
else
    echo "✗ Org1 peer failed"
    exit 1
fi

echo ""
echo "Step 2: Join Org2 peer..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
  -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp \
  peer0.org2.example.com \
  peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Org2 peer joined"
else
    echo "✗ Org2 peer failed"
    exit 1
fi

echo ""
echo "Step 3: List channels on Org1..."
docker exec peer0.org1.example.com peer channel list

echo ""
echo "=========================================="
echo "  ✓ Peers Joined Successfully!"
echo "=========================================="

cd ../..

