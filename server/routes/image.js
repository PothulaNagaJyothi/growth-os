const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  generateImage,
  uploadImage,
  getImagesByBlog,
} = require('../controllers/imageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();

// File upload filters & validations
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size limit: 5MB for images
  fileFilter: (req, file, cb) => {
    const filetypes = /png|jpg|jpeg|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Supported image formats are: .png, .jpg, .jpeg, and .webp only.'));
    }
  },
});

// Secure all endpoints under auth shield
router.use(protect);

router.post('/generate', generateImage);
router.post('/upload', upload.single('image'), uploadImage);
router.get('/:blogId', getImagesByBlog);

module.exports = router;
