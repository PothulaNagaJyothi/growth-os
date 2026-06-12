const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Blog = require('../models/Blog');
const { analyzeSEO } = require('../utils/seoEngine');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MIGRATION] MONGODB_URI is missing from the environment configuration.');
    process.exit(1);
  }

  console.log('[MIGRATION] Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('[MIGRATION] Connected successfully.');

  const db = mongoose.connection.db;
  const collection = db.collection('blogs');

  console.log('[MIGRATION] Fetching active collection indexes...');
  const indexes = await collection.indexes();
  console.log('[MIGRATION] Active indexes:', indexes.map(i => i.name));

  const hasCampaignIndex = indexes.some(idx => idx.name === 'campaignId_1');
  if (hasCampaignIndex) {
    console.log('[MIGRATION] Dropping old unique campaignId_1 index...');
    await collection.dropIndex('campaignId_1');
    console.log('[MIGRATION] Index dropped successfully.');
  } else {
    console.log('[MIGRATION] No legacy non-sparse campaignId index detected.');
  }

  console.log('[MIGRATION] Recreating campaignId index with { unique: true, sparse: true } configuration...');
  await collection.createIndex({ campaignId: 1 }, { unique: true, sparse: true });
  console.log('[MIGRATION] Sparse unique index created successfully.');

  // Migrate existing records
  const blogs = await Blog.find({});
  console.log(`[MIGRATION] Sourced ${blogs.length} blog documents to analyze & update.`);

  for (const blog of blogs) {
    let updated = false;

    if (blog.keyword === undefined) {
      blog.keyword = '';
      updated = true;
    }
    if (blog.targetAudience === undefined) {
      blog.targetAudience = '';
      updated = true;
    }
    if (blog.tone === undefined) {
      blog.tone = '';
      updated = true;
    }
    if (!blog.slug) {
      blog.slug = blog.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      updated = true;
    }

    if (blog.seoScore === undefined || blog.seoScore === 0) {
      const targetKeyword = blog.keyword || '';
      const analysis = analyzeSEO(blog.title, blog.content, blog.metaDescription, targetKeyword);
      blog.seoScore = analysis.score;
      blog.seoAnalysis = analysis;
      updated = true;
    }

    if (!blog.versions || blog.versions.length === 0) {
      blog.versions = [{
        version: 1,
        title: blog.title,
        content: blog.content,
        createdAt: blog.createdAt || new Date()
      }];
      updated = true;
    }

    if (updated) {
      console.log(`[MIGRATION] Updating database attributes for: "${blog.title}" (ID: ${blog._id})`);
      await blog.save();
    }
  }

  console.log('[MIGRATION] Schema migration process completed successfully.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('[MIGRATION ERROR] Migration execution failed:', err);
  process.exit(1);
});
