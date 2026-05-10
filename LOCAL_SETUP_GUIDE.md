# TSplineForge Local Setup & Testing Guide

This guide walks you through setting up TSplineForge locally and running tests to verify everything works.

## Prerequisites

- **Node.js 22+** - Download from https://nodejs.org/
- **pnpm 9+** - Install with `npm install -g pnpm`
- **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
- **Docker Compose 2.0+** - Included with Docker Desktop
- **Rust 1.75+** (optional, for building microservices from source)
- **Git** - For version control

## Step 1: Verify Setup

Run the verification script to check all prerequisites:

```bash
./scripts/verify-setup.sh
```

This will check:
- ✅ Required tools installed
- ✅ Docker services accessible
- ✅ Port availability
- ✅ Dependencies installed

## Step 2: Start Infrastructure Services

The easiest way is with Docker Compose:

```bash
# Start all services (PostgreSQL, Redis, MinIO, NATS, Prometheus, Grafana)
docker-compose up -d

# Verify services are running
docker-compose ps
```

**What's running:**
- PostgreSQL (port 5432) - Main database
- Redis (port 6379) - Cache layer
- MinIO (port 9001) - S3-compatible object storage
- NATS (port 4222) - Message broker
- Prometheus (port 9090) - Metrics collection
- Grafana (port 3002) - Monitoring dashboards

## Step 3: Install Dependencies

```bash
# Install all project dependencies
pnpm install

# This installs dependencies for:
# - Root project
# - /apps/web (Next.js frontend)
# - /services/gateway (API server)
# - All microservices
```

## Step 4: Start Development Servers

```bash
# Start all servers in parallel
pnpm dev

# This will start:
# - Web UI (http://localhost:3001)
# - API Gateway (http://localhost:3000)
# - Microservices (if built)
```

**Wait for all servers to be ready** (watch for "ready in X ms" messages)

## Step 5: Access the Application

Open your browser and navigate to:

```
http://localhost:3001
```

### Default Credentials

To test, register a new account:

1. Click "Register" on the login page
2. Enter email: `test@example.com`
3. Enter password: `Test123!`
4. Create account

Then login with those credentials.

## Step 6: Run Tests

### Unit Tests

```bash
# Run all tests across all packages
pnpm test

# Run tests for specific service
cd services/geometry-engine
cargo test

cd ../gateway
npm test
```

### Integration Tests

```bash
# Test API endpoints
cd services/gateway
npm run test:integration

# Test with sample data
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Manual Testing Flow

#### 1. Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"SecurePass123!"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"SecurePass123"}'

# Response will include JWT token
# Use token in Authorization header for other requests
```

#### 2. Test CAD Editor

1. Navigate to http://localhost:3001/editor
2. Click "Upload Mesh"
3. Select a 3D model file (OBJ, STL, PLY, GLTF)
4. Wait for upload and validation
5. Test viewport interactions:
   - **Rotate**: Click and drag with mouse
   - **Zoom**: Mouse wheel scroll
   - **Pan**: Right-click and drag
6. Click on vertices to select them
7. Use Property Inspector to modify position/rotation/scale

#### 3. Test Claude AI Integration

1. In the CAD editor, click "Ask Claude" button
2. Type a code modification request: `"Add error handling to this function"`
3. Review the suggested changes
4. Click "Accept Changes" or "Reject"
5. If accepted, code updates in the editor

#### 4. Test Mesh Processing

Through the API:

```bash
# Validate mesh topology
curl -X POST http://localhost:3000/api/meshes/validate \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@model.obj"

# Remesh with quad generation
curl -X POST http://localhost:3000/api/remeshing/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meshId": "uuid-of-mesh",
    "targetQuadCount": 1000,
    "iterations": 5
  }'

# Get job status
curl http://localhost:3000/api/remeshing/jobs/job-id \
  -H "Authorization: Bearer $TOKEN"
```

## Step 7: View Monitoring

### Prometheus Metrics

http://localhost:9090

- API request rates and latencies
- Database query performance
- Cache hit rates
- Message queue depth

### Grafana Dashboards

http://localhost:3002 (credentials: admin/admin)

Pre-configured dashboards for:
- Request metrics
- Database performance
- Service health
- Error rates

## Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Find what's using a port (macOS/Linux)
lsof -i :3000
lsof -i :5432

# Change docker-compose port mappings if needed
# Edit docker-compose.yml and change port assignments
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Connect to database directly
psql -h localhost -U tspline -d tsplineforge

# Run migrations manually
docker-compose exec postgres psql -U tspline -d tsplineforge \
  -f /docker-entrypoint-initdb.d/init.sql
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose logs redis

# Connect to Redis CLI
redis-cli -h localhost -p 6379
ping  # Should return PONG
```

### Services Not Starting

```bash
# View logs for all services
docker-compose logs -f

# View specific service logs
docker-compose logs -f gateway
docker-compose logs -f postgres

# Restart services
docker-compose restart
```

### API Not Responding

```bash
# Check health endpoint
curl http://localhost:3000/health

# View gateway logs
docker-compose logs gateway

# Restart gateway
docker-compose restart gateway
```

## Performance Testing

### Load Testing

```bash
# Install Apache Bench (macOS)
brew install httpd

# Run load test (1000 requests, 10 concurrent)
ab -n 1000 -c 10 http://localhost:3000/health

# Results show:
# - Requests/sec (throughput)
# - Response times
# - Percentiles (p50, p95, p99)
```

### Memory Profiling

```bash
# Enable profiling in .env
ENABLE_PROFILING=true

# View heap snapshots
node --inspect-brk services/gateway/dist/index.js
# Open chrome://inspect in Chrome DevTools
```

## Cleanup

### Stop Services

```bash
# Stop all containers (keep data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove all data (fresh start)
docker-compose down -v
```

### Clear Node Modules

```bash
# Remove all node_modules
pnpm clean
```

## Success Checklist

- [ ] `./scripts/verify-setup.sh` passes all checks
- [ ] `docker-compose ps` shows all services running
- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts all servers
- [ ] http://localhost:3001 loads in browser
- [ ] Can register and login with test account
- [ ] Can access http://localhost:3000/health
- [ ] CAD editor loads and accepts mesh uploads
- [ ] Claude AI sidebar works with test prompt
- [ ] All tests pass with `pnpm test`

## Next Steps

Once local setup is verified:

1. **Read the codebase** - Start with ARCHITECTURE.md
2. **Try modifications** - Edit components in apps/web/src
3. **Build and test** - Run `pnpm build && pnpm test`
4. **Deploy locally** - Use `docker-compose` configs
5. **Deploy to cloud** - Follow DEPLOYMENT.md for Kubernetes

## Getting Help

- 📖 Documentation: See `/docs` folder
- 🐛 Issues: GitHub Issues for bug reports
- 💬 Questions: GitHub Discussions for Q&A
- 📧 Email: Create an issue with [HELP] tag

## Resources

- [Architecture Overview](ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Claude Integration](docs/CLAUDE_INTEGRATION.md)
