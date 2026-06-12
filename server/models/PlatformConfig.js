const mongoose = require('mongoose');

const PlatformConfigSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    titleRules: {
      type: String,
      default: '',
    },
    structureRules: {
      type: String,
      default: '',
    },
    seoRules: {
      type: String,
      default: '',
    },
    imageRules: {
      type: String,
      default: '',
    },
    ctaRules: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlatformConfig', PlatformConfigSchema);
