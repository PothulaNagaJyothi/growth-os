// Growth OS - Automated Knowledge Base Integration Test Suite
const axios = require('axios');
const mongoose = require('mongoose');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4490'; // Use distinct test port to prevent collisions
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('   GROWTH OS - KNOWLEDGE BASE INTEGRATION TEST       ');
console.log('======================================================');

// Import and boot the server
const server = require('./app');

console.log('\nBooting test server instance on port 4490...');
console.log('Establishing MongoDB Atlas connection channel...');

// Resilient database connection wait wrapper
const checkConnectionInterval = setInterval(() => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(checkConnectionInterval);
    console.log('\n  -> Sourced active Mongoose connection. Commencing test suite...\n');
    runTestSuite();
  }
}, 200);

// Timeout safety fallback (fail after 15 seconds of waiting)
setTimeout(() => {
  if (mongoose.connection.readyState !== 1) {
    clearInterval(checkConnectionInterval);
    console.error('\n[FATAL] MongoDB Atlas connection timed out in test suite.');
    process.exit(1);
  }
}, 15000);

async function runTestSuite() {
  const baseURL = 'http://localhost:4490/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Knowledge Tester',
    email: `knowledge_test_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Knowledge Corp ${uniqueId}`
  };

  const testFileContent = 'Growth OS core system specs: Node.js Express server + React JS frontend, grounded Context uploads via Cloudinary, and Azure OpenAI chat completions engine.';
  const testFileName = `test_grounding_${uniqueId}.txt`;

  let authToken = null;
  let documentId = null;

  try {
    // ----------------------------------------------------
    // Test 1: User Registration
    // ----------------------------------------------------
    console.log(`[TEST 1] Registering New User: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      authToken = registerRes.data.token;
      console.log('  -> SUCCESS: Account registered and token received.');
    } else {
      throw new Error('Registration endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 2: Upload Knowledge Base File
    // ----------------------------------------------------
    console.log(`\n[TEST 2] Uploading Grounding Document: ${testFileName}...`);
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${testFileName}"\r\n`),
      Buffer.from(`Content-Type: text/plain\r\n\r\n`),
      Buffer.from(testFileContent),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await axios.post(`${baseURL}/knowledge/upload`, body, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    });

    if (uploadRes.data && uploadRes.data.success) {
      documentId = uploadRes.data.data._id;
      console.log(`  -> SUCCESS: File uploaded. Document ID: ${documentId}`);
      console.log(`  -> Extracted Text: "${uploadRes.data.data.extractedText.trim()}"`);
      console.log(`  -> File URL: ${uploadRes.data.data.fileUrl}`);
    } else {
      throw new Error('Upload endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 3: List Knowledge Base Files
    // ----------------------------------------------------
    console.log('\n[TEST 3] Fetching Company Knowledge Documents...');
    const listRes = await axios.get(`${baseURL}/knowledge`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (listRes.data && listRes.data.success) {
      console.log(`  -> SUCCESS: Retrieved ${listRes.data.count} documents.`);
      const found = listRes.data.data.some(doc => doc._id === documentId);
      if (found) {
        console.log('  -> Verified: Uploaded document exists in list.');
      } else {
        throw new Error('Uploaded document ID not found in document list.');
      }
    } else {
      throw new Error('List documents endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 4: Grounded Blog Generation (RAG Integration Test)
    // ----------------------------------------------------
    console.log('\n[TEST 4] Triggering Grounded Blog Generation (Direct Keyword)...');
    const blogRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'Growth OS Grounded Blogging',
        targetAudience: 'Marketing technology managers',
        tone: 'Informative'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (blogRes.data && blogRes.data.success) {
      console.log('  -> SUCCESS: Grounded blog generated successfully!');
      console.log(`  -> Title: "${blogRes.data.data.title}"`);
      console.log(`  -> SEO Score: ${blogRes.data.data.seoScore}`);
    } else {
      throw new Error('Grounded blog generation failed.');
    }

    // ----------------------------------------------------
    // Test 5: Delete Knowledge Base File
    // ----------------------------------------------------
    console.log(`\n[TEST 5] Deleting Knowledge Document: ${documentId}...`);
    const deleteRes = await axios.delete(`${baseURL}/knowledge/${documentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (deleteRes.data && deleteRes.data.success) {
      console.log('  -> SUCCESS: Document deleted successfully.');
    } else {
      throw new Error('Delete endpoint failed.');
    }

    // Double check it's gone
    const verifyListRes = await axios.get(`${baseURL}/knowledge`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const stillExists = verifyListRes.data.data.some(doc => doc._id === documentId);
    if (stillExists) {
      throw new Error('Document still exists in DB after deletion!');
    }
    console.log('  -> Verified: Document no longer exists in MongoDB.');

    console.log('\n======================================================');
    console.log('   KNOWLEDGE BASE INTEGRATION TEST: SUCCESS (100%)    ');
    console.log('======================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n======================================================');
    console.error('   KNOWLEDGE BASE TEST FAILED                         ');
    console.error('======================================================');
    console.error('Error Details:', error.response?.data || error.message);
    console.log('======================================================\n');
    process.exit(1);
  }
}