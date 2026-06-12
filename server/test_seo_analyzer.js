// Growth OS - SEO Analyzer Service Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');
const seoAnalyzer = require('./services/seo-engine/seoAnalyzer');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4567'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('    GROWTH OS - SEO ANALYZER INTEGRATION TEST SUITE   ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4567...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching SEO Analyzer tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4567/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'SEO Analyst',
    email: `seo_analyst_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `SEO Testing Corp ${uniqueId}`
  };

  let authToken = null;
  let blogId = null;

  try {
    // ----------------------------------------------------
    // Test 1: Direct Unit Test on SEO Analyzer
    // ----------------------------------------------------
    console.log('[TEST 1] Running Direct Unit Tests on SEO Analyzer...');
    
    // Create an ideal SEO text (should get score 100)
    const idealTitle = 'How to Use Kubernetes Autoscaling in Production';
    const idealMeta = 'Learn how to configure Kubernetes autoscaling to manage traffic spikes efficiently in cloud clusters.';
    const idealSlug = 'how-to-use-kubernetes-autoscaling-in-production';
    
    let repeatedBody = '';
    for (let i = 0; i < 28; i++) {
      repeatedBody += `\n\nParagraph ${i}: In this section, we discuss how Kubernetes autoscaling helps us manage resources. Modern DevOps environments demand scalable systems. We need to deploy metrics-server to track resource metrics like memory usage and cpu usage. `;
    }

    const idealContent = `# How to Use Kubernetes Autoscaling in Production

In this article, we will explain how to use Kubernetes autoscaling to optimize resource utilization. Knowing when and how to scale your applications automatically ensures that you only pay for what you need while keeping your services stable.
${repeatedBody}

## 1. Understanding Kubernetes Autoscaling

Setting up scaling is crucial for modern infrastructure.
Here are the core components:
- Horizontal Pod Autoscaler (HPA)
- Vertical Pod Autoscaler (VPA)
- Cluster Autoscaler

## 2. Setting Up HPA

We will walk through the configuration of HPA using resource limits.
Make sure you monitor your cluster performance regularly.

### 2.1 Custom Prometheus Metrics

You can also leverage custom metrics to scale based on traffic or message queues. This is crucial for microservices.

### FAQ
- What is Kubernetes autoscaling? It is the process of scaling resources automatically.
- How do I set it up? Read this guide.

### Conclusion
To sum up, Kubernetes autoscaling helps minimize resource overhead.

For more details, visit our [internal dashboard](/dashboard) or check the [official docs](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/).

![Kubernetes Scaling Diagram](https://kubernetes.io/images/hpa-diagram.png)
`;

    const result = seoAnalyzer.analyze(idealTitle, idealContent, idealMeta, 'Kubernetes autoscaling', idealSlug);
    
    console.log(`  -> Standalone SEO Score: ${result.seoScore}/100`);
    console.log('  -> Checks:', result.checks);
    console.log('  -> Recommendations Count:', result.recommendations.length);

    // Verify checks
    if (result.seoScore !== 100) {
      console.warn(`[WARNING] Ideal text score is ${result.seoScore}/100. Recommendations:`, result.recommendations);
      throw new Error(`Expected score 100, but got ${result.seoScore}`);
    }
    if (!result.checks.keywordInTitle) throw new Error('keywordInTitle check failed');
    if (!result.checks.keywordInMetaDescription) throw new Error('keywordInMetaDescription check failed');
    if (!result.checks.keywordInFirstParagraph) throw new Error('keywordInFirstParagraph check failed');
    if (!result.checks.keywordInH1) throw new Error('keywordInH1 check failed');
    if (!result.checks.keywordInSlug) throw new Error('keywordInSlug check failed');
    if (result.checks.wordCount < 800 || result.checks.wordCount > 1200) throw new Error('wordCount check failed');
    if (result.checks.h2Count !== 2) throw new Error('h2Count check failed');
    if (result.checks.h3Count !== 3) throw new Error('h3Count check failed');
    if (!result.checks.faqPresence) throw new Error('faqPresence check failed');
    if (!result.checks.conclusionPresence) throw new Error('conclusionPresence check failed');
    if (result.checks.internalLinks !== 1) throw new Error('internalLinks check failed');
    if (result.checks.externalLinks !== 1) throw new Error('externalLinks check failed');
    if (!result.checks.imageAltText) throw new Error('imageAltText check failed');

    console.log('  -> SUCCESS: Standalone unit tests passed.');

    // ----------------------------------------------------
    // Test 2: Register User & Establish Company Profile
    // ----------------------------------------------------
    console.log(`\n[TEST 2] Registering New User: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      authToken = registerRes.data.token;
      console.log('  -> SUCCESS: Account registered and company context set.');
    } else {
      throw new Error('Registration endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 3: Generate Direct Blog via API
    // ----------------------------------------------------
    console.log('\n[TEST 3] Generating Direct Blog via Keyword (Automatic SEO Analysis)...');
    const generateRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'cloud metrics',
        targetAudience: 'DevOps Teams',
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
      console.log('  -> Generated Title:', blog.title);
      console.log('  -> SEO Score:', blog.seoScore);
      console.log('  -> Checks persisted in DB:', blog.seoAnalysis.checks);
      
      // Verify schema attributes
      if (blog.seoScore === undefined || blog.seoScore === null) throw new Error('seoScore is missing.');
      if (!blog.seoAnalysis) throw new Error('seoAnalysis is missing.');
      if (blog.seoAnalysis.seoScore === undefined) throw new Error('seoAnalysis.seoScore is missing.');
      if (blog.seoAnalysis.score === undefined) throw new Error('seoAnalysis.score is missing.');
      if (blog.seoAnalysis.score !== blog.seoScore) throw new Error('seoAnalysis.score and seoScore mismatch.');
      if (!blog.seoAnalysis.checks) throw new Error('seoAnalysis.checks is missing from DB.');
      
      // Verify legacy fields presence
      if (blog.seoAnalysis.readabilityScore === undefined) throw new Error('readabilityScore is missing.');
      if (blog.seoAnalysis.keywordDensity === undefined) throw new Error('keywordDensity is missing.');
      if (blog.seoAnalysis.titleScore === undefined) throw new Error('titleScore is missing.');
      if (blog.seoAnalysis.metaScore === undefined) throw new Error('metaScore is missing.');
      if (blog.seoAnalysis.headingScore === undefined) throw new Error('headingScore is missing.');

      console.log('  -> Database verification check passed.');
    } else {
      throw new Error('Direct Blog Generation endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 4: Update Blog to recalculate SEO score
    // ----------------------------------------------------
    console.log('\n[TEST 4] Updating Blog manually to verify re-running of SEO Analyzer...');
    const updateRes = await axios.put(
      `${baseURL}/blogs/${blogId}`,
      {
        title: 'Ultimate Guide to Cloud Metrics Optimization',
        content: `# Ultimate Guide to Cloud Metrics Optimization
        
In this guide, we discuss cloud metrics. This is a crucial topic for optimization.

## 1. Metrics Gathering

Gathering metrics helps cloud environments.

## 2. Advanced Analysis

Analyzing data is key.

### FAQ
- What are cloud metrics? Performance indicators for cloud systems.

### Conclusion
Cloud metrics are essential. Check out our [dashboard](/dashboard) or the [AWS docs](https://aws.amazon.com).

![Cloud metrics chart](https://example.com/chart.png)
`,
        metaDescription: 'Optimize your applications with this comprehensive guide to cloud metrics analysis.'
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
      console.log('  -> Recommendations Count:', blog.seoAnalysis.recommendations.length);
      console.log('  -> Word Count in DB:', blog.seoAnalysis.checks.wordCount);
      console.log('  -> H2 Count in DB:', blog.seoAnalysis.checks.h2Count);
      console.log('  -> Image Alt Text in DB:', blog.seoAnalysis.checks.imageAltText);
      
      // Ensure recalculation occurred correctly
      if (blog.seoAnalysis.checks.wordCount < 40) throw new Error('Word count check did not update.');
      if (blog.seoAnalysis.checks.h2Count !== 2) throw new Error('H2 count check did not update.');
    } else {
      throw new Error('Update Blog endpoint failed.');
    }

    console.log('\n======================================================');
    console.log('    ALL SEO ANALYZER TESTS PASSED: 100% NOMINAL        ');
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
