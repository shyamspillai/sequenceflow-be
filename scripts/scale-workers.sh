#!/bin/bash

WORKERS=${1}

if [ -z "$WORKERS" ]; then
    echo "❌ Usage: $0 <number_of_workers>"
    echo ""
    echo "Examples:"
    echo "  $0 5    # Scale to 5 workers"
    echo "  $0 10   # Scale to 10 workers"
    echo "  $0 1    # Scale down to 1 worker"
    exit 1
fi

# Check for Docker Compose
if sudo docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="sudo docker compose"
elif sudo docker-compose --version > /dev/null 2>&1; then
    COMPOSE_CMD="sudo docker-compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose and try again."
    exit 1
fi

echo "📈 Scaling workers to $WORKERS instances..."

# Check if we're in development or production mode
if $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "worker-dev"; then
    echo "🔧 Development mode detected"
    $COMPOSE_CMD -f docker-compose.dev.yml up -d --scale worker-dev=$WORKERS worker-dev
elif $COMPOSE_CMD ps | grep -q "worker"; then
    echo "🚀 Production mode detected"
    $COMPOSE_CMD up -d --scale worker=$WORKERS worker
else
    echo "❌ No workers found. Please start the environment first:"
    echo "  Development: ./scripts/dev-setup.sh"
    echo "  Production:  ./scripts/prod-setup.sh"
    exit 1
fi

echo "⏳ Waiting for workers to start..."
sleep 5

# Show current status
echo "🔍 Current worker status:"
if $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "worker-dev"; then
    $COMPOSE_CMD -f docker-compose.dev.yml ps worker-dev
else
    $COMPOSE_CMD ps worker
fi

echo ""
echo "✅ Workers scaled to $WORKERS instances!"
echo ""
echo "📊 Monitor worker performance:"
echo "  • $COMPOSE_CMD logs -f worker  # Worker logs"
echo "  • http://localhost:3001          # BullMQ Dashboard"
echo "" 