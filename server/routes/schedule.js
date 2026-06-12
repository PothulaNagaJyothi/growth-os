const express = require('express');
const {
  schedulePost,
  getSchedules,
  cancelSchedule,
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.post('/', schedulePost);
router.get('/', getSchedules);
router.delete('/:id', cancelSchedule);

module.exports = router;
