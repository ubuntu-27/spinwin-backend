#!/bin/bash
# EC2 Deployment Script for spinwin-backend
# This script is executed on the EC2 instance during deployment

set -e

APP_DIR="$HOME/spinwin-backend"

echo "🚀 Starting deployment..."

# Navigate to app directory
cd "$APP_DIR"

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Install all dependencies (devDependencies needed for TypeScript build)
echo "📦 Installing dependencies..."
npm ci

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Reload PM2 (graceful restart)
echo "♻️ Restarting PM2..."
pm2 reload ecosystem.config.cjs --env production

# Save PM2 process list (survives reboot)
pm2 save

# Wait for application to start
sleep 3

# Health check
echo "🏥 Running health check..."
if curl -f http://localhost:3333/ > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is healthy."
else
    echo "❌ Health check failed!"
    pm2 logs spinwin-backend --lines 50
    exit 1
fi

echo "🎉 Deployment complete!"
