# Getting Started with TSplineForge

## 5-Minute Setup

### 1. Clone & Install

```bash
git clone https://github.com/anthropics/tsplineforge.git
cd tsplineforge
pnpm install
```

### 2. Start Services

```bash
# Terminal 1: Infrastructure
docker-compose up

# Terminal 2: Development servers
pnpm dev
```

### 3. Open Browser

- Web UI: http://localhost:3001
- API: http://localhost:3000
- MinIO Console: http://localhost:9001

### 4. Test It

1. Register a new account
2. Click "Upload Mesh"
3. Select an OBJ/STL file
4. View validation report
5. Try remeshing

## Development Workflow

### Directory Navigation

```bash
# Workspace root
cd .

# Geometry engine
cd services/geometry-engine

# Web frontend
cd apps/web

# Gateway API
cd services/gateway
```

### Making Code Changes

#### Backend (Rust Geometry)

```bash
cd services/geometry-engine

# Edit src/mesh.rs, src/topology.rs, etc.
# Run tests
cargo test

# Build
cargo build --release
```

#### Backend (Node.js Gateway)

```bash
cd services/gateway

# Edit src/routes/mesh.ts, etc.
# Format
pnpm format

# Lint
pnpm lint
```

#### Frontend (React/Next.js)

```bash
cd apps/web

# Edit src/app/page.tsx, src/components/, etc.
# Dev server auto-reloads

# Type check
pnpm run type-check
```

### Database Migrations

```bash
# PostgreSQL is running in docker-compose
# Connect with:
psql -h localhost -U tspline -d tsplineforge

# Tables are auto-created on first run
# To reset:
docker-compose exec postgres psql -U tspline -d tsplineforge -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Debugging

#### JavaScript

```bash
# Chrome DevTools
# Open http://localhost:3001
# F12 → Sources, Debugger

# VSCode Debugger
# .vscode/launch.json includes Node.js attach config
```

#### Rust

```bash
# Build with debug symbols
cargo build

# GDB debugging
rust-gdb --args ./target/debug/geometry-server

# Or use lldb (macOS)
lldb ./target/debug/geometry-server
```

## Common Tasks

### Add a New API Endpoint

```bash
# 1. Add route handler
# services/gateway/src/routes/newfeature.ts
export const newFeatureRouter = Router();
newFeatureRouter.post('/', (req, res) => {
  // Handle request
  res.json({ result: 'ok' });
});

# 2. Register in gateway
# services/gateway/src/index.ts
app.use('/api/newfeature', requireAuth, newFeatureRouter);

# 3. Test
curl -H "Authorization: Bearer $TOKEN" \
     -X POST http://localhost:3000/api/newfeature
```

### Add a New UI Component

```bash
# 1. Create component
# apps/web/src/components/MyComponent.tsx
export function MyComponent() {
  return <div>My Component</div>;
}

# 2. Import and use
# apps/web/src/app/page.tsx
import { MyComponent } from '@/components/MyComponent';
export default function Home() {
  return <MyComponent />;
}

# Dev server auto-reloads
```

### Run Geometry Benchmarks

```bash
cd services/geometry-engine

# Compile benchmarks
cargo bench --no-run

# Run
cargo bench
```

## Testing

### Unit Tests

```bash
# All tests
pnpm test

# Rust only
cd services/geometry-engine && cargo test

# Watch mode
pnpm test -- --watch
```

### Integration Tests

```bash
# With docker-compose running:
cd services/gateway
npm run test:integration
```

### End-to-End Tests

```bash
# With full stack running:
cd apps/web
pnpm run test:e2e
```

## Troubleshooting

### Port Already in Use

```bash
# Kill processes
lsof -ti:3000,3001,5432,6379 | xargs kill -9

# Or use different ports
GATEWAY_PORT=3002 pnpm dev
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps

# Restart if needed
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### WASM Module Load Failed

```bash
# Ensure Next.js WebAssembly config is correct
# (already in next.config.ts)

# Clear Next.js cache
rm -rf apps/web/.next

# Rebuild
cd apps/web && pnpm build
```

### Out of Memory

```bash
# Increase Docker memory
docker-compose down
# Edit docker-compose.yml memory limits

# Or increase Node heap
NODE_OPTIONS="--max-old-space-size=4096" pnpm dev
```

## Learning Path

1. **Week 1**: Core Concepts
   - Read [ARCHITECTURE.md](../ARCHITECTURE.md)
   - Explore mesh data structures
   - Run existing tests

2. **Week 2**: API Development
   - Add new Gateway endpoint
   - Test with curl/Postman
   - Add validation

3. **Week 3**: Geometry Algorithms
   - Implement curvature computation
   - Add to remeshing pipeline
   - Benchmark performance

4. **Week 4**: Full Stack Feature
   - UI form for new feature
   - API endpoint
   - Geometry engine implementation
   - Tests and docs

## Getting Help

### Documentation
- [Architecture](../ARCHITECTURE.md)
- [API Reference](./api.md)
- [Algorithm Guide](./algorithms.md)

### Community
- [GitHub Issues](https://github.com/anthropics/tsplineforge/issues)
- [Discussions](https://github.com/anthropics/tsplineforge/discussions)

### Contributing
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- Code style: Prettier (auto-format)
- Tests required for PRs

## Next Steps

- [ ] Complete the 5-minute setup
- [ ] Upload your first mesh
- [ ] Read ARCHITECTURE.md
- [ ] Make your first code change
- [ ] Run the test suite
- [ ] Check out open issues
