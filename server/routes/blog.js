const express = require('express');
const {
  generateBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  getBlogByTopic,
  optimizeBlog,
  getBlogVersions,
  restoreBlogVersion,
  approveBlog,
  publishBlog,
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.post('/generate', generateBlog);
router.get('/topic/:topicId', getBlogByTopic);
router.post('/:id/optimize', optimizeBlog);
router.get('/:id/versions', getBlogVersions);
router.post('/:id/restore/:version', restoreBlogVersion);
router.post('/:id/approve', approveBlog);
router.post('/:id/publish', publishBlog);

router.route('/')
  .get(getBlogs);

router.route('/:id')
  .get(getBlogById)
  .put(updateBlog);

module.exports = router;
