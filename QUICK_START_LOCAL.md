# TSplineForge - Quick Start Guide (Local Development)

**Time to First Run**: ~10-15 minutes  
**Difficulty**: Beginner-friendly  
**Platform**: macOS, Linux, Windows (WSL2)

---

## 🚀 One-Command Quick Start

```bash
# Complete setup in one shot (macOS with Homebrew)
brew install node@22 && npm install -g pnpm@9 && \
git clone https://github.com/ChaitanyaJoshi1769/tsplineforge.git && \
cd tsplineforge && \
./scripts/verify-setup.sh && \
pnpm install && \
docker-compose up -d && \
pnpm dev
```

Then open: **http://localhost:3001**

---

## 📋 Step-by-Step Setup

### 1. Install Prerequisites (5 minutes)

**macOS** (using Homebrew):
```bash
# Install Node.js 22
brew install node@22

# Verify installation
node --version  # Should show v22.x.x or higher
npm --version   # Should show 9.x.x or higher

# Install pnpm
npm install -g pnpm@9

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
# Or: brew install --cask docker
```

**Linux** (Ubuntu/Debian):
```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
```

**Windows** (WSL2):
```bash
# Open PowerShell as Administrator
# Enable WSL2: wsl --install

# In WSL2 terminal, follow Linux instructions above
```

### 2. Verify Setup (1 minute)

```bash
# Clone the repository
git clone https://github.com/ChaitanyaJoshi1769/tsplineforge.git
cd tsplineforge

# Run verification script
./scripts/verify-setup.sh
```

**Expected output:**
```
✅ node is installed
✅ pnpm is installed
✅ docker is installed
✅ docker-compose is installed
✅ Node modules installed (or warning if not yet)
...
🎉 All checks passed! Setup is ready.
```

### 3. Install Dependencies (3-5 minutes)

```bash
# Install all project dependencies
pnpm install

# This installs:
# - Frontend: Next.js, React, Three.js, Tailwind
# - Backend: Express, TypeScript, gRPC
# - Tools: ESLint, Prettier, Jest
```

### 4. Start Docker Services (1 minute)

```bash
# Start all infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps

# Should see 8 services in "Up" state:
# ✓ postgres       (5432)
# ✓ redis          (6379)
# ✓ minio          (9000, 9001)
# ✓ nats           (4222)
# ✓ prometheus     (9090)
# ✓ grafana        (3002)
# ✓ gateway        (3000)
```

### 5. Start Development Servers (1 minute)

```bash
# Start all development servers in parallel
pnpm dev

# Wait for the output:
# ✓ Ready in X ms
# ✓ Compiled successfully
# ✓ All services ready
```

### 6. Open in Browser (< 1 minute)

Visit: **http://localhost:3001**

You should see the TSplineForge login page.

---

## 🧪 First Test (2 minutes)

### Register a Test Account

1. Click **"Register"** on the login page
2. Enter:
   - **Email**: `test@example.com`
   - **Password**: `Test123!@`
3. Click **"Create Account"**
4. Login with these credentials

### Try the CAD Editor

1. Navigate to **CAD Editor** (click "Editor" in the sidebar)
2. You should see:
   - ✅ 3D viewport with a grid
   - ✅ Property inspector panel
   - ✅ Toolbar with tools
   - ✅ "Ask Claude" button

### Try Claude AI

1. Click **"Ask Claude"** button
2. Type: `"Add error handling to this function"`
3. Claude should respond with code suggestions
4. Click **"Accept Changes"** to apply them

---

## 📊 What's Running

| Component | Port | URL | Purpose |
|-----------|------|-----|---------|
| **Web UI** | 3001 | http://localhost:3001 | Main application |
| **API Gateway** | 3000 | http://localhost:3000/health | Backend API |
| **PostgreSQL** | 5432 | postgres://localhost | Database |
| **Redis** | 6379 | redis://localhost | Cache layer |
| **MinIO** | 9000/9001 | http://localhost:9001 | File storage |
| **NATS** | 4222 | nats://localhost | Message queue |
| **Prometheus** | 9090 | http://localhost:9090 | Metrics |
| **Grafana** | 3002 | http://localhost:3002 | Dashboards |

---

## 🛠️ Common Commands

```bash
# View logs
docker-compose logs -f              # All services
docker-compose logs -f postgres     # Specific service

# Stop services (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Remove everything (fresh start)
docker-compose down -v

# Run tests
pnpm test

# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build

# Stop development servers
# Press Ctrl+C in the terminal running `pnpm dev`
```

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Find what's using port 3001
lsof -i :3001

# Stop it or use different port
# Edit docker-compose.yml to change ports
```

### "Docker daemon not running"
```bash
# Start Docker Desktop (macOS)
open /Applications/Docker.app

# Or start Docker service (Linux)
sudo systemctl start docker
```

### "pnpm install fails"
```bash
# Clear cache and retry
pnpm store prune
pnpm install

# Or use npm if pnpm has issues
npm install
npm run dev
```

### "Database connection error"
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Wait 10 seconds before retrying
sleep 10
```

### "Services not starting"
```bash
# Run verification script for diagnosis
./scripts/verify-setup.sh

# Check Docker is running
docker ps

# View detailed logs
docker-compose logs
```

---

## 📚 Next Steps

After successful setup:

1. **Read the documentation**
   ```bash
   # System architecture
   cat ARCHITECTURE.md
   
   # API endpoints
   cat docs/API.md
   
   # Full setup guide
   cat LOCAL_SETUP_GUIDE.md
   ```

2. **Run the test suite**
   ```bash
   # Follow TEST_CHECKLIST.md
   cat TEST_CHECKLIST.md
   
   # Run unit tests
   pnpm test
   ```

3. **Make changes**
   ```bash
   # Code is hot-reloaded
   # Edit files in apps/web/src or services/gateway/src
   # Changes appear automatically
   ```

4. **Deploy locally**
   ```bash
   # Build for production
   pnpm build
   
   # Deploy to Kubernetes (if installed)
   kubectl apply -k infrastructure/k8s/overlays/dev
   ```

---

## 🎯 Common Development Tasks

### Edit Frontend Code
```bash
# Navigate to web app
cd apps/web/src

# Files auto-reload on save
# Edit components in components/
# Edit pages in app/
```

### Edit Backend Code
```bash
# Navigate to API gateway
cd services/gateway/src

# Files auto-reload on save
# Edit routes in routes/
# Edit services in services/
```

### Run Code Quality Checks
```bash
# Format code
pnpm format

# Check linting
pnpm lint

# Run tests
pnpm test

# Build everything
pnpm build
```

### Access Database
```bash
# Connect directly to PostgreSQL
psql -h localhost -U tspline -d tsplineforge

# Or use a UI tool like pgAdmin
docker-compose exec postgres psql -U tspline -d tsplineforge
```

---

## 🚀 Deployment After Local Testing

Once local development is complete:

```bash
# For production deployment
cat docs/DEPLOYMENT.md

# For Kubernetes
cat infrastructure/k8s/README.md

# For Docker production images
cat infrastructure/docker/README.md
```

---

## ⏱️ Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Install prerequisites | 5-10 min | One-time |
| Clone & verify | 1-2 min | Quick |
| Install dependencies | 3-5 min | ☕ Coffee break |
| Start Docker services | 1 min | Fast |
| Start dev servers | 1 min | Quick |
| **Total** | **~15 min** | Ready! |

---

## 💡 Pro Tips

1. **Keep Docker running**: Leave `docker-compose up -d` running in the background
2. **Use tmux/screen**: Split terminal to run `pnpm dev` in one window, work in another
3. **Enable hot reload**: Changes to code auto-apply (no restart needed)
4. **Read logs**: `docker-compose logs -f` shows what's happening
5. **Backup database**: `docker-compose down` preserves data in volumes
6. **Fresh start**: `docker-compose down -v` clears everything for a clean restart

---

## 📞 Need Help?

- 📖 **Full setup guide**: Read `LOCAL_SETUP_GUIDE.md`
- 🧪 **Testing guide**: Read `TEST_CHECKLIST.md`
- 🏗️ **Architecture**: Read `ARCHITECTURE.md`
- 🤝 **Contributing**: Read `CONTRIBUTING.md`
- 💬 **Questions**: Create a GitHub Discussion
- 🐛 **Bugs**: Create a GitHub Issue with `[BUG]` tag

---

**Status**: Ready to run! 🎉

Follow the steps above and you'll have TSplineForge running in 10-15 minutes.
