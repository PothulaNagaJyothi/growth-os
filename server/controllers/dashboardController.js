const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Blog = require('../models/Blog');
const RenderedBlog = require('../models/RenderedBlog');
const Schedule = require('../models/Schedule');
const Telemetry = require('../models/Telemetry');
const KnowledgeBase = require('../models/KnowledgeBase');
const ImageMetadata = require('../models/ImageMetadata');

// @desc    Get dashboard metrics & activity feed
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const companyId = req.user.companyId;

    // 1. Content Overview counts
    const draftCount = await Blog.countDocuments({ companyId, status: { $regex: /^draft$/i } });
    const publishedCount = await Blog.countDocuments({ companyId, status: { $regex: /^published$/i } });
    const scheduledCount = await Blog.countDocuments({ companyId, status: { $regex: /^scheduled$/i } });

    // Average SEO Score
    const seoAvgResult = await Blog.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: null, avgScore: { $avg: '$seoScore' } } }
    ]);
    const averageSeoScore = seoAvgResult.length > 0 ? Math.round(seoAvgResult[0].avgScore) : 0;

    // 2. Action Required queries
    // Blogs with SEO Score below 80
    const lowSeoBlogs = await Blog.find({ companyId, seoScore: { $lt: 80 } })
      .select('_id title seoScore')
      .sort({ seoScore: 1 })
      .limit(5);

    // Drafts awaiting review
    const draftsAwaitingReview = await Blog.find({ companyId, status: { $regex: /^draft$/i } })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Blogs missing cover images (no ImageMetadata record associated)
    const allBlogs = await Blog.find({ companyId }).select('_id title updatedAt');
    const imageMetadatas = await ImageMetadata.find({ companyId }).select('blogId');
    const blogIdsWithImages = new Set(imageMetadatas.map(img => img.blogId.toString()));
    const blogsMissingImages = allBlogs
      .filter(b => !blogIdsWithImages.has(b._id.toString()))
      .slice(0, 5)
      .map(b => ({
        _id: b._id,
        title: b.title,
        updatedAt: b.updatedAt
      }));

    // 3. Content Pipeline Stage Counts
    // Ideas = Topics in 'draft' status
    const pipelineIdeas = await Topic.countDocuments({ companyId, status: 'draft' });
    // Research = Topics in 'active' status
    const pipelineResearch = await Topic.countDocuments({ companyId, status: 'active' });
    // Draft = Blogs in 'draft' status
    const pipelineDraft = draftCount;
    // Ready = Blogs in 'approved' or 'ready' status
    const pipelineReady = await Blog.countDocuments({ companyId, status: { $regex: /^(ready|approved)$/i } });
    // Published = Blogs in 'published' status
    const pipelinePublished = publishedCount;

    // 4. Upcoming Content (scheduled posts from Schedule and direct Blog scheduled statuses)
    const upcomingSchedules = await Schedule.find({
      companyId,
      status: 'scheduled'
    })
      .populate('blogId', 'title')
      .sort({ scheduledDate: 1 })
      .limit(5);

    const upcoming = upcomingSchedules.map(s => ({
      _id: s.blogId?._id || s._id,
      title: s.blogId?.title || s.publishOptions?.title || 'Untitled Scheduled Post',
      scheduledDate: s.scheduledDate,
      platform: s.publishPlatform || 'Blog'
    }));

    const directScheduledBlogs = await Blog.find({
      companyId,
      status: { $regex: /^scheduled$/i }
    })
      .select('_id title publishDate')
      .sort({ publishDate: 1 })
      .limit(5);

    const mergedUpcoming = [...upcoming];
    directScheduledBlogs.forEach(sb => {
      if (!mergedUpcoming.some(item => item.title === sb.title)) {
        mergedUpcoming.push({
          _id: sb._id,
          title: sb.title,
          scheduledDate: sb.publishDate || new Date(),
          platform: 'Canonical'
        });
      }
    });
    const finalUpcoming = mergedUpcoming
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .slice(0, 5);

    // 5. Keyword Opportunities
    const topicsForKeywords = await Topic.find({ companyId }).select('keywords');
    const keywordCounts = {};
    topicsForKeywords.forEach(t => {
      if (Array.isArray(t.keywords)) {
        t.keywords.forEach(kw => {
          const cleanKw = kw.trim();
          if (cleanKw) {
            keywordCounts[cleanKw] = (keywordCounts[cleanKw] || 0) + 1;
          }
        });
      }
    });
    const sortedKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    const fallbackKeywords = ['startup marketing', 'growth hacking', 'content strategy', 'SEO optimization', 'product-led growth', 'inbound sales', 'founder brand'];
    const finalKeywords = [...new Set([...sortedKeywords, ...fallbackKeywords])].slice(0, 5);

    // 6. Knowledge Base Summary
    const kbCount = await KnowledgeBase.countDocuments({ companyId });
    const latestKb = await KnowledgeBase.findOne({ companyId }).sort({ updatedAt: -1 }).select('updatedAt');
    const lastUpdated = latestKb ? latestKb.updatedAt : null;
    const sourcesCount = await KnowledgeBase.distinct('fileName', { companyId }).then(res => res.length);
    const coveragePercentage = kbCount > 0 ? Math.min(95, 35 + kbCount * 12) : 0;

    // 7. Recent Activity (Chronological feed of Telemetry & document mutations)
    const [
      recentTopics,
      recentBlogs,
      recentSchedules,
      recentTelemetries
    ] = await Promise.all([
      Topic.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      Blog.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      Schedule.find({ companyId }).sort({ createdAt: -1 }).limit(5).populate('blogId'),
      Telemetry.find({ companyId }).sort({ createdAt: -1 }).limit(10)
    ]);

    const activities = [];

    recentTelemetries.forEach(tel => {
      let title = 'AI Operation';
      switch (tel.processType) {
        case 'canonical_generation': title = 'Generated Blog Canonical Outline'; break;
        case 'visual_outline_generation': title = 'Generated Visual Outline'; break;
        case 'blog_expansion': title = 'Expanded Blog Content'; break;
        case 'platform_rendering': title = 'Adapted Blog for Platform'; break;
        case 'image_prompt_generation': title = 'Created AI Image Prompts'; break;
        case 'image_generation': title = 'Generated Cover Image'; break;
        case 'seo_optimization': title = 'Optimized Canonical Blog SEO'; break;
        case 'platform_seo_optimization': title = 'Optimized Platform Blog SEO'; break;
        case 'logo_analysis': title = 'Analyzed Brand Logo'; break;
        case 'content_healing': title = 'Healed Blog Content'; break;
        case 'keyword_suggestion': title = 'Generated Keyword Recommendations'; break;
        case 'market_research': title = 'Completed Market Research'; break;
        case 'document_summarization': title = 'Processed Knowledge Base Document'; break;
      }
      activities.push({
        action: title,
        target: `Tokens: ${tel.totalTokens?.toLocaleString() || 0} (${tel.modelName})`,
        timestamp: tel.createdAt,
        type: 'AI'
      });
    });

    recentTopics.forEach(t => {
      activities.push({
        action: 'Created Topic Idea',
        target: t.topicName,
        timestamp: t.createdAt,
        type: 'Topic'
      });
    });

    recentBlogs.forEach(b => {
      activities.push({
        action: 'Drafted Article',
        target: b.title,
        timestamp: b.createdAt,
        type: 'Blog'
      });
    });

    recentSchedules.forEach(s => {
      activities.push({
        action: s.status === 'published' ? 'Published Post' : 'Scheduled Post',
        target: s.blogId ? s.blogId.title : 'Adapted Post',
        timestamp: s.createdAt,
        type: 'Schedule'
      });
    });

    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          draftBlogs: draftCount,
          publishedBlogs: publishedCount,
          scheduledBlogs: scheduledCount,
          averageSeoScore
        },
        actionRequired: {
          lowSeoBlogs,
          draftsAwaitingReview,
          blogsMissingImages
        },
        contentPipeline: {
          ideas: pipelineIdeas,
          research: pipelineResearch,
          draft: pipelineDraft,
          ready: pipelineReady,
          published: pipelinePublished
        },
        upcomingContent: finalUpcoming,
        keywordOpportunities: finalKeywords,
        knowledgeBase: {
          totalDocuments: kbCount,
          lastUpdated,
          sourcesCount,
          coveragePercentage
        },
        recentActivity: sortedActivities
      }
    });
  } catch (error) {
    next(error);
  }
};
