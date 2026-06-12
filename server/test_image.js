"// Growth OS - Automated Image Engine Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4500'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - AI IMAGE ENGINE TEST                   ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\
Booting test server instance on port 4500...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Image Engine tests...\
');
    await runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4500/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Image Creator',
    email: `test_image_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Image Creative Corp ${uniqueId}`
  };

  let authToken = null;
  let companyId = null;
  let personaId = null;
  let campaignId = null;
  let blogId = null;
  let generatedImageId = null;

  try {
    // ----------------------------------------------------
    // Test 1: Register User & Establish Company Profile
    // ----------------------------------------------------
    console.log(`[TEST 1] Registering New User: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      authToken = registerRes.data.token;
      companyId = registerRes.data.user.companyId;
      console.l
<truncated 7849 bytes>