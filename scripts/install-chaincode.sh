#!/bin/bash

# Install and instantiate healthcare chaincode

set -e

CHAINCODE_NAME="healthcare-chaincode"
CHAINCODE_VERSION="1.0"
CHANNEL_NAME="mychannel"

echo "=== Installing Healthcare Chaincode ==="
echo ""

# Check if Fabric network is running
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo "✗ Fabric network is not running!"
    echo "Please start the Fabric network first:"
    echo "  docker-compose -f fabric-network/docker-compose-fabric.yml up -d"
    exit 1
fi

echo "Step 1: Packaging chaincode..."
cd chaincode
npm install
cd ..

# Copy chaincode to CLI container
echo "Step 2: Copying chaincode to CLI container..."
docker cp chaincode cli:/opt/gopath/src/github.com/chaincode/healthcare-chaincode

# Install chaincode
echo "Step 3: Installing chaincode on peer..."
docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path /opt/gopath/src/github.com/chaincode/healthcare-chaincode \
    --lang node \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep -oP 'Package ID: \K[^,]+' | head -1)

if [ -z "$PACKAGE_ID" ]; then
    echo "✗ Failed to get package ID"
    exit 1
fi

echo "✓ Chaincode installed with Package ID: $PACKAGE_ID"
echo ""

# Approve chaincode
echo "Step 4: Approving chaincode definition..."
docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence 1 \
    --signature-policy "OR('Org1MSP.member')"

if [ $? -eq 0 ]; then
    echo "✓ Chaincode definition approved"
else
    echo "✗ Failed to approve chaincode"
    exit 1
fi
echo ""

# Commit chaincode
echo "Step 5: Committing chaincode definition..."
docker exec cli peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence 1 \
    --signature-policy "OR('Org1MSP.member')"

if [ $? -eq 0 ]; then
    echo "✓ Chaincode committed to channel"
else
    echo "✗ Failed to commit chaincode"
    exit 1
fi
echo ""

# Query chaincode
echo "Step 6: Verifying chaincode installation..."
docker exec cli peer chaincode query -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -c '{"function":"Init","Args":[]}' || true

echo ""
echo "=== Chaincode Installation Complete ==="
echo ""
echo "Chaincode is now available on the network!"
echo "You can now use the backend services with Fabric integration."
echo ""
