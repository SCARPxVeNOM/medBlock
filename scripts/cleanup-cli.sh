#!/bin/bash

# Cleanup old CLI container and restart network

set -e

echo "=== Cleaning Up CLI Container ==="

# Stop and remove CLI container
echo "Removing old CLI container..."
docker stop cli 2>/dev/null || true
docker rm cli 2>/dev/null || true

echo "✓ CLI container removed"

# Check if there are any other CLI containers
OLD_CLI=$(docker ps -a --filter "name=cli" --format "{{.ID}}" 2>/dev/null || true)
if [ -n "$OLD_CLI" ]; then
    echo "Removing additional CLI containers..."
    docker rm -f $OLD_CLI 2>/dev/null || true
fi

echo ""
echo "=== Cleanup Complete ==="
echo "You can now run:"
echo "  cd fabric-network"
echo "  docker-compose -f docker-compose-fabric.yml up -d"

