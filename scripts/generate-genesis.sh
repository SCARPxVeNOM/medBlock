#!/bin/bash

# Generate genesis block and channel artifacts
# Requires configtxgen tool from Fabric samples

set -e

echo "=== Generating Genesis Block and Channel Artifacts ==="

# Find configtxgen binary
CONFIGTXGEN=""

# Check if configtxgen is in PATH
if command -v configtxgen &> /dev/null; then
    CONFIGTXGEN=configtxgen
    echo "Using configtxgen from PATH"
# Check fabric-samples directory (from project root)
elif [ -f "fabric-samples/bin/configtxgen" ]; then
    CONFIGTXGEN=fabric-samples/bin/configtxgen
    echo "Using configtxgen from fabric-samples/bin"
# Check from scripts directory
elif [ -f "../fabric-samples/bin/configtxgen" ]; then
    CONFIGTXGEN=../fabric-samples/bin/configtxgen
    echo "Using configtxgen from ../fabric-samples/bin"
# Check if fabric-samples exists and find configtxgen
elif [ -d "fabric-samples" ]; then
    CONFIGTXGEN_PATH=$(find fabric-samples -name "configtxgen" -type f 2>/dev/null | head -1)
    if [ -n "$CONFIGTXGEN_PATH" ]; then
        CONFIGTXGEN=$CONFIGTXGEN_PATH
        echo "Found configtxgen at: $CONFIGTXGEN"
    fi
fi

# If still not found, try to download
if [ -z "$CONFIGTXGEN" ] || [ ! -f "$CONFIGTXGEN" ]; then
    echo "configtxgen not found. Checking fabric-samples..."
    
    if [ ! -d "fabric-samples" ]; then
        echo "Downloading Fabric samples..."
        curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0
    fi
    
    # Try to find configtxgen again (check multiple paths)
    if [ -f "fabric-samples/bin/configtxgen" ]; then
        CONFIGTXGEN=fabric-samples/bin/configtxgen
    elif [ -f "./fabric-samples/bin/configtxgen" ]; then
        CONFIGTXGEN=./fabric-samples/bin/configtxgen
    elif [ -f "../fabric-samples/bin/configtxgen" ]; then
        CONFIGTXGEN=../fabric-samples/bin/configtxgen
    else
        CONFIGTXGEN_PATH=$(find fabric-samples -name "configtxgen" -type f 2>/dev/null | head -1)
        if [ -n "$CONFIGTXGEN_PATH" ]; then
            CONFIGTXGEN=$CONFIGTXGEN_PATH
        else
            echo "✗ configtxgen binary not found!"
            echo "Please ensure Fabric samples are installed correctly"
            exit 1
        fi
    fi
fi

# Make sure configtxgen is executable
chmod +x "$CONFIGTXGEN" 2>/dev/null || true

# Store project root
PROJECT_ROOT="$PWD"
export FABRIC_CFG_PATH=$PROJECT_ROOT/fabric-network

cd fabric-network

# Create channel-artifacts directory
mkdir -p channel-artifacts

# Remove old artifacts if they exist
rm -f channel-artifacts/*.block channel-artifacts/*.tx 2>/dev/null || true

# Fix CONFIGTXGEN path if it's relative
if [[ "$CONFIGTXGEN" == fabric-samples/* ]] || [[ "$CONFIGTXGEN" == ./fabric-samples/* ]]; then
    CONFIGTXGEN="$PROJECT_ROOT/$CONFIGTXGEN"
fi

# Generate genesis block
echo "Generating genesis block using: $CONFIGTXGEN"
"$CONFIGTXGEN" -profile MedBlockOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

if [ $? -eq 0 ]; then
    echo "✓ Genesis block generated"
else
    echo "✗ Failed to generate genesis block"
    exit 1
fi

# Generate channel creation transaction
echo "Generating channel creation transaction..."
"$CONFIGTXGEN" -profile MedBlockChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mychannel

if [ $? -eq 0 ]; then
    echo "✓ Channel transaction generated"
else
    echo "✗ Failed to generate channel transaction"
    exit 1
fi

# Generate anchor peer update
echo "Generating anchor peer update..."
"$CONFIGTXGEN" -profile MedBlockChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP

if [ $? -eq 0 ]; then
    echo "✓ Anchor peer update generated"
else
    echo "✗ Failed to generate anchor peer update"
    exit 1
fi

cd ..

echo "=== Genesis Block and Channel Artifacts Generation Complete ==="

