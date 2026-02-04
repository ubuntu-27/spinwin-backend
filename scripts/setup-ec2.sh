#!/bin/bash
# EC2 Initial Setup Script for spinwin-backend
# Run this once on a fresh EC2 instance

set -e

echo "🔧 Setting up EC2 instance for spinwin-backend..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Install Git (if not present)
sudo apt-get install -y git

# Create app directory
APP_DIR="$HOME/spinwin-backend"
mkdir -p "$APP_DIR"

echo "✅ Initial setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url> $APP_DIR"
echo "2. Create .env file with your environment variables"
echo "3. Run: cd $APP_DIR && npm install && npm run build"
echo "4. Start with PM2: pm2 start ecosystem.config.cjs --env production"
echo "5. Save PM2 config: pm2 save"
