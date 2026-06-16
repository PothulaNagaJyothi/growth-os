const express = require('express');
const {
  generateResearch,
  getResearchByCampaign,
  getResearches,
  deleteResearch,
} = require('../controllers/researchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.post('/generate', generateResearch);
router.get('/:topicId', getResearchByCampaign);

// Optional helper list and delete routes
router.get('/', getResearches);
router.delete('/:id', deleteResearch);

module.exports = router;
