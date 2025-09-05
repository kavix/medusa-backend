const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CTF_FLAG = process.env.CTF_FLAG || 'Medusa{CTF_CHALLENGE_PHASE1_PASSED}';

// Disable X-Powered-By header for security
app.disable('x-powered-by');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// Database connection
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// VULNERABLE LOGIN ENDPOINT - INTENTIONALLY SUSCEPTIBLE TO SQL INJECTION
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials.'
        });
    }

    // VULNERABILITY: Direct string concatenation in SQL query
    // This is intentionally vulnerable to SQL injection
    const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";

    db.get(query, (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Check if a row was returned and if the username is 'admin'
        if (row && row.username === 'admin') {
            // Send flag as HTTP response header
            res.setHeader('X-CTF-Flag', CTF_FLAG);
            return res.json({
                success: true,
                message: 'Login successful! Check the response headers ASAP for more rewards.'
            });
        } else {
            // For any other case (no row, non-admin user, etc.)
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Vulnerable CTF server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
    console.log('');
    console.log('=== SQL INJECTION CHALLENGE ===');
    console.log('Goal: Login as "admin" user without knowing the password');
    console.log('');
    console.log('Hint: The username field might be vulnerable to SQL injection...');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});