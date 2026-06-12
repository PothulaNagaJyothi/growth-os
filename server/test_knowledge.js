"// Growth OS - Automated Knowledge Base Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4490'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - KNOWLEDGE BASE INTEGRATION TEST       ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\
Booting test server instance on port 4490...');
console.log('Establishing MongoDB Atlas connection channel...');

// Resilient database connection wait wrapper
const checkConnectionInterval = setInterval(() => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(checkConnectionInterval);
    console.log('\
  -> Sourced active Mongoose connection. Commencing test suite...\
');
    runTestSuite();
  }
}, 200);

// Timeout safety fallback (fail after 15 seconds of waiting)
setTimeout(() => {
  if (mongoose.connection.readyState !== 1) {
    clearInterval(checkConnectionInterval);
    console.error('\
[FATAL] MongoDB Atlas connection timed out in test suite.');
    process.exit(1);
  }
}, 15000);

async function runTestSuite() {
  const baseURL = 'http://localhost:4490/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Knowledge Tester',
    email: `knowledge_test_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Knowledge Corp ${uniqueId}`
  };

  const testFileContent = 'Growth OS core system specs: Node.js Express server + React JS frontend, grounded Context uploads via Cloudinary, and Azure OpenAI chat completions engine.';
  const testFileName = `test_grounding_${uniqueId}.txt`;

  let authToken = null;
  let documentId = null;

  try {
    // ----------------------------------------------------

<truncated 5626 bytes>