# TSplineForge Usage Guide

Complete guide for using the TSplineForge platform including mesh editing, remeshing, surface fitting, and export.

## Getting Started

### 1. Local Development
```bash
# Start all services
docker-compose up -d

# Install dependencies and start dev server
pnpm install
pnpm dev

# Access the platform
# Web UI: http://localhost:3001
# API: http://localhost:3000
# Geometry Engine: http://localhost:50051 (gRPC)
```

### 2. Authentication
```bash
# Register new account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'

# Response includes JWT token
{
  "token": "eyJ...",
  "user": {"id":"...","email":"user@example.com","role":"user"}
}

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'
```

---

## Web Interface Workflow

### Dashboard

1. **Access Dashboard**: Navigate to http://localhost:3001 after login
2. **View Projects**: See all your mesh projects
3. **Create Project**:
   - Click "New Project" button
   - Enter project name and description
   - Click Create

### CAD Editor

#### Opening the Editor
```
Dashboard → [Open Editor] button → CAD Editor page
```

#### Editor Layout
```
┌─ Toolbar (Left)
│  ├─ Transform tools (Select, Move, Extrude)
│  ├─ Edit tools (Duplicate, Delete)
│  ├─ File tools (Import, Export)
│  └─ History (Undo, Redo)
│
├─ 3D Viewport (Center)
│  ├─ Left-click: Select vertex
│  ├─ Mouse wheel: Zoom in/out
│  ├─ Right-click + drag: Rotate camera
│  └─ Grid background for reference
│
└─ Property Inspector (Right)
   ├─ Mesh Properties (name, vertex/face count, validity)
   ├─ Transform (position, rotation, scale)
   ├─ Appearance (color, opacity, metallic, roughness)
   └─ Statistics (real-time mesh info)
```

#### Keyboard Shortcuts
```
S - Select tool
M - Move tool
E - Extrude tool
D - Duplicate selection
Del - Delete selection
Ctrl+Z - Undo
Ctrl+Y - Redo
Scroll - Zoom viewport
```

#### Editing Workflow

**Example: Modify a Cube**

1. Editor opens with default cube
2. Inspect properties:
   - See "Vertices: 8, Faces: 6" in right panel
   - Mesh is "Valid"
3. Click "Move" tool (or press M)
4. Set Transform properties:
   - Position X: 1.0
   - Position Y: 0.5
   - Position Z: 0.0
5. Cube moves in viewport (real-time)
6. Click "Save" to persist changes

---

## Geometry Algorithms API

### Curvature Computation

**Endpoint**: `POST /api/mesh/:id/curvature`

```bash
curl -X POST http://localhost:3000/api/mesh/mesh-123/curvature \
  -H "Authorization: Bearer $TOKEN"

Response:
{
  "curvatures": [
    {"kmax": 2.5, "kmin": 1.2, "kmean": 1.85, "kgaussian": 3.0},
    ...
  ],
  "computed_at": "2025-05-10T12:34:56Z"
}
```

**Interpretation**:
- `kmax`: Maximum principal curvature (strongest bend)
- `kmin`: Minimum principal curvature (weakest bend)
- `kmean`: Average curvature (overall curvedness)
- `kgaussian`: Gaussian curvature (intrinsic shape)

**Use Case**: Identify flat regions (kmax ≈ kmin ≈ 0) vs. curved regions

### Quad Remeshing

**Endpoint**: `POST /api/mesh/:id/remesh`

```bash
curl -X POST http://localhost:3000/api/mesh/mesh-123/remesh \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_quad_count": 10000,
    "preserve_features": true,
    "optimization_passes": 5,
    "use_ai_assistance": true
  }'

Response:
{
  "job_id": "remesh-456",
  "status": "queued",
  "estimated_time": 30,
  "config": {...}
}

# Check status
curl -X GET http://localhost:3000/api/mesh/mesh-123/remesh/remesh-456 \
  -H "Authorization: Bearer $TOKEN"

Response:
{
  "status": "completed",
  "quad_count": 9847,
  "iterations": 25,
  "error": 0.0087,
  "elapsed_ms": 2340,
  "output_mesh_id": "mesh-124"
}
```

**Parameters**:
- `target_quad_count`: Desired number of quads (default: 10000)
- `preserve_features`: Keep sharp edges (default: true)
- `optimization_passes`: Smoothing iterations (default: 5)
- `use_ai_assistance`: Use ML for topology (default: true)

**Process**:
1. Computes curvature field on input mesh
2. Generates direction field aligned with principal curvatures
3. Detects singularities (umbilic points, sharp features)
4. Generates quad mesh following field directions
5. Optimizes quad element quality

### Surface Fitting

**Endpoint**: `POST /api/mesh/:id/fit-surface`

```bash
curl -X POST http://localhost:3000/api/mesh/mesh-123/fit-surface \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tolerance": 0.001,
    "max_iterations": 100,
    "fairness_weight": 0.1,
    "continuity": "G1"
  }'

Response:
{
  "job_id": "fit-789",
  "status": "in_progress",
  "progress_percent": 35
}

# Poll for completion
curl -X GET http://localhost:3000/api/mesh/mesh-123/fit-surface/fit-789 \
  -H "Authorization: Bearer $TOKEN"

Response:
{
  "status": "completed",
  "tspline": {...},
  "error": 0.00045,
  "iterations": 47,
  "converged": true,
  "elapsed_ms": 3210
}
```

**Parameters**:
- `tolerance`: Target fitting error (default: 1e-6)
- `max_iterations`: Maximum refinement iterations (default: 100)
- `fairness_weight`: Smoothness penalty 0-1 (default: 0.1)
- `continuity`: C0, G1, or G2 (positional, tangent, or curvature) (default: G1)

**Process**:
1. Samples input mesh surface at multiple points
2. Creates initial T-spline mesh from input
3. Iteratively adjusts control points to fit samples
4. Adds fairness constraints to prevent overfitting
5. Enforces continuity at patch boundaries
6. Checks convergence at each iteration

---

## REST API Reference

### Project Management

**Create Project**
```bash
POST /api/project
Body: {"name": "Car Body", "description": "Aerodynamic design"}
```

**List Projects**
```bash
GET /api/project
```

**Get Project**
```bash
GET /api/project/:id
```

**Update Project**
```bash
PATCH /api/project/:id
Body: {"name": "Updated Name", "description": "..."}
```

**Delete Project**
```bash
DELETE /api/project/:id
```

### Mesh Management

**Upload Mesh**
```bash
POST /api/mesh/upload
Body: FormData {
  file: <binary .obj/.stl/.ply>,
  name: "suspension_mount",
  project_id: "proj-123"
}
```

**List Meshes**
```bash
GET /api/mesh
Query: ?project_id=proj-123
```

**Get Mesh**
```bash
GET /api/mesh/:id
```

**Delete Mesh**
```bash
DELETE /api/mesh/:id
```

**Validate Mesh**
```bash
POST /api/mesh/:id/validate

Response:
{
  "is_valid": false,
  "severity": 2,
  "issues": [
    {"type": "NonManifoldEdge", "count": 3},
    {"type": "DuplicateVertex", "count": 1}
  ],
  "suggestions": [
    "Merge duplicate vertices within 1e-10",
    "Check non-manifold edges near..."
  ]
}
```

### Real-time Collaboration

**WebSocket Connection**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Join project room
ws.send(JSON.stringify({
  type: 'join',
  project_id: 'proj-123',
  user_id: 'user-456'
}));

// Listen for changes
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'edit') {
    console.log('User', message.user_id, 'edited:', message.operation);
  }
};

// Send edit
ws.send(JSON.stringify({
  type: 'edit',
  operation: 'move_vertex',
  vertex_id: 5,
  position: [1.0, 2.0, 3.0]
}));
```

---

## CLI Examples

### Using the Geometry Engine Directly

```bash
# Access geometry service (gRPC)
# Compile a test binary:
cd services/geometry-engine
cargo run --release --bin geometry-server

# It will:
# 1. Create a test mesh (cube)
# 2. Compute curvatures for all vertices
# 3. Validate mesh topology
# 4. Print statistics
```

### Running Remeshing Tests

```bash
cd services/remesh-engine

# Run all tests
cargo test

# Run specific test
cargo test test_remesh_cube -- --nocapture

# Benchmark remeshing
cargo bench
```

### Testing Surface Fitting

```bash
cd services/surface-fitting

# Unit tests
cargo test

# Create test mesh and fit surface
cargo test test_fitting_result_convergence -- --nocapture
```

---

## Performance Tuning

### Viewport Optimization

For large meshes (>1M polygons):

1. **Decimation**: Pre-process with remeshing
   ```bash
   POST /api/mesh/:id/remesh
   {"target_quad_count": 50000}  # Reduce polygon count
   ```

2. **LOD (Level of Detail)**: Use remesher output as display mesh

3. **Viewport Settings**:
   - Disable wireframe if not needed
   - Disable normals visualization
   - Set autoRotate=false for static meshes

### Algorithm Performance

**Curvature Computation**: 
- Parallelize with rayon (already configured)
- Neighborhood size: 10 vertices (configurable)
- Time: ~100ms for 1M vertices

**Remeshing**:
- Tune optimization_passes (5 default)
- Use preserve_features=false for speed
- Increase target_quad_count for coarser mesh

**Surface Fitting**:
- Reduce max_iterations for speed (100 default)
- Lower tolerance if quick fit acceptable (1e-6 default)
- GPU acceleration available via use_gpu=true

---

## Troubleshooting

### Mesh Validation Fails

**Issue**: "NonManifoldEdge" errors
**Solution**:
1. Check mesh for duplicate vertices (merge within epsilon)
2. Verify all edges are shared by exactly 2 faces
3. Re-export from CAD software with "merge duplicates" option

**Issue**: "DuplicateVertex" errors
**Solution**:
```bash
# Use remesher to clean mesh
POST /api/mesh/:id/remesh
{"target_quad_count": <current_face_count>}
```

### Remeshing Timeout

**Issue**: Remeshing takes >60 seconds
**Solution**:
1. Reduce target_quad_count (start with 5000)
2. Set preserve_features=false
3. Reduce optimization_passes to 2

### Surface Fitting Diverges

**Issue**: Error increases instead of decreasing
**Solution**:
1. Increase fairness_weight (0.1 → 0.5)
2. Reduce max_iterations to stop early
3. Pre-remesh input to regular quad mesh

### WebSocket Disconnects

**Issue**: Real-time collaboration disconnects
**Solution**:
1. Check network latency (<100ms recommended)
2. Verify server memory (32GB recommended for 100+ users)
3. Enable Redis caching in docker-compose.yml

---

## Advanced Usage

### Custom Tool Development

Add new tools to CADToolbar:

```typescript
// src/components/editor/CADToolbar.tsx
const customTools: Tool[] = [
  {
    id: 'smooth',
    label: 'Smooth Surface',
    icon: Zap,
    shortcut: 'Shift+S',
    onClick: () => {
      // Call your API
      fetch('/api/mesh/:id/smooth', {method: 'POST'})
    }
  }
];

<CADToolbar tools={customTools} />
```

### Batch Processing

```bash
#!/bin/bash
for mesh in *.obj; do
  mesh_id=$(curl -X POST /api/mesh/upload \
    -F "file=@$mesh" \
    -H "Authorization: Bearer $TOKEN" \
    | jq -r '.id')
  
  curl -X POST "/api/mesh/$mesh_id/remesh" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"target_quad_count": 10000}'
done
```

### Integration with CAM Software

```bash
# Export fitted surface as STEP
curl -X GET /api/mesh/:id/export?format=STEP \
  -H "Authorization: Bearer $TOKEN" \
  -o part.step

# Open in Fusion 360, Inventor, etc.
```

---

## Support & Resources

- **Documentation**: See docs/ directory
- **API Reference**: [API.md](docs/API.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Development**: [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)
- **Issues**: GitHub Issues & Discussions
- **Community**: Discord server (link in README)

---

**Happy CAD designing! 🚀**
