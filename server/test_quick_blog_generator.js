// Growth OS - Quick Blog Generator Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4569'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('  GROWTH OS - QUICK BLOG GENERATOR INTEGRATION TEST   ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4569...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Quick Blog Generator tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4569/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Quick Writer',
    email: `quick_writer_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Quick Press ${uniqueId}`
  };

  let authToken = null;
  let blogId = null;

  try {
    // ----------------------------------------------------
    // Test 1: Register User & Establish Company Profile
    // ----------------------------------------------------
    console.log(`[TEST 1] Registering New User: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      authToken = registerRes.data.token;
      console.log('  -> SUCCESS: Account registered and company context set.');
    } else {
      throw new Error('Registration endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 2: Generate Blog Post via Quick Blog Pipeline
    // ----------------------------------------------------
    console.log('\n[TEST 2] Generating Quick Blog (Keyword -> Brief -> Content -> Analyzer -> Optimizer)...');
    const generateRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'local seo optimization',
        targetAudience: 'Local Shop Owners',
        tone: 'casual'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (generateRes.data && generateRes.data.success) {
      const blog = generateRes.data.data;
      blogId = blog._id;
      console.log('  -> SUCCESS: Quick Blog generated successfully!');
      console.log('  -> Generated Title:', blog.title);
      console.log('  -> Slug generated:', blog.slug);
      console.log('  -> Final SEO Score:', blog.seoScore);
      console.log('  -> Target Audience stored:', blog.targetAudience);
      console.log('  -> Tone stored:', blog.tone);
      console.log('  -> Version History Count:', blog.versions.length);
      
      // Basic schema checks
      if (blog.keyword !== 'local seo optimization') throw new Error('Incorrect keyword value stored.');
      if (blog.tone !== 'casual') throw new Error('Incorrect tone value stored.');
      if (blog.targetAudience !== 'Local Shop Owners') throw new Error('Incorrect targetAudience value stored.');
      if (!blog.slug) throw new Error('Slug was not generated.');
      if (blog.seoScore === undefined || blog.seoScore === null) throw new Error('SEO score is missing.');
      if (blog.seoScore < 80) throw new Error(`Expected score >= 80, but got ${blog.seoScore}`);
      
      // Check version history sequence
      if (blog.versions.length === 2) {
        console.log('  -> Verified: Auto-optimization ran in the backend and created Version 2!');
        if (blog.versions[0].version !== 1) throw new Error('Initial version number should be 1.');
        if (blog.versions[1].version !== 2) throw new Error('Optimized version number should be 2.');
      } else if (blog.versions.length === 1) {
        console.log('  -> Verified: Initial draft met SEO criteria >= 80, no auto-optimization was needed.');
        if (blog.versions[0].version !== 1) throw new Error('Initial version number should be 1.');
      } else {
        throw new Error(`Unexpected versions count: ${blog.versions.length}`);
      }

      // Check checklist and recommendations
      const seo = blog.seoAnalysis;
      if (!seo || !seo.checks) throw new Error('seoAnalysis or checks field is missing.');
      console.log(`  -> Audit Checks: TitleOK=${seo.checks.keywordInTitle}, H1OK=${seo.checks.keywordInH1}, FAQOK=${seo.checks.faqPresence}, WordCount=${seo.checks.wordCount}`);
    } else {
      throw new Error('Quick Blog Generation endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 3: Verify Draft Fetching
    // ----------------------------------------------------
    console.log('\n[TEST 3] Querying generated draft by unique ID...');
    const getRes = await axios.get(
      `${baseURL}/blogs/${blogId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (getRes.data && getRes.data.success) {
      const blog = getRes.data.data;
      if (blog.status !== 'draft') throw new Error('Generated post should default to "draft" status.');
      console.log('  -> SUCCESS: Draft verified in MongoDB with status: "draft".');
    } else {
      throw new Error('Fetching blog by ID failed.');
    }

    console.log('\n======================================================');
    console.log('  QUICK BLOG GENERATOR TESTS PASSED: 100% NOMINAL    ');
    console.log('======================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n======================================================');
    console.error('   TEST FAILURE DETECTED                              ');
    console.error('======================================================');
    console.error('Error Details:', error.response?.data || error.message);
    console.log('======================================================\n');
    process.exit(1);
  }
}
