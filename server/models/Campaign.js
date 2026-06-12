const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    personaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Persona',
      required: [true, 'Persona selection is required'],
    },
    campaignName: {
      type: String,
      required: [true, 'Campaign Name is required'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Campaign Topic is required'],
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    platforms: {
      type: [String],
      default: [],
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Campaign', CampaignSchema);
