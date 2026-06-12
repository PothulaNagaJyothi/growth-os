const mongoose = require('mongoose');

const ImageMetadataSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    prompt: {
      type: String,
      trim: true,
      default: '',
    },
    dimensions: {
      type: String,
      trim: true,
      default: '1024x1024',
    },
    type: {
      type: String,
      enum: ['generated', 'uploaded'],
      default: 'generated',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ImageMetadata', ImageMetadataSchema);
