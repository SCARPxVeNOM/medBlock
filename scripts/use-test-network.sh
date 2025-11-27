#!/bin/bash

# Use Fabric test network instead of custom network
# This is more reliable and follows official documentation

set -e

echo "=========================================="
echo "  Using Official Fabric Test Network"
echo "=========================================="
echo ""

# Check if test-network is running
if [ ! -d "fabric-samples/test-network" ]; then
    echo "✗ Test network not found!"
    echo "Run: bash scripts/setup-test-network.sh"
    exit 1
fi

cd fabric-samples/test-network

# Check if network is up
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo "Network is not running. Starting it..."
    ./network.sh up createChannel -c mychannel
fi

echo "✓ Test network is running"
echo ""

# Show network status
echo "Network containers:"
docker ps --filter "name=peer\|orderer" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "Testing chaincode..."

# Set environment for Org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# If chaincode is deployed, test it
if docker ps | grep -q "healthcare-chaincode"; then
    echo "Testing chaincode invocation..."
    
    # Test Init
    peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C mychannel \
        -n healthcare-chaincode \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        -c '{"function":"Init","Args":[]}'
    
    if [ $? -eq 0 ]; then
        echo "✓ Chaincode is working!"
    fi
else
    echo "Chaincode not deployed yet"
    echo "Run: bash scripts/deploy-to-test-network.sh"
fi

cd ../..

echo ""
echo "=========================================="
echo "  Test Network Ready"
echo "=========================================="

