// Growth OS - SEO Optimizer Loop Verification Test
const axios = require('axios');
const mongoose = require('mongoose');
const Blog = require('./models/Blog');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4569'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('    GROWTH OS - SEO OPTIMIZER LOOP TEST SUITE         ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4569...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching SEO Optimizer loop tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4569/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'SEO Optimizer Tester',
    email: `seo_loop_tester_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `SEO Loop Agency ${uniqueId}`
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
        keyword: 'conversion rate optimization',
        targetAudience: 'E-commerce Owners',
        tone: 'educational'
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
        title: 'Conversion Tips',
        content: 'Brief tips about conversion. No keywords, no headings, no links, and no FAQs.',
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
      
      if (degradedScore >= 80) {
        throw new Error('Failed to degrade SEO score below 80. Content must be lower quality.');
      }
    } else {
      throw new Error('Manually degrading blog post failed.');
    }

    // ----------------------------------------------------
    // Test 4: Trigger Auto-Optimization & Verify Iterations
    // ----------------------------------------------------
    console.log('\n[TEST 4] Triggering Auto-Optimization Loop (POST /api/blogs/:id/optimize)...');
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
    } else {
      throw new Error('SEO Optimization endpoint returned error.');
    }

    // ----------------------------------------------------
    // Test 5: Verify MongoDB Persistence & Optimization History
    // ----------------------------------------------------
    console.log('\n[TEST 5] Verifying MongoDB Persistence and Optimization History Record...');
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
      console.log('  -> Optimization History Count:', blog.optimizationHistory.length);
      console.log('  -> Optimization History Entries:', JSON.stringify(blog.optimizationHistory, null, 2));

      // Validate database updates
      if (blog.seoScore !== optimizedScore) throw new Error('Database score does not match optimized response score.');
      if (!blog.optimizationHistory || blog.optimizationHistory.length === 0) {
        throw new Error('Expected optimizationHistory array to contain entries, but it was empty.');
      }
      
      // Verify first attempt structure
      const firstEntry = blog.optimizationHistory[0];
      if (firstEntry.attempt === undefined) throw new Error('History entry missing attempt number');
      if (firstEntry.oldScore === undefined) throw new Error('History entry missing oldScore');
      if (firstEntry.newScore === undefined) throw new Error('History entry missing newScore');
      if (!Array.isArray(firstEntry.improvements)) throw new Error('History entry missing improvements array');
      
      console.log('  -> Database optimization history verification passed.');
    } else {
      throw new Error('Verifying blog persistence failed.');
    }

    console.log('\n======================================================');
    console.log('    ALL SEO OPTIMIZER LOOP TESTS PASSED: 100% NOMINAL  ');
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
