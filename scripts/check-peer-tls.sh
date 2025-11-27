#!/bin/bash

# Check TLS configuration of running peers

echo "=========================================="
echo "  Checking Peer TLS Configuration"
echo "=========================================="
echo ""

echo "Checking peer0.org1.example.com..."
docker inspect peer0.org1.example.com --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -i tls

echo ""
echo "Checking peer0.org2.example.com..."
docker inspect peer0.org2.example.com --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -i tls

echo ""
echo "Checking orderer.example.com..."
docker inspect orderer.example.com --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -i tls

echo ""
echo "=========================================="

