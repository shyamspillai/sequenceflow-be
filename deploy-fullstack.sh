#!/bin/bash

echo "🚀 Deploying Full-Stack Workflow Engine"
echo "======================================="

# Create frontend directory
mkdir -p frontend-dist

echo "📦 Building frontend..."
if [ ! -d "../sequence-flow" ]; then
    echo "❌ Frontend directory not found. Please run this from sequence-be directory"
    echo "   Expected: ../sequence-flow"
    exit 1
fi

# Build frontend with correct API base URL
cd ../sequence-flow

# Update API base URL to use same origin
echo "⚙️  Configuring frontend for same-origin deployment..."
export VITE_SEQUENCE_BE_BASE_URL=""  # Empty means same origin

# Build the frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
    
    # Copy built files to backend
    cp -r dist/* ../sequence-be/frontend-dist/
    echo "📁 Frontend files copied to backend"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ../sequence-be

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null
docker-compose -f docker-compose.https.yml down 2>/dev/null

# Start full-stack deployment
echo "🚀 Starting full-stack deployment..."
docker-compose -f docker-compose.fullstack.yml up -d --build

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Test the deployment
echo "🔍 Testing deployment..."
if curl -f http://localhost:80/health 2>/dev/null; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

if curl -f http://localhost:80/ 2>/dev/null | grep -q "DOCTYPE"; then
    echo "✅ Frontend is serving"
else
    echo "❌ Frontend not accessible"
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your app is available at: http://68.183.246.88"
echo "📊 API endpoints: http://68.183.246.88/workflows"
echo "🔧 BullMQ Dashboard: http://68.183.246.88:3001"
echo ""
echo "📋 Service status:"
docker-compose -f docker-compose.fullstack.yml ps
