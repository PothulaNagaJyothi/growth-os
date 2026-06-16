const express = require('express');
const multer = require('multer');
const path = require('path');
const { getCompany, createCompany, updateCompany, uploadLogo, deleteLogo } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Multer memory storage configuration for logo
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB for company logo
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

router.use(protect); // Secure all company routes

router.route('/')
  .get(getCompany)
  .post(createCompany);

router.post('/upload-logo', upload.single('logo'), uploadLogo);
router.delete('/delete-logo', deleteLogo);

router.route('/:id')
  .put(updateCompany);

module.exports = router;
