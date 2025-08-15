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

REMOVE_VOLUMES=${1:-""}

echo "🛑 Stopping Docker services..."

# Check if development mode is running
if [ -f "docker-compose.dev.yml" ] && $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "📊 Stopping development environment..."
    if [ "$REMOVE_VOLUMES" = "-v" ] || [ "$REMOVE_VOLUMES" = "--volumes" ]; then
        echo "⚠️  Removing volumes (this will delete data)..."
        $COMPOSE_CMD -f docker-compose.dev.yml down -v
    else
        $COMPOSE_CMD -f docker-compose.dev.yml down
    fi
fi

# Check if production mode is running
if $COMPOSE_CMD ps | grep -q "Up"; then
    echo "🚀 Stopping production environment..."
    if [ "$REMOVE_VOLUMES" = "-v" ] || [ "$REMOVE_VOLUMES" = "--volumes" ]; then
        echo "⚠️  Removing volumes (this will delete data)..."
        $COMPOSE_CMD down -v
    else
        $COMPOSE_CMD down
    fi
fi

echo ""
echo "✅ Services stopped successfully!"
echo ""

if [ "$REMOVE_VOLUMES" != "-v" ] && [ "$REMOVE_VOLUMES" != "--volumes" ]; then
    echo "💡 To also remove volumes (database data), run:"
    echo "   $0 -v"
fi 