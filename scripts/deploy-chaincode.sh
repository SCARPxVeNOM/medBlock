#!/bin/bash

# Deploy healthcare chaincode to Fabric network

set -e

echo "=========================================="
echo "  Deploying Healthcare Chaincode"
echo "=========================================="
echo ""

# Check chaincode dependencies
if [ ! -d "chaincode/node_modules" ]; then
    echo "Installing chaincode dependencies..."
    cd chaincode
    npm install
    cd ..
fi

cd fabric-samples/test-network

echo "Deploying chaincode to network..."
echo ""

IMAGE_TAG=2.5 ./network.sh deployCC \
  -ccn healthcare \
  -ccp ../../chaincode \
  -ccl javascript \
  -ccep "OR('Org1MSP.peer','Org2MSP.peer')"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✓ Chaincode Deployed Successfully!"
    echo "=========================================="
    echo ""
    echo "Chaincode Name: healthcare"
    echo "Channel: mychannel"
    echo ""
    echo "Next: Test the chaincode"
    echo "  bash scripts/test-chaincode.sh"
else
    echo ""
    echo "✗ Chaincode deployment failed"
    echo ""
    echo "Troubleshooting:"
    echo "  docker logs peer0.org1.example.com"
    exit 1
fi

cd ../..

