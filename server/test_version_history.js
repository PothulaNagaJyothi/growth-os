// Growth OS - Version History System Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4570'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('  GROWTH OS - VERSION HISTORY INTEGRATION TEST        ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4570...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Version History tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4570/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Version Manager',
    email: `version_manager_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Version Logs Inc ${uniqueId}`
  };

  let authToken = null;
  let blogId = null;
  let version1Data = null;
  let version2Data = null;

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
    // Test 2: Generate Blog Post (Initial State)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Generating Initial Blog Post...');
    const generateRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'inbound marketing tactics',
        targetAudience: 'Growth Marketers',
        tone: 'formal'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (generateRes.data && generateRes.data.success) {
      const blog = generateRes.data.data;
      blogId = blog._id;
      console.log('  -> SUCCESS: Blog generated successfully!');
      console.log('  -> Initial versions count:', blog.versions.length);
      
      // Store initial version data for comparison
      version1Data = blog.versions[0];
      console.log('  -> Version 1 details: Title =', version1Data.title);
      console.log('  -> Version 1 details: MetaDescription =', version1Data.metaDescription);
      console.log('  -> Version 1 details: SEOScore =', version1Data.seoScore);

      // Verify versions schema properties
      if (version1Data.version !== 1) throw new Error('First version index must be 1');
      if (version1Data.seoScore === undefined || version1Data.seoScore === null) {
        throw new Error('seoScore must be set in version history');
      }
      if (version1Data.metaDescription === undefined || version1Data.metaDescription === null) {
        throw new Error('metaDescription must be set in version history');
      }
    } else {
      throw new Error('Blog generation failed.');
    }

    // ----------------------------------------------------
    // Test 3: Manually Update Blog Post (Creates new version)
    // ----------------------------------------------------
    console.log('\n[TEST 3] Manually updating content (PUT /api/blogs/:id)...');
    const updateRes = await axios.put(
      `${baseURL}/blogs/${blogId}`,
      {
        title: 'Updated Inbound Marketing Tactics for SaaS Scaling',
        metaDescription: 'A newly updated comprehensive guide covering search intent and content funnels.',
        content: 'This is completely new content that contains inbound marketing tactics to scale your organic growth channels. Check out the FAQs and conclusion.'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (updateRes.data && updateRes.data.success) {
      const blog = updateRes.data.data;
      console.log('  -> SUCCESS: Blog manually updated.');
      console.log('  -> Updated versions count:', blog.versions.length);
      
      // Find the last version
      const latestVer = blog.versions[blog.versions.length - 1];
      version2Data = latestVer;
      console.log('  -> New version details: Version =', latestVer.version);
      console.log('  -> New version details: Title =', latestVer.title);
      console.log('  -> New version details: SEO Score =', latestVer.seoScore);

      if (latestVer.title !== 'Updated Inbound Marketing Tactics for SaaS Scaling') {
        throw new Error('Title was not updated correctly in version history');
      }
    } else {
      throw new Error('Blog update endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 4: Retrieve Versions List (GET /api/blogs/:id/versions)
    // ----------------------------------------------------
    console.log('\n[TEST 4] Retrieving versions list (GET /api/blogs/:id/versions)...');
    const versionsRes = await axios.get(
      `${baseURL}/blogs/${blogId}/versions`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (versionsRes.data && versionsRes.data.success) {
      const versionsList = versionsRes.data.data;
      console.log('  -> SUCCESS: Retrieved versions array.');
      console.log('  -> Number of versions fetched:', versionsList.length);

      // Verify listing properties
      if (versionsList.length < 2) throw new Error('Expected at least 2 versions in history.');
      const first = versionsList[0];
      if (first.version !== 1) throw new Error('First item version index mismatch.');
      if (!first.title || !first.content || first.seoScore === undefined) {
        throw new Error('Version properties are incomplete.');
      }
    } else {
      throw new Error('Versions fetch endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 5: Restore Blog to Version 1 (POST /api/blogs/:id/restore/:version)
    // ----------------------------------------------------
    console.log('\n[TEST 5] Restoring blog to Version 1 (POST /api/blogs/:id/restore/1)...');
    const restoreRes = await axios.post(
      `${baseURL}/blogs/${blogId}/restore/1`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (restoreRes.data && restoreRes.data.success) {
      const restoredBlog = restoreRes.data.data;
      console.log('  -> SUCCESS: Restore request returned success.');
      console.log('  -> Restored Title:', restoredBlog.title);
      console.log('  -> Restored MetaDescription:', restoredBlog.metaDescription);
      console.log('  -> Restored SEO Score:', restoredBlog.seoScore);
      console.log('  -> Regenerated Slug:', restoredBlog.slug);
      console.log('  -> Post-restore versions count:', restoredBlog.versions.length);

      // Assertions: content has been restored to Version 1 state
      if (restoredBlog.title !== version1Data.title) {
        throw new Error(`Expected title "${version1Data.title}", but got "${restoredBlog.title}"`);
      }
      if (restoredBlog.metaDescription !== version1Data.metaDescription) {
        throw new Error(`Expected meta description "${version1Data.metaDescription}", but got "${restoredBlog.metaDescription}"`);
      }
      if (restoredBlog.content !== version1Data.content) {
        throw new Error('Content does not match Version 1 content');
      }

      // Assertions: slug has been regenerated
      const expectedSlug = version1Data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (restoredBlog.slug !== expectedSlug) {
        throw new Error(`Expected slug "${expectedSlug}", but got "${restoredBlog.slug}"`);
      }

      // Assertions: a new version has been appended to versions list
      const lastVersionIndex = restoredBlog.versions.length;
      const latestVer = restoredBlog.versions[lastVersionIndex - 1];
      console.log('  -> Appended new version index:', latestVer.version);
      
      if (latestVer.version !== lastVersionIndex) {
        throw new Error(`Expected last version number to be ${lastVersionIndex}, but got ${latestVer.version}`);
      }
      if (latestVer.title !== version1Data.title) {
        throw new Error('Appended version data title does not match restored title');
      }
    } else {
      throw new Error('Restore endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 6: Verify current database document
    // ----------------------------------------------------
    console.log('\n[TEST 6] Querying current blog state from DB to double check consistency...');
    const verifyRes = await axios.get(
      `${baseURL}/blogs/${blogId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (verifyRes.data && verifyRes.data.success) {
      const blog = verifyRes.data.data;
      console.log('  -> Database Title:', blog.title);
      console.log('  -> Database Version History Count:', blog.versions.length);
      
      if (blog.title !== version1Data.title) {
        throw new Error('Database title does not reflect restored title.');
      }
      console.log('  -> SUCCESS: Database state is completely consistent.');
    } else {
      throw new Error('Verification query failed.');
    }

    console.log('\n======================================================');
    console.log('  VERSION HISTORY TESTS PASSED: 100% NOMINAL         ');
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
