#!/bin/bash

# Setup wallet with admin identity for backend services

set -e

echo "=== Setting up Fabric Wallet ==="

WALLET_DIR="../backend/wallet"
ADMIN_DIR="fabric-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"

if [ ! -d "$ADMIN_DIR" ]; then
    echo "✗ Admin certificates not found!"
    echo "Please run ./scripts/init-fabric-network.sh first"
    exit 1
fi

# Create wallet directory
mkdir -p "$WALLET_DIR"

# Copy admin certificate and key
echo "Copying admin identity to wallet..."

# Create admin identity structure
mkdir -p "$WALLET_DIR/appUser"

# Copy certificate
if [ -f "$ADMIN_DIR/signcerts/Admin@org1.example.com-cert.pem" ]; then
    cp "$ADMIN_DIR/signcerts/Admin@org1.example.com-cert.pem" "$WALLET_DIR/appUser/"
    echo "✓ Certificate copied"
else
    echo "✗ Certificate not found"
    exit 1
fi

# Copy private key
PRIVATE_KEY=$(find "$ADMIN_DIR/keystore" -name "*_sk" | head -1)
if [ -n "$PRIVATE_KEY" ]; then
    cp "$PRIVATE_KEY" "$WALLET_DIR/appUser/"
    echo "✓ Private key copied"
else
    echo "✗ Private key not found"
    exit 1
fi

echo "✓ Wallet setup complete"
echo ""
echo "Admin identity is now available for backend services"
echo ""

