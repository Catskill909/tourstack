# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from app directory
COPY app/package*.json ./

# Install dependencies
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

# Copy package files and install production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (tsx runs TypeScript directly)
COPY --from=builder /app/server ./server

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Create uploads directory
RUN mkdir -p uploads/images uploads/audio uploads/documents

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 3000
EXPOSE 3000

# Start the API server with tsx
CMD ["npx", "tsx", "server/index.ts"]
