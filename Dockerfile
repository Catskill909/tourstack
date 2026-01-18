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

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve for static file serving
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
