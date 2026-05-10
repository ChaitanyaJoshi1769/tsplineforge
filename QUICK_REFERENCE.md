# TSplineForge Quick Reference

## Setup (First Time)

```bash
git clone https://github.com/anthropics/tsplineforge.git
cd tsplineforge
pnpm install
docker-compose up -d
pnpm dev
```

Browser: http://localhost:3001

## Common Commands

### Development

```bash
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm lint             # Lint everything
pnpm format           # Format code
pnpm test             # Run all tests
```

### Rust (Geometry Engine)

```bash
cd services/geometry-engine
cargo build --release  # Build optimized
cargo test            # Run tests
cargo bench           # Run benchmarks
cargo clippy          # Lint
```

### Node.js Services

```bash
cd services/gateway
pnpm dev              # Watch mode
pnpm build            # Production build
pnpm test             # Run tests
pnpm lint             # Lint
```

### Docker

```bash
docker-compose up      # Start all services
docker-compose down    # Stop all services
docker-compose logs    # View logs
docker-compose ps      # Service status
```

### Kubernetes

```bash
kubectl apply -f infrastructure/k8s/
kubectl get all -n tsplineforge
kubectl logs -n tsplineforge deployment/gateway
kubectl port-forward svc/gateway 3000:80 -n tsplineforge
```

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Web UI | 3001 | http://localhost:3001 |
| API Gateway | 3000 | http://localhost:3000 |
| Postgres | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO | 9000/9001 | http://localhost:9001 |
| NATS | 4222 | nats://localhost:4222 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |

## API Quick Start

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass"}'
```

### Login

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass"}' \
  | jq -r '.token')
```

### Upload Mesh

```bash
curl -X POST http://localhost:3000/api/mesh/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"my_model",
    "format":"obj",
    "data":"'$(base64 model.obj)'"
  }'
```

### Validate Mesh

```bash
curl -X POST http://localhost:3000/api/mesh/{MESH_ID}/validate \
  -H "Authorization: Bearer $TOKEN"
```

## File Structure Cheat Sheet

```
tsplineforge/
├── services/
│   ├── geometry-engine/    # Rust core
│   ├── gateway/            # Node.js API
│   ├── remesh-engine/      # 🚧 Quad remeshing
│   ├── tspline-kernel/     # 🚧 T-Splines
│   ├── surface-fitting/    # 🚧 Fitting
│   └── ai-topology/        # 🚧 AI
├── apps/
│   └── web/                # Next.js frontend
├── packages/
│   ├── ui/                 # Components
│   ├── viewer/             # 3D viewport
│   ├── sdk-js/             # JS SDK
│   └── sdk-python/         # Python SDK
├── infrastructure/
│   ├── docker/             # Dockerfiles
│   ├── k8s/                # Kubernetes
│   └── monitoring/         # Observability
└── docs/                   # Documentation
```

## Code Examples

### Rust Mesh

```rust
use geometry_engine::{MeshBuilder, MeshValidator};
use nalgebra::Vector3;

let mesh = MeshBuilder::new("cube")
    .vertex(Vector3::new(0.0, 0.0, 0.0))
    .vertex(Vector3::new(1.0, 0.0, 0.0))
    .vertex(Vector3::new(1.0, 1.0, 0.0))
    .triangle(0, 1, 2)
    .build();

let validator = MeshValidator::new(1e-10);
let report = validator.validate(&mesh);
println!("Valid: {}", report.is_valid);
```

### TypeScript API Call

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const mesh = await client.post('/mesh/upload', {
  name: 'model',
  format: 'obj',
  data: base64Data
});
```

### React Component

```typescript
import { useAuth } from '@/context/auth';

export function MyComponent() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user ? (
        <>
          <p>Welcome {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login('user@test.com', 'pass')}>
          Login
        </button>
      )}
    </div>
  );
}
```

## Debugging

### Logs

```bash
# Gateway
docker-compose logs gateway -f

# Geometry engine
docker-compose logs geometry-engine -f

# Web app (Chrome DevTools)
# Open http://localhost:3001 and press F12
```

### Database

```bash
# Connect to Postgres
docker-compose exec postgres psql -U tspline -d tsplineforge

# Example queries
SELECT * FROM users;
SELECT * FROM meshes;
```

### Redis

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Example commands
KEYS *
GET mesh:uuid
FLUSHALL  # ⚠️ Clears everything
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| DB connection failed | `docker-compose restart postgres` |
| WASM load error | `rm -rf apps/web/.next && pnpm build` |
| Out of memory | `NODE_OPTIONS="--max-old-space-size=4096" pnpm dev` |
| Logs too noisy | `docker-compose logs --tail=50` |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Format & test
pnpm format
pnpm test

# Commit
git add .
git commit -m "Add my feature"

# Push
git push origin feature/my-feature

# Create PR on GitHub
# Wait for CI to pass
# Get review & merge
```

## Useful Links

- **GitHub**: https://github.com/anthropics/tsplineforge
- **Issues**: https://github.com/anthropics/tsplineforge/issues
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Docs**: [docs/API.md](./docs/API.md)
- **Getting Started**: [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)
- **Deployment**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Environment Variables

See `.env.example` for all variables.

Key ones:
- `NODE_ENV` - development/production
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Auth token secret
- `LOG_LEVEL` - Logging verbosity

## Performance Tips

- Use `pnpm` instead of `npm` (faster)
- Run `pnpm install` with `--frozen-lockfile` in CI
- Use `turbo` for incremental builds
- Enable Docker BuildKit: `export DOCKER_BUILDKIT=1`
- Use `.dockerignore` to exclude files

## Security Checklist

- ✅ Change `JWT_SECRET` in production
- ✅ Use HTTPS/TLS in production
- ✅ Enable database backups
- ✅ Rotate API keys regularly
- ✅ Monitor logs for errors
- ✅ Keep dependencies updated
- ✅ Use strong passwords
- ✅ Enable RBAC in Kubernetes

## Production Deployment

```bash
# Build images
docker-compose build

# Push to registry
docker push tsplineforge/gateway:latest
docker push tsplineforge/web:latest

# Deploy to Kubernetes
kubectl apply -k infrastructure/k8s/overlays/prod

# Verify
kubectl get pods -n tsplineforge
kubectl rollout status deployment/gateway -n tsplineforge
```

## Getting Help

1. Check docs in `/docs`
2. Search GitHub issues
3. Read error messages carefully
4. Check logs: `docker-compose logs`
5. Open GitHub issue with:
   - Steps to reproduce
   - Error message
   - Environment details
   - What you tried

---

**Last Updated**: 2025-01-15
**Version**: 0.1.0
