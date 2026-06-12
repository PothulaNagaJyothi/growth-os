const mongoose = require('mongoose');
const aiService = require('./services/aiService');
const contentValidator = require('./services/content-engine/contentValidator');

// Configure custom environment configurations before loading the server app
process.env.PORT = '4575'; // Use distinct test port
process.env.NODE_ENV = 'test';

console.log('======================================================');
console.log('    GROWTH OS - ITERATIVE CORRECTION TEST SUITE       ');
console.log('======================================================');

// Import the server to initialize the connection
const server = require('./app');

// Resilient polling for MongoDB connection ready state before running tests
const pollInterval = setInterval(async () => {
  if (mongoose.connection.readyState === 1) {
    clearInterval(pollInterval);
    console.log('MongoDB connection is OPEN. Launching Correction tests...\n');
    runCorrectionTests();
  }
}, 200);

async function runCorrectionTests() {
  try {
    // ----------------------------------------------------
    // Test 1: Content validation correction loop - Expansion
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Expansion Correction Loop (< 800 words)...');

    // Save the original queryAI
    const originalQueryAI = aiService.queryAI;

    // Stub queryAI to simulate iterative correction
    let queryCount = 0;
    aiService.queryAI = async function (messages, options) {
      queryCount++;
      console.log(`  -> Mock queryAI called (Call #${queryCount})`);
      if (queryCount === 1) {
        // Return a slightly longer but still invalid content (< 800 words)
        return 'word '.repeat(700);
      } else {
        // Finally return compliant content (> 800 words)
        return 'word '.repeat(900);
      }
    };

    const shortContent = 'word '.repeat(500); // 500 words
    console.log(`Initial word count: ${contentValidator.countWords(shortContent)}`);
    
    const expandedResult = await aiService.adjustContentLength(shortContent);
    const finalWordCount = contentValidator.countWords(expandedResult);
    console.log(`Final word count after correction: ${finalWordCount}`);

    if (queryCount !== 2) {
      throw new Error(`Expected queryAI to be called twice, but got ${queryCount}`);
    }
    if (finalWordCount !== 900) {
      throw new Error(`Expected final word count to be 900, but got ${finalWordCount}`);
    }
    console.log('  -> SUCCESS: Expansion correction loop executed iteratively.');

    // ----------------------------------------------------
    // Test 2: Content validation correction loop - Condensation
    // ----------------------------------------------------
    console.log('\n[TEST 2] Testing Condensation Correction Loop (> 1200 words)...');
    
    queryCount = 0;
    aiService.queryAI = async function (messages, options) {
      queryCount++;
      console.log(`  -> Mock queryAI called (Call #${queryCount})`);
      if (queryCount === 1) {
        // Return a slightly shorter but still invalid content (> 1200 words)
        return 'word '.repeat(1300);
      } else {
        // Finally return compliant content (< 1200 words)
        return 'word '.repeat(1000);
      }
    };

    const longContent = 'word '.repeat(1500); // 1500 words
    console.log(`Initial word count: ${contentValidator.countWords(longContent)}`);
    
    const condensedResult = await aiService.adjustContentLength(longContent);
    const finalWordCountCondensed = contentValidator.countWords(condensedResult);
    console.log(`Final word count after correction: ${finalWordCountCondensed}`);

    if (queryCount !== 2) {
      throw new Error(`Expected queryAI to be called twice, but got ${queryCount}`);
    }
    if (finalWordCountCondensed !== 1000) {
      throw new Error(`Expected final word count to be 1000, but got ${finalWordCountCondensed}`);
    }
    console.log('  -> SUCCESS: Condensation correction loop executed iteratively.');

    // Restore original queryAI
    aiService.queryAI = originalQueryAI;

    console.log('\n======================================================');
    console.log('  CORRECTION TESTS PASSED: 100% NOMINAL                ');
    console.log('======================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n======================================================');
    console.error('   CORRECTION TEST FAILURE DETECTED                    ');
    console.error('======================================================');
    console.error('Error Details:', error.message);
    console.log('======================================================\n');
    process.exit(1);
  }
}
