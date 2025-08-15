FROM node:20-alpine AS base

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy built application and node_modules
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S workflow -u 1001

# Change ownership
RUN chown -R workflow:nodejs /usr/src/app
USER workflow

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Default to API server, can be overridden
EXPOSE 3000
CMD ["node", "dist/main.js"] 