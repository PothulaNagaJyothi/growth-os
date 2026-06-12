const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Check if credentials exist for Cloudinary integration
const hasCloudinary = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary storage engine configuration loaded.');
} else {
  logger.warn('Cloudinary credentials missing in .env. Falling back to local file uploads.');
}

/**
 * Uploads a file buffer to Cloudinary or saves it locally as a fallback
 * @param {Buffer} fileBuffer - Sourced file buffer
 * @param {String} fileName - Sourced file name
 * @returns {Promise<Object>} - Sourced URL and asset key metadata
 */
exports.uploadBuffer = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    if (hasCloudinary) {
      // Stream upload directly to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'growth-os-knowledge',
          resource_type: 'auto', // Auto-detect format (image or raw doc)
          public_id: `${Date.now()}_${path.parse(fileName).name}`,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary Upload Stream Error: ' + error.message);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      );
      uploadStream.end(fileBuffer);
    } else {
      // Fallback: Store locally
      try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueName = `${Date.now()}_${fileName}`;
        const filePath = path.join(uploadDir, uniqueName);

        fs.writeFileSync(filePath, fileBuffer);
        
        // Sourced URL maps statically to backend Express uploads route
        const localUrl = `/uploads/${uniqueName}`;
        
        resolve({
          url: localUrl,
          public_id: uniqueName,
        });
      } catch (error) {
        logger.error('Local File Upload Fallback Error: ' + error.message);
        reject(error);
      }
    }
  });
};

/**
 * Deletes a file asset from Cloudinary or local uploads folder
 * @param {String} publicId - Sourced asset key metadata
 */
exports.deleteAsset = async (publicId, resourceType) => {
  if (hasCloudinary) {
    try {
      const isRaw = resourceType === 'raw' || (publicId && /\.(pdf|docx|txt|doc|xls|xlsx|csv|pptx|ppt)$/i.test(publicId));
      const rType = isRaw ? 'raw' : 'image';
      await cloudinary.uploader.destroy(publicId, { resource_type: rType });
      logger.info(`Successfully deleted Cloudinary ${rType} asset: ${publicId}`);
    } catch (error) {
      logger.error(`Cloudinary Delete Error: ${error.message}`);
    }
  } else {
    try {
      const filePath = path.join(__dirname, '../uploads', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Successfully deleted local asset file: ${publicId}`);
      }
    } catch (error) {
      logger.error(`Local File Delete Error: ${error.message}`);
    }
  }
};
