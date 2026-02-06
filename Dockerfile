# 46elks MCP Server - Docker Image
# Multi-stage build for minimal image size

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
# Use --ignore-scripts to skip husky prepare script
RUN npm ci --ignore-scripts

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Install production dependencies only (separate step for clean prod node_modules)
RUN rm -rf node_modules && npm ci --omit=dev --ignore-scripts

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Remove npm and related tools (not needed at runtime, eliminates vulnerabilities)
RUN npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/include/node /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set ownership
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Environment variables (to be provided at runtime)
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Run MCP server
CMD ["node", "dist/index.js"]
