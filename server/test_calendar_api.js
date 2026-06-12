// Growth OS - Content Calendar APIs Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Schedule = require('./models/Schedule');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4578'; // Use distinct test port
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_32_bytes_long_minimum_length_required';

console.log('======================================================');
console.log('    GROWTH OS - CONTENT CALENDAR API SYSTEM TEST      ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4578...');
console.log('Polling MongoDB Atlas connection channel...');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Calendar tests...\n');
    runTests();
  }
}, 200);

async function runTests() {
  const baseURL = 'http://localhost:4578/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Calendar Editor',
    email: `calendar_editor_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Calendar Press ${uniqueId}`
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
    // Test 2: Create Test Blogs Directly in DB for project checks
    // ----------------------------------------------------
    console.log('\n[TEST 2] Seeding test blogs into database...');
    const dbBlogs = await Blog.insertMany([
      {
        companyId: mongoose.connection.models.User.findOne ? (await mongoose.connection.models.User.findOne({ email: testUser.email })).companyId : new mongoose.Types.ObjectId(),
        title: 'Blog 1: Scaling Node.js Applications',
        content: 'This is the body content of Blog 1...',
        status: 'draft',
        author: 'Jane Doe',
        keywordCategory: 'Backend',
        publishDate: new Date('2026-07-01T12:00:00Z'),
      },
      {
        companyId: mongoose.connection.models.User.findOne ? (await mongoose.connection.models.User.findOne({ email: testUser.email })).companyId : new mongoose.Types.ObjectId(),
        title: 'Blog 2: React Component Design Patterns',
        content: 'This is the body content of Blog 2...',
        status: 'scheduled',
        author: 'John Smith',
        keywordCategory: 'Frontend',
        publishDate: new Date('2026-07-15T12:00:00Z'),
      }
    ]);

    blogId1 = dbBlogs[0]._id;
    blogId2 = dbBlogs[1]._id;
    const testCompanyId = dbBlogs[0].companyId;
    console.log(`  -> Seeded 2 blogs: Blog 1 (ID: ${blogId1}, draft), Blog 2 (ID: ${blogId2}, scheduled)`);

    // Let's seed an active schedule for Blog 2
    const schedule = await Schedule.create({
      companyId: testCompanyId,
      blogId: blogId2,
      publishPlatform: 'html',
      publishOptions: {},
      scheduledDate: new Date('2026-07-15T12:00:00Z'),
      status: 'scheduled',
    });
    console.log(`  -> Seeded active Schedule document for Blog 2 (ID: ${schedule._id})`);

    // ----------------------------------------------------
    // Test 3: GET /api/calendar - Verify projection and fields
    // ----------------------------------------------------
    console.log('\n[TEST 3] Testing GET /api/calendar for projection and fields...');
    const calendarRes = await axios.get(`${baseURL}/calendar`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (calendarRes.data && calendarRes.data.success) {
      console.log(`  -> SUCCESS: Calendar list returned. Total count: ${calendarRes.data.count}`);
      const blogs = calendarRes.data.data;
      if (blogs.length !== 2) throw new Error(`Expected 2 blogs, got ${blogs.length}`);
      
      // Verify projection fields
      const firstBlog = blogs[0];
      console.log('  -> Projected keys of returned object:', Object.keys(firstBlog));
      if (!firstBlog.title || !firstBlog.status || !firstBlog.author || !firstBlog.keywordCategory) {
        throw new Error('Projection fields missing in response.');
      }
      if (firstBlog.content) {
        throw new Error('Security/Performance warning: content body field should be excluded from Calendar view.');
      }
    } else {
      throw new Error('GET /api/calendar request failed.');
    }

    // ----------------------------------------------------
    // Test 4: GET /api/calendar/filters - Verify filters extraction
    // ----------------------------------------------------
    console.log('\n[TEST 4] Testing GET /api/calendar/filters for unique filter metadata...');
    const filtersRes = await axios.get(`${baseURL}/calendar/filters`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (filtersRes.data && filtersRes.data.success) {
      const filters = filtersRes.data.data;
      console.log('  -> Extracted Statuses:', filters.statuses);
      console.log('  -> Extracted Authors:', filters.authors);
      console.log('  -> Extracted Categories:', filters.categories);

      if (!filters.statuses.includes('draft') || !filters.statuses.includes('scheduled')) {
        throw new Error('Statuses filter incomplete.');
      }
      if (!filters.authors.includes('Jane Doe') || !filters.authors.includes('John Smith')) {
        throw new Error('Authors filter incomplete.');
      }
      if (!filters.categories.includes('Backend') || !filters.categories.includes('Frontend')) {
        throw new Error('Categories filter incomplete.');
      }
      if (!filters.keywordCategories.includes('Backend') || !filters.keywordCategories.includes('Frontend')) {
        throw new Error('Keyword categories filter incomplete.');
      }
      console.log('  -> SUCCESS: Filters query verified.');
    } else {
      throw new Error('GET /api/calendar/filters request failed.');
    }

    // ----------------------------------------------------
    // Test 5: PATCH /api/calendar/:id/reschedule - Rescheduling Blog
    // ----------------------------------------------------
    const newPublishDate = '2026-08-01T15:00:00.000Z';
    console.log(`\n[TEST 5] Testing PATCH /api/calendar/${blogId2}/reschedule to: ${newPublishDate}...`);
    const rescheduleRes = await axios.patch(
      `${baseURL}/calendar/${blogId2}/reschedule`,
      { publishDate: newPublishDate },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (rescheduleRes.data && rescheduleRes.data.success) {
      const updatedBlog = rescheduleRes.data.data;
      console.log('  -> Rescheduled response publishDate:', updatedBlog.publishDate);
      if (new Date(updatedBlog.publishDate).toISOString() !== newPublishDate) {
        throw new Error('Publish date was not updated correctly on Blog.');
      }

      // Check Mongoose Schedule document sync
      const scheduleInDb = await Schedule.findOne({ blogId: blogId2, status: 'scheduled' });
      console.log('  -> Synced Schedule Date in DB:', scheduleInDb.scheduledDate.toISOString());
      if (scheduleInDb.scheduledDate.toISOString() !== newPublishDate) {
        throw new Error('Schedule document date was not synchronized.');
      }
      console.log('  -> SUCCESS: Rescheduling synchronized Blog and Schedule document.');
    } else {
      throw new Error('PATCH /api/calendar/:id/reschedule failed.');
    }

    // ----------------------------------------------------
    // Test 6: PATCH /api/calendar/:id/status - Status transitions (Cleanup / Creation)
    // ----------------------------------------------------
    console.log('\n[TEST 6] Testing PATCH /api/calendar/:id/status transitions...');

    // A. Transitions from scheduled -> archived (should delete the Schedule record)
    console.log('  -> Part A: Transition scheduled blog to archived status...');
    const statusRes1 = await axios.patch(
      `${baseURL}/calendar/${blogId2}/status`,
      { status: 'archived' },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (statusRes1.data && statusRes1.data.success) {
      const updatedBlog = statusRes1.data.data;
      console.log('    -> Blog status in response:', updatedBlog.status);
      if (updatedBlog.status !== 'archived') throw new Error('Expected blog status to be archived.');

      // Check if Schedule was deleted
      const scheduleCount = await Schedule.countDocuments({ blogId: blogId2, status: 'scheduled' });
      console.log('    -> Active Schedule documents remaining in DB for Blog 2:', scheduleCount);
      if (scheduleCount !== 0) throw new Error('Schedule document was not deleted upon cancellation/archive.');
      console.log('    -> SUCCESS: Scheduler record cleaned up.');
    } else {
      throw new Error('Transition to archived status failed.');
    }

    // B. Transitions from draft -> scheduled (should create a Schedule record if future date exists)
    // Set Blog 1 publish date into the future first
    console.log('  -> Part B: Rescheduling draft blog to future date...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    await axios.patch(
      `${baseURL}/calendar/${blogId1}/reschedule`,
      { publishDate: futureDate.toISOString() },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('  -> Transitioning draft blog to scheduled status...');
    const statusRes2 = await axios.patch(
      `${baseURL}/calendar/${blogId1}/status`,
      { status: 'scheduled' },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (statusRes2.data && statusRes2.data.success) {
      const updatedBlog = statusRes2.data.data;
      console.log('    -> Blog status in response:', updatedBlog.status);
      if (updatedBlog.status !== 'scheduled') throw new Error('Expected blog status to be scheduled.');

      // Verify a Schedule was created
      const scheduleInDb = await Schedule.findOne({ blogId: blogId1, status: 'scheduled' });
      if (!scheduleInDb) throw new Error('Schedule document was not created when transitioning to scheduled state.');
      console.log('    -> Succeeded schedule created platform:', scheduleInDb.publishPlatform);
      console.log('    -> Succeeded schedule date:', scheduleInDb.scheduledDate.toISOString());
      console.log('    -> SUCCESS: Scheduler record created on status transition.');
    } else {
      throw new Error('Transition to scheduled status failed.');
    }

    // C. Transition from scheduled -> draft (should delete the Schedule record)
    console.log('  -> Part C: Transition scheduled blog to draft status...');
    const statusRes3 = await axios.patch(
      `${baseURL}/calendar/${blogId1}/status`,
      { status: 'draft' },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (statusRes3.data && statusRes3.data.success) {
      const updatedBlog = statusRes3.data.data;
      console.log('    -> Blog status in response:', updatedBlog.status);
      if (updatedBlog.status !== 'draft') throw new Error('Expected blog status to be draft.');

      // Check if Schedule was deleted
      const scheduleCount = await Schedule.countDocuments({ blogId: blogId1, status: 'scheduled' });
      console.log('    -> Active Schedule documents remaining in DB for Blog 1:', scheduleCount);
      if (scheduleCount !== 0) throw new Error('Schedule document was not deleted upon reverting to draft.');
      console.log('    -> SUCCESS: Scheduler record cleaned up upon revert to draft.');
    } else {
      throw new Error('Transition to draft status failed.');
    }

    console.log('\n======================================================');
    console.log('  CONTENT CALENDAR API TESTS PASSED: 100% NOMINAL    ');
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
