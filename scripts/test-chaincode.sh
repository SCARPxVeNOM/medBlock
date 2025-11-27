#!/bin/bash

# Test the healthcare chaincode

set -e

echo "=========================================="
echo "  Testing Healthcare Chaincode"
echo "=========================================="
echo ""

cd fabric-samples/test-network

# Set environment for Org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "Test 1: Initialize ledger..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n healthcare \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'

echo ""
echo "✓ Ledger initialized"

sleep 3

echo ""
echo "Test 2: Create a test record..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n healthcare \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"CreateRecord","Args":["record1","patient123","cid123","hash123","wrappedKey123"]}'

echo ""
echo "✓ Record created"

sleep 3

echo ""
echo "Test 3: Query the record..."
peer chaincode query \
  -C mychannel \
  -n healthcare \
  -c '{"function":"GetRecord","Args":["record1"]}'

echo ""
echo ""
echo "=========================================="
echo "  ✓ Chaincode is Working!"
echo "=========================================="
echo ""

cd ../..

