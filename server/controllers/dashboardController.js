const Campaign = require('../models/Campaign');
const Blog = require('../models/Blog');
const RenderedBlog = require('../models/RenderedBlog');
const Schedule = require('../models/Schedule');

// @desc    Get dashboard metrics & activity feed
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const companyId = req.user.companyId;

    // 1. Fetch counts
    const [
      activeCampaigns,
      blogsGenerated,
      scheduledPosts,
      publishedPosts
    ] = await Promise.all([
      Campaign.countDocuments({ companyId, status: { $ne: 'completed' } }),
      Blog.countDocuments({ companyId }),
      Schedule.countDocuments({ companyId, status: 'scheduled' }),
      Schedule.countDocuments({ companyId, status: 'published' })
    ]);

    // 2. Fetch recent records for activity log
    const [
      recentCampaigns,
      recentBlogs,
      recentRenders,
      recentSchedules
    ] = await Promise.all([
      Campaign.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      Blog.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      RenderedBlog.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      Schedule.find({ companyId }).sort({ createdAt: -1 }).limit(5).populate('platformBlogId')
    ]);

    // 3. Normalize activities into a unified chronological array
    const activities = [];

    recentCampaigns.forEach(c => {
      activities.push({
        action: 'Created Campaign',
        target: c.campaignName,
        timestamp: c.createdAt,
        type: 'Campaign'
      });
    });

    recentBlogs.forEach(b => {
      activities.push({
        action: 'Generated Canonical Outline',
        target: b.title,
        timestamp: b.createdAt,
        type: 'Generation'
      });
    });

    recentRenders.forEach(r => {
      activities.push({
        action: `Rendered ${r.platformName} draft`,
        target: r.title || 'Adapted draft',
        timestamp: r.createdAt,
        type: 'Render'
      });
    });

    recentSchedules.forEach(s => {
      const platformName = s.platformBlogId ? s.platformBlogId.platformName : 'Social';
      const title = s.platformBlogId ? s.platformBlogId.title : 'Adapted Post';
      activities.push({
        action: s.status === 'published' ? `Published ${platformName} Post` : `Scheduled ${platformName} Post`,
        target: title,
        timestamp: s.createdAt,
        type: 'Schedule'
      });
    });

    // Sort by timestamp descending and take the top 6
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          activeCampaigns,
          blogsGenerated,
          scheduledPosts,
          publishedPosts
        },
        recentActivity: sortedActivities
      }
    });
  } catch (error) {
    next(error);
  }
};
