#!/bin/bash

echo "🔐 Setting up self-signed SSL certificates..."

# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=68.183.246.88"

echo "✅ SSL certificates created!"
echo "📍 Certificate: ssl/cert.pem"
echo "🔑 Private key: ssl/key.pem"

echo ""
echo "🚀 Now run: docker-compose -f docker-compose.https.yml up -d"
echo "🌐 Your API will be available at: https://68.183.246.88"
echo ""
echo "⚠️  Update Vercel environment variable to:"
echo "   VITE_SEQUENCE_BE_BASE_URL=https://68.183.246.88"
