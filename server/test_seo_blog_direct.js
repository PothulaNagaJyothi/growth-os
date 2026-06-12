// Growth OS - SEO & Direct Keyword Blog Generator Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4481'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - SEO DIRECT BLOG ENGINE TEST SUITE      ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4481...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Direct Blog Engine tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4481/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'SEO Manager',
    email: `seo_manager_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `SEO Content Lab ${uniqueId}`
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
    // Test 2: Generate Direct Blog via Keyword Input
    // ----------------------------------------------------
    console.log('\n[TEST 2] Generating Direct Blog via Keyword, Audience & Tone...');
    const generateRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'Kubernetes autoscaling',
        targetAudience: 'Infrastructure Engineers',
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
      console.log('  -> Generated Title:', blog.title);
      console.log('  -> Generated Slug:', blog.slug);
      console.log('  -> SEO Score:', blog.seoScore);
      console.log('  -> Tone stored:', blog.tone);
      console.log('  -> Target Audience stored:', blog.targetAudience);
      
      // Verify schema attributes
      if (blog.keyword !== 'Kubernetes autoscaling') throw new Error('Incorrect keyword value stored.');
      if (blog.tone !== 'casual') throw new Error('Incorrect tone value stored.');
      if (blog.targetAudience !== 'Infrastructure Engineers') throw new Error('Incorrect targetAudience value stored.');
      if (!blog.slug) throw new Error('Slug was not generated.');
      if (blog.seoScore === undefined || blog.seoScore === null) throw new Error('SEO score is missing.');
      
      // Verify SEO analysis structure
      const seo = blog.seoAnalysis;
      if (!seo) throw new Error('seoAnalysis field is missing.');
      console.log(`  -> SEO Details: Score=${seo.score}, Readability=${seo.readabilityScore}, Density=${seo.keywordDensity}%, RecommendationsCount=${seo.recommendations.length}`);
      
      if (seo.score === undefined) throw new Error('seoAnalysis.score is missing.');
      if (seo.readabilityScore === undefined) throw new Error('seoAnalysis.readabilityScore is missing.');
      if (seo.keywordDensity === undefined) throw new Error('seoAnalysis.keywordDensity is missing.');
      if (seo.titleScore === undefined) throw new Error('seoAnalysis.titleScore is missing.');
      if (seo.metaScore === undefined) throw new Error('seoAnalysis.metaScore is missing.');
      if (seo.headingScore === undefined) throw new Error('seoAnalysis.headingScore is missing.');
      if (!Array.isArray(seo.recommendations)) throw new Error('seoAnalysis.recommendations is not an array.');

      // Verify versions array
      if (!blog.versions || blog.versions.length !== 1) throw new Error('Versions array should contain exactly 1 entry on initial save.');
      if (blog.versions[0].version !== 1) throw new Error('Initial version number should be 1.');
      console.log('  -> Version History check passed: Version 1 seeded successfully.');
    } else {
      throw new Error('Direct Blog Generation endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 3: Update Blog content and check Versioning
    // ----------------------------------------------------
    console.log('\n[TEST 3] Updating Blog to Trigger Version 2 & Recalculate SEO...');
    const updatedTitle = 'Mastering Kubernetes autoscaling: A Step-by-Step Production Guide';
    const updatedContent = `# Mastering Kubernetes autoscaling: A Step-by-Step Production Guide

In this guide, we dive deep into the mechanics of **Kubernetes autoscaling** in cloud clusters. Understanding resource utilization metrics ensures cost efficiency and peak application stability.

## 1. Setting Up Horizontal Pod Autoscaler

Managing resources starts with configuring limits:
- Core CPU limits
- Core Memory parameters

We target **Infrastructure Engineers** who require a **casual** but technical workflow.

## 2. Advanced Custom Metrics Exporters

Using Prometheus and Custom Metric APIs, we can query request queues directly. By establishing custom thresholds, we prevent latency and scale dynamically before clusters saturate.

- Custom scrape targets configuration.
- Autoscaling threshold adjustments.`;

    const updateRes = await axios.put(
      `${baseURL}/blogs/${blogId}`,
      {
        title: updatedTitle,
        content: updatedContent,
        metaDescription: 'An optimized guide to Kubernetes autoscaling using custom Prometheus metrics.'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (updateRes.data && updateRes.data.success) {
      const blog = updateRes.data.data;
      console.log('  -> SUCCESS: Blog updated successfully!');
      console.log('  -> Updated Title:', blog.title);
      console.log('  -> Updated Slug:', blog.slug);
      console.log('  -> Recalculated SEO Score:', blog.seoScore);
      console.log('  -> Number of Versions:', blog.versions.length);

      // Verify version increment
      if (blog.versions.length !== 2) throw new Error('Versions array should now contain exactly 2 entries.');
      if (blog.versions[1].version !== 2) throw new Error('Updated version number should be 2.');
      if (blog.versions[1].title !== updatedTitle) throw new Error('Version 2 title does not match updated title.');
      
      // Verify slug update
      if (!blog.slug.startsWith('mastering-kubernetes-autoscaling')) throw new Error('Slug did not update to reflect new title.');
      console.log('  -> Slug and Version 2 validation passed.');
    } else {
      throw new Error('Update Blog endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 4: Adapt Direct Blog to platform-specific post (LinkedIn)
    // ----------------------------------------------------
    console.log('\n[TEST 4] Adapting Direct Blog for LinkedIn (Platform Renderer Compatibility)...');
    const renderRes = await axios.post(
      `${baseURL}/render/LinkedIn`,
      { blogId },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (renderRes.data && renderRes.data.success) {
      console.log('  -> SUCCESS: Direct blog successfully adapted for LinkedIn!');
      console.log('  -> Sourced Hook Title:', renderRes.data.data.title);
    } else {
      throw new Error('Platform rendering for direct blog failed.');
    }

    console.log('\n======================================================');
    console.log('   ALL INTEGRATION TESTS PASSED: 100% NOMINAL          ');
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
