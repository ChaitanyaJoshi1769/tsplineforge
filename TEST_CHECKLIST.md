# TSplineForge Testing Checklist

Comprehensive testing checklist for validating all features of TSplineForge.

## Pre-Test Setup

- [ ] All services running: `docker-compose ps`
- [ ] `pnpm dev` started and all services ready
- [ ] No errors in console logs
- [ ] Database initialized and migrations applied

## Authentication & Authorization

### User Registration
- [ ] Navigate to http://localhost:3001/register
- [ ] Register new account with email and password
- [ ] Receive confirmation/success message
- [ ] Can login with registered credentials
- [ ] Cannot register with duplicate email (error shown)
- [ ] Password validation works (min length, complexity)

### User Login
- [ ] Login with valid credentials succeeds
- [ ] Session token created and stored
- [ ] Redirect to dashboard/home page
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Session persists across page refresh

### Session Management
- [ ] Logout clears session
- [ ] Protected routes redirect to login when not authenticated
- [ ] JWT token expires after configured time
- [ ] Token refresh endpoint works

## CAD Editor Interface

### Viewport Rendering
- [ ] Viewport renders without errors
- [ ] Grid helper visible
- [ ] Lighting is appropriate (not too dark/bright)
- [ ] Default scene renders (cube or similar)
- [ ] Frame rate is smooth (60fps or close)

### User Interactions
- [ ] **Rotate mesh**: Click and drag mouse
- [ ] **Zoom mesh**: Mouse wheel scroll (boundaries 0.1-20)
- [ ] **Pan mesh**: Right-click and drag (if implemented)
- [ ] **Select vertex**: Click on vertex (shows highlight)
- [ ] **Deselect**: Click on empty space
- [ ] **Transform**: Modify position/rotation/scale in properties

### Keyboard Shortcuts
- [ ] **S** - Select tool (cursor changes)
- [ ] **M** - Move tool
- [ ] **E** - Extrude tool
- [ ] **D** - Duplicate selected geometry
- [ ] **Del** - Delete selected
- [ ] **Ctrl+Z** - Undo (if history implemented)
- [ ] **Ctrl+Y** - Redo (if history implemented)
- [ ] **Esc** - Deselect all

### Mesh Statistics
- [ ] Vertex count displays
- [ ] Face count displays
- [ ] Triangle count displays
- [ ] Validity status updates on mesh change
- [ ] Stats update when mesh is modified

## Mesh Processing

### Mesh Upload
- [ ] Upload OBJ file - succeeds
- [ ] Upload STL file - succeeds
- [ ] Upload PLY file - succeeds
- [ ] Upload GLTF file - succeeds
- [ ] File size validation works (reject >500MB)
- [ ] Invalid file format shows error
- [ ] Progress indicator shows during upload

### Mesh Validation
- [ ] Validation completes for sample mesh
- [ ] Reports vertex/face counts
- [ ] Shows validity status (valid/invalid)
- [ ] Detects non-manifolds (if mesh has issues)
- [ ] Detects degenerate triangles
- [ ] Detects duplicate faces

### Remeshing Operations
- [ ] Start remeshing job
- [ ] Progress indicator updates
- [ ] Job completes without errors
- [ ] Output quad mesh has correct target count (±10%)
- [ ] Mesh quality improves after remeshing
- [ ] Can download remeshed result

### T-Spline Fitting
- [ ] Start fitting operation
- [ ] Fitting converges (RMS error decreases)
- [ ] Fitting completes in reasonable time (<30s for test mesh)
- [ ] Output mesh is smooth and continuous
- [ ] Can visualize fitted surface

## Claude AI Integration

### Starting Conversation
- [ ] Click "Ask Claude" button in editor
- [ ] AIAssistant sidebar opens
- [ ] Text input field is active and focused

### Single Prompt
- [ ] Type simple prompt: "Add error handling"
- [ ] Send message (Enter key or send button)
- [ ] Loading indicator appears
- [ ] Response arrives within 10 seconds
- [ ] Code changes displayed in preview
- [ ] Change list shows what was modified

### Code Modifications
- [ ] Accept changes button works
- [ ] Code in editor updates
- [ ] File marked as modified (unsaved indicator)
- [ ] Can save file
- [ ] Reject changes button works
- [ ] Code remains unchanged after reject

### Multi-Turn Conversation
- [ ] Send first message
- [ ] Receive response
- [ ] Send follow-up question
- [ ] Context preserved (Claude remembers previous messages)
- [ ] Can send multiple turns (5+)
- [ ] Conversation history displayed

### Error Handling
- [ ] Network error shows message
- [ ] Invalid code prompt shows error
- [ ] Oversized code shows error (>50KB)
- [ ] API key error handled gracefully
- [ ] Retry works after error

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```
- [ ] Returns 200 OK
- [ ] Response contains service status

### Authentication
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```
- [ ] Register endpoint works
- [ ] Returns user ID and token
- [ ] Token can be used in subsequent requests

### Mesh Operations
```bash
curl -X POST http://localhost:3000/api/meshes/validate \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@mesh.obj"
```
- [ ] Upload returns mesh ID
- [ ] Validation returns validity status
- [ ] Can list all meshes
- [ ] Can delete mesh

### Claude API
```bash
curl -X POST http://localhost:3000/api/claude/modify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"test.ts","language":"typescript","currentCode":"const x=1;","prompt":"Add JSDoc"}'
```
- [ ] Modify endpoint works
- [ ] Returns modified code
- [ ] Returns explanation of changes
- [ ] Returns list of changes

### Error Responses
- [ ] 400 - Bad request (invalid params)
- [ ] 401 - Unauthorized (missing token)
- [ ] 403 - Forbidden (insufficient permissions)
- [ ] 404 - Not found (resource doesn't exist)
- [ ] 500 - Server error (logged properly)

## Database

### Connection
- [ ] Can connect to PostgreSQL
- [ ] Migrations applied successfully
- [ ] Tables created
- [ ] Indexes created

### Data Persistence
- [ ] User data persists after logout/login
- [ ] Mesh metadata stored correctly
- [ ] Job status tracked in database
- [ ] Conversation history stored

### Query Performance
- [ ] User lookup is fast (<100ms)
- [ ] Mesh list retrieval is fast
- [ ] Complex queries complete in reasonable time

## Cache Layer (Redis)

- [ ] Redis accessible at localhost:6379
- [ ] Session data cached
- [ ] Cache invalidates on update
- [ ] Cache improves performance (measurable difference)

## Message Queue (NATS)

- [ ] NATS accessible at localhost:4222
- [ ] Can publish/subscribe to topics
- [ ] Job queue works (remeshing jobs queued)
- [ ] Failed jobs handled properly

## Object Storage (MinIO)

- [ ] MinIO console accessible at http://localhost:9001
- [ ] Can upload files via API
- [ ] Can download files via API
- [ ] Files persist after restart

## Monitoring & Observability

### Prometheus
- [ ] Accessible at http://localhost:9090
- [ ] Metrics being collected
- [ ] Can query metrics
- [ ] Request count increasing
- [ ] Error rate visible

### Grafana
- [ ] Accessible at http://localhost:3002
- [ ] Dashboards loading
- [ ] Metrics displaying
- [ ] Can create custom dashboard

### Logging
- [ ] Logs show in console
- [ ] Structured JSON logging
- [ ] Log levels working (debug, info, warn, error)
- [ ] Request IDs tracked through logs

## Performance Tests

### Response Times
- [ ] Health check: <100ms
- [ ] Auth endpoint: <500ms
- [ ] Mesh upload: <2s for 1MB file
- [ ] Mesh validation: <5s
- [ ] Claude API: <10s

### Load Testing
```bash
ab -n 100 -c 10 http://localhost:3000/health
```
- [ ] No dropped requests
- [ ] Response time consistent
- [ ] No memory leaks (check memory after test)

### Concurrency
- [ ] Multiple users can login simultaneously
- [ ] Multiple file uploads work concurrently
- [ ] No race conditions detected
- [ ] Database locks handled properly

## Browser Compatibility

- [ ] Chrome/Chromium - works
- [ ] Firefox - works
- [ ] Safari - works
- [ ] Mobile browsers - viewport responsive
- [ ] No console errors
- [ ] No JavaScript exceptions

## Edge Cases & Error Scenarios

### Invalid Input
- [ ] Empty file upload rejected
- [ ] Malformed JSON returns 400
- [ ] Missing required fields returns 400
- [ ] Oversized requests rejected

### Concurrent Operations
- [ ] Multiple remeshing jobs run independently
- [ ] Concurrent Claude requests don't interfere
- [ ] Database can handle concurrent queries

### Recovery
- [ ] Service restart without data loss
- [ ] Database connection recovery
- [ ] Network interruption handling
- [ ] Graceful degradation

## Documentation Validation

- [ ] README has correct setup instructions
- [ ] All documented endpoints exist
- [ ] API examples are accurate
- [ ] Architecture diagram is up-to-date
- [ ] Environment variables documented
- [ ] Troubleshooting guide is helpful

## Security Tests

- [ ] JWT tokens properly validated
- [ ] CORS headers present
- [ ] SQL injection prevented
- [ ] XSS protection in place
- [ ] CSRF tokens validated
- [ ] Passwords hashed (not plain text)
- [ ] Sensitive data not logged
- [ ] Rate limiting working

## Final Checks

- [ ] No console errors or warnings
- [ ] No memory leaks (check with profiler)
- [ ] No unhandled promise rejections
- [ ] All dependencies up-to-date
- [ ] No secrets in code
- [ ] No debug code left in production
- [ ] All tests passing
- [ ] Performance acceptable

## Sign-Off

- [ ] All critical tests passed
- [ ] All important tests passed
- [ ] Known issues documented
- [ ] Release notes prepared
- [ ] Deployment ready

---

**Testing Date**: ___________
**Tested By**: ___________
**Status**: ___________
**Notes**: ___________
