#!/bin/bash

# Verify crypto materials are in the correct location

set -e

echo "=== Verifying Crypto Materials ==="

CRYPTO_DIR="fabric-network/crypto-config"

if [ ! -d "$CRYPTO_DIR" ]; then
    echo "✗ crypto-config directory not found!"
    echo "Please run: ./scripts/generate-crypto.sh"
    exit 1
fi

echo "✓ crypto-config directory exists"

# Check for required paths
REQUIRED_PATHS=(
    "peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    "peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp"
    "ordererOrganizations/example.com/orderers/orderer.example.com/msp"
)

for path in "${REQUIRED_PATHS[@]}"; do
    if [ -d "$CRYPTO_DIR/$path" ]; then
        echo "✓ $path exists"
    else
        echo "✗ $path NOT FOUND"
        exit 1
    fi
done

echo ""
echo "=== Crypto Materials Verification Complete ==="
echo "All required paths are present."

