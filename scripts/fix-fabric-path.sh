#!/bin/bash

# Fix script to locate Fabric binaries after installation
# This helps when binaries are in unexpected locations

set -e

echo "=== Locating Fabric Binaries ==="

# Check if fabric-samples exists
if [ ! -d "fabric-samples" ]; then
    echo "✗ fabric-samples directory not found!"
    exit 1
fi

echo "Searching for cryptogen..."
CRYPTOGEN=$(find fabric-samples -name "cryptogen" -type f 2>/dev/null | head -1)
if [ -n "$CRYPTOGEN" ]; then
    echo "✓ Found cryptogen at: $CRYPTOGEN"
    # Make it executable
    chmod +x "$CRYPTOGEN"
else
    echo "✗ cryptogen not found in fabric-samples"
    echo "Checking bin directory..."
    if [ -d "fabric-samples/bin" ]; then
        ls -la fabric-samples/bin/ | head -10
    fi
fi

echo ""
echo "Searching for configtxgen..."
CONFIGTXGEN=$(find fabric-samples -name "configtxgen" -type f 2>/dev/null | head -1)
if [ -n "$CONFIGTXGEN" ]; then
    echo "✓ Found configtxgen at: $CONFIGTXGEN"
    chmod +x "$CONFIGTXGEN"
else
    echo "✗ configtxgen not found in fabric-samples"
fi

echo ""
echo "=== Binary Location Check Complete ==="

