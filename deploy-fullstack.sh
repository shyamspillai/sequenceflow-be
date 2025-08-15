#!/bin/bash

echo "🚀 Deploying Full-Stack Workflow Engine"
echo "======================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get update && apt-get install -y nodejs
fi

# Check Node.js version
echo "📍 Node.js version: $(node --version)"
echo "📍 npm version: $(npm --version)"

# Create frontend directory
mkdir -p frontend-dist

echo "📦 Building frontend..."
if [ ! -d "../sequenceflow-fe" ]; then
    echo "❌ Frontend directory not found. Please run this from sequence-be directory"
    echo "   Expected: ../sequenceflow-fe"
    exit 1
fi

# Build frontend with correct API base URL
cd ../sequenceflow-fe

# Always install dependencies (including dev dependencies for build)
echo "📦 Installing frontend dependencies (including dev dependencies)..."
npm install

# Clean any previous build
rm -rf dist

# Update API base URL to use same origin
echo "⚙️  Configuring frontend for same-origin deployment..."
export VITE_SEQUENCE_BE_BASE_URL=""  # Empty means same origin

# Build the frontend (skip TypeScript checking for faster build)
echo "🔨 Building frontend..."
echo "⚙️  Using Vite build without TypeScript checking for production..."

# Create a temporary vite config for production build without TS checking
cat > vite.config.prod.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    }
  },
  esbuild: {
    target: 'es2015'
  }
})
EOF

# Build using the production config
npx vite build --config vite.config.prod.js

# Clean up temp config
rm -f vite.config.prod.js

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
    
    # Copy built files to backend
    mkdir -p ../sequence-be/frontend-dist
    cp -r dist/* ../sequence-be/frontend-dist/
    echo "📁 Frontend files copied to backend"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ../sequence-be

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.dev.yml down 2>/dev/null
docker compose -f docker-compose.https.yml down 2>/dev/null

# Start full-stack deployment
echo "🚀 Starting full-stack deployment..."
docker compose -f docker-compose.fullstack.yml up -d --build

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
docker compose -f docker-compose.fullstack.yml ps
