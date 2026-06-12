// Growth OS - Blog Studio Manual Schedule Sync Test
const axios = require('axios');
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Schedule = require('./models/Schedule');

process.env.PORT = '4579';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_32_bytes_long_minimum_length_required';

console.log('======================================================');
console.log('   GROWTH OS - BLOG STUDIO SCHEDULE SYNC TEST        ');
console.log('======================================================');

const server = require('./app');

const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Sync tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4579/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Sync Editor',
    email: `sync_editor_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Sync Publishing ${uniqueId}`
  };

  let authToken = null;
  let blogId = null;

  try {
    // 1. Register User
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    authToken = registerRes.data.token;
    console.log('  -> Registered user successfully.');

    // 2. Create a test Blog
    const dbBlog = await Blog.create({
      companyId: (await mongoose.connection.models.User.findOne({ email: testUser.email })).companyId,
      title: 'Manual Blog title',
      content: 'Manual Blog body content goes here...',
      status: 'draft',
      author: 'Jane Doe',
      keywordCategory: 'General',
    });
    blogId = dbBlog._id;
    console.log(`  -> Seeded draft blog: ID: ${blogId}`);

    // 3. PUT request to /api/blogs/:id - Update publish date & status to scheduled
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    console.log(`\n[TEST] Issuing PUT /api/blogs/${blogId} to reschedule and transition to "scheduled"...`);
    const updateRes = await axios.put(
      `${baseURL}/blogs/${blogId}`,
      {
        status: 'scheduled',
        publishDate: futureDate.toISOString()
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (updateRes.data && updateRes.data.success) {
      console.log('  -> SUCCESS: PUT request completed successfully.');
      const blog = updateRes.data.data;
      console.log('  -> Saved blog status:', blog.status);
      console.log('  -> Saved blog publishDate:', blog.publishDate);
      if (blog.status !== 'scheduled') throw new Error('Expected status to be scheduled.');
      if (new Date(blog.publishDate).toISOString() !== futureDate.toISOString()) throw new Error('Expected publishDate to match.');

      // Check Schedule document synchronization
      const schedule = await Schedule.findOne({ blogId: blogId, status: 'scheduled' });
      if (!schedule) throw new Error('Schedule document was not created.');
      console.log('  -> SUCCESS: Schedule document auto-created!');
      console.log('  -> Schedule Date in DB:', schedule.scheduledDate.toISOString());
      if (schedule.scheduledDate.toISOString() !== futureDate.toISOString()) throw new Error('Schedule date does not match.');
    } else {
      throw new Error('PUT request failed.');
    }

    // 4. PUT request to /api/blogs/:id - Revert to draft
    console.log(`\n[TEST] Issuing PUT /api/blogs/${blogId} to revert status to "draft"...`);
    const revertRes = await axios.put(
      `${baseURL}/blogs/${blogId}`,
      {
        status: 'draft'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (revertRes.data && revertRes.data.success) {
      console.log('  -> SUCCESS: Revert PUT request completed.');
      const blog = revertRes.data.data;
      console.log('  -> Saved blog status:', blog.status);
      if (blog.status !== 'draft') throw new Error('Expected status to be draft.');

      // Verify Schedule document was deleted
      const scheduleCount = await Schedule.countDocuments({ blogId: blogId, status: 'scheduled' });
      console.log('  -> Remaining Schedule documents in DB:', scheduleCount);
      if (scheduleCount !== 0) throw new Error('Schedule document was not deleted.');
      console.log('  -> SUCCESS: Schedule document auto-deleted!');
    } else {
      throw new Error('Revert PUT request failed.');
    }

    console.log('\n======================================================');
    console.log('   BLOG STUDIO SCHEDULE SYNC TESTS PASSED: 100%       ');
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
