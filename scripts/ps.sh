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

echo "🔍 Docker services status:"
echo ""

# Check development mode first
if [ -f "docker-compose.dev.yml" ] && $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "📊 Development Environment:"
    $COMPOSE_CMD -f docker-compose.dev.yml ps
elif $COMPOSE_CMD ps | grep -q "Up"; then
    echo "🚀 Production Environment:"
    $COMPOSE_CMD ps
else
    echo "⚠️  No services running"
    echo ""
    echo "Start services with:"
    echo "  Development: npm run docker:dev"
    echo "  Production:  npm run docker:prod"
fi

echo "" 