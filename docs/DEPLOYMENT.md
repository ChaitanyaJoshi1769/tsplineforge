# Deployment Guide

## Prerequisites

- Kubernetes cluster (1.28+) with 4+ cores, 8GB+ RAM
- Docker registry access
- kubectl configured
- PostgreSQL client tools
- Terraform 1.5+ (for infrastructure)

## Quick Start (Docker Compose)

Best for local development and testing:

```bash
docker-compose up -d
```

Starts all services:
- Gateway API: http://localhost:3000
- Web UI: http://localhost:3001
- Postgres: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9001
- NATS: localhost:4222

## Production (Kubernetes)

### 1. Prepare Cluster

```bash
# Create namespace
kubectl create namespace tsplineforge

# Label for monitoring
kubectl label namespace tsplineforge \
  monitoring=enabled \
  backup=enabled
```

### 2. Configure Secrets

```bash
# Create secrets
kubectl create secret generic tsplineforge-secrets \
  --from-literal=database-url='postgresql://tspline:password@postgres:5432/tsplineforge' \
  --from-literal=jwt-secret='your-super-secret-key' \
  --from-literal=s3-endpoint='https://s3.amazonaws.com' \
  --from-literal=s3-access-key='AKIA...' \
  --from-literal=s3-secret-key='...' \
  --from-literal=postgres-password='secure-password' \
  -n tsplineforge
```

### 3. Deploy Infrastructure

```bash
# Apply manifests in order
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/configmap.yaml
kubectl apply -f infrastructure/k8s/statefulset-database.yaml
kubectl apply -f infrastructure/k8s/deployment-gateway.yaml

# Verify
kubectl get all -n tsplineforge
```

### 4. Configure Ingress

```yaml
# infrastructure/k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tsplineforge
  namespace: tsplineforge
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - tsplineforge.example.com
    secretName: tsplineforge-tls
  rules:
  - host: tsplineforge.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway
            port:
              number: 80
```

```bash
kubectl apply -f infrastructure/k8s/ingress.yaml
```

### 5. Setup Database

```bash
# Forward port
kubectl port-forward -n tsplineforge \
  statefulset/postgres 5432:5432

# In another terminal
psql postgresql://tspline:password@localhost:5432/tsplineforge \
  < infrastructure/database/init.sql
```

### 6. Monitoring & Logging

```bash
# Deploy Prometheus
kubectl apply -f infrastructure/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f infrastructure/monitoring/grafana.yaml

# Port forward for access
kubectl port-forward -n tsplineforge \
  svc/prometheus 9090:9090

kubectl port-forward -n tsplineforge \
  svc/grafana 3001:3000
```

## Cloud Deployment

### Google Cloud (GKE)

```bash
# Create cluster
gcloud container clusters create tsplineforge \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-4 \
  --enable-ip-alias \
  --enable-stackdriver-kubernetes

# Configure kubectl
gcloud container clusters get-credentials tsplineforge

# Deploy
kubectl apply -k infrastructure/k8s/overlays/prod
```

### AWS (EKS)

```bash
# Create cluster
eksctl create cluster \
  --name tsplineforge \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name main \
  --nodes 3 \
  --instance-types t3.xlarge

# Deploy
kubectl apply -k infrastructure/k8s/overlays/prod
```

### Azure (AKS)

```bash
# Create resource group
az group create \
  --name tsplineforge \
  --location eastus

# Create cluster
az aks create \
  --resource-group tsplineforge \
  --name tsplineforge-cluster \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard

# Deploy
kubectl apply -k infrastructure/k8s/overlays/prod
```

## Scaling

### Horizontal Scaling

```bash
# Scale gateway
kubectl scale deployment gateway \
  --replicas 5 \
  -n tsplineforge

# Auto-scaling
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-hpa
  namespace: tsplineforge
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF
```

### Vertical Scaling

Edit deployment resource limits:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Backup & Recovery

### Database Backup

```bash
# Manual backup
kubectl exec -n tsplineforge statefulset/postgres -- \
  pg_dump -U tspline tsplineforge | gzip > backup.sql.gz

# Automated daily backup (CronJob)
kubectl apply -f infrastructure/k8s/backup-cron.yaml
```

### Restore from Backup

```bash
# Extract backup
gunzip backup.sql.gz

# Connect to database
kubectl port-forward -n tsplineforge \
  statefulset/postgres 5432:5432

# Restore
psql postgresql://tspline:password@localhost:5432/tsplineforge \
  < backup.sql
```

## Monitoring

### Health Checks

```bash
# Gateway health
kubectl get endpoints gateway -n tsplineforge

# Pod status
kubectl get pods -n tsplineforge -o wide

# Logs
kubectl logs -n tsplineforge deployment/gateway --tail=100 -f
```

### Prometheus Queries

```
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_errors_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_duration_seconds_bucket[5m]))
```

### Grafana Dashboards

Import dashboards from:
- infrastructure/monitoring/grafana/dashboards/

## Troubleshooting

### Pod Won't Start

```bash
# Check events
kubectl describe pod <pod-name> -n tsplineforge

# Check logs
kubectl logs <pod-name> -n tsplineforge

# Check resources
kubectl top pods -n tsplineforge
```

### Database Connection Issues

```bash
# Test connectivity
kubectl run -it --rm debug \
  --image=postgres:16 \
  --restart=Never \
  -n tsplineforge \
  -- psql postgresql://tspline:password@postgres:5432/tsplineforge
```

### Memory Issues

```bash
# Check usage
kubectl top nodes
kubectl top pods -n tsplineforge

# Increase limits
kubectl set resources deployment gateway \
  -n tsplineforge \
  --limits=memory=2Gi,cpu=1000m \
  --requests=memory=512Mi,cpu=500m
```

## Upgrade Process

```bash
# Check current version
kubectl describe deployment gateway -n tsplineforge

# Update image
kubectl set image deployment/gateway \
  gateway=tsplineforge/gateway:v0.2.0 \
  -n tsplineforge

# Watch rollout
kubectl rollout status deployment/gateway -n tsplineforge

# Rollback if needed
kubectl rollout undo deployment/gateway -n tsplineforge
```

## Cost Optimization

- Use node auto-scaling
- Set resource requests/limits
- Use spot instances for non-critical workloads
- Schedule non-critical jobs during off-hours
- Use object storage for old data

## Security Hardening

- Enable network policies
- Use RBAC for access control
- Encrypt secrets at rest
- Enable audit logging
- Regular security scanning

```bash
# Network policy example
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: tsplineforge
spec:
  podSelector: {}
  policyTypes:
  - Ingress
EOF
```

## Next Steps

1. Set up CI/CD pipeline (.github/workflows)
2. Configure monitoring and alerting
3. Set up backup automation
4. Configure SSL/TLS certificates
5. Test failover and recovery procedures
