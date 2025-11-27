#!/bin/bash

# Check Fabric network status

set -e

echo "=== Fabric Network Status ==="
echo ""

# Check all containers
echo "Checking containers..."
docker ps -a --filter "name=orderer\|peer\|cli" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Checking orderer logs (last 10 lines)..."
if docker ps -a | grep -q "orderer"; then
    docker logs orderer.example.com --tail 10 2>&1 || true
else
    echo "Orderer container not found!"
fi

echo ""
echo "Checking networks..."
docker network ls | grep fabric || echo "No fabric network found"

echo ""
echo "=== Status Check Complete ==="

