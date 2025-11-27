#!/bin/bash

# Install complete Fabric binaries and samples

set -e

echo "=========================================="
echo "  Installing Fabric Binaries"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "chaincode" ]; then
    echo "Error: Run this from the project root (medblock directory)"
    exit 1
fi

# Download fabric-samples with binaries
echo "Downloading Fabric 2.5.0 binaries and samples..."
echo ""

if [ -d "fabric-samples" ]; then
    echo "Removing existing fabric-samples..."
    rm -rf fabric-samples
fi

# Download using official script
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary

# Move binaries to fabric-samples/bin
mkdir -p fabric-samples/bin
mv bin/* fabric-samples/bin/ 2>/dev/null || true
rmdir bin 2>/dev/null || true

echo ""
echo "Downloading fabric-samples..."
git clone --depth 1 --branch release-2.5 https://github.com/hyperledger/fabric-samples.git fabric-samples-temp
mv fabric-samples-temp/* fabric-samples/ 2>/dev/null || true
rm -rf fabric-samples-temp

echo ""
echo "Verifying binaries..."
ls -la fabric-samples/bin/

echo ""
echo "Testing fabric-ca-client..."
fabric-samples/bin/fabric-ca-client version || echo "fabric-ca-client not working"

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "Binaries installed in: fabric-samples/bin/"
echo ""
echo "Next: Run bash scripts/start-fabric-simple.sh"

