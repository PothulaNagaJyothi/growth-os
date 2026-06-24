const axios = require('axios');

async function run() {
  const baseURL = 'http://localhost:4000/api';
  const uniqueId = Date.now();
  const testUser = {
    name: 'UDEN Blogger',
    email: `uden_blogger_${uniqueId}@growthos.com`,
    password: 'securePassword123',
    companyName: 'UDEN Test Group'
  };

  try {
    console.log(`[STEP 1] Registering user ${testUser.email}...`);
    const regRes = await axios.post(`${baseURL}/auth/register`, testUser);
    const token = regRes.data.token;
    console.log('  -> Registration SUCCESS.');

    // 2. Crawl uden.tech
    console.log('\n[STEP 2] Crawling uden.tech to populate brand context and personas...');
    const crawlRes = await axios.post(
      `${baseURL}/knowledge/crawl`,
      { url: 'https://uden.tech/' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('  -> Crawl SUCCESS.');
    console.log('  -> Company Sourced:', crawlRes.data.data.company.companyName);
    console.log('  -> Brand Colors Sourced:', crawlRes.data.data.company.brandColors);

    // 3. Fetch personas
    console.log('\n[STEP 3] Fetching generated UDEN personas...');
    const personasRes = await axios.get(`${baseURL}/personas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const personas = personasRes.data.data;
    console.log(`  -> Found ${personas.length} personas:`);
    personas.forEach((p, idx) => {
      console.log(`     ${idx + 1}. ${p.personaName} (${p.audienceType})`);
    });

    if (personas.length === 0) {
      throw new Error('No personas generated for UDEN.');
    }

    // Use the first persona (usually Tech-Talent Seekers/Employers or similar)
    const selectedPersona = personas[0];
    console.log(`\n  -> Selected Persona for generation: "${selectedPersona.personaName}"`);

    // 4. Generate Blog
    console.log('\n[STEP 4] Generating SEO-optimized blog for uden.tech...');
    const blogRes = await axios.post(
      `${baseURL}/blogs/generate`,
      {
        keyword: 'tech consulting and outsourcing',
        targetAudience: selectedPersona.description,
        tone: selectedPersona.tone,
        personaId: selectedPersona._id
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const blog = blogRes.data.data;
    console.log('\n======================================================');
    console.log('   UDEN BLOG GENERATION SUCCESS (100%)                ');
    console.log('======================================================');
    console.log(`Title: ${blog.title}`);
    console.log(`SEO Score: ${blog.seoScore}`);
    console.log(`Status: ${blog.status}`);
    console.log(`Word Count: ${blog.wordCount || blog.content.split(/\s+/).length}`);
    console.log('\n--- Content Preview ---');
    console.log(blog.content.slice(0, 800) + '\n...');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n======================================================');
    console.error('   BLOG GENERATION FAILED                             ');
    console.error('======================================================');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
    console.log('======================================================\n');
  }
}

run();
