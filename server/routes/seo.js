const express = require('express');
const { generateBriefController } = require('../controllers/seoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.post('/brief', generateBriefController);

module.exports = router;
