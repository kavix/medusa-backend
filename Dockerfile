# Use official Node.js runtime for production
FROM node:20-slim

WORKDIR /usr/src/app

# Install system dependencies needed for sqlite3 compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -g 1001 nodeuser && \
    useradd -r -u 1001 -g nodeuser -s /bin/false nodeuser

# Change ownership of working directory to nodeuser
RUN chown nodeuser:nodeuser /usr/src/app

# Switch to non-root user early
USER nodeuser

# Copy package files
COPY --chown=nodeuser:nodeuser package*.json ./

# Install all dependencies (including dev dependencies needed for sqlite3 compilation)
RUN npm install

# Copy application files (including pre-built dist directory and database)
COPY --chown=nodeuser:nodeuser server.js database-setup.js vite.config.js ./
COPY --chown=nodeuser:nodeuser dist ./dist
COPY --chown=nodeuser:nodeuser database.db ./database.db

# Note: Database is pre-built to avoid sqlite3 compilation issues in Docker

# Make database file read-only for security (prevents DROP TABLE attacks)  
RUN chmod 444 database.db

# Create a directory for logs (if needed) with proper permissions
RUN mkdir -p /usr/src/app/logs

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