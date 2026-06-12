"// Growth OS - Automated Persona CRUD Integration Test Suite
const axios = require('axios');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4470'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - PERSONA CRUD INTEGRATION TEST          ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

// Wait 3 seconds for the MongoDB Atlas database connection to establish fully
console.log('\
Booting test server instance on port 4470...');
console.log('Establishing MongoDB Atlas connection channel...');

setTimeout(async () => {
  const baseURL = 'http://localhost:4470/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Persona Tester',
    email: `persona_test_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Persona Corp ${uniqueId}`
  };

  const initialPersona = {
    personaName: 'Thought Leader',
    tone: 'Professional & Visionary',
    writingStyle: 'Founder-focused',
    audienceType: 'SaaS Founders',
    description: 'A persona that speaks authoritatively on SaaS metrics and funding rounds.'
  };

  const updatedPersona = {
    personaName: 'Thought Leader (Refined)',
    tone: 'Sarcastic & Engaging',
    writingStyle: 'Storytelling',
    audienceType: 'Tech Engineers',
    description: 'An updated persona designed for sharing memes and deep-dives on technical debts.'
  };

  let authToken = null;
  let personaId = null;

  try {
    // ----------------------------------------------------
    // Test 1: User Registration
    // ----------------------------------------------------
    console.log(`\
[TEST 1] Registering User & Establishing Authentication Context...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
 
<truncated 5898 bytes>