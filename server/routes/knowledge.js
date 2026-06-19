const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
  extractBrandContext,
  updateDocumentSummary
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();

// File upload filters & validations
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size limit: 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx|txt|plain|octet-stream|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Supported file extensions are: .pdf, .docx, and .txt only.'));
    }
  },
});

// Secure all endpoints under auth shield
router.use(protect);

router.route('/')
  .get(getDocuments);

// Single file upload bound to field 'file'
router.post('/upload', upload.single('file'), uploadDocument);

router.post('/:id/extract', extractBrandContext);
router.put('/:id/summary', updateDocumentSummary);

router.route('/:id')
  .delete(deleteDocument);

module.exports = router;
