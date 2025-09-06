# Multi-stage build to handle different requirements
# Stage 1: Build stage with all build tools
FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy source code first
COPY . .

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Build the React frontend using the direct vite.js path
RUN node node_modules/vite/bin/vite.js build

# Stage 2: Production stage
FROM node:20-slim AS production

WORKDIR /usr/src/app

# Install only production dependencies and Python for sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -g 1001 nodeuser && \
    useradd -r -u 1001 -g nodeuser -s /bin/false nodeuser

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.js ./
COPY --from=builder /usr/src/app/database-setup.js ./
COPY --from=builder /usr/src/app/vite.config.js ./

# Run database setup as root (needed for file creation)
RUN node database-setup.js

# Change ownership of all application files to nodeuser
RUN chown -R nodeuser:nodeuser /usr/src/app

# Make database file read-only for security (prevents DROP TABLE attacks)
RUN chmod 444 database.db

# Create a directory for logs (if needed) with proper permissions
RUN mkdir -p /usr/src/app/logs && chown nodeuser:nodeuser /usr/src/app/logs

# Switch to non-root user
USER nodeuser

# Set environment variable for CTF flag
ENV CTF_FLAG="Medusa{CTF_CHALLENGE_PHASE1_PASSED}"

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3000, path: '/', method: 'GET' }; \
    const req = http.request(options, (res) => { \
    if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
    }); \
    req.on('error', () => { process.exit(1); }); \
    req.end();"

# Run the application
CMD ["node", "server.js"]