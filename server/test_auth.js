"// Growth OS - Automated JWT Auth Integration Test Suite
const axios = require('axios');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4450'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - JWT AUTHENTICATION INTEGRATION TEST   ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

// Wait 3 seconds for the MongoDB Atlas database connection to establish fully
console.log('\
Booting test server instance on port 4450...');
console.log('Establishing MongoDB Atlas connection channel...');

setTimeout(async () => {
  const baseURL = 'http://localhost:4450/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Automation Tester',
    email: `test_auth_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Test Corp ${uniqueId}`
  };

  let authToken = null;

  try {
    // ----------------------------------------------------
    // Test 1: API Health Check
    // ----------------------------------------------------
    console.log('\
[TEST 1] Verifying System Health Router...');
    const healthRes = await axios.get(`${baseURL}/health`);
    if (healthRes.data && healthRes.data.success) {
      console.log('  -> SUCCESS: API Health is nominal.');
    } else {
      throw new Error('Health check returned nominal status error.');
    }

    // ----------------------------------------------------
    // Test 2: User & Company Registration
    // ----------------------------------------------------
    console.log(`\
[TEST 2] Registering New User: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      authToken = registerRes.data.token;
      console.log(
<truncated 4126 bytes>