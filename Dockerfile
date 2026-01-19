# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from app directory
COPY app/package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy the rest of the app directory
COPY app/ ./

# Generate Prisma client
RUN npx prisma generate

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for healthchecks and tsx for running TypeScript. Add sqlite for db tools.
RUN apk add --no-cache curl sqlite && npm install -g tsx

# Copy package files
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source
COPY --from=builder /app/server ./server

# Copy generated Prisma client
COPY --from=builder /app/src/generated ./src/generated

# Copy startup script
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/start.sh

# Create data and uploads directories
RUN mkdir -p data uploads/images uploads/audio uploads/documents

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 3000
EXPOSE 3000

# Healthcheck - Coolify uses this to verify container is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start using the startup script (runs migrations, seed, then server)
CMD ["sh", "./scripts/start.sh"]
