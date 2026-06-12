// Growth OS - SEO Brief Engine & Pipeline Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4482'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - SEO BRIEF ENGINE TEST SUITE            ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4482...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching SEO Brief Engine tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4482/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'SEO Specialist',
    email: `seo_spec_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `SEO Content Agency ${uniqueId}`
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
    // Test 2: Generate SEO Brief via API
    // ----------------------------------------------------
    console.log('\n[TEST 2] Generating SEO Brief via POST /api/seo/brief...');
    const briefRes = await axios.post(
      `${baseURL}/seo/brief`,
      { keyword: 'AWS EKS Autoscaling' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (briefRes.data && briefRes.data.success) {
      const brief = briefRes.data.data;
      console.log('  -> SUCCESS: SEO Brief generated successfully!');
      console.log('  -> Primary Keyword:', brief.primaryKeyword);
      console.log('  -> Search Intent:', brief.searchIntent);
      console.log('  -> Suggested H1:', brief.h1Suggestion);
      console.log('  -> Suggested H2 Structure:', brief.h2Suggestions.join(' | '));
      console.log('  -> Semantic Keywords:', brief.semanticKeywords.join(', '));
      console.log('  -> Recommended Word Count:', brief.recommendedWordCount);

      // Verify schema attributes
      if (brief.primaryKeyword !== 'AWS EKS Autoscaling') throw new Error('Incorrect primaryKeyword value.');
      if (!brief.searchIntent) throw new Error('Search intent is missing.');
      if (!brief.h1Suggestion) throw new Error('H1 suggestion is missing.');
      if (!Array.isArray(brief.h2Suggestions) || brief.h2Suggestions.length === 0) throw new Error('H2 structure suggestions are missing.');
      if (!Array.isArray(brief.semanticKeywords) || brief.semanticKeywords.length === 0) throw new Error('Semantic keywords are missing.');
      if (!brief.recommendedWordCount) throw new Error('Recommended word count is missing.');
    } else {
      throw new Error('POST /api/seo/brief endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 3: Generate Blog and Verify SEO Brief Storage
    // ----------------------------------------------------
    console.log('\n[TEST 3] Generating Direct Blog to verify SEO Brief storage in CanonicalBlog document...');
    const generateRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'AWS EKS Autoscaling',
        targetAudience: 'Cloud Architects',
        tone: 'formal'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (generateRes.data && generateRes.data.success) {
      const blog = generateRes.data.data;
      blogId = blog._id;
      console.log('  -> SUCCESS: Blog generated successfully!');
      console.log('  -> Generated Title:', blog.title);
      console.log('  -> SEO Score:', blog.seoScore);

      // Verify seoBrief is stored inside MongoDB blog document
      const brief = blog.seoBrief;
      if (!brief) throw new Error('seoBrief field is missing from the stored Blog document.');
      console.log('  -> Verified: seoBrief is stored in Blog collection.');
      console.log('  -> Stored Brief Primary Keyword:', brief.primaryKeyword);
      console.log('  -> Stored Brief Suggested H1:', brief.h1Suggestion);

      if (brief.primaryKeyword !== 'AWS EKS Autoscaling') throw new Error('Incorrect stored brief primary keyword.');
      if (!brief.h1Suggestion) throw new Error('Incorrect stored brief H1 suggestion.');
    } else {
      throw new Error('Generate Blog with SEO Brief flow failed.');
    }

    console.log('\n======================================================');
    console.log('   ALL SEO BRIEF INTEGRATION TESTS PASSED: 100% NOMINAL');
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
