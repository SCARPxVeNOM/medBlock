#!/bin/bash

# Deploy our healthcare chaincode to the test network

set -e

echo "=========================================="
echo "  Deploying Healthcare Chaincode"
echo "=========================================="
echo ""

if [ ! -d "fabric-samples/test-network" ]; then
    echo "✗ Test network not found!"
    echo "Run: bash scripts/setup-test-network.sh"
    exit 1
fi

# Copy chaincode to test-network
echo "Copying chaincode..."
mkdir -p fabric-samples/test-network/chaincode
cp -r chaincode fabric-samples/test-network/chaincode/healthcare-chaincode

cd fabric-samples/test-network

# Make sure network is running
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo "Starting network..."
    ./network.sh up createChannel -c mychannel
fi

# Deploy chaincode
echo ""
echo "Deploying chaincode..."
./network.sh deployCC \
    -ccn healthcare-chaincode \
    -ccp ./chaincode/healthcare-chaincode \
    -ccl javascript

if [ $? -eq 0 ]; then
    echo "✓ Chaincode deployed successfully"
    
    # Test it
    echo ""
    echo "Testing chaincode..."
    
    export PATH=${PWD}/../bin:$PATH
    export FABRIC_CFG_PATH=$PWD/../config/
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    
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
    
    echo ""
    echo "✓ Chaincode is working!"
else
    echo "✗ Failed to deploy chaincode"
    exit 1
fi

cd ../..

echo ""
echo "=========================================="
echo "  Deployment Complete"
echo "=========================================="
echo ""
echo "Chaincode 'healthcare-chaincode' is deployed on 'mychannel'"
echo ""
echo "To use it with backend services, update connection profile to point to test-network"

