#!/bin/bash

# Check for Docker Compose
if sudo docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="sudo docker compose"
elif sudo docker-compose --version > /dev/null 2>&1; then
    COMPOSE_CMD="sudo docker-compose"
else
    echo "❌ Docker Compose not found."
    exit 1
fi

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📋 Available services:"
    if [ -f "docker-compose.dev.yml" ] && $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo "Development mode detected"
        $COMPOSE_CMD -f docker-compose.dev.yml ps --services
        echo ""
        echo "Usage: $0 <service-name>"
        echo "Example: $0 api-dev"
        echo "Or: $0 worker-dev"
        $COMPOSE_CMD -f docker-compose.dev.yml logs -f
    else
        echo "Production mode detected"
        $COMPOSE_CMD ps --services
        echo ""
        echo "Usage: $0 <service-name>"
        echo "Example: $0 api"
        echo "Or: $0 worker"
        $COMPOSE_CMD logs -f
    fi
else
    # Show logs for specific service
    if [ -f "docker-compose.dev.yml" ] && $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "Up"; then
        $COMPOSE_CMD -f docker-compose.dev.yml logs -f $SERVICE
    else
        $COMPOSE_CMD logs -f $SERVICE
    fi
fi 