"// Growth OS - Automated Platform Renderer Engine Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4490'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - PLATFORM RENDERER ENGINE TEST          ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');
const PlatformConfig = require('./models/PlatformConfig');

console.log('\
Booting test server instance on port 4490...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Renderer Engine tests in 1s...\
');
    setTimeout(runTests, 1000); // Wait 1s for the startup platform seeder to run!
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4490/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Renderer Operator',
    email: `test_render_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Renderer Corp ${uniqueId}`
  };

  let authToken = null;
  let companyId = null;
  let personaId = null;
  let campaignId = null;
  let blogId = null;
  let renderedId = null;

  try {
    // ----------------------------------------------------
    // Verify platforms configurations seeding success
    // ----------------------------------------------------
    console.log('[VERIFY SEED] Sourcing PlatformConfig count in database...');
    const configCount = await PlatformConfig.countDocuments();
    console.log(`  -> Sourced Configs Count: ${con
<truncated 7681 bytes>