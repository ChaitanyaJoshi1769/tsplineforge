#!/bin/bash

# TSplineForge Local Setup Verification Script
# Checks all prerequisites and services are running correctly

set -e

echo "🔍 TSplineForge Setup Verification"
echo "=================================="
echo ""

FAILED=0
PASSED=0

# Helper functions
check_command() {
  if command -v "$1" &> /dev/null; then
    echo "✅ $1 is installed"
    ((PASSED++))
  else
    echo "❌ $1 is NOT installed (Required: $2)"
    ((FAILED++))
  fi
}

check_service() {
  if curl -s "$1" > /dev/null; then
    echo "✅ $2 is running at $1"
    ((PASSED++))
  else
    echo "❌ $2 is NOT responding at $1"
    ((FAILED++))
  fi
}

# Check Node.js
echo "📋 Checking Prerequisites..."
check_command "node" "Node.js 22+ required"

# Check pnpm
check_command "pnpm" "pnpm 9+ required"

# Check Docker
check_command "docker" "Docker required for containers"

# Check Docker Compose
check_command "docker-compose" "Docker Compose required"

echo ""
echo "🐳 Checking Docker Services..."

# Check if docker-compose services are running
if docker-compose ps 2>/dev/null | grep -q "postgres"; then
  echo "✅ PostgreSQL is running"
  ((PASSED++))
else
  echo "⚠️  PostgreSQL is not running (run: docker-compose up -d)"
  ((FAILED++))
fi

if docker-compose ps 2>/dev/null | grep -q "redis"; then
  echo "✅ Redis is running"
  ((PASSED++))
else
  echo "⚠️  Redis is not running (run: docker-compose up -d)"
  ((FAILED++))
fi

if docker-compose ps 2>/dev/null | grep -q "nats"; then
  echo "✅ NATS is running"
  ((PASSED++))
else
  echo "⚠️  NATS is not running (run: docker-compose up -d)"
  ((FAILED++))
fi

echo ""
echo "🌐 Checking API Endpoints..."

# Check services if containers are running
check_service "http://localhost:3000/health" "API Gateway"
check_service "http://localhost:9001" "MinIO Console"
check_service "http://localhost:6379" "Redis" || true
check_service "http://localhost:5432" "PostgreSQL" || true

echo ""
echo "📦 Checking Dependencies..."

# Check package installations
if [ -d "node_modules" ]; then
  echo "✅ Node modules installed"
  ((PASSED++))
else
  echo "⚠️  Node modules not installed (run: pnpm install)"
  ((FAILED++))
fi

echo ""
echo "=================================="
echo "✅ Passed: $PASSED checks"
echo "❌ Failed: $FAILED checks"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All checks passed! Setup is ready."
  echo ""
  echo "Next steps:"
  echo "1. pnpm install           # Install dependencies"
  echo "2. docker-compose up -d   # Start services"
  echo "3. pnpm dev              # Start development servers"
  echo "4. Open http://localhost:3001"
  exit 0
else
  echo "⚠️  Some checks failed. Please fix the issues above."
  exit 1
fi
