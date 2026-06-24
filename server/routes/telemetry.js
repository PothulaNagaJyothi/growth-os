const express = require('express');
const router = express.Router();
const { getTelemetryStats, getGlobalTelemetryStats } = require('../controllers/telemetryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getTelemetryStats);
router.get('/global-stats', protect, authorize('admin'), getGlobalTelemetryStats);

module.exports = router;

