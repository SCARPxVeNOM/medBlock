#!/bin/bash

# Generate self-signed SSL certificates for development/testing
# For production, use Let's Encrypt or purchased certificates

set -e

echo "=========================================="
echo "  SSL Certificate Generator"
echo "=========================================="
echo ""

# Create SSL directory
mkdir -p nginx/ssl

# Generate private key
echo "Generating private key..."
openssl genrsa -out nginx/ssl/key.pem 2048

# Generate certificate signing request
echo "Generating certificate signing request..."
openssl req -new -key nginx/ssl/key.pem -out nginx/ssl/cert.csr -subj "/C=US/ST=California/L=San Francisco/O=MedBlock/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
echo "Generating self-signed certificate..."
openssl x509 -req -days 365 -in nginx/ssl/cert.csr -signkey nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Clean up CSR
rm nginx/ssl/cert.csr

echo ""
echo "✓ SSL certificates generated!"
echo ""
echo "Files created:"
echo "  - nginx/ssl/key.pem (private key)"
echo "  - nginx/ssl/cert.pem (certificate)"
echo ""
echo "⚠️  These are self-signed certificates for development only!"
echo "⚠️  For production, use Let's Encrypt or purchase certificates."
echo ""

