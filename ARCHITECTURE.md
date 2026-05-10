# TSplineForge Architecture

**A production-grade AI-powered mesh-to-T-Spline CAD platform combining Blender, Fusion 360, and Rhino capabilities.**

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  • Web Browser (Next.js + React)    [/apps/web]             │
│  • Desktop App (Tauri)              [/apps/desktop]          │
│  • Viewport (WebGPU + Three.js)     [/packages/viewer]       │
│  • JavaScript SDK                   [/packages/sdk-js]       │
│  • Python SDK                       [/packages/sdk-python]   │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ├─── WebSocket (Live collab)
                 ├─── gRPC (Geometry ops)
                 └─── REST/GraphQL (Assets)
                 │
┌────────────────▼──────────────────────────────────────────┐
│                   API GATEWAY LAYER                        │
├───────────────────────────────────────────────────────────┤
│  Node.js Gateway  [/services/gateway]                     │
│  • Route orchestration                                     │
│  • Auth/RBAC                                               │
│  • Rate limiting & caching                                │
│  • WebSocket multiplexing                                 │
│  • Real-time session management                           │
└────────────────┬──────────────────────────────────────────┘
                 │
        ┌────────┼────────┬──────────┬──────────┐
        │        │        │          │          │
┌───────▼──┐ ┌───▼────┐ ┌─▼──────┐ ┌─▼────┐ ┌─▼──────┐
│ Geometry │ │Remesh  │ │TSpline │ │Surface│ │AI/Topo │
│  Engine  │ │Engine  │ │Kernel  │ │Fit    │ │Assist  │
└──────────┘ └────────┘ └────────┘ └──────┘ └────────┘
    Rust       Rust       Rust       Rust      Python
   [/svc/      [/svc/    [/svc/    [/svc/    [/svc/
    geom]      remesh]   tspline]   surface]   ai]
    │           │         │         │          │
    │           └────┬────┴────┬────┴──┬───────┘
    │                │         │       │
┌───▼────────────────▼─────────▼───────▼─────────────────┐
│              PERSISTENT STORAGE LAYER                  │
├─────────────────────────────────────────────────────────┤
│  • PostgreSQL (metadata, sessions, projects)           │
│  • Redis (caching, locks, real-time state)             │
│  • S3/MinIO (geometry files, exports)                  │
│  • NATS (event streaming, async tasks)                 │
└─────────────────────────────────────────────────────────┘
    │
┌───▴─────────────────────────────────────────────────┐
│        COMPUTE & DEPLOYMENT LAYER                   │
├──────────────────────────────────────────────────────┤
│  Kubernetes orchestration [/infrastructure/k8s]     │
│  Docker containerization  [/infrastructure/docker]  │
│  GPU scheduling (CUDA/Vulkan)                       │
│  Distributed processing                             │
└──────────────────────────────────────────────────────┘
```

## Module Breakdown

### 1. **Geometry Engine** (Rust) `/services/geometry-engine`
- **Purpose**: Core mesh representation, topology validation, spatial queries
- **Key Components**:
  - `HalfEdgeTopology`: 2-manifold mesh structure
  - `BVH`: Bounding volume hierarchy for spatial queries
  - `SpatialHash`: Fast point location
  - `MeshValidator`: Non-manifold detection, repair
  - `Serialization`: Binary encoding/decoding
- **IO Formats**: OBJ, STL, FBX, PLY, GLTF, USD, Alembic
- **Parallelization**: Rayon for CPU-parallel operations
- **Output**: WASM bindings, C ABI, Python bindings

### 2. **Remesh Engine** (Rust) `/services/remesh-engine`
- **Purpose**: Quad-dominant remeshing with AI assistance
- **Algorithms**:
  - Curvature field computation (principal curvatures)
  - Field-aligned parameterization (SLIM)
  - Singularity detection and positioning
  - Quad generation with edge-flow optimization
  - Feature preservation (hard edges, creases)
- **AI Components**:
  - Graph Neural Network for edge-flow prediction
  - Learned topology generation
  - Semantic segmentation for feature detection
- **Output**: Quad meshes, edge-flow fields, singularity maps

### 3. **T-Spline Kernel** (Rust) `/services/tspline-kernel`
- **Purpose**: T-mesh representation, refinement, evaluation
- **Features**:
  - T-junction handling
  - Local refinement with knot insertion
  - Bézier extraction
  - Catmull-Clark compatibility
  - Continuity enforcement (C0, G1, G2)
  - Extraordinary vertex handling
- **Topology**: Tree-based T-mesh with atomic operations
- **Evaluation**: Toric topology, NURBS blending
- **Rendering**: Adaptive tessellation to quads

### 4. **Surface Fitting** (Rust) `/services/surface-fitting`
- **Purpose**: Fit T-Splines to quad meshes with fairness
- **Solvers**:
  - Least-squares fitting (sparse direct solvers)
  - L-BFGS optimization for fairness
  - GPU-accelerated matrix operations
  - Iterative refinement with convergence analysis
- **Constraints**:
  - Curvature continuity (G1, G2)
  - Tolerance bounds
  - Feature preservation
  - Manufacturing precision
- **Diagnostics**:
  - Accuracy heatmaps
  - Curvature analysis
  - Gap/deviation metrics

### 5. **AI Topology Assistant** (Python) `/services/ai-topology`
- **Purpose**: Intelligent suggestions and automatic fixes
- **Models**:
  - Graph Transformer for mesh analysis
  - Geometry embeddings (learned representations)
  - Semantic segmentation (features, sharp edges)
  - Manufacturability scoring
- **Capabilities**:
  - Suggest edge flow and topology
  - Auto-fix poles and singularities
  - Detect and preserve CAD features
  - Reduce complexity while preserving intent
  - Feasibility analysis
- **Integration**: Conversational AI (LLM orchestration)

### 6. **CAD Export Engine** (Rust) `/services/cad-export`
- **Purpose**: Exact T-Spline to CAD format conversion
- **Formats**:
  - STEP AP242 (exact B-Splines)
  - IGES (trimmed surfaces)
  - SAT (Parasolid)
  - OBJ, STL (tessellated)
  - USD (studio pipelines)
  - GLTF (game engines)
- **Features**:
  - Automatic format capability detection
  - Precision controls
  - Metadata preservation
  - Software-specific optimization (Fusion, Rhino, Blender)

### 7. **API Gateway** (Node.js) `/services/gateway`
- **Purpose**: Request routing, auth, orchestration
- **Capabilities**:
  - Express-based HTTP/REST
  - GraphQL layer for complex queries
  - gRPC proxying
  - WebSocket multiplexing for live collaboration
  - JWT auth with RBAC
  - Rate limiting & caching
  - Request validation & transformation
  - Error standardization

### 8. **Web Application** (Next.js + React) `/apps/web`
- **Purpose**: Browser-native CAD editor
- **UI Framework**: React 19 + Tailwind CSS
- **3D Viewport**: Three.js + WebGPU
- **State Management**: Zustand with immer
- **Real-time**: TanStack Query for sync, WebSocket for collab
- **Viewport Features**:
  - GPU-accelerated rendering
  - Wireframe/shaded modes
  - Curvature visualization
  - Zebra/draft analysis
  - Real-time tessellation
- **CAD Tools**:
  - Move, extrude, crease, bevel, bridge
  - Smooth, weld, relax operations
  - Patch insertion & deletion
  - Local refinement
- **UX**: Maya/Blender keyboard controls, command palette, undo/redo graph

### 9. **Infrastructure** `/infrastructure`
- **Containerization** (`/docker`):
  - Multi-stage Dockerfiles for each service
  - GPU support (NVIDIA base images)
  - Slim production images
  - Health checks & graceful shutdown
- **Orchestration** (`/k8s`):
  - Deployment manifests for each service
  - StatefulSet for data services (Postgres, Redis)
  - HPA for compute services
  - Ingress for API gateway
  - Service mesh (optional Istio)
- **IaC** (`/terraform`):
  - GKE/EKS/AKS provisioning
  - Database clusters
  - Object storage buckets
  - Monitoring & logging infrastructure

### 10. **Package Libraries** `/packages`
- **ui**: React component library (headless CAD components)
- **viewer**: Three.js CAD viewport (reusable)
- **wasm-bindings**: Auto-generated from Rust
- **sdk-js**: TypeScript CAD API client
- **sdk-python**: Python remote client

## Data Flow

### Mesh Import Pipeline
```
User uploads OBJ/STL/FBX
    ↓
Gateway (validation, chunking)
    ↓
Geometry Engine (import, normalization)
    ↓
Validation (topology check)
    ↓
Curvature computation → Cache
    ↓
Stored in S3 + metadata in Postgres
    ↓
Viewport loads low-poly LOD + streams full geometry
```

### Remeshing Pipeline
```
Quad Remesh requested
    ↓
Geometry Engine computes edge flow field
    ↓
AI Topology suggests optimal singularity placement
    ↓
Remesh Engine generates quad mesh
    ↓
Optimize edge loops (smoothing, reduction)
    ↓
Output quad mesh + topology report
```

### T-Spline Conversion
```
User selects "Convert to T-Spline"
    ↓
Quad mesh prepared (topology verified)
    ↓
T-Spline Kernel creates base T-mesh
    ↓
Surface Fitting fits spline surface to original
    ↓
Fairness optimization (curvature minimization)
    ↓
Continuity enforcement (G1/G2)
    ↓
Accuracy heatmap generated
    ↓
User can refine or accept
```

### Real-time Editing
```
User moves control point
    ↓
Change sent to Gateway via WebSocket
    ↓
Session lock acquired (Redis)
    ↓
T-Spline Kernel evaluates change
    ↓
Regenerate tessellation (GPU)
    ↓
Push updated viewport state to all clients
    ↓
Undo/redo recorded in operation graph
```

### Export
```
User selects "Export STEP"
    ↓
CAD Export Engine detects target constraints
    ↓
Convert T-Spline to exact B-Splines (if needed)
    ↓
Generate STEP AP242 file
    ↓
Upload to S3, return signed URL
    ↓
Client downloads
```

## Technology Stack

### Frontend
```
Runtime: Node.js 22 LTS
Framework: Next.js 15 (App Router)
UI: React 19 + Tailwind CSS v4
3D: Three.js r170 + WebGPU
State: Zustand v5
Data fetching: TanStack Query v5
Real-time: Socket.io + custom WebSocket
Build: Turbo + SWC
```

### Backend Services
```
Geometry: Rust 1.81 (MSRV)
  - nalgebra: Linear algebra
  - petgraph: Graph algorithms
  - rayon: Data-level parallelism
  - serde: Serialization
  
API Gateway: Node.js + Express
  - GraphQL: apollo-server-express
  - gRPC: @grpc/grpc-js
  - Auth: jsonwebtoken, bcryptjs

AI Pipeline: Python 3.11
  - PyTorch 2.1 + CUDA 12.1
  - DGL: Graph neural networks
  - scikit-learn: Utilities
  - FastAPI: Async HTTP server

Database:
  - PostgreSQL 16 (jsonb support)
  - Redis 7.2 (caching, locks, pubsub)
  - S3-compatible (MinIO or AWS S3)
```

### Infrastructure
```
Container: Docker 24+
Orchestration: Kubernetes 1.28+
  - Service mesh: Linkerd (optional)
  - Ingress: Nginx / Istio
  - Storage: CSI drivers

Monitoring:
  - Prometheus + Grafana
  - Jaeger (distributed tracing)
  - ELK (logging)

Message Bus: NATS 2.10+ (publish-subscribe, request-reply)

Deployment:
  - Terraform for IaC
  - ArgoCD for GitOps
```

## Performance Characteristics

### Throughput
- **Mesh Import**: 1M polygons/second (streaming)
- **Topology Validation**: 50M polygons/second (parallel)
- **Quad Remeshing**: 100K quads/second (GPU-assisted)
- **T-Spline Fitting**: Converges in <10 iterations for most inputs
- **Viewport Rendering**: 60+ FPS at 4K with 1M+ polygons

### Memory
- **Geometry Storage**: ~52 bytes/triangle (position, normal, data)
- **Out-of-Core**: Streaming for 100M+ polygon models
- **VRAM**: Optimized for 8GB consumer GPUs

### Latency
- **Real-time Editing**: <16ms per operation
- **Remesh**: 5-30 seconds (depends on input size)
- **Export**: 1-5 seconds for STEP generation
- **Collaboration**: <100ms WebSocket sync

## Scalability Model

### Horizontal Scaling
- **Stateless services**: Scale geometry, remesh, surface-fit services independently
- **Stateful sessions**: Redis with consistent hashing
- **Database**: Read replicas for analytics, primary for writes
- **Object storage**: Automatic distribution across buckets

### Vertical Scaling
- **GPU workloads**: Multiple GPUs per pod
- **CPU workloads**: Configurable thread pools
- **Memory**: Streaming and memory-mapped files for massive meshes

## Security Architecture

### Authentication
- JWT with RS256 signing
- OAuth 2.0 / OIDC support
- MFA support

### Authorization
- RBAC (Role-Based Access Control)
- Resource-level permissions
- API key scoping
- Project isolation

### Data Protection
- TLS 1.3 for all transport
- Database encryption at rest
- S3 encryption (SSE-S3 or KMS)
- Audit logging for all CAD operations

### API Security
- Request signing for external APIs
- CSRF protection
- Rate limiting per user/API key
- Input validation on all boundaries

## Deployment Modes

### Local Development
```bash
docker-compose up
# Starts all services locally with hot reload
```

### Single-Server
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=... \
  tsplineforge/all-in-one
```

### Cloud Kubernetes
```bash
kubectl apply -k infrastructure/k8s/overlays/prod
# Helm charts for easy deployment
```

### Serverless (Future)
- AWS Lambda for stateless compute
- Container images on Lambda
- EFS for shared geometry cache

## Observability

### Logging
- Structured JSON logs
- Correlation IDs across services
- Log levels configurable per module

### Metrics
- Request latency (p50, p95, p99)
- Geometry operation timing
- GPU utilization
- Memory allocation patterns
- Cache hit rates

### Tracing
- Distributed tracing for request flows
- Geometry operation flamegraphs
- GPU kernel timing

## Extension Points

### Plugin SDK
- WASM-based plugins
- Access to geometry APIs
- UI extension hooks
- Can publish to plugin marketplace

### Custom Services
- gRPC protocol for new services
- Event-driven architecture via NATS
- Kubernetes-native deployment

## Success Metrics

1. **Performance**: Outperform Blender retopology by 5-10x
2. **Quality**: Match Fusion 360 export precision
3. **Usability**: 50% faster CAD workflow than manual retopology
4. **Scalability**: Handle 100M+ polygon meshes
5. **Reliability**: 99.9% uptime SLA
6. **Adoption**: 10k+ users in first year

---

**Next**: Initialize monorepo, implement geometry core, build frontend.
