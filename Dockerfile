# Use official Node.js runtime as base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Create a non-root user
RUN addgroup -g 1001 -S nodeuser && \
    adduser -S -D -H -u 1001 -s /sbin/nologin nodeuser

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Build React frontend
RUN npm run build

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