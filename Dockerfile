# ---- Base Stage ----
# Use official Node.js runtime
FROM node:20-slim AS base
WORKDIR /usr/src/app
# Install system dependencies needed for sqlite3 compilation
RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/*

# ---- Builder Stage ----
# This stage builds the application
FROM base AS builder
WORKDIR /usr/src/app
# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install
# Copy the rest of the application source code
COPY . .
# Set up the database
RUN npm run setup
# Build the React frontend
RUN npm run build

# ---- Production Stage ----
# This stage creates the final, lean production image
FROM base AS production
WORKDIR /usr/src/app
# Create a non-root user for security
RUN groupadd -g 1001 nodeuser && \
    useradd -r -u 1001 -g nodeuser -s /bin/false nodeuser

# Copy package files and install only production dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --omit=dev

# Copy application files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/database-setup.js ./database-setup.js
COPY --from=builder /usr/src/app/database.db ./database.db

# Create logs directory and set all permissions as root
RUN mkdir -p /usr/src/app/logs && \
    chmod 444 database.db && \
    chown -R nodeuser:nodeuser /usr/src/app

# Switch to the non-root user for runtime
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
