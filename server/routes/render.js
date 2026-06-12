const express = require('express');
const {
  generatePlatformRender,
  getRenderedBlog,
  getRenderByBlogAndPlatform,
} = require('../controllers/renderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.post('/:platform', generatePlatformRender);
router.get('/blog/:blogId/platform/:platformName', getRenderByBlogAndPlatform);
router.get('/:id', getRenderedBlog);

module.exports = router;
