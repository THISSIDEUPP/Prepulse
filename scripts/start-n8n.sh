#!/bin/bash

echo "Starting PrePulse n8n integration..."

if [ -f .env.n8n ]; then
  export $(cat .env.n8n | grep -v '^#' | xargs)
fi

docker compose up -d

echo "Waiting for n8n to start..."
sleep 10

echo "Importing workflow templates..."

echo "n8n integration started successfully!"
echo "Access n8n at: http://localhost:5678"
echo "Username: admin"
echo "Password: (check .env.n8n file)"
