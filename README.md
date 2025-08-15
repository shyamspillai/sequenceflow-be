# Async Workflow Engine

This backend supports both synchronous and asynchronous workflow execution using BullMQ and Redis for massive horizontal scalability. The entire system runs via Docker for easy deployment and scaling.

## 🚀 Quick Start

### Development (with Hot Reload)
```bash
# Start everything (API + Workers + Infrastructure + Monitoring)
npm run docker:dev

# Or manually:
./scripts/dev-setup.sh
```

### Production
```bash
# Start with 2 workers (default)
npm run docker:prod

# Or with custom worker count:
./scripts/prod-setup.sh 5 10  # 5 workers, 10 concurrency each
```

### Scaling Workers
```bash
# Scale to 10 workers
npm run docker:scale 10

# Or manually:
./scripts/scale-workers.sh 10
```

## 🏗️ Architecture Overview

### 🔄 Async Workflow System

The system has been refactored to support event-driven, asynchronous workflow execution:

1. **Task-Based Execution**: Each workflow node becomes an independent task
2. **Dependency Management**: Tasks are queued only when their dependencies are satisfied
3. **Horizontal Scaling**: Multiple worker processes can process tasks in parallel
4. **Event-Driven**: Node completion triggers downstream node evaluation
5. **Fault Tolerance**: Built-in retry mechanisms and error handling

### 🏗️ Key Components

#### 1. **WorkflowTask Entity** (`entities/task.entity.ts`)
- Tracks individual node execution state
- Stores input/output payloads and dependencies
- Links to BullMQ job IDs for tracking

#### 2. **Queue System** (`queues/workflow.queue.ts`)
- `workflow-tasks`: Executes individual workflow nodes
- `workflow-dependencies`: Checks and triggers dependent tasks

#### 3. **Services**
- **AsyncWorkflowService**: Orchestrates async workflow execution
- **TaskExecutionService**: Executes individual tasks
- **DependencyService**: Manages task dependencies and triggers

#### 4. **Workers** (`worker.ts`)
- Standalone worker processes for horizontal scaling
- Configurable concurrency levels
- Graceful shutdown handling

### 📊 Execution Flow

```
Workflow Start
     ↓
Create Tasks for All Nodes
     ↓
Build Dependency Graph
     ↓
Queue Start Node (inputText)
     ↓
Worker Executes Task
     ↓
Task Completion Triggers Dependency Check
     ↓
Queue Ready Downstream Tasks
     ↓
Repeat Until All Tasks Complete
```

## 🐳 Docker Deployment

### Service Architecture
```yaml
services:
  api:          # NestJS API Server
  worker:       # BullMQ Workers (scalable)
  postgres:     # Database
  redis:        # Queue & Cache
  redis-commander: # Redis GUI (optional)
  bullmq-board:    # Queue monitoring (optional)
```

### Development Environment
- **Hot Reload**: Code changes automatically restart services
- **Full Monitoring**: Redis GUI + Queue dashboard included
- **Volume Mounting**: Your code is mounted for live editing

### Production Environment
- **Optimized Images**: Multi-stage build for smaller images
- **Health Checks**: Automatic service monitoring
- **Scaling Ready**: Easy horizontal worker scaling
- **Security**: Non-root user, minimal attack surface

## 📡 API Endpoints

### Async Execution (New)

#### Start Async Workflow
```http
POST /workflows/{id}/execute-async
Content-Type: application/json

{
  "input": {
    "key": "value"
  }
}
```

Response:
```json
{
  "runId": "uuid-here"
}
```

#### Check Run Status
```http
GET /workflows/runs/{runId}/status
```

Response:
```json
{
  "status": "running",
  "startedAt": "2024-01-01T00:00:00Z",
  "finishedAt": null,
  "tasks": [
    {
      "id": "task-uuid",
      "nodeId": "node-1",
      "nodeType": "inputText",
      "status": "completed",
      "startedAt": "2024-01-01T00:00:00Z",
      "completedAt": "2024-01-01T00:00:01Z"
    }
  ],
  "logs": [
    {
      "id": "log-uuid",
      "type": "node-output",
      "message": "Task completed",
      "timestamp": "2024-01-01T00:00:01Z",
      "nodeId": "node-1"
    }
  ]
}
```

#### Cancel Running Workflow
```http
POST /workflows/runs/{runId}/cancel
```

### Legacy Sync Execution (Preserved)

```http
POST /workflows/{id}/execute
```

## 🛠️ Development Commands

### Docker Operations
```bash
npm run docker:dev          # Start development environment
npm run docker:prod         # Start production environment
npm run docker:scale 5      # Scale to 5 workers
npm run docker:logs:api     # View API logs
npm run docker:logs:worker  # View worker logs
npm run docker:down         # Stop all services
npm run docker:ps           # Show service status
```

### Local Development (Legacy)
```bash
npm run start:dev           # Start API server locally
npm run start:worker:dev    # Start worker locally
```

## 🔧 Configuration

### Environment Variables

Development (set in docker-compose.dev.yml):
```yaml
NODE_ENV: development
PGHOST: postgres
REDIS_HOST: redis
WORKER_CONCURRENCY: 3
CHOKIDAR_USEPOLLING: true  # For hot reload
```

Production (set in docker-compose.yml):
```yaml
NODE_ENV: production
PGHOST: postgres
REDIS_HOST: redis
WORKER_CONCURRENCY: 5
```

### Scaling Configuration

#### Vertical Scaling (Per Worker)
```bash
# Set worker concurrency
WORKER_CONCURRENCY=10 ./scripts/prod-setup.sh
```

#### Horizontal Scaling (More Workers)
```bash
# Scale to 20 workers
./scripts/scale-workers.sh 20
```

## 🌐 Service URLs

### Development
- **API**: http://localhost:3000
- **Redis**: localhost:6380 (mapped from container port 6379)
- **PostgreSQL**: localhost:5432
- **Redis Commander**: http://localhost:8081
- **BullMQ Dashboard**: http://localhost:3001

### Production
- **API**: http://localhost:3000
- **Redis**: localhost:6380 (mapped from container port 6379)
- **PostgreSQL**: localhost:5432
- **Monitoring Tools**: Use `--profile tools` flag

## 🚀 Production Deployment

### Local Production Test
```bash
./scripts/prod-setup.sh 5 10  # 5 workers, 10 concurrency each
```

### Cloud Deployment

#### Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml workflow-engine
```

#### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-worker
spec:
  replicas: 10  # Scale based on load
  selector:
    matchLabels:
      app: workflow-worker
  template:
    spec:
      containers:
      - name: worker
        image: your-registry/workflow-engine:latest
        command: ["node", "dist/worker.js"]
        env:
        - name: WORKER_CONCURRENCY
          value: "5"
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

## 📈 Monitoring & Observability

### Built-in Dashboards
- **BullMQ Board**: http://localhost:3001 - Queue monitoring
- **Redis Commander**: http://localhost:8081 - Redis data browser

### Metrics to Monitor
- Queue length and processing rate
- Task execution times
- Failed job counts
- Worker memory/CPU usage
- Database connection pool usage

### Health Checks
All services include health checks:
- API server responds to HTTP requests
- Workers process heartbeat jobs
- Database connectivity
- Redis connectivity

## 🔍 Benefits of Docker Architecture

### Scalability
- **Horizontal Workers**: `docker-compose up --scale worker=10`
- **Zero Downtime**: Rolling updates and scaling
- **Resource Isolation**: Each service in its own container

### Reliability
- **Service Isolation**: Failed worker doesn't affect API
- **Auto Restart**: `restart: unless-stopped` policy
- **Health Monitoring**: Built-in health checks

### Performance
- **Optimized Images**: Multi-stage builds for production
- **Resource Limits**: Configurable CPU/memory limits
- **Efficient Networking**: Internal Docker networking

### Development Experience
- **Hot Reload**: Development changes restart services automatically
- **Consistent Environment**: Same stack across team members
- **Easy Setup**: Single command to start everything

## 🛠️ Troubleshooting

### Common Issues

#### Services not starting
```bash
# Check Docker is running
docker info

# Check service logs
npm run docker:logs:dev

# Reset environment
npm run docker:down:dev
npm run docker:dev
```

#### Worker scaling issues
```bash
# Check current workers
npm run docker:ps

# Force restart workers
docker-compose restart worker
```

#### Database connection issues
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v  # WARNING: Deletes data
npm run docker:dev
```

### Performance Tuning

#### High Load Scenarios
```bash
# Scale workers aggressively
./scripts/scale-workers.sh 20

# Increase worker concurrency
WORKER_CONCURRENCY=15 ./scripts/prod-setup.sh 10
```

#### Memory Optimization
```bash
# Monitor resource usage
docker stats

# Limit worker memory
# Edit docker-compose.yml to add memory limits
```

This Docker-based architecture provides a production-ready, scalable workflow engine that can handle massive concurrent loads while being easy to develop, deploy, and maintain! 