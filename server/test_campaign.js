"// Growth OS - Automated Campaign CRUD Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4480'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - CAMPAIGN CRUD INTEGRATION TEST         ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\
Booting test server instance on port 4480...');
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
  const baseURL = 'http://localhost:4480/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Campaign Tester',
    email: `campaign_test_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Campaign Corp ${uniqueId}`
  };

  const testPersona = {
    personaName: 'Technical Founder',
    tone: 'Authoritative & Pragmatic',
    writingStyle: 'Code-heavy & Deep-dive',
    audienceType: 'Software Architects',
    description: 'A persona addressing low-level optimization and server scalability topics.'
  };

  const initialCampaign = {
    campaignName: 'Q3 Enterprise Scale API',
   
<truncated 8959 bytes>