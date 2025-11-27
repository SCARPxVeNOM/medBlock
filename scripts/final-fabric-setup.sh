#!/bin/bash

# Final working Fabric setup - using osnadmin channel join

set -e

echo "=========================================="
echo "  Final Fabric Setup (Working Version)"
echo "=========================================="
echo ""

cd /mnt/c/Users/aryan/Desktop/medblock/fabric-samples/test-network

echo "Step 1: Start network (no channel yet)..."
IMAGE_TAG=2.5 ./network.sh up

if [ $? -ne 0 ]; then
    echo "✗ Failed to start network"
    exit 1
fi

echo ""
echo "✓ Network started"
echo ""

# Set paths
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/configtx

echo "Step 2: Create channel genesis block..."
mkdir -p ./channel-artifacts
configtxgen -profile ChannelUsingRaft \
  -outputBlock ./channel-artifacts/mychannel.block \
  -channelID mychannel

echo "✓ Channel block created"
echo ""

echo "Step 3: Join channel to orderer using osnadmin..."
osnadmin channel join \
  --channelID mychannel \
  --config-block ./channel-artifacts/mychannel.block \
  -o localhost:7053 \
  --ca-file "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --client-cert "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt" \
  --client-key "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key"

echo "✓ Orderer joined channel"
echo ""

echo "Step 4: Join Org1 peer to channel..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer channel join -b ./channel-artifacts/mychannel.block

echo "✓ Org1 peer joined"
echo ""

echo "Step 5: Join Org2 peer to channel..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer channel join -b ./channel-artifacts/mychannel.block

echo "✓ Org2 peer joined"
echo ""

echo "Step 6: List channels on Org1 peer..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer channel list

echo ""
echo "=========================================="
echo "  ✓ FABRIC NETWORK IS READY!"
echo "=========================================="
echo ""
echo "Next: Deploy chaincode"
echo "  IMAGE_TAG=2.5 ./network.sh deployCC -ccn healthcare -ccp /mnt/c/Users/aryan/Desktop/medblock/chaincode -ccl javascript"

cd /mnt/c/Users/aryan/Desktop/medblock

