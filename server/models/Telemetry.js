const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    processType: {
      type: String,
      required: true,
      enum: [
        'canonical_generation',
        'visual_outline_generation',
        'blog_expansion',
        'platform_rendering',
        'image_prompt_generation',
        'image_generation',
        'seo_optimization',
        'platform_seo_optimization',
        'logo_analysis',
        'content_healing',
        'keyword_suggestion'
      ],
    },
    modelName: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Telemetry', TelemetrySchema);
