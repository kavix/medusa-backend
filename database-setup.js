const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Create database file
const db = new sqlite3.Database('database.db');

console.log('Setting up database...');

// Create users table
db.serialize(() => {
    // Drop table if exists (for clean setup)
    db.run("DROP TABLE IF EXISTS users");

    // Create users table
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    // Generate a very long and random password for admin
    const adminPassword = crypto.randomBytes(32).toString('hex');

    // Insert users
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");

    // Admin user with complex password
    stmt.run("admin", adminPassword);

    // Guest user with simple password
    stmt.run("guest", "guest");

    stmt.finalize();

    console.log('Database setup completed!');
    console.log('Users created:');
    console.log('- admin (password: ' + adminPassword + ')');
    console.log('- guest (password: guest)');
    console.log('');
    console.log('SQL Injection Challenge: Try to login as admin without knowing the password!');
    console.log('Hint: Try using SQL injection in the username field...');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});