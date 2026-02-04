#!/bin/bash
# EC2 Deployment Script for spinwin-backend
# This script is executed on the EC2 instance during deployment

set -e

APP_DIR="$HOME/spinwin-backend"
NODE_ENV="${NODE_ENV:-production}"

echo "🚀 Starting deployment..."

# Navigate to app directory
cd "$APP_DIR"

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Install production dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Reload PM2
echo "♻️ Restarting PM2..."
pm2 reload ecosystem.config.cjs --env production

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
