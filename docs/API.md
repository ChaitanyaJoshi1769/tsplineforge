# TSplineForge API Reference

Base URL: `http://localhost:3000/api` (development) or `https://api.tsplineforge.io` (production)

## Authentication

All endpoints except `/auth/*` require a Bearer token.

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (201)**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "token": "eyJhbGc..."
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200)**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "token": "eyJhbGc..."
}
```

## Mesh Operations

### Upload Mesh

```http
POST /mesh/upload
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Model",
  "format": "obj",
  "data": "base64_encoded_file_data"
}
```

**Response (201)**
```json
{
  "id": "mesh-uuid",
  "userId": "user-uuid",
  "name": "Model",
  "format": "obj",
  "size": 1024000,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Get Mesh

```http
GET /mesh/:id
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "id": "mesh-uuid",
  "userId": "user-uuid",
  "name": "Model",
  "format": "obj",
  "size": 1024000,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### List Meshes

```http
GET /mesh
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "meshes": [
    {
      "id": "mesh-uuid",
      "name": "Model",
      "format": "obj",
      "size": 1024000,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Validate Mesh

```http
POST /mesh/:id/validate
Authorization: Bearer {token}

{
  "detailed": true
}
```

**Response (200)**
```json
{
  "meshId": "mesh-uuid",
  "isValid": false,
  "severity": 2,
  "issues": [
    {
      "type": "NonManifoldEdge",
      "v0": 42,
      "v1": 87,
      "description": "Edge is non-manifold"
    },
    {
      "type": "DegenerateTriangle",
      "faceId": 100,
      "description": "Triangle has zero area"
    }
  ],
  "suggestions": [
    "Remove non-manifold edges using topology repair",
    "Delete degenerate faces"
  ]
}
```

### Remesh

```http
POST /mesh/:id/remesh
Authorization: Bearer {token}

{
  "targetQuadCount": 10000,
  "preserveFeatures": true,
  "aiAssistance": true,
  "maxIterations": 100
}
```

**Response (202)**
```json
{
  "jobId": "job-uuid",
  "status": "queued",
  "progress": 0,
  "estimatedTime": 45
}
```

### Get Remesh Status

```http
GET /mesh/:id/remesh/:jobId
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "jobId": "job-uuid",
  "status": "in_progress",
  "progress": 45,
  "estimatedTime": 20,
  "currentStep": "Generating quad mesh",
  "resultMeshId": null
}
```

### Convert to T-Spline

```http
POST /mesh/:id/to-tspline
Authorization: Bearer {token}

{
  "tolerance": 1e-6,
  "continuity": "G2"
}
```

**Response (202)**
```json
{
  "jobId": "job-uuid",
  "status": "queued"
}
```

### Export Mesh

```http
POST /mesh/:id/export
Authorization: Bearer {token}

{
  "format": "step",
  "precision": 1e-6,
  "includeNormals": true
}
```

**Response (200)**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/tsplineforge/...",
  "expiresIn": 3600,
  "format": "step",
  "size": 2048000
}
```

### Delete Mesh

```http
DELETE /mesh/:id
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "message": "Mesh deleted"
}
```

## Project Management

### Create Project

```http
POST /project
Authorization: Bearer {token}

{
  "name": "My CAD Project",
  "description": "Optional description"
}
```

**Response (201)**
```json
{
  "id": "project-uuid",
  "userId": "user-uuid",
  "name": "My CAD Project",
  "description": "Optional description",
  "meshes": [],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Get Projects

```http
GET /project
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "name": "My CAD Project",
      "meshes": ["mesh-uuid"],
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Get Project

```http
GET /project/:id
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "id": "project-uuid",
  "userId": "user-uuid",
  "name": "My CAD Project",
  "description": "Optional description",
  "meshes": ["mesh-uuid-1", "mesh-uuid-2"],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Update Project

```http
PATCH /project/:id
Authorization: Bearer {token}

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200)**
```json
{
  "id": "project-uuid",
  "name": "Updated Name",
  "description": "Updated description",
  ...
}
```

### Add Mesh to Project

```http
POST /project/:id/meshes
Authorization: Bearer {token}

{
  "meshId": "mesh-uuid"
}
```

**Response (200)**
```json
{
  "id": "project-uuid",
  "meshes": ["mesh-uuid", ...],
  ...
}
```

### Remove Mesh from Project

```http
DELETE /project/:id/meshes/:meshId
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "id": "project-uuid",
  "meshes": [...],
  ...
}
```

### Delete Project

```http
DELETE /project/:id
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "message": "Project deleted"
}
```

## WebSocket (Real-time)

**URL**: `ws://localhost:3000/ws` (development)

### Join Project

```json
{
  "type": "join",
  "projectId": "project-uuid"
}
```

### Edit Mesh

```json
{
  "type": "edit",
  "data": {
    "meshId": "mesh-uuid",
    "operation": "move_vertex",
    "vertexId": 42,
    "position": [1.0, 2.0, 3.0]
  }
}
```

### Receive Edit

```json
{
  "type": "edit",
  "clientId": "client-uuid",
  "data": {
    "meshId": "mesh-uuid",
    "operation": "move_vertex",
    "vertexId": 42,
    "position": [1.0, 2.0, 3.0]
  }
}
```

### User Cursor

```json
{
  "type": "cursor",
  "position": [100, 200],
  "user": {
    "id": "user-uuid",
    "name": "John Doe"
  }
}
```

### User Joined

```json
{
  "type": "user_joined",
  "clientId": "client-uuid",
  "user": {
    "id": "user-uuid",
    "name": "John Doe"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Errors

| Status | Code | Meaning |
|--------|------|---------|
| 400 | BAD_REQUEST | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Access denied |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | VALIDATION_ERROR | Validation failed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limiting

- 1000 requests per 15 minutes per IP
- Returns `X-RateLimit-*` headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642252800
```

## Pagination

List endpoints support pagination:

```http
GET /mesh?page=1&limit=20
```

## Filtering & Sorting

```http
GET /mesh?sort=-createdAt&filter[format]=obj
```

## SDKs

- **JavaScript**: `npm install @tsplineforge/sdk-js`
- **Python**: `pip install tsplineforge`

See [SDK docs](./sdk.md) for usage examples.
