#!/bin/bash

# Fix TLS mismatch in test network
# The issue is that peers are running without TLS but CLI is using TLS

set -e

echo "=== Fixing Test Network TLS Configuration ==="

cd fabric-samples/test-network

# Stop the network
echo "Stopping network..."
./network.sh down

# Start network without TLS (simpler for PoC)
echo "Starting network without TLS..."

# Modify the docker-compose to disable TLS
# Or use environment variable to disable it

# Start network with explicit non-TLS config
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org1.example.com/
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051

# Start network
./network.sh up createChannel -c mychannel

cd ../..

echo ""
echo "=== Network Started ==="

