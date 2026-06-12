// Growth OS - Unified E2E System Workflow Test Suite
const axios = require('axios');

const baseURL = 'http://localhost:4000/api';
const uniqueId = Date.now();

const testUser = {
  name: 'E2E Flow Tester',
  email: `e2e_tester_${uniqueId}@growthos.com`,
  password: 'securePassword123',
  companyName: `E2E Tech Industries ${uniqueId}`
};

console.log('========================================================');
console.log('   GROWTH OS - COMPLETE E2E WORKFLOW INTEGRATION TEST   ');
console.log('========================================================');
console.log(`Targeting active API gateway: ${baseURL}\n`);

async function runE2E() {
  let token = null;
  let personaId = null;
  let campaignId = null;
  let blogId = null;
  let platformBlogId = null;
  let scheduleId = null;

  try {
    // ----------------------------------------------------
    // Test 1: Register User & Company
    // ----------------------------------------------------
    console.log(`[STEP 1] Registering New User Account: ${testUser.email}...`);
    const registerRes = await axios.post(`${baseURL}/auth/register`, testUser);
    
    if (registerRes.data && registerRes.data.success) {
      token = registerRes.data.token;
      console.log('  -> SUCCESS: Account registered and company context provisioned.');
    } else {
      throw new Error('Registration endpoint failed.');
    }

    // ----------------------------------------------------
    // Test 2: Create target Persona
    // ----------------------------------------------------
    console.log('\n[STEP 2] Creating Target Persona Profile...');
    const personaRes = await axios.post(
      `${baseURL}/personas`,
      {
        personaName: 'Cloud SRE Leads',
        tone: 'Analytical & Direct',
        writingStyle: 'Highly technical, architecture-driven',
        audienceType: 'Infrastructure leaders and platform engineers',
        description: 'Focused on cluster reliability and optimizing cloud overhead.'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (personaRes.data && personaRes.data.success) {
      personaId = personaRes.data.data._id;
      console.log(`  -> SUCCESS: Persona profile registered (ID: ${personaId}).`);
    } else {
      throw new Error('Persona creation failed.');
    }

    // ----------------------------------------------------
    // Test 3: Create Campaign
    // ----------------------------------------------------
    console.log('\n[STEP 3] Launching Campaign Context...');
    const campaignRes = await axios.post(
      `${baseURL}/campaigns`,
      {
        personaId,
        campaignName: 'Kubernetes Pod Autoscaler Optimization',
        topic: 'Horizontal Pod Autoscaling (HPA) using custom Prometheus metrics',
        keywords: ['Kubernetes HPA', 'Prometheus metrics query', 'scale-up latency'],
        platforms: ['LinkedIn', 'Medium'],
        goal: 'Generate 50 demo registrations.',
        status: 'draft'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (campaignRes.data && campaignRes.data.success) {
      campaignId = campaignRes.data.data._id;
      console.log(`  -> SUCCESS: Campaign established (ID: ${campaignId}).`);
    } else {
      throw new Error('Campaign creation failed.');
    }

    // ----------------------------------------------------
    // Test 4: Synthesize Research Engine Report
    // ----------------------------------------------------
    console.log('\n[STEP 4] Running Grounded Research Engine Synthesis...');
    const researchRes = await axios.post(
      `${baseURL}/research/generate`,
      { campaignId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (researchRes.data && researchRes.data.success) {
      console.log('  -> SUCCESS: Grounded market research successfully synthesized.');
      console.log('  -> Trending Keywords Sourced:', researchRes.data.data.keywords?.map(k => k.keyword).join(', '));
    } else {
      throw new Error('Research synthesis failed.');
    }

    // ----------------------------------------------------
    // Test 5: Generate Canonical Blog Post
    // ----------------------------------------------------
    console.log('\n[STEP 5] Generating Canonical Blog Post...');
    const blogRes = await axios.post(
      `${baseURL}/blogs/generate`,
      { campaignId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (blogRes.data && blogRes.data.success) {
      blogId = blogRes.data.data._id;
      console.log(`  -> SUCCESS: Canonical Blog written (ID: ${blogId}).`);
      console.log('  -> Blog Title:', blogRes.data.data.title);
    } else {
      throw new Error('Blog writing generation failed.');
    }

    // ----------------------------------------------------
    // Test 6: Render Platform Adaptation (LinkedIn)
    // ----------------------------------------------------
    console.log('\n[STEP 6] Adapting Blog for LinkedIn (Platform Renderer)...');
    const renderRes = await axios.post(
      `${baseURL}/render/LinkedIn`,
      { blogId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (renderRes.data && renderRes.data.success) {
      platformBlogId = renderRes.data.data._id;
      console.log(`  -> SUCCESS: Adapted post rendered (ID: ${platformBlogId}).`);
      console.log('  -> Sourced Title Hook:', renderRes.data.data.title);
    } else {
      throw new Error('Platform rendering failed.');
    }

    // ----------------------------------------------------
    // Test 7: Schedule Publication on Calendar
    // ----------------------------------------------------
    console.log('\n[STEP 7] Scheduling Post Publication...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5); // 5 days from now
    
    const scheduleRes = await axios.post(
      `${baseURL}/schedule`,
      {
        platformBlogId,
        scheduledDate: futureDate.toISOString(),
        timezone: 'UTC'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (scheduleRes.data && scheduleRes.data.success) {
      scheduleId = scheduleRes.data.data._id;
      console.log(`  -> SUCCESS: Scheduled publication on calendar (ID: ${scheduleId}).`);
      console.log('  -> Date Queued:', scheduleRes.data.data.scheduledDate);
    } else {
      throw new Error('Scheduling failed.');
    }

    // ----------------------------------------------------
    // Test 8: Get Upcoming Queue & Cancel Schedule
    // ----------------------------------------------------
    console.log('\n[STEP 8] Verifying Scheduler Queue & Clean Cancellation...');
    const queueRes = await axios.get(`${baseURL}/schedule`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (queueRes.data && queueRes.data.success && queueRes.data.count >= 1) {
      console.log('  -> Verified schedule exists in the upcoming queue.');
    } else {
      throw new Error('Schedules queue validation failed.');
    }

    // Cancel schedule
    const cancelRes = await axios.delete(`${baseURL}/schedule/${scheduleId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (cancelRes.data && cancelRes.data.success) {
      console.log('  -> SUCCESS: Scheduled publication cancelled successfully.');
    } else {
      throw new Error('Cancellation failed.');
    }

    console.log('\n========================================================');
    console.log('   E2E WORKFLOW INTEGRATION STATUS: 100% NOMINAL        ');
    console.log('========================================================\n');

  } catch (error) {
    console.error('\n========================================================');
    console.error('   INTEGRATION FAILURE: WORKFLOW BROKEN                 ');
    console.error('========================================================');
    console.error('Error Details:', error.response?.data || error.message);
    console.log('========================================================\n');
    process.exit(1);
  }
}

runE2E();
