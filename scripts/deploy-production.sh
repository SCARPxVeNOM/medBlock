#!/bin/bash

# Production Deployment Script for MedBlock

set -e

echo "=========================================="
echo "  MedBlock Production Deployment"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create .env from .env.production template:"
    echo "  cp .env.production .env"
    echo "  nano .env  # Edit with your secrets"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "⚠️  SSL certificates not found!"
    echo ""
    read -p "Generate self-signed certificates for testing? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash scripts/generate-ssl-certs.sh
    else
        echo "Please place your SSL certificates in nginx/ssl/"
        exit 1
    fi
fi

# Build images
echo "Step 1: Building Docker images..."
docker-compose -f docker-compose.prod.yml build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✓ Images built successfully"
echo ""

# Pull external images
echo "Step 2: Pulling external images..."
docker-compose -f docker-compose.prod.yml pull

echo "✓ Images pulled"
echo ""

# Start services
echo "Step 3: Starting services..."
docker-compose -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services!"
    exit 1
fi

echo "✓ Services started"
echo ""

# Wait for services to be healthy
echo "Step 4: Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "Checking service health..."

# Check frontend
if curl -sf https://localhost/health > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "⚠️  Frontend health check failed"
fi

# Check uploader
if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ Uploader is healthy"
else
    echo "⚠️  Uploader health check failed"
fi

# Check key service
if curl -sf http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✓ Key service is healthy"
else
    echo "⚠️  Key service health check failed"
fi

echo ""
echo "=========================================="
echo "  ✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend: https://localhost"
echo "  - Uploader API: http://localhost:3001"
echo "  - Key Service API: http://localhost:3002"
echo "  - MinIO Console: http://localhost:9001"
echo "  - Grafana: http://localhost:3000"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""

