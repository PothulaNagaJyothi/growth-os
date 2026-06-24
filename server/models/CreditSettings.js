const mongoose = require('mongoose');

const CreditSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      default: 'credits',
      unique: true,
    },
    defaultSignupCredits: {
      type: Number,
      default: 25,
    },
    textGenerationCost: {
      type: Number,
      default: 1,
    },
    imageGenerationCost: {
      type: Number,
      default: 3,
    },
    websiteAnalysisCost: {
      type: Number,
      default: 5,
    },
    researchAnalysisCost: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CreditSettings', CreditSettingsSchema);
