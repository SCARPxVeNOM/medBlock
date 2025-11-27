#!/bin/bash

# Complete Fabric setup - joins peers and deploys chaincode

set -e

echo "=========================================="
echo "  Complete Fabric Setup"
echo "=========================================="
echo ""

# Get absolute path to test-network
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
TEST_NETWORK_DIR="$PROJECT_ROOT/fabric-samples/test-network"

cd "$TEST_NETWORK_DIR"

# Set environment with absolute paths
export PATH=${TEST_NETWORK_DIR}/../bin:$PATH
export FABRIC_CFG_PATH=${TEST_NETWORK_DIR}/../config/
export CORE_PEER_TLS_ENABLED=false

echo "Step 1: Joining Org1 peer to channel..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_MSPCONFIGPATH="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"

echo "DEBUG: CORE_PEER_MSPCONFIGPATH=$CORE_PEER_MSPCONFIGPATH"
ls -la "$CORE_PEER_MSPCONFIGPATH" | head -5

peer channel join -b ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Org1 peer joined successfully"
else
    echo "✗ Failed to join Org1 peer"
    exit 1
fi

echo ""
echo "Step 2: Joining Org2 peer to channel..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_MSPCONFIGPATH="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"

peer channel join -b ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Org2 peer joined successfully"
else
    echo "✗ Failed to join Org2 peer"
    exit 1
fi

echo ""
echo "Step 3: Listing channels on Org1 peer..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_MSPCONFIGPATH="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"

peer channel list

echo ""
echo "=========================================="
echo "  ✓ Peers Joined Successfully!"
echo "=========================================="
echo ""

# Now deploy chaincode
echo "Step 4: Installing chaincode dependencies..."
cd "$PROJECT_ROOT/chaincode"
if [ ! -d "node_modules" ]; then
    npm install
fi

cd "$TEST_NETWORK_DIR"

echo ""
echo "Step 5: Deploying chaincode..."
IMAGE_TAG=2.5 ./network.sh deployCC -ccn healthcare -ccp "$PROJECT_ROOT/chaincode" -ccl javascript -ccep "OR('Org1MSP.peer','Org2MSP.peer')"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✓ CHAINCODE DEPLOYED SUCCESSFULLY!"
    echo "=========================================="
    echo ""
    echo "Testing chaincode..."
    
    # Test the chaincode
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
    export CORE_PEER_MSPCONFIGPATH="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051
    
    echo ""
    echo "Creating test record..."
    peer chaincode invoke \
      -o localhost:7050 \
      --ordererTLSHostnameOverride orderer.example.com \
      --tls \
      --cafile "${TEST_NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
      -C mychannel \
      -n healthcare \
      --peerAddresses localhost:7051 \
      --tlsRootCertFiles "${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
      -c '{"function":"CreateRecord","Args":["record1","patient123","cid123","hash123","wrappedKey123"]}'
    
    sleep 3
    
    echo ""
    echo "Querying record..."
    peer chaincode query \
      -C mychannel \
      -n healthcare \
      -c '{"function":"GetRecord","Args":["record1"]}'
    
    echo ""
    echo ""
    echo "=========================================="
    echo "  🎉 FABRIC BLOCKCHAIN IS WORKING! 🎉"
    echo "=========================================="
    echo ""
    echo "Summary:"
    echo "  ✓ Network running (orderer + 2 peers)"
    echo "  ✓ Channel 'mychannel' created"
    echo "  ✓ Peers joined to channel"
    echo "  ✓ Chaincode 'healthcare' deployed"
    echo "  ✓ Chaincode tested and working"
    echo ""
    echo "Next steps:"
    echo "  1. Start backend services:"
    echo "     cd ../../backend"
    echo "     npm install"
    echo "     npm run start:uploader (in one terminal)"
    echo "     npm run start:keyservice (in another terminal)"
    echo ""
    echo "  2. Start frontend:"
    echo "     cd ../frontend"
    echo "     npm install"
    echo "     npm run dev"
    echo ""
else
    echo "✗ Chaincode deployment failed"
    exit 1
fi

cd "$PROJECT_ROOT"

