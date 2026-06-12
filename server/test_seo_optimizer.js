// Growth OS - SEO Optimizer Service Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');
const Blog = require('./models/Blog');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4568'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('    GROWTH OS - SEO OPTIMIZER INTEGRATION TEST SUITE   ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4568...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching SEO Optimizer tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4568/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'SEO Specialist',
    email: `seo_specialist_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `SEO Growth Agency ${uniqueId}`
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
    // Test 2: Generate Initial Blog Post
    // ----------------------------------------------------
    console.log('\n[TEST 2] Generating Initial Blog Post via API...');
    const generateRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'email lead generation',
        targetAudience: 'B2B Sales Teams',
        tone: 'casual'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (generateRes.data && generateRes.data.success) {
      const blog = generateRes.data.data;
      blogId = blog._id;
      console.log('  -> SUCCESS: Blog generated successfully!');
      console.log('  -> Initial SEO Score:', blog.seoScore);
    } else {
      throw new Error('Direct Blog Generation endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 3: Manually Degrade Blog to Low Score (< 80)
    // ----------------------------------------------------
    console.log('\n[TEST 3] Updating Blog manually to degrade SEO quality (score < 80)...');
    const degradeRes = await axios.put(
      `${baseURL}/blogs/${blogId}`,
      {
        title: 'Email Leads',
        content: 'Short content about email leads. No keywords, no headings, no links, and no FAQs.',
        metaDescription: 'short meta info'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    let degradedScore = 0;
    if (degradeRes.data && degradeRes.data.success) {
      const blog = degradeRes.data.data;
      degradedScore = blog.seoScore;
      console.log('  -> SUCCESS: Blog degraded successfully.');
      console.log('  -> Degraded SEO Score:', degradedScore);
      console.log('  -> Version History Count:', blog.versions.length);
      
      if (degradedScore >= 80) {
        throw new Error('Failed to degrade SEO score below 80. Content must be lower quality.');
      }
    } else {
      throw new Error('Manually degrading blog post failed.');
    }

    // ----------------------------------------------------
    // Test 4: Trigger Auto-Optimization
    // ----------------------------------------------------
    console.log('\n[TEST 4] Triggering Auto-Optimization Endpoint (POST /api/blogs/:id/optimize)...');
    const optimizeRes = await axios.post(
      `${baseURL}/blogs/${blogId}/optimize`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    let optimizedScore = 0;
    if (optimizeRes.data && optimizeRes.data.success) {
      const result = optimizeRes.data;
      optimizedScore = result.newScore;
      console.log('  -> SUCCESS: Optimization endpoint responded successfully!');
      console.log('  -> Old Score returned:', result.oldScore);
      console.log('  -> New Score returned:', result.newScore);
      console.log('  -> Improvements Reported:', result.improvements);
      
      if (result.oldScore !== degradedScore) throw new Error('Returned oldScore does not match degraded score.');
      if (optimizedScore < 80) throw new Error(`Optimization failed to raise score above 80 (new score: ${optimizedScore}).`);
      if (!Array.isArray(result.improvements) || result.improvements.length === 0) {
        throw new Error('Improvements array is empty or not an array.');
      }
    } else {
      throw new Error('SEO Optimization endpoint returned error.');
    }

    // ----------------------------------------------------
    // Test 5: Verify Changes in MongoDB Persistence
    // ----------------------------------------------------
    console.log('\n[TEST 5] Verifying MongoDB Persistence and Version Increment...');
    const verifyRes = await axios.get(
      `${baseURL}/blogs/${blogId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (verifyRes.data && verifyRes.data.success) {
      const blog = verifyRes.data.data;
      console.log('  -> Title in DB:', blog.title);
      console.log('  -> Slug in DB:', blog.slug);
      console.log('  -> SEO Score in DB:', blog.seoScore);
      console.log('  -> Total Versions:', blog.versions.length);
      console.log('  -> Version History Counter Check:', blog.versions.map(v => v.version));

      // Validate database updates
      if (blog.seoScore !== optimizedScore) throw new Error('Database score does not match optimized response score.');
      const len = blog.versions.length;
      if (len < 3) throw new Error(`Expected at least 3 versions, but got ${len}`);
      if (blog.versions[len - 1].version !== len) throw new Error('Latest version index mismatch.');
      if (blog.versions[len - 1].title !== blog.title) throw new Error('Latest version title does not match optimized title.');
      
      // Ensure slug contains the slugified keyword
      if (!blog.slug.includes('email-lead-generation')) {
        console.warn('[WARNING] Optimized slug does not contain keyword. Slug:', blog.slug);
      }
      
      // Verify FAQ and links in the database checks
      const checks = blog.seoAnalysis.checks;
      console.log('  -> Persisted Checks:', checks);
      if (!checks.faqPresence) throw new Error('FAQ Presence check failed to pass after optimization.');
      if (!checks.keywordInTitle) throw new Error('Keyword In Title check failed after optimization.');
      if (!checks.keywordInH1) throw new Error('Keyword In H1 check failed after optimization.');
      if (checks.wordCount < 800) throw new Error(`Word count check failed after optimization: ${checks.wordCount}`);
    } else {
      throw new Error('Verifying blog persistence failed.');
    }

    // ----------------------------------------------------
    // Test 6: Verify Early Return for High Score (>= 80)
    // ----------------------------------------------------
    console.log('\n[TEST 6] Triggering Optimization again (Score is already >= 80)...');
    const optimizeAgainRes = await axios.post(
      `${baseURL}/blogs/${blogId}/optimize`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (optimizeAgainRes.data && optimizeAgainRes.data.success) {
      const result = optimizeAgainRes.data;
      console.log('  -> SUCCESS: Endpoint handled early exit successfully!');
      console.log('  -> Old Score:', result.oldScore);
      console.log('  -> New Score:', result.newScore);
      console.log('  -> Improvements Count:', result.improvements.length);
      console.log('  -> Message:', result.message);

      if (result.oldScore !== optimizedScore) throw new Error('Old score should match previous optimized score.');
      if (result.newScore !== optimizedScore) throw new Error('New score should match previous optimized score.');
      if (result.improvements.length !== 0) throw new Error('Improvements array should be empty.');
    } else {
      throw new Error('Second optimization run failed.');
    }

    console.log('\n======================================================');
    console.log('    ALL SEO OPTIMIZER TESTS PASSED: 100% NOMINAL       ');
    console.log('======================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n======================================================');
    console.error('    TEST FAILURE DETECTED                              ');
    console.error('======================================================');
    console.error('Error Details:', error.response?.data || error.message);
    console.log('======================================================\n');
    process.exit(1);
  }
}
