# Multi-stage build for Astro with SSR (Server-Side Rendering)

# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

# Set working directory
WORKDIR /app

# Copy built assets and necessary files from build stage
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321
# Copy .env file for build-time environment variables
COPY .env /app/.env

# Expose port
EXPOSE 4321

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:4321/ || exit 1

# Command to run
CMD ["node", "./dist/server/entry.mjs"]
