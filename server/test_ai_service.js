"// Growth OS - Automated AIService Core Integration Test Suite
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4470'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - REUSABLE AI SERVICE INTEGRATION TEST   ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');
const aiService = require('./services/aiService');

console.log('\
Booting test server instance on port 4470...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching AI Service tests...\
');
    await runTests();
  }
}, 200);

async function runTests() {
  const mockCompany = {
    companyName: 'Veloce AI',
    industry: 'DevOps & Infrastructure Software',
    productDescription: 'An automated container scaling console for cloud engineers.',
    brandVoice: 'Pragmatic, Technical, Concise',
    competitors: ['Kubernetes Standard', 'AWS ECS', 'Heroku Platform'],
    targetAudience: 'Cloud Engineers, CTOs, Tech Leads'
  };

  const mockPersona = {
    personaName: 'Cloud Infrastructure Architects',
    tone: 'Analytic, Helpful, Actionable',
    writingStyle: 'Direct, Data-driven',
    audienceType: 'Principal Engineers, Site Reliability Engineers (SREs)'
  };

  const mockCampaign = {
    topic: 'Automated Container Cluster Optimizations in 2026',
    goal: 'Demonstrate 60% server compute cost reductions and drive 40 demo downloads.',
    keywords: ['Container Scaling', 'DevOps Automations', 'ECS optimizations']
  };

  const mockKnowledge = '[Refer
<truncated 4555 bytes>