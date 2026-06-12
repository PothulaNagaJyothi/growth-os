const Blog = require('../models/Blog');
const Schedule = require('../models/Schedule');

// @desc    Get all blogs in calendar view (scoped to company context)
// @route   GET /api/calendar
// @access  Private
exports.getCalendar = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const filter = { companyId: req.user.companyId };
    
    // Support optional filters with robust array and casing support
    if (req.query.status) {
      const statusList = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
      const normalizedStatuses = [];
      statusList.forEach(s => {
        if (typeof s === 'string') {
          const lower = s.toLowerCase();
          const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
          normalizedStatuses.push(lower);
          normalizedStatuses.push(capitalized);
        }
      });
      if (normalizedStatuses.length > 0) {
        filter.status = { $in: normalizedStatuses };
      }
    }

    if (req.query.author) {
      const authorList = Array.isArray(req.query.author) ? req.query.author : [req.query.author];
      filter.author = { $in: authorList };
    }

    if (req.query.keywordCategory) {
      const categoryList = Array.isArray(req.query.keywordCategory) ? req.query.keywordCategory : [req.query.keywordCategory];
      filter.keywordCategory = { $in: categoryList };
    }

    const blogs = await Blog.find(filter)
      .select('title publishDate status author keywordCategory createdAt')
      .sort({ publishDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule a blog post (update publishDate and sync Schedule document)
// @route   PATCH /api/calendar/:id/reschedule
// @access  Private
exports.rescheduleBlog = async (req, res, next) => {
  try {
    const { publishDate } = req.body;
    if (!publishDate) {
      return res.status(400).json({ success: false, error: 'Publish date is required' });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    if (blog.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify this blog' });
    }

    const targetDate = new Date(publishDate);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    blog.publishDate = targetDate;

    // Sync with existing schedule documents if status is scheduled
    if (blog.status === 'scheduled') {
      const schedule = await Schedule.findOne({ blogId: blog._id, status: 'scheduled' });
      if (schedule) {
        schedule.scheduledDate = targetDate;
        await schedule.save();
      }
    }

    await blog.save();

    res.status(200).json({
      success: true,
      data: {
        _id: blog._id,
        title: blog.title,
        publishDate: blog.publishDate,
        status: blog.status,
        author: blog.author,
        keywordCategory: blog.keywordCategory,
      },
      message: 'Blog publication successfully rescheduled.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of a blog post (and handle Schedule deletion/creation)
// @route   PATCH /api/calendar/:id/status
// @access  Private
exports.updateBlogStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const validStatuses = ['draft', 'approved', 'scheduled', 'published', 'archived'];
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    if (blog.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify this blog' });
    }

    const oldStatus = blog.status;
    blog.status = normalizedStatus;

    if (normalizedStatus === 'scheduled') {
      // Must have valid future publish date
      if (!blog.publishDate) {
        return res.status(400).json({ success: false, error: 'Cannot schedule a blog without a publish date set.' });
      }
      if (new Date(blog.publishDate) <= new Date()) {
        return res.status(400).json({ success: false, error: 'Cannot schedule a blog with a past publish date.' });
      }

      // Check if a Schedule document already exists, if not, create one
      const existingSchedule = await Schedule.findOne({ blogId: blog._id, status: 'scheduled' });
      if (!existingSchedule) {
        await Schedule.create({
          companyId: req.user.companyId,
          blogId: blog._id,
          publishPlatform: 'html', // default fallback platform
          publishOptions: {},
          scheduledDate: blog.publishDate,
          timezone: 'UTC',
          status: 'scheduled',
        });
      }
    } else {
      // If transitioning away from scheduled, cleanup/delete any pending Schedule documents
      if (oldStatus === 'scheduled' || normalizedStatus !== 'scheduled') {
        await Schedule.deleteMany({ blogId: blog._id, status: 'scheduled' });
      }

      // If transitioning to published, update publishDate
      if (normalizedStatus === 'published') {
        blog.publishDate = new Date();
        if (!blog.publishInfo) {
          blog.publishInfo = {};
        }
        blog.publishInfo.publishedAt = new Date();
        blog.publishInfo.platform = blog.publishInfo.platform || 'html';
      }
    }

    await blog.save();

    res.status(200).json({
      success: true,
      data: {
        _id: blog._id,
        title: blog.title,
        publishDate: blog.publishDate,
        status: blog.status,
        author: blog.author,
        keywordCategory: blog.keywordCategory,
      },
      message: `Blog status updated successfully to ${normalizedStatus}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic filters for calendar (unique statuses, authors, categories)
// @route   GET /api/calendar/filters
// @access  Private
exports.getCalendarFilters = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const companyId = req.user.companyId;

    const [statuses, authors, categories] = await Promise.all([
      Blog.distinct('status', { companyId }),
      Blog.distinct('author', { companyId }),
      Blog.distinct('keywordCategory', { companyId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        statuses: statuses.filter(Boolean),
        authors: authors.filter(Boolean),
        categories: categories.filter(Boolean),
        keywordCategories: categories.filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
};
