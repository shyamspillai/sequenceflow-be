#!/bin/bash

echo "🚀 Starting Async Workflow Engine Production Environment"
echo "====================================================="

# Check if Docker is running
if ! sudo docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check for Docker Compose
if sudo docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="sudo docker compose"
elif sudo docker-compose --version > /dev/null 2>&1; then
    COMPOSE_CMD="sudo docker-compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose and try again."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "🔧 Using: $COMPOSE_CMD"

# Parse command line arguments
WORKERS=${1:-2}
WORKER_CONCURRENCY=${2:-5}

echo "🏗️ Configuration:"
echo "  • Workers: $WORKERS"
echo "  • Worker Concurrency: $WORKER_CONCURRENCY"
echo ""

# Start core services first
echo "📊 Starting infrastructure services..."
$COMPOSE_CMD up -d postgres redis

# Wait for infrastructure
echo "⏳ Waiting for infrastructure to be ready..."
sleep 10

# Build and start API server
echo "🌐 Starting API server..."
$COMPOSE_CMD up -d --build api

# Wait for API to be ready
echo "⏳ Waiting for API server to be ready..."
sleep 15

# Start workers
echo "🏭 Starting $WORKERS worker processes..."
WORKER_CONCURRENCY=$WORKER_CONCURRENCY $COMPOSE_CMD up -d --scale worker=$WORKERS worker

# Wait for all services
echo "⏳ Waiting for all services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
$COMPOSE_CMD ps

echo ""
echo "✅ Production environment is ready!"
echo ""
echo "🌐 Services available at:"
echo "  • API Server: http://localhost:3000"
echo "  • Workers: $WORKERS instances running"
echo "  • PostgreSQL: localhost:5433 (mapped from container port 5432)"
echo "  • Redis: localhost:6380 (mapped from container port 6379)"
echo ""
echo "📚 API Endpoints:"
echo "  • GET /workflows - List workflows"
echo "  • POST /workflows/{id}/execute-async - Start async workflow"
echo "  • GET /workflows/runs/{runId}/status - Check status"
echo "  • POST /workflows/runs/{runId}/cancel - Cancel workflow"
echo ""
echo "🛠️ Production Commands:"
echo "  • $COMPOSE_CMD logs -f api     # API logs"
echo "  • $COMPOSE_CMD logs -f worker  # Worker logs"
echo "  • $COMPOSE_CMD ps              # Service status"
echo "  • $COMPOSE_CMD down            # Stop all services"
echo ""
echo "📈 Scaling Commands:"
echo "  • $COMPOSE_CMD up -d --scale worker=5 worker  # Scale to 5 workers"
echo "  • $COMPOSE_CMD restart worker                 # Restart workers"
echo ""
echo "🔧 Monitoring (optional):"
echo "  • $COMPOSE_CMD --profile tools up -d redis-commander  # Redis GUI"
echo "  • $COMPOSE_CMD --profile tools up -d bullmq-board     # Queue monitoring"
echo "" 