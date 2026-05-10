# Development Guide

Complete guide for extending and developing TSplineForge.

## Project Structure Quick Ref

```
services/
├── geometry-engine/    # Mesh types, topology, validation
├── remesh-engine/      # Quad remeshing pipeline
├── tspline-kernel/     # T-mesh & surface operations
├── surface-fitting/    # Curve fitting optimization
├── ai-topology/        # Neural network suggestions
└── gateway/            # REST API & orchestration

apps/
└── web/                # Next.js frontend

packages/
├── ui/                 # React components
├── viewer/             # 3D viewport
├── sdk-js/             # TypeScript SDK
└── sdk-python/         # Python SDK
```

## Adding a New Service

### 1. Create Service Directory

```bash
mkdir -p services/my-service/{src,tests}
```

### 2. Create Cargo.toml (Rust)

```toml
[package]
name = "my-service"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.35", features = ["full"] }
tonic = "0.11"
# ...other deps

[[bin]]
name = "my-service-server"
path = "src/bin/server.rs"
```

### 3. Create Service Module

```rust
// src/lib.rs
pub mod operations;

pub struct MyService {
    // Configuration
}

impl MyService {
    pub fn new() -> Self {
        Self {}
    }
    
    pub fn do_something(&self) {
        // Implementation
    }
}
```

### 4. Create gRPC Server

```rust
// src/bin/server.rs
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "127.0.0.1:50051".parse()?;
    let service = MyService::new();
    
    // Start server
    Ok(())
}
```

### 5. Register in Workspace

Add to root `pnpm-workspace.yaml`:

```yaml
packages:
  - 'services/my-service'
```

### 6. Add Docker Build

Create `infrastructure/docker/Dockerfile.my-service`:

```dockerfile
FROM rust:1.81 as builder
WORKDIR /app
COPY services/my-service .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/my-service-server .
EXPOSE 50051
CMD ["./my-service-server"]
```

## Adding Frontend Features

### 1. Create Component

```typescript
// src/components/MyFeature.tsx
'use client';

import { useState } from 'react';

export function MyFeature() {
  const [state, setState] = useState<string>('');

  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      {/* Component JSX */}
    </div>
  );
}
```

### 2. Create Page

```typescript
// src/app/my-feature/page.tsx
'use client';

import { useAuth } from '@/context/auth';
import { MyFeature } from '@/components/MyFeature';

export default function MyFeaturePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">My Feature</h1>
      <MyFeature />
    </div>
  );
}
```

### 3. Update Navigation

Add link in navbar/sidebar to route to new page.

## Adding API Endpoints

### 1. Create Route Handler

```typescript
// services/gateway/src/routes/my-feature.ts
import { Router } from 'express';

export const myFeatureRouter = Router();

myFeatureRouter.get('/', (req, res) => {
  res.json({ data: 'response' });
});

myFeatureRouter.post('/', (req, res) => {
  const { input } = req.body;
  res.json({ result: `processed ${input}` });
});
```

### 2. Register Route

```typescript
// services/gateway/src/index.ts
import { myFeatureRouter } from './routes/my-feature';

app.use('/api/my-feature', requireAuth, myFeatureRouter);
```

### 3. Add Tests

```typescript
// services/gateway/src/routes/my-feature.test.ts
describe('My Feature API', () => {
  it('should return data', async () => {
    const response = await request(app).get('/api/my-feature');
    expect(response.status).toBe(200);
  });
});
```

## Implementing Algorithms

### Rust Geometry Algorithm

```rust
// services/geometry-engine/src/my_algorithm.rs
use nalgebra::Vector3;
use crate::Mesh;

pub struct MyAlgorithm {
    // Configuration
}

impl MyAlgorithm {
    pub fn new() -> Self {
        Self {}
    }
    
    pub fn compute(&self, mesh: &Mesh) -> Vec<f64> {
        // Algorithm implementation
        vec![]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_algorithm() {
        // Test implementation
    }
}
```

## Testing

### Unit Tests (Rust)

```bash
cd services/geometry-engine
cargo test
cargo test --test integration_tests
```

### Unit Tests (TypeScript)

```bash
cd apps/web
npm test
npm test -- --watch
```

### Integration Tests

```bash
# Start docker-compose
docker-compose up -d

# Run integration tests
npm run test:integration
```

### End-to-End Tests

```bash
# Start dev servers
pnpm dev

# Run E2E tests
npm run test:e2e
```

## Database Migrations

### Add Migration

```sql
-- infrastructure/database/migrations/001_add_my_table.sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_my_table_name ON my_table(name);
```

### Apply Migration

```bash
psql -h localhost -U tspline -d tsplineforge \
  < infrastructure/database/migrations/001_add_my_table.sql
```

## Performance Optimization

### Profile Rust Code

```bash
cd services/geometry-engine
cargo bench

# Generate flamegraph
cargo install flamegraph
cargo flamegraph
```

### Profile TypeScript

```bash
# Use Chrome DevTools
# Open http://localhost:3001
# F12 -> Performance -> Record
```

### Database Query Optimization

```sql
-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM meshes WHERE user_id = '...';

-- Add indexes if needed
CREATE INDEX idx_meshes_user_id ON meshes(user_id);
```

## Deployment

### Local Development

```bash
docker-compose up -d
pnpm dev
```

### Kubernetes

```bash
# Deploy to cluster
kubectl apply -k infrastructure/k8s/

# Check status
kubectl get all -n tsplineforge

# View logs
kubectl logs -n tsplineforge deployment/gateway
```

### Production

```bash
# Build Docker images
docker build -f infrastructure/docker/Dockerfile.geometry -t tsplineforge/geometry:latest .
docker build -f infrastructure/docker/Dockerfile.gateway -t tsplineforge/gateway:latest .
docker build -f infrastructure/docker/Dockerfile.web -t tsplineforge/web:latest .

# Push to registry
docker push tsplineforge/geometry:latest
docker push tsplineforge/gateway:latest
docker push tsplineforge/web:latest

# Deploy
kubectl apply -k infrastructure/k8s/overlays/prod
```

## Code Quality

### Format Code

```bash
pnpm format
cd services/geometry-engine && cargo fmt
cd services/ai-topology && black . && isort .
```

### Lint Code

```bash
pnpm lint
cd services/geometry-engine && cargo clippy --all-targets
```

### Type Check

```bash
pnpm run type-check
```

## Debugging

### Rust

```bash
# GDB debugging
rust-gdb ./target/debug/geometry-engine

# Debug with logging
RUST_LOG=debug cargo run
```

### TypeScript

```bash
# VS Code debugging
# .vscode/launch.json has Node.js attach config

# Or use Chrome DevTools
# F12 -> Sources -> Set breakpoints
```

### Database

```bash
# Connect to PostgreSQL
psql -h localhost -U tspline -d tsplineforge

# View logs
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;
```

## Documentation

### Writing Docs

```markdown
# Feature Name

Brief description.

## Usage

Code example.

## Parameters

- `param1`: Description
- `param2`: Description

## Returns

Description of return value.
```

### API Documentation

Include JSDoc/Rustdoc comments:

```rust
/// Compute feature on mesh
///
/// # Arguments
/// * `mesh` - Input mesh
///
/// # Returns
/// Feature vector
pub fn compute(mesh: &Mesh) -> Vec<f64> {
    // ...
}
```

## CI/CD

### GitHub Actions

Workflows in `.github/workflows/`:

- `test.yml` - Run tests
- `build.yml` - Build Docker images
- `deploy.yml` - Deploy to Kubernetes

### Local Testing

```bash
# Run tests locally before pushing
pnpm test
cd services/geometry-engine && cargo test
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test: `pnpm test`
3. Format code: `pnpm format`
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create PR on GitHub
7. Wait for CI checks to pass
8. Get code review
9. Merge!

## Getting Help

- **Architecture**: See [ARCHITECTURE.md](../ARCHITECTURE.md)
- **API**: See [API.md](./API.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

Happy developing! 🚀
