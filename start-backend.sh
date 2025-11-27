#!/bin/bash
cd /mnt/c/Users/aryan/Desktop/medblock/backend
echo "Starting backend services..."
PORT=3001 node uploader.js > /tmp/uploader.log 2>&1 &
echo "✓ Uploader started on port 3001 (PID: $!)"
sleep 2
PORT=3002 node keyservice.js > /tmp/keyservice.log 2>&1 &
echo "✓ Key-service started on port 3002 (PID: $!)"
echo ""
echo "Backend services running!"
echo "Logs: /tmp/uploader.log and /tmp/keyservice.log"

