const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Blog = require('./models/Blog');

// Load env variables
dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growth-os';

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoURI);
  console.log('Connected to database!');

  // Seed temp blogs
  const companyId = new mongoose.Types.ObjectId();
  const blogs = await Blog.insertMany([
    {
      companyId,
      title: 'Draft Backend Post',
      content: 'Content...',
      status: 'draft',
      author: 'Alice Cooper',
      keywordCategory: 'Backend',
      publishDate: new Date('2026-07-01T12:00:00Z'),
    },
    {
      companyId,
      title: 'Scheduled Frontend Post',
      content: 'Content...',
      status: 'scheduled',
      author: 'Bob Dylan',
      keywordCategory: 'Frontend',
      publishDate: new Date('2026-07-05T12:00:00Z'),
    }
  ]);

  console.log(`Seeded 2 blogs for company ${companyId}`);

  // Test filter queries matching calendarController behavior
  
  // Test Status case-insensitive / array filter
  const runFilterQuery = async (query) => {
    const filter = { companyId };
    
    if (query.status) {
      const statusList = Array.isArray(query.status) ? query.status : [query.status];
      const normalizedStatuses = [];
      statusList.forEach(s => {
        if (typeof s === 'string') {
          const lower = s.toLowerCase();
          const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
          normalizedStatuses.push(lower);
          normalizedStatuses.push(capitalized);
        }
      });
      if (normalizedStatuses.length > 0) {
        filter.status = { $in: normalizedStatuses };
      }
    }

    if (query.author) {
      const authorList = Array.isArray(query.author) ? query.author : [query.author];
      filter.author = { $in: authorList };
    }

    if (query.keywordCategory) {
      const categoryList = Array.isArray(query.keywordCategory) ? query.keywordCategory : [query.keywordCategory];
      filter.keywordCategory = { $in: categoryList };
    }

    return await Blog.find(filter);
  };

  // 1. Test query status = 'Draft' (capitalized)
  const res1 = await runFilterQuery({ status: 'Draft' });
  console.log(`1. query status = 'Draft' (capitalized): found ${res1.length} blogs (Expected: 1)`);
  if (res1.length !== 1 || res1[0].title !== 'Draft Backend Post') {
    throw new Error('Casing match for single status string failed');
  }

  // 2. Test query status = ['Draft', 'Scheduled'] (capitalized array)
  const res2 = await runFilterQuery({ status: ['Draft', 'Scheduled'] });
  console.log(`2. query status = ['Draft', 'Scheduled']: found ${res2.length} blogs (Expected: 2)`);
  if (res2.length !== 2) {
    throw new Error('Casing match for status array failed');
  }

  // 3. Test query author = ['Alice Cooper'] (array format from frontend)
  const res3 = await runFilterQuery({ author: ['Alice Cooper'] });
  console.log(`3. query author = ['Alice Cooper']: found ${res3.length} blogs (Expected: 1)`);
  if (res3.length !== 1 || res3[0].author !== 'Alice Cooper') {
    throw new Error('Array match for author string failed');
  }

  // 4. Test query keywordCategory = ['Frontend'] (array format from frontend)
  const res4 = await runFilterQuery({ keywordCategory: ['Frontend'] });
  console.log(`4. query keywordCategory = ['Frontend']: found ${res4.length} blogs (Expected: 1)`);
  if (res4.length !== 1 || res4[0].keywordCategory !== 'Frontend') {
    throw new Error('Array match for category string failed');
  }

  // Cleanup
  await Blog.deleteMany({ companyId });
  console.log('Cleaned up seeded blogs.');

  await mongoose.disconnect();
  console.log('Disconnected from database. All tests passed successfully!');
}

run().catch(err => {
  console.error('Test failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
