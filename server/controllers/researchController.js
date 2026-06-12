const Research = require('../models/Research');
const Campaign = require('../models/Campaign');
const researchEngine = require('../services/research-engine/researchEngine');

// @desc    Trigger AI research synthesis for a campaign and store it
// @route   POST /api/research/generate
// @access  Private
exports.generateResearch = async (req, res, next) => {
  try {
    const { campaignId } = req.body;
    if (!campaignId) {
      return res.status(400).json({ success: false, error: 'Campaign ID is required' });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    // 1. Verify campaign exists and belongs to user's company
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to research this campaign' });
    }

    // 2. Synthesize using ResearchEngine service
    const synthesizedData = await researchEngine.synthesizeResearch(req.user.companyId, campaignId);

    // 3. Save to database - Overwrite existing research if it already exists for this campaign, or create a new one!
    // Since unique is campaignId, let's do an upsert to keep the DB clean and avoid duplicate key errors.
    const research = await Research.findOneAndUpdate(
      { campaignId },
      {
        companyId: req.user.companyId,
        campaignId,
        news: synthesizedData.news,
        keywords: synthesizedData.keywords,
        competitorAnalysis: synthesizedData.competitorAnalysis,
        suggestedAngles: synthesizedData.suggestedAngles,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      success: true,
      data: research,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get research report for a specific campaign
// @route   GET /api/research/:campaignId
// @access  Private
exports.getResearchByCampaign = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    // Verify campaign belongs to company
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to access research for this campaign' });
    }

    const researchRecord = await Research.findOne({
      companyId: req.user.companyId,
      campaignId: req.params.campaignId,
    }).populate('campaignId');

    if (!researchRecord) {
      return res.status(404).json({
        success: false,
        error: 'No research report found for this campaign context. Synthesize one first.',
      });
    }

    res.status(200).json({
      success: true,
      data: researchRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all research reports for the company context (Optional utility)
// @route   GET /api/research
// @access  Private
exports.getResearches = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const researchRecords = await Research.find({ companyId: req.user.companyId }).populate('campaignId');
    res.status(200).json({
      success: true,
      count: researchRecords.length,
      data: researchRecords,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a research report (Optional utility)
// @route   DELETE /api/research/delete/:id
// @access  Private
exports.deleteResearch = async (req, res, next) => {
  try {
    const research = await Research.findById(req.params.id);

    if (!research) {
      return res.status(404).json({ success: false, error: 'Research report not found' });
    }

    if (research.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this research report' });
    }

    await Research.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Research report removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
