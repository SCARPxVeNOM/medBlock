#!/bin/bash

# Generate crypto materials for Fabric network
# Requires cryptogen tool from Fabric samples

set -e

echo "=== Generating Crypto Materials ==="

# Find cryptogen binary
CRYPTOGEN=""

# Check if cryptogen is in PATH
if command -v cryptogen &> /dev/null; then
    CRYPTOGEN=cryptogen
    echo "Using cryptogen from PATH"
# Check fabric-samples directory (from project root)
elif [ -f "fabric-samples/bin/cryptogen" ]; then
    CRYPTOGEN=fabric-samples/bin/cryptogen
    echo "Using cryptogen from fabric-samples/bin"
# Check from scripts directory
elif [ -f "../fabric-samples/bin/cryptogen" ]; then
    CRYPTOGEN=../fabric-samples/bin/cryptogen
    echo "Using cryptogen from ../fabric-samples/bin"
# Check if fabric-samples exists and find cryptogen
elif [ -d "fabric-samples" ]; then
    CRYPTOGEN_PATH=$(find fabric-samples -name "cryptogen" -type f 2>/dev/null | head -1)
    if [ -n "$CRYPTOGEN_PATH" ]; then
        CRYPTOGEN=$CRYPTOGEN_PATH
        echo "Found cryptogen at: $CRYPTOGEN"
    fi
fi

# If still not found, try to download
if [ -z "$CRYPTOGEN" ] || [ ! -f "$CRYPTOGEN" ]; then
    echo "cryptogen not found. Checking fabric-samples..."
    
    if [ ! -d "fabric-samples" ]; then
        echo "Downloading Fabric samples..."
        curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0
    fi
    
    # Try to find cryptogen again (check multiple paths)
    if [ -f "fabric-samples/bin/cryptogen" ]; then
        CRYPTOGEN=fabric-samples/bin/cryptogen
    elif [ -f "./fabric-samples/bin/cryptogen" ]; then
        CRYPTOGEN=./fabric-samples/bin/cryptogen
    elif [ -f "../fabric-samples/bin/cryptogen" ]; then
        CRYPTOGEN=../fabric-samples/bin/cryptogen
    else
        CRYPTOGEN_PATH=$(find fabric-samples -name "cryptogen" -type f 2>/dev/null | head -1)
        if [ -n "$CRYPTOGEN_PATH" ]; then
            CRYPTOGEN=$CRYPTOGEN_PATH
        else
            echo "✗ cryptogen binary not found!"
            echo "Please ensure Fabric samples are installed correctly"
            exit 1
        fi
    fi
fi

# Make sure cryptogen is executable
chmod +x "$CRYPTOGEN" 2>/dev/null || true

# Generate crypto materials
echo "Generating crypto materials using: $CRYPTOGEN"
cd fabric-network

# Remove old crypto-config if exists
if [ -d "crypto-config" ]; then
    echo "Removing old crypto-config..."
    rm -rf crypto-config
fi

$CRYPTOGEN generate --config=./crypto-config.yaml --output="crypto-config"

if [ $? -eq 0 ]; then
    echo "✓ Crypto materials generated successfully"
else
    echo "✗ Failed to generate crypto materials"
    exit 1
fi

cd ..

echo "=== Crypto Materials Generation Complete ==="

