# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:24-alpine AS deps

WORKDIR /app

# Install security updates and required tools
RUN apk add --no-cache \
    dumb-init \
    tini \
    ca-certificates \
    && apk upgrade --no-cache

# Copy only package files for better layer caching
COPY package*.json ./

# Install dependencies for production
RUN npm install --omit=dev && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:24-alpine AS production

# Add OCI labels for better image management
LABEL org.opencontainers.image.title="AI FinOps Backend Service"
LABEL org.opencontainers.image.description="Backend microservice for AI FinOps platform"
LABEL org.opencontainers.image.vendor="AI FinOps"
LABEL org.opencontainers.image.version="1.0.0"
LABEL maintainer="AI FinOps Team"

WORKDIR /app

# Install only runtime essentials and security updates
RUN apk add --no-cache \
    dumb-init \
    ca-certificates \
    tzdata \
    && apk upgrade --no-cache \
    && rm -rf /var/cache/apk/*

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Set proper environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=1024" \
    TZ=UTC

# Copy production dependencies from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package*.json ./

# Set security-conscious file permissions
RUN chmod -R 550 /app && \
    chmod -R 440 /app/package*.json

# Switch to non-root user
USER nestjs

# Expose port (documentation only, doesn't publish)
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]
