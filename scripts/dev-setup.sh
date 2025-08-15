#!/bin/bash

echo "🚀 Starting Async Workflow Engine Development Environment"
echo "=================================================="

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

# Start all services in development mode (NON-DETACHED)
echo "📊 Starting all services (API, Workers, PostgreSQL, Redis, Monitoring)..."
echo "⚡ Running in foreground mode - you'll see all logs in real-time!"
echo "💡 Press Ctrl+C to stop all services"
echo ""
echo "🌐 Services will be available at:"
echo "  • API Server: http://localhost:3000"
echo "  • PostgreSQL: localhost:5433 (mapped from container port 5432)"
echo "  • Redis: localhost:6380 (mapped from container port 6379)"
echo "  • Redis Commander: http://localhost:8081"
echo "  • BullMQ Dashboard: http://localhost:3001"
echo ""

# Build and start services in foreground
$COMPOSE_CMD -f docker-compose.dev.yml up --build 