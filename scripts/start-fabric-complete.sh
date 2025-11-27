#!/bin/bash

# Complete script to start Fabric network and fix CLI

set -e

echo "=========================================="
echo "  Starting Fabric Network"
echo "=========================================="
echo ""

# Check Docker
if ! docker ps > /dev/null 2>&1; then
    echo "✗ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo "✓ Docker is running"
echo ""

# Cleanup old CLI container
echo "Cleaning up old CLI container..."
docker stop cli 2>/dev/null || true
docker rm cli 2>/dev/null || true
echo "✓ Cleanup complete"
echo ""

# Start Fabric network
echo "Starting Fabric network..."
cd fabric-network

# Check if crypto materials exist
if [ ! -d "crypto-config" ]; then
    echo "✗ Crypto materials not found!"
    echo "Please run: bash ../scripts/generate-crypto.sh"
    exit 1
fi

# Check if channel artifacts exist
if [ ! -d "channel-artifacts" ] || [ ! -f "channel-artifacts/genesis.block" ]; then
    echo "✗ Channel artifacts not found!"
    echo "Please run: bash ../scripts/generate-genesis.sh"
    exit 1
fi

# Start all services
docker-compose -f docker-compose-fabric.yml up -d

if [ $? -eq 0 ]; then
    echo "✓ Fabric network started"
else
    echo "✗ Failed to start Fabric network"
    exit 1
fi

echo ""
echo "Waiting for containers to be ready..."
sleep 10

# Verify containers are running
echo ""
echo "Checking container status..."
docker ps --filter "name=orderer\|peer\|cli" --format "table {{.Names}}\t{{.Status}}" || true

# Verify CLI is on correct network
echo ""
echo "Verifying network connectivity..."
if docker exec cli ping -c 1 orderer.example.com > /dev/null 2>&1; then
    echo "✓ CLI can reach orderer"
elif docker exec cli nslookup orderer.example.com > /dev/null 2>&1; then
    echo "✓ CLI can resolve orderer hostname"
else
    echo "⚠ Network connectivity check failed (may still work for gRPC)"
fi

cd ..

echo ""
echo "=========================================="
echo "  Fabric Network Started Successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Create channel: bash scripts/create-channel.sh"
echo "2. Install chaincode: bash scripts/install-chaincode.sh"
echo ""

