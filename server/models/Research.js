const mongoose = require('mongoose');

const ResearchSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      unique: true, // One research report per campaign
    },
    news: {
      type: String,
      default: '',
    },
    keywords: [
      {
        keyword: { type: String, required: true },
        volume: { type: String, default: 'Moderate' },
        difficulty: { type: String, default: 'Medium' },
        intent: { type: String, default: 'Informational' },
      },
    ],
    competitorAnalysis: {
      type: String,
      default: '',
    },
    suggestedAngles: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Research', ResearchSchema);
