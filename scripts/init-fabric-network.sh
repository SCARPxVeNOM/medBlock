#!/bin/bash

# Complete Fabric network initialization script
# This script sets up the entire Fabric network

set -e

echo "=========================================="
echo "  MedBlock Fabric Network Initialization"
echo "=========================================="
echo ""

# Check Docker
echo "Step 1: Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "✗ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo "✓ Docker is running"
echo ""

# Check if Fabric samples are needed
if [ ! -d "fabric-samples" ] && ! command -v cryptogen &> /dev/null; then
    echo "Step 2: Installing Fabric samples..."
    echo "This may take a few minutes..."
    # Only download Fabric 2.5.0, skip fabric-ca if it fails
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 || {
        echo "⚠ Fabric CA download failed, continuing without it (not required for basic setup)"
    }
    echo "✓ Fabric samples installed"
    echo ""
fi

# Generate crypto materials
echo "Step 3: Generating crypto materials..."
if [ -f "scripts/generate-crypto.sh" ]; then
    chmod +x scripts/generate-crypto.sh
    ./scripts/generate-crypto.sh
    if [ $? -ne 0 ]; then
        echo "✗ Crypto generation failed. Trying alternative method..."
        # Try direct path
        if [ -f "./fabric-samples/bin/cryptogen" ]; then
            cd fabric-network
            rm -rf crypto-config 2>/dev/null || true
            ../fabric-samples/bin/cryptogen generate --config=./crypto-config.yaml --output="crypto-config"
            cd ..
        else
            echo "✗ Cannot find cryptogen. Please check fabric-samples installation."
            exit 1
        fi
    fi
else
    echo "Using cryptogen directly..."
    cd fabric-network
    if command -v cryptogen &> /dev/null; then
        cryptogen generate --config=./crypto-config.yaml --output="crypto-config"
    elif [ -f "../fabric-samples/bin/cryptogen" ]; then
        ../fabric-samples/bin/cryptogen generate --config=./crypto-config.yaml --output="crypto-config"
    else
        echo "✗ cryptogen not found!"
        exit 1
    fi
    cd ..
fi
echo ""

# Generate genesis block
echo "Step 4: Generating genesis block and channel artifacts..."
if [ -f "scripts/generate-genesis.sh" ]; then
    chmod +x scripts/generate-genesis.sh
    ./scripts/generate-genesis.sh
    if [ $? -ne 0 ]; then
        echo "✗ Genesis generation failed. Trying alternative method..."
        export FABRIC_CFG_PATH=$PWD/fabric-network
        cd fabric-network
        mkdir -p channel-artifacts
        
        if [ -f "../fabric-samples/bin/configtxgen" ]; then
            CONFIGTXGEN=../fabric-samples/bin/configtxgen
        elif command -v configtxgen &> /dev/null; then
            CONFIGTXGEN=configtxgen
        else
            echo "✗ Cannot find configtxgen. Please check fabric-samples installation."
            exit 1
        fi
        
        $CONFIGTXGEN -profile MedBlockOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
        $CONFIGTXGEN -profile MedBlockChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mychannel
        $CONFIGTXGEN -profile MedBlockChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
        cd ..
    fi
else
    echo "Using configtxgen directly..."
    export FABRIC_CFG_PATH=$PWD/fabric-network
    cd fabric-network
    mkdir -p channel-artifacts
    
    if command -v configtxgen &> /dev/null; then
        CONFIGTXGEN=configtxgen
    elif [ -f "../fabric-samples/bin/configtxgen" ]; then
        CONFIGTXGEN=../fabric-samples/bin/configtxgen
    else
        echo "✗ configtxgen not found!"
        exit 1
    fi
    
    $CONFIGTXGEN -profile MedBlockOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    $CONFIGTXGEN -profile MedBlockChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mychannel
    $CONFIGTXGEN -profile MedBlockChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
    cd ..
fi
echo ""

# Start Fabric network
echo "Step 5: Starting Fabric network..."
docker-compose -f fabric-network/docker-compose-fabric.yml up -d

echo "Waiting for network to be ready..."
sleep 10

# Check if containers are running
if docker ps | grep -q "orderer.example.com"; then
    echo "✓ Fabric network started"
else
    echo "✗ Failed to start Fabric network"
    exit 1
fi
echo ""

# Create channel
echo "Step 6: Creating channel..."
docker exec cli peer channel create -o orderer.example.com:7050 -c mychannel -f ./channel-artifacts/channel.tx --outputBlock ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Channel created"
else
    echo "⚠ Channel creation failed (may already exist)"
fi
echo ""

# Join peer to channel
echo "Step 7: Joining peer to channel..."
docker exec cli peer channel join -b ./channel-artifacts/mychannel.block

if [ $? -eq 0 ]; then
    echo "✓ Peer joined channel"
else
    echo "⚠ Peer join failed (may already be joined)"
fi
echo ""

# Update anchor peer
echo "Step 8: Updating anchor peer..."
docker exec cli peer channel update -o orderer.example.com:7050 -c mychannel -f ./channel-artifacts/Org1MSPanchors.tx

if [ $? -eq 0 ]; then
    echo "✓ Anchor peer updated"
else
    echo "⚠ Anchor peer update failed"
fi
echo ""

echo "=========================================="
echo "  Fabric Network Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Install chaincode: ./scripts/install-chaincode.sh"
echo "2. Start application services: docker-compose up -d"
echo ""

