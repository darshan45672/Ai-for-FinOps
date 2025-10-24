# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:24-alpine AS deps

WORKDIR /app

# Install security updates and required tools
RUN apk add --no-cache \
    libc6-compat \
    ca-certificates \
    && apk upgrade --no-cache

# Copy only package files for better layer caching
COPY package*.json ./

# Install all dependencies
RUN npm install && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Install required tools
RUN apk add --no-cache libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:24-alpine AS production

# Add OCI labels for better image management
LABEL org.opencontainers.image.title="AI FinOps Frontend"
LABEL org.opencontainers.image.description="Frontend application for AI FinOps platform"
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
    adduser -S nextjs -u 1001 -G nodejs

# Set proper environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=512" \
    TZ=UTC \
    HOSTNAME="0.0.0.0"

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set security-conscious file permissions
RUN chown -R nextjs:nodejs /app && \
    chmod -R 550 /app && \
    chmod -R 555 /app/public

# Switch to non-root user
USER nextjs

# Expose port (documentation only, doesn't publish)
EXPOSE 3003

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
