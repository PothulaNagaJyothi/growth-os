const Company = require('../../models/Company');
const Campaign = require('../../models/Campaign');
const Persona = require('../../models/Persona');
const KnowledgeBase = require('../../models/KnowledgeBase');
const aiService = require('../aiService');

class ResearchEngine {
  /**
   * Generates a market research synthesis report by delegating to the reusable AIService
   * @param {string} companyId - User's company ID context
   * @param {string} campaignId - Targeted campaign ID
   */
  async synthesizeResearch(companyId, campaignId) {
    try {
      // 1. Fetch Campaign and populate references
      const campaign = await Campaign.findById(campaignId).populate('personaId');
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Verify company ownership context
      if (campaign.companyId.toString() !== companyId.toString()) {
        throw new Error('Unauthorized company context for campaign');
      }

      // 2. Fetch Company details
      let companyProfile = await Company.findById(companyId);
      if (!companyProfile) {
        companyProfile = await Company.findOne({ createdBy: companyId });
      }

      const companyData = companyProfile || {
        companyName: 'Growth OS Client',
        industry: 'Technology',
        brandVoice: 'Professional, Innovative',
        competitors: [],
        targetAudience: 'Early Adopters',
        productDescription: 'Enterprise software solution',
      };

      // 3. Fetch Grounding context
      const knowledgeDocs = await KnowledgeBase.find({ companyId });
      let knowledgeContext = '';
      if (knowledgeDocs && knowledgeDocs.length > 0) {
        knowledgeContext = knowledgeDocs
          .slice(0, 3)
          .map((doc) => `[Reference Doc: ${doc.fileName}]\n${doc.extractedText.slice(0, 1000)}...`)
          .join('\n\n');
      }

      const persona = campaign.personaId || {
        personaName: 'General Audience',
        tone: 'Informative',
        writingStyle: 'Direct',
        audienceType: 'SaaS Professionals',
      };

      // 4. Delegate to AIService
      const synthesizedData = await aiService.generateResearch(
        campaign,
        companyData,
        persona,
        knowledgeContext
      );

      return {
        topic: campaign.topic,
        news: synthesizedData.news,
        keywords: synthesizedData.keywords,
        competitorAnalysis: synthesizedData.competitorAnalysis,
        suggestedAngles: synthesizedData.suggestedAngles,
      };
    } catch (err) {
      console.error('[RESEARCH DELEGATION ERROR]', err);
      throw err;
    }
  }
}

module.exports = new ResearchEngine();
