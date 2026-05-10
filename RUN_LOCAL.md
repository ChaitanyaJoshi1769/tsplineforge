# 🚀 TSplineForge - Run Locally on macOS

**Complete setup guide for running TSplineForge on your Mac**

---

## ⚡ Ultra-Quick Start (Copy & Paste)

If you're in a hurry, copy and paste this single command:

```bash
cd /Users/jay/CAD && ./install-dependencies.sh && pnpm install && docker-compose up -d && pnpm dev
```

Then open: **http://localhost:3001**

---

## 📋 Step-by-Step Instructions

### Step 1: Install Dependencies (5-10 minutes)

**Option A: Automated (Recommended)**

```bash
cd /Users/jay/CAD
./install-dependencies.sh
```

This script will:
- Install Homebrew (if needed)
- Install Node.js 22
- Install pnpm 9
- Install Docker Desktop

**Option B: Manual Installation**

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 22
brew install node@22
brew link node@22 --force

# Install pnpm 9
npm install -g pnpm@9

# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

### Step 2: Verify Dependencies (1 minute)

```bash
# Check versions
node --version      # Should show v22.x.x
npm --version       # Should show 9.x.x
pnpm --version      # Should show 9.x.x

# Start Docker Desktop if not already running
open /Applications/Docker.app

# Verify Docker
docker --version    # Should show Docker version
```

### Step 3: Run Setup Verification (1 minute)

```bash
cd /Users/jay/CAD
./scripts/verify-setup.sh
```

This will check:
- ✅ Node.js installed
- ✅ pnpm installed
- ✅ Docker available
- ✅ Ports available (3000-3002, 5432, 6379, etc.)

### Step 4: Install Project Dependencies (3-5 minutes)

```bash
cd /Users/jay/CAD
pnpm install
```

This installs:
- Frontend: Next.js, React, Three.js, Tailwind
- Backend: Express, TypeScript, gRPC libraries
- Tools: ESLint, Prettier, Jest, Turbo

**Note**: This is a one-time step. Subsequent runs don't need this unless you change dependencies.

### Step 5: Start Infrastructure Services (1 minute)

```bash
cd /Users/jay/CAD
docker-compose up -d

# Verify all services are running
docker-compose ps
```

You should see 8 services in "Up" state:
```
CONTAINER ID   IMAGE                    STATUS
xxxxx          postgres:16-alpine       Up 1 minute
xxxxx          redis:7-alpine           Up 1 minute
xxxxx          minio/minio:latest       Up 1 minute
xxxxx          nats:2.10-alpine         Up 1 minute
xxxxx          prom/prometheus:latest   Up 1 minute
xxxxx          grafana/grafana:latest   Up 1 minute
```

### Step 6: Start Development Servers (1 minute)

```bash
cd /Users/jay/CAD
pnpm dev
```

Wait for output like:
```
✓ Compiled successfully
✓ Ready in 35ms
✓ All services running
```

### Step 7: Open in Browser (< 1 minute)

Open: **http://localhost:3001**

You should see the TSplineForge login page!

---

## 🧪 First Test - Register & Login

1. Click **"Register"** button
2. Enter:
   - **Email**: `test@example.com`
   - **Password**: `Test123!@`
3. Click **"Create Account"**
4. Login with these credentials

---

## 🎯 What You Can Do Now

### 1. Explore the CAD Editor
```
Navigate to: http://localhost:3001/editor
- See 3D viewport with grid
- Upload a 3D mesh (.obj, .stl, .ply, .gltf)
- Rotate/zoom with mouse
- Click vertices to select
- Edit properties (position, rotation, scale, color)
```

### 2. Try Claude AI Integration
```
- Click "Ask Claude" button
- Type: "Add error handling to this function"
- See AI-generated code suggestions
- Accept or reject changes
```

### 3. Monitor Services
```
Prometheus Metrics:     http://localhost:9090
Grafana Dashboards:     http://localhost:3002
MinIO File Browser:     http://localhost:9001
API Health Check:       http://localhost:3000/health
```

### 4. Run Tests
```bash
cd /Users/jay/CAD
pnpm test

# Or follow TEST_CHECKLIST.md for manual testing
cat TEST_CHECKLIST.md
```

---

## ⏱️ Timeline

| Step | Time | Cumulative |
|------|------|-----------|
| Install dependencies | 5-10 min | 5-10 min |
| Verify setup | 1 min | 6-11 min |
| Install project deps | 3-5 min | 9-16 min |
| Start services | 1 min | 10-17 min |
| Start servers | 1 min | 11-18 min |
| **READY TO USE** | | **~15 min** |

---

## 🛠️ Useful Commands While Running

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f gateway

# Stop services (keeps data)
docker-compose stop

# Restart services
docker-compose restart

# Stop and remove containers (keeps data)
docker-compose down

# Full reset (removes all data)
docker-compose down -v

# Check service health
docker-compose ps

# Run tests
pnpm test

# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build

# Stop dev servers
# Press Ctrl+C in the terminal running 'pnpm dev'
```

---

## 🔧 Troubleshooting

### "Port already in use"
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### "Docker daemon not running"
```bash
# Start Docker Desktop
open /Applications/Docker.app

# Wait 30 seconds for it to fully start
sleep 30

# Verify Docker is running
docker ps
```

### "pnpm install fails"
```bash
# Clear pnpm cache
pnpm store prune

# Try again
pnpm install

# If still fails, use npm
npm install
npm run dev
```

### "Services won't start"
```bash
# Check Docker is running
docker ps

# View detailed logs
docker-compose logs

# Restart Docker
open /Applications/Docker.app

# Wait 30 seconds
sleep 30

# Try again
docker-compose up -d
```

### "Database connection error"
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Wait 10 seconds
sleep 10

# Retry your operation
```

### "Cannot find module" errors
```bash
# This happens if Node.js installation failed
# Verify Node.js is installed:
node --version

# If not found, reinstall:
brew install node@22
brew link node@22 --force

# Clear node_modules and try again
rm -rf node_modules
pnpm install
```

---

## 📚 Documentation

After setup, explore:

```bash
# Quick reference
cat QUICK_START_LOCAL.md

# Complete local setup guide
cat LOCAL_SETUP_GUIDE.md

# System architecture
cat ARCHITECTURE.md

# Test procedures
cat TEST_CHECKLIST.md

# Production deployment
cat docs/DEPLOYMENT.md

# API documentation
cat docs/API.md
```

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ `http://localhost:3001` shows login page
2. ✅ Can register and login successfully
3. ✅ CAD Editor loads with 3D viewport
4. ✅ Can upload a 3D mesh file
5. ✅ Claude AI button responds to prompts
6. ✅ Docker services show as "Up" in `docker-compose ps`
7. ✅ Prometheus and Grafana dashboards load

---

## 🚀 Next Steps After Setup

### For Development
```bash
# Make code changes
# Files in apps/web/src and services/gateway/src auto-reload

# Run tests
pnpm test

# Format code
pnpm format

# Commit changes
git add .
git commit -m "Your feature description"
git push origin main
```

### For Production Deployment
```bash
# Read deployment guide
cat docs/DEPLOYMENT.md

# Build Docker images
docker build -f infrastructure/docker/Dockerfile.gateway -t myregistry/gateway:v1.0.0 .

# Deploy to Kubernetes
kubectl apply -k infrastructure/k8s/overlays/prod
```

---

## 💡 Pro Tips

1. **Keep Docker running**: Leave `docker-compose up -d` running in background
2. **Monitor logs**: Use `docker-compose logs -f` in another terminal
3. **Hot reload**: Changes to code auto-apply (no restart needed)
4. **Separate terminals**: Run `pnpm dev` in one, commands in another
5. **Database backup**: `docker-compose down` preserves data in volumes
6. **Fresh start**: `docker-compose down -v` for complete reset

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs**: `docker-compose logs`
2. **Run verification**: `./scripts/verify-setup.sh`
3. **Read troubleshooting**: This section above
4. **Consult guides**: `LOCAL_SETUP_GUIDE.md`
5. **GitHub Issues**: Create an issue with `[HELP]` tag

---

## 🎯 Summary

**To run TSplineForge locally:**

```bash
# One-time setup (15 minutes total)
./install-dependencies.sh        # Install Node.js, pnpm, Docker
./scripts/verify-setup.sh        # Verify everything is ready
pnpm install                     # Install project dependencies
docker-compose up -d             # Start infrastructure services
pnpm dev                         # Start development servers

# Then open http://localhost:3001
```

**To restart later:**

```bash
# Services keep running in background
# Just start dev servers
pnpm dev

# Or restart everything
docker-compose up -d && pnpm dev
```

---

**Happy coding! TSplineForge is now running on your Mac! 🚀**
