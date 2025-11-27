#!/bin/bash

# Setup Fabric test network following official documentation
# Based on: https://hyperledger-fabric.readthedocs.io/en/release-2.5/getting_started.html

set -e

echo "=========================================="
echo "  Setting Up Fabric Test Network"
echo "=========================================="
echo ""

# Check if fabric-samples exists
if [ ! -d "fabric-samples" ]; then
    echo "✗ fabric-samples directory not found!"
    echo "Downloading Fabric samples..."
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0
    echo "✓ Fabric samples downloaded"
fi

# Navigate to test-network
if [ ! -d "fabric-samples/test-network" ]; then
    echo "✗ test-network directory not found in fabric-samples!"
    exit 1
fi

cd fabric-samples/test-network

# Clean up any existing network
echo "Cleaning up any existing network..."
./network.sh down

# Start the network
echo ""
echo "Starting Fabric test network..."
./network.sh up createChannel -c mychannel -ca

if [ $? -eq 0 ]; then
    echo "✓ Test network started successfully"
else
    echo "✗ Failed to start test network"
    exit 1
fi

# Deploy chaincode
echo ""
echo "Deploying healthcare chaincode..."

# Copy our chaincode to test-network
cp -r ../../chaincode ./chaincode/healthcare-chaincode

# Deploy it
./network.sh deployCC -ccn healthcare-chaincode -ccp ./chaincode/healthcare-chaincode -ccl javascript

if [ $? -eq 0 ]; then
    echo "✓ Chaincode deployed successfully"
else
    echo "✗ Failed to deploy chaincode"
    exit 1
fi

cd ../..

echo ""
echo "=========================================="
echo "  Fabric Network Running!"
echo "=========================================="
echo ""
echo "Network is using the official test-network setup"
echo ""
echo "Next steps:"
echo "1. Configure backend to use test-network"
echo "2. Test chaincode invocation"
echo ""

