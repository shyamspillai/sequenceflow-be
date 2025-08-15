# Async Workflow Engine

This backend supports both synchronous and asynchronous workflow execution using BullMQ and Redis for massive horizontal scalability. The entire system runs via Docker for easy deployment and scaling.

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** ([Download here](https://www.docker.com/products/docker-desktop/))

### 1. Clone & Navigate
```bash
git clone https://github.com/shyamspillai/sequenceflow-be.git
cd sequenceflow-be
```

### 2. Development (with Hot Reload)
```bash
# Start everything (API + Workers + Infrastructure + Monitoring)
npm run docker:dev
```

OR 

```bash
docker compose -f docker-compose.dev.yml up
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
Queue Start Node (inputText / httpCall)
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
- **Health Checks**: Automatic service monitoring
- **Scaling Ready**: Easy horizontal worker scaling

## 🔧 API Endpoints

### Workflow Management
```http
GET    /workflows                           # List all workflows
POST   /workflows                           # Create new workflow
GET    /workflows/:id                       # Get workflow details
PUT    /workflows/:id                       # Update workflow
DELETE /workflows/:id                       # Delete workflow
POST   /workflows/:id/execute-async         # Execute workflow asynchronously
```

### Workflow Execution
```http
GET    /workflows/:id/runs                  # List workflow runs
GET    /workflows/:id/runs/:runId/status    # Get execution status and logs
POST   /workflows/:id/runs/:runId/cancel    # Cancel running workflow
```

### Mock API Endpoints (for testing)
```http
GET    /workflows/api/mock/apollo/person-enrichment    # Person data enrichment
GET    /workflows/api/mock/workflows/api/test-weather  # Weather data API
POST   /workflows/api/mock/lead-scoring/analyze        # Lead scoring service
POST   /workflows/api/mock/notifications/ae-alert      # Sales notification
POST   /workflows/api/mock/email/follow-up             # Email automation
GET    /workflows/api/mock/sensors/temperature/live    # Temperature sensors
POST   /workflows/api/mock/building/ac/control         # AC system control
POST   /workflows/api/mock/triggers/temperature-alert  # Automated triggers
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


## 🌐 Service URLs

### Development
- **API**: http://localhost:3000
- **Redis**: localhost:6380 (mapped from container port 6379)
- **PostgreSQL**: localhost:5432
- **Redis Commander**: http://localhost:8081
- **BullMQ Dashboard**: http://localhost:3001


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


#### Database connection issues
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v  # WARNING: Deletes data
npm run docker:dev
```
