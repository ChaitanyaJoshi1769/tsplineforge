#!/bin/bash

# TSplineForge - macOS Dependency Installation Script
# This script installs all required dependencies for local development

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   TSplineForge - macOS Dependency Installation                ║"
echo "║   This script will install Node.js, pnpm, and Docker          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "❌ This script is for macOS only"
  exit 1
fi

echo "ℹ️  This script requires sudo access to install Homebrew"
echo "ℹ️  You'll be prompted for your password below"
echo ""

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Add Homebrew to PATH for this script
  if [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  echo "✅ Homebrew already installed"
fi

echo ""
echo "📥 Installing Node.js 22..."
if brew list node@22 &> /dev/null; then
  echo "✅ Node.js 22 already installed"
else
  brew install node@22
  # Link node to PATH
  brew link node@22 --force
fi

echo ""
echo "📥 Installing pnpm 9..."
if npm list -g pnpm@9 &> /dev/null; then
  echo "✅ pnpm 9 already installed"
else
  npm install -g pnpm@9
fi

echo ""
echo "📥 Installing Docker Desktop..."
if command -v docker &> /dev/null; then
  echo "✅ Docker already installed"
else
  echo "📱 Installing Docker Desktop (this may take a few minutes)..."
  brew install --cask docker
  echo "⚠️  Please start Docker Desktop from Applications folder"
  echo "    Then run: docker-compose up -d"
fi

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "✅ INSTALLATION COMPLETE"
echo "═════════════════════════════════════════════════════════════════"
echo ""

# Verify installations
echo "Verifying installations..."
echo ""

NODE_VERSION=$(node --version 2>/dev/null || echo "Not found")
NPM_VERSION=$(npm --version 2>/dev/null || echo "Not found")
PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "Not found")

echo "✓ Node.js:  $NODE_VERSION"
echo "✓ npm:      $NPM_VERSION"
echo "✓ pnpm:     $PNPM_VERSION"

if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  echo "✓ Docker:   $DOCKER_VERSION"
else
  echo "⚠️  Docker:   Installation pending - start Docker Desktop app"
fi

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "🚀 NEXT STEPS"
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "1. Start Docker Desktop (if not already running)"
echo "   Applications → Docker.app"
echo ""
echo "2. Verify setup with verification script:"
echo "   ./scripts/verify-setup.sh"
echo ""
echo "3. Install project dependencies:"
echo "   pnpm install"
echo ""
echo "4. Start all services:"
echo "   docker-compose up -d"
echo ""
echo "5. Start development servers:"
echo "   pnpm dev"
echo ""
echo "6. Open in browser:"
echo "   http://localhost:3001"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
