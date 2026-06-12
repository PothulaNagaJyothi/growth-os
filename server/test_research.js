"// Growth OS - Automated Aligned Research Engine Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4460'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - AI RESEARCH ENGINE INTEGRATION TEST    ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\
Booting test server instance on port 4460...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching integration tests...\
');
    await runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4460/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Research Aligned Tester',
    email: `test_research_align_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Research Align Corp ${uniqueId}`
  };

  let authToken = null;
  let companyId = null;
  let personaId = null;
  let campaignId = null;
  let researchRecord = null;

  try {
    // ----------------------------------------------------
    // Test 1: Register User & Establish Company Profile
    // ----------------------------------------------------
    console.log(`[TEST 1] Registering New User: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      authToken = registerRes.data.token;
      companyId = registerRes.data.user.companyId;
      cons
<truncated 6665 bytes>