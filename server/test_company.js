"// Growth OS - Automated Company Settings Integration Test Suite
const axios = require('axios');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4460'; // Use a distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - COMPANY SETTINGS INTEGRATION TEST       ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

// Wait 3 seconds for the MongoDB Atlas database connection to establish fully
console.log('\
Booting test server instance on port 4460...');
console.log('Establishing MongoDB Atlas connection channel...');

setTimeout(async () => {
  const baseURL = 'http://localhost:4460/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Company Tester',
    email: `company_test_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Original Company ${uniqueId}`
  };

  const updatedCompanyData = {
    companyName: `Updated SaaS Corp ${uniqueId}`,
    website: 'https://saascorp.io',
    industry: 'B2B SaaS',
    productDescription: 'An advanced AI-powered marketing engine and automation system.',
    targetAudience: 'Chief Marketing Officers and growth teams.',
    brandVoice: 'Professional, forward-thinking, and highly technical.',
    competitors: ['Acme Marketing', 'Bolt Automations', 'GrowthFlow'],
    logo: 'https://saascorp.io/assets/logo.png'
  };

  let authToken = null;
  let companyId = null;

  try {
    // ----------------------------------------------------
    // Test 1: User Registration (Automatic Company Onboarding)
    // ----------------------------------------------------
    console.log(`\
[TEST 1] Registering User & Onboarding Company Profile...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && r
<truncated 4490 bytes>