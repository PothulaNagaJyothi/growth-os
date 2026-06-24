const axios = require('axios');

async function run() {
  const baseURL = 'http://localhost:4000/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'Crawl Tester',
    email: `crawl_test_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: `Crawl Corp ${uniqueId}`
  };

  try {
    console.log(`Registering user ${testUser.email}...`);
    const regRes = await axios.post(`${baseURL}/auth/register`, testUser);
    const token = regRes.data.token;
    console.log('Registration success. Token:', token ? 'exists' : 'null');

    // 1. Crawl uden.tech
    console.log('\nTesting crawl of uden.tech...');
    try {
      const crawlRes = await axios.post(
        `${baseURL}/knowledge/crawl`,
        { url: 'https://uden.tech/' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('uden.tech crawl SUCCESS:', JSON.stringify(crawlRes.data, null, 2));
    } catch (crawlErr) {
      console.error('uden.tech crawl FAILED:');
      if (crawlErr.response) {
        console.error('Status:', crawlErr.response.status);
        console.error('Data:', JSON.stringify(crawlErr.response.data, null, 2));
      } else {
        console.error(crawlErr.message);
      }
    }

    // 2. Crawl stripe.com
    console.log('\nTesting crawl of stripe.com...');
    try {
      const crawlRes = await axios.post(
        `${baseURL}/knowledge/crawl`,
        { url: 'https://stripe.com/' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('stripe.com crawl SUCCESS:', JSON.stringify(crawlRes.data, null, 2));
    } catch (crawlErr) {
      console.error('stripe.com crawl FAILED:');
      if (crawlErr.response) {
        console.error('Status:', crawlErr.response.status);
        console.error('Data:', JSON.stringify(crawlErr.response.data, null, 2));
      } else {
        console.error(crawlErr.message);
      }
    }

  } catch (err) {
    console.error('General error:', err.message);
  }
}

run();
