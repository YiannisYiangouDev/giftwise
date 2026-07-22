#!/bin/bash
# Local deployment helper script for GiftWise

SERVER_IP="104.168.64.186"
TARGET_DIR="/var/www/giftwise"

echo "=== 🎁 Deploying GiftWise to remote server ($SERVER_IP) ==="

# 1. Transfer code to the server
echo "📦 Transferring files via rsync..."
rsync -avz --exclude='node_modules' \
           --exclude='.next' \
           --exclude='.env.local' \
           --exclude='.git' \
           --exclude='scraper/.venv' \
           ./ root@$SERVER_IP:$TARGET_DIR

# Copy environment file
echo "🔑 Copying environment configuration..."
rsync -avz ./frontend/.env.local root@$SERVER_IP:$TARGET_DIR/.env

# 2. Run build and start containers
echo "🚀 Rebuilding and starting Docker containers on remote host..."
ssh root@$SERVER_IP "cd $TARGET_DIR && docker compose up --build -d"

echo "=== ✅ Deployment trigger complete! ==="
echo "Access the app at http://$SERVER_IP:3030"
