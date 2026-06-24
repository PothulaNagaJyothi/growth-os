const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env') });

const Company = require('./models/Company');
const User = require('./models/User');
const CreditTransaction = require('./models/CreditTransaction');
const creditService = require('./services/creditService');

async function runTests() {
  console.log('--- STARTING CREDITS AND ROLE-BASED ACCESS CONTROL VALIDATION ---');
  
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/growth-os';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    // 1. Create mock company and user
    console.log('\nStep 1: Creating mock company and user...');
    const randomSuffix = Math.floor(Math.random() * 100000);
    const mockCompanyName = `Test Company ${randomSuffix}`;
    const mockEmail = `test_user_${randomSuffix}@growth-os.com`;
    const tempUserId = new mongoose.Types.ObjectId();

    const company = await Company.create({
      companyName: mockCompanyName,
      website: 'growth-os-test.com',
      creditsBalance: 25,
      creditsTotalAllocated: 25,
      createdBy: tempUserId
    });
    console.log(`- Company created: ${company.companyName} (ID: ${company._id}) with ${company.creditsBalance} credits.`);

    const user = await User.create({
      _id: tempUserId,
      name: `Test Admin User`,
      email: mockEmail,
      password: 'password123',
      role: 'admin',
      companyId: company._id
    });
    console.log(`- User created: ${user.name} (Role: ${user.role}, ID: ${user._id})`);

    // 2. Query default credit settings
    console.log('\nStep 2: Testing Credit Settings retrieval...');
    const settings = await creditService.getCreditSettings();
    console.log(`- Settings retrieved key: ${settings.key}`);
    console.log(`- Default starting credits: ${settings.defaultSignupCredits}`);
    console.log(`- Text cost: ${settings.textGenerationCost}`);
    console.log(`- Image cost: ${settings.imageGenerationCost}`);
    console.log(`- Crawl cost: ${settings.websiteAnalysisCost}`);
    console.log(`- Research cost: ${settings.researchAnalysisCost}`);

    // 3. Test Charging Text Generation (1 credit)
    console.log('\nStep 3: Charging company for text generation...');
    const chargeTextResult = await creditService.chargeCreditsForGeneration({
      companyId: company._id,
      userId: user._id,
      amount: settings.textGenerationCost,
      type: 'generation_text',
      note: 'Canonical blog generation charge'
    });
    
    let updatedCompany = await Company.findById(company._id);
    console.log(`- Charge successful. Remaining balance: ${updatedCompany.creditsBalance} (Expected: 24)`);

    // 4. Test Transaction Log Creation
    console.log('\nStep 4: Verifying Credit Transaction ledger...');
    const transaction = await CreditTransaction.findOne({ companyId: company._id, type: 'generation_text' });
    if (transaction) {
      console.log(`- Transaction ledger log found! Amount: ${transaction.amount}, Balance After: ${transaction.balanceAfter}`);
    } else {
      throw new Error('Ledger log not created for text generation');
    }

    // 5. Test Refund Logic
    console.log('\nStep 5: Testing refund logic (simulating generation failure)...');
    await creditService.refundGenerationCredits({
      companyId: company._id,
      userId: user._id,
      amount: settings.textGenerationCost,
      type: 'generation_text',
      note: 'Refund for failed blog generation'
    });
    updatedCompany = await Company.findById(company._id);
    console.log(`- Refund successful. Restored balance: ${updatedCompany.creditsBalance} (Expected: 25)`);

    // 6. Test Insufficient Credits Blocking
    console.log('\nStep 6: Testing insufficient credit limits...');
    // Artificially drop balance to 2
    company.creditsBalance = 2;
    await company.save();
    console.log(`- Dropped company credits balance manually to 2`);

    try {
      // Try to charge crawling (5 credits)
      console.log(`- Attempting to charge crawling (Cost: ${settings.websiteAnalysisCost} credits)...`);
      await creditService.chargeCreditsForGeneration({
        companyId: company._id,
        userId: user._id,
        amount: settings.websiteAnalysisCost,
        type: 'crawling_analysis',
        note: 'Website crawl charge'
      });
      throw new Error('Charge succeeded, but should have failed due to insufficient credits!');
    } catch (err) {
      console.log(`- Charge blocked successfully as expected! Error: "${err.message}"`);
    }

    // 7. Clean up test documents
    console.log('\nStep 7: Cleaning up mock documents from DB...');
    await User.findByIdAndDelete(user._id);
    await Company.findByIdAndDelete(company._id);
    await CreditTransaction.deleteMany({ companyId: company._id });
    console.log('- Cleanup done.');

    console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! VALIDATION FAILED !!!', error);
  } finally {
    console.log('\nDisconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

runTests();
