// Growth OS - Publishing Module & CMS Abstraction Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Schedule = require('./models/Schedule');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4571'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('  GROWTH OS - CMS PUBLISHING SYSTEM INTEGRATION TEST  ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4571...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Publishing tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4571/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'CMS Editor',
    email: `cms_editor_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Publishing Press ${uniqueId}`
  };

  let authToken = null;
  let blogId1 = null;
  let blogId2 = null;

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
    // Test 2: Generate First Blog Post (Initial State: Draft)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Generating Canonical Blog Post 1...');
    const generateRes1 = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'kubernetes scalability',
        targetAudience: 'DevOps Engineers',
        tone: 'formal'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (generateRes1.data && generateRes1.data.success) {
      const blog = generateRes1.data.data;
      blogId1 = blog._id;
      console.log('  -> SUCCESS: Blog 1 generated successfully.');
      console.log('  -> Initial Status:', blog.status);
      if (blog.status !== 'draft') throw new Error('Expected initial status to be "draft"');
    } else {
      throw new Error('Blog 1 generation failed.');
    }

    // ----------------------------------------------------
    // Test 3: Publish Immediately (Direct Export HTML)
    // ----------------------------------------------------
    console.log('\n[TEST 3] Publishing Blog 1 immediately as HTML...');
    const publishRes = await axios.post(
      `${baseURL}/blogs/${blogId1}/publish`,
      {
        platform: 'html',
        options: {}
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (publishRes.data && publishRes.data.success) {
      const blog = publishRes.data.data;
      console.log('  -> SUCCESS: Direct publication endpoint responded.');
      console.log('  -> Published Status:', blog.status);
      console.log('  -> Publish Platform:', blog.publishInfo.platform);
      console.log('  -> Publish Date:', blog.publishInfo.publishedAt);
      console.log('  -> Export HTML length:', blog.publishInfo.exportData.length);
      
      if (blog.status !== 'published') throw new Error('Expected status to be "published"');
      if (blog.publishInfo.platform !== 'html') throw new Error('Expected platform to be "html"');
      if (!blog.publishInfo.exportData.includes('<!DOCTYPE html>')) throw new Error('Exported content is not valid HTML');
    } else {
      throw new Error('Immediate HTML publication failed.');
    }

    // ----------------------------------------------------
    // Test 4: Generate Second Blog Post & Approve It
    // ----------------------------------------------------
    console.log('\n[TEST 4] Generating Blog Post 2 and transitioning to Approved...');
    const generateRes2 = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'ci cd pipelines automation',
        targetAudience: 'Release Managers',
        tone: 'formal'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (generateRes2.data && generateRes2.data.success) {
      blogId2 = generateRes2.data.data._id;
      console.log('  -> Blog 2 generated.');
    }

    // Approve the blog
    const approveRes = await axios.post(
      `${baseURL}/blogs/${blogId2}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (approveRes.data && approveRes.data.success) {
      const blog = approveRes.data.data;
      console.log('  -> SUCCESS: Blog 2 approved.');
      console.log('  -> Blog 2 status:', blog.status);
      if (blog.status !== 'approved') throw new Error('Expected status to be "approved"');
    } else {
      throw new Error('Blog approval failed.');
    }

    // Try approving it again (should fail because status is not 'draft')
    try {
      await axios.post(
        `${baseURL}/blogs/${blogId2}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      throw new Error('Expected double approval to fail, but it succeeded.');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  -> SUCCESS: Double approval failed with HTTP 400 (Expected).');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // Test 5: Schedule Canonical Blog 2 (WordPress Mock)
    // ----------------------------------------------------
    const pastDate = new Date(Date.now() - 10000); // 10 seconds in past
    console.log(`\n[TEST 5] Scheduling Blog 2 for past date: ${pastDate.toISOString()}...`);
    const scheduleRes = await axios.post(
      `${baseURL}/schedule`,
      {
        blogId: blogId2,
        scheduledDate: pastDate.toISOString(),
        publishPlatform: 'wordpress',
        publishOptions: {
          wpUrl: 'https://test-wordpress.org',
          username: 'wpadmin',
          password: 'mock-app-password',
          status: 'publish'
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (scheduleRes.data && scheduleRes.data.success) {
      const schedule = scheduleRes.data.data;
      console.log('  -> SUCCESS: Blog scheduled successfully.');
      console.log('  -> Schedule status in response:', schedule.status);
      console.log('  -> Schedule platform in response:', schedule.publishPlatform);
      
      // Verify database status of blog is now 'scheduled'
      const blogInDb = await Blog.findById(blogId2);
      console.log('  -> Blog 2 status in DB:', blogInDb.status);
      if (blogInDb.status !== 'scheduled') throw new Error('Expected blog status in DB to be "scheduled"');
    } else {
      throw new Error('Scheduling blog failed.');
    }

    // ----------------------------------------------------
    // Test 6: Run Background Scheduler Cron Simulation
    // ----------------------------------------------------
    console.log('\n[TEST 6] Simulating Node-Cron background publication sweep...');
    
    // Find scheduled records that match conditions
    const now = new Date();
    const pendingSchedules = await Schedule.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    });

    console.log(`  -> Found ${pendingSchedules.length} pending schedules matching sweep criteria.`);
    if (pendingSchedules.length === 0) {
      throw new Error('No pending schedules found to trigger sweep.');
    }

    // Run the scheduler cron handler logic directly
    const publishers = require('./services/publishers');
    for (const schedule of pendingSchedules) {
      if (schedule.blogId) {
        const blog = await Blog.findById(schedule.blogId);
        if (blog) {
          console.log(`  -> Processing schedule ID: ${schedule._id}`);
          console.log(`  -> Simulating publish of "${blog.title}" to ${schedule.publishPlatform}`);
          
          const result = await publishers.publish(blog, schedule.publishPlatform, schedule.publishOptions || {});
          
          if (result.success) {
            blog.status = 'published';
            blog.publishInfo = {
              platform: schedule.publishPlatform,
              publishedAt: new Date(),
              externalId: result.externalId,
              url: result.url || '',
              exportData: result.exportData || '',
            };

            const nextVersion = (blog.versions && blog.versions.length > 0)
              ? Math.max(...blog.versions.map(v => v.version)) + 1
              : 1;

            blog.versions.push({
              version: nextVersion,
              title: blog.title,
              metaDescription: blog.metaDescription,
              content: blog.content,
              seoScore: blog.seoScore,
              createdAt: new Date(),
            });

            await blog.save();
            console.log('     -> Blog saved in DB as "published".');
          }
        }
      }
      schedule.status = 'published';
      await schedule.save();
      console.log('     -> Schedule saved in DB as "published".');
    }

    // Verify final states
    const finalBlog = await Blog.findById(blogId2);
    console.log('\n[TEST RESULT CHECK] Verification of post-cron states:');
    console.log('  -> Final Blog Status in DB:', finalBlog.status);
    console.log('  -> Final Blog Platform in DB:', finalBlog.publishInfo.platform);
    console.log('  -> Final Blog WordPress ID in DB:', finalBlog.publishInfo.externalId);
    console.log('  -> Final Blog Version History Count:', finalBlog.versions.length);

    if (finalBlog.status !== 'published') throw new Error('Blog should be transition to "published".');
    if (finalBlog.publishInfo.platform !== 'wordpress') throw new Error('Blog platform should be "wordpress".');
    if (!finalBlog.publishInfo.externalId.startsWith('wp-mock-')) throw new Error('Expected mock external ID starting with wp-mock-');

    console.log('\n======================================================');
    console.log('  CMS PUBLISHING TESTS PASSED: 100% NOMINAL          ');
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
