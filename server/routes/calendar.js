const express = require('express');
const {
  getCalendar,
  rescheduleBlog,
  updateBlogStatus,
  getCalendarFilters,
} = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.get('/', getCalendar);
router.get('/filters', getCalendarFilters);
router.patch('/:id/reschedule', rescheduleBlog);
router.patch('/:id/status', updateBlogStatus);

module.exports = router;
