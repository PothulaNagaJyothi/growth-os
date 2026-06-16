const express = require('express');
const {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  suggestKeywords,
} = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.post('/suggest-keywords', suggestKeywords);

router.route('/')
  .get(getTopics)
  .post(createTopic);

router.route('/:id')
  .get(getTopicById)
  .put(updateTopic)
  .delete(deleteTopic);

module.exports = router;
