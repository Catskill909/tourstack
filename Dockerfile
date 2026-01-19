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

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy package files
COPY --from=builder /app/package*.json ./

# Install production dependencies (Prisma needs its runtime)
RUN npm ci --omit=dev

# Re-generate Prisma client in production context
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source
COPY --from=builder /app/server ./server

# Copy generated Prisma client
COPY --from=builder /app/src/generated ./src/generated

# Create uploads directory
RUN mkdir -p uploads/images uploads/audio uploads/documents

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 3000
EXPOSE 3000

# Start the API server with tsx
CMD ["tsx", "server/index.ts"]
