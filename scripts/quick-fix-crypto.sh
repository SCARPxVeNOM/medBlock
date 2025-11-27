#!/bin/bash

# Quick fix script to generate crypto materials
# Run this from the project root directory

set -e

echo "=== Quick Fix: Generating Crypto Materials ==="

# Ensure we're in the right directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Find cryptogen
if [ -f "fabric-samples/bin/cryptogen" ]; then
    CRYPTOGEN="fabric-samples/bin/cryptogen"
elif [ -f "./fabric-samples/bin/cryptogen" ]; then
    CRYPTOGEN="./fabric-samples/bin/cryptogen"
else
    echo "✗ cryptogen not found!"
    echo "Please ensure fabric-samples is installed"
    exit 1
fi

echo "Using: $CRYPTOGEN"
chmod +x "$CRYPTOGEN" 2>/dev/null || true

# Generate crypto materials
cd fabric-network

# Remove old crypto-config if exists
if [ -d "crypto-config" ]; then
    echo "Removing old crypto-config..."
    rm -rf crypto-config
fi

echo "Generating crypto materials..."
"$PROJECT_ROOT/$CRYPTOGEN" generate --config=./crypto-config.yaml --output="crypto-config"

if [ $? -eq 0 ]; then
    echo "✓ Crypto materials generated successfully"
    cd ..
    exit 0
else
    echo "✗ Failed to generate crypto materials"
    cd ..
    exit 1
fi

