const axios = require('axios');
const ImageMetadata = require('../models/ImageMetadata');
const Blog = require('../models/Blog');
const aiService = require('../services/aiService');
const cloudinaryService = require('../services/cloudinaryService');
const logger = require('../utils/logger');

// @desc    Generate DALL-E image and store permanently in Cloudinary or Local uploads fallback
// @route   POST /api/images/generate
// @access  Private
exports.generateImage = async (req, res, next) => {
  try {
    const { blogId, prompt, dimensions = '1024x1024' } = req.body;

    if (!blogId) {
      return res.status(400).json({ success: false, error: 'Blog ID is required' });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    // 1. Fetch Blog and verify context ownership
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Parent blog not found' });
    }

    if (blog.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage assets for this blog' });
    }

    // 2. Resolve or generate prompt dynamically
    let resolvedPrompt = prompt;
    if (!resolvedPrompt) {
      console.log('[IMAGE CONTROLLER] Prompt missing. Generating prompt dynamically using branding details...');
      const Company = require('../models/Company');
      const Topic = require('../models/Topic');
      const Persona = require('../models/Persona');

      const company = await Company.findById(req.user.companyId);
      let topic = null;
      let persona = null;

      if (blog.topicId) {
        topic = await Topic.findById(blog.topicId);
        if (topic && topic.personaId) {
          persona = await Persona.findById(topic.personaId);
        }
      }

      resolvedPrompt = await aiService.generateBrandedImagePrompt({
        blog,
        company,
        topic,
        persona,
        platform: req.body.platform || 'General'
      });
    }

    // 3. Dispatch image generation to DALL-E via AIService
    const tempUrl = await aiService.generateImage(resolvedPrompt, dimensions);

    // 4. Download DALL-E temp URL to buffer and upload to permanent storage
    let permanentUrl = tempUrl;
    let storageResult = { public_id: `temp_${Date.now()}` };

    try {
      let buffer;
      if (tempUrl.startsWith('data:image')) {
        console.log('[IMAGE CONTROLLER] Decoding DALL-E base64 image data to buffer...');
        const base64Data = tempUrl.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        console.log('[IMAGE CONTROLLER] Downloading DALL-E image buffer to store permanently...');
        const bufferResponse = await axios.get(tempUrl, { responseType: 'arraybuffer' });
        buffer = Buffer.from(bufferResponse.data, 'binary');
      }
      
      // Upload buffer
      storageResult = await cloudinaryService.uploadBuffer(buffer, `dalle_${blogId}_${Date.now()}.png`);
      permanentUrl = storageResult.url;
      console.log('[IMAGE CONTROLLER] Permanent storage URL generated successfully.');
    } catch (downloadErr) {
      console.warn('[IMAGE CONTROLLER WARNING] Sourced image download/upload failed. Sourced fallback tempUrl directly...', downloadErr.message);
    }

    // 5. Save metadata to database
    const metadata = await ImageMetadata.create({
      companyId: req.user.companyId,
      blogId,
      imageUrl: permanentUrl,
      prompt: resolvedPrompt,
      dimensions,
      type: 'generated',
    });

    res.status(201).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload file image asset manually
// @route   POST /api/images/upload
// @access  Private
exports.uploadImage = async (req, res, next) => {
  try {
    const { blogId } = req.body;
    
    if (!blogId) {
      return res.status(400).json({ success: false, error: 'Blog ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    // 1. Fetch Blog and verify context ownership
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Parent blog not found' });
    }

    if (blog.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage assets for this blog' });
    }

    // 2. Upload file buffer to permanent storage
    const storageResult = await cloudinaryService.uploadBuffer(req.file.buffer, req.file.originalname);

    // 3. Save metadata to database
    const metadata = await ImageMetadata.create({
      companyId: req.user.companyId,
      blogId,
      imageUrl: storageResult.url,
      prompt: `Uploaded asset: ${req.file.originalname}`,
      dimensions: 'custom',
      type: 'uploaded',
    });

    res.status(201).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all image metadata records associated with a blog post
// @route   GET /api/images/:blogId
// @access  Private
exports.getImagesByBlog = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const { blogId } = req.params;

    const images = await ImageMetadata.find({
      companyId: req.user.companyId,
      blogId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest branded prompt for DALL-E based on company & persona context
// @route   POST /api/images/suggest-prompt
// @access  Private
exports.suggestPrompt = async (req, res, next) => {
  try {
    const { blogId, platform = 'General' } = req.body;
    if (!blogId) {
      return res.status(400).json({ success: false, error: 'Blog ID is required' });
    }

    const Company = require('../models/Company');
    const Topic = require('../models/Topic');
    const Persona = require('../models/Persona');

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Parent blog not found' });
    }

    const company = await Company.findById(req.user.companyId);
    let topic = null;
    let persona = null;

    if (blog.topicId) {
      topic = await Topic.findById(blog.topicId);
      if (topic && topic.personaId) {
        persona = await Persona.findById(topic.personaId);
      }
    }

    const suggestedPrompt = await aiService.generateBrandedImagePrompt({
      blog,
      company,
      topic,
      persona,
      platform
    });

    res.status(200).json({
      success: true,
      data: suggestedPrompt
    });
  } catch (error) {
    next(error);
  }
};
