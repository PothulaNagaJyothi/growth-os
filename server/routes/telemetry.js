const express = require('express');
const router = express.Router();
const { getTelemetryStats } = require('../controllers/telemetryController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getTelemetryStats);

module.exports = router;
