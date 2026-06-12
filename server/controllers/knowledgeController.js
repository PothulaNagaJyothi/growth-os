const KnowledgeBase = require('../models/KnowledgeBase');
const cloudinaryService = require('../services/cloudinaryService');
const textExtractor = require('../services/textExtractor');
const logger = require('../utils/logger');

// @desc    Get all company knowledge documents
// @route   GET /api/knowledge
// @access  Private
exports.getDocuments = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const documents = await KnowledgeBase.find({ companyId: req.user.companyId });
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload new document and extract text
// @route   POST /api/knowledge/upload
// @access  Private
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please provide a file to upload' });
    }

    const { originalname, buffer, mimetype } = req.file;

    logger.info(`Starting upload process for file: ${originalname} (${mimetype})`);

    // 1. Upload file buffer to Cloudinary (or local filesystem fallback)
    const uploadResult = await cloudinaryService.uploadBuffer(buffer, originalname);
    logger.info(`Upload completed. Sourced URL: ${uploadResult.url}`);

    // 2. Extract raw text from buffer based on file type
    logger.info(`Starting text extraction for file: ${originalname}`);
    const extractedText = await textExtractor.extractText(buffer, mimetype, originalname);
    logger.info(`Text extraction completed. Extracted length: ${extractedText.length} characters.`);

    // 3. Register KnowledgeBase record in MongoDB
    const document = await KnowledgeBase.create({
      companyId: req.user.companyId,
      fileName: originalname,
      fileType: originalname.split('.').pop().toLowerCase(),
      fileUrl: uploadResult.url,
      publicId: uploadResult.public_id,
      extractedText,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a knowledge document
// @route   DELETE /api/knowledge/:id
// @access  Private
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await KnowledgeBase.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Verify company ownership context
    if (document.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this document' });
    }

    // 1. Delete asset from Cloudinary or local uploads folder
    await cloudinaryService.deleteAsset(document.publicId);

    // 2. Delete database model record
    await KnowledgeBase.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Knowledge document removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
