const Schedule = require('../models/Schedule');
const RenderedBlog = require('../models/RenderedBlog');

// @desc    Schedule a platform adapted blog post for future publication
// @route   POST /api/schedule
// @access  Private
exports.schedulePost = async (req, res, next) => {
  try {
    const { platformBlogId, blogId, publishPlatform, publishOptions, scheduledDate, timezone = 'UTC' } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ success: false, error: 'Scheduled Date is required' });
    }

    if (!platformBlogId && !blogId) {
      return res.status(400).json({ success: false, error: 'Either Platform Blog ID or Canonical Blog ID is required' });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    let scheduleData = {
      companyId: req.user.companyId,
      scheduledDate: new Date(scheduledDate),
      timezone,
      status: 'scheduled',
    };

    if (platformBlogId) {
      // Verify existence of the rendered blog post
      const renderedBlog = await RenderedBlog.findById(platformBlogId);
      if (!renderedBlog) {
        return res.status(404).json({ success: false, error: 'Adapted platform post not found' });
      }

      // Verify company ownership context
      if (renderedBlog.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to schedule this post' });
      }

      scheduleData.platformBlogId = platformBlogId;
    } else {
      // Canonical blog flow
      if (!publishPlatform) {
        return res.status(400).json({ success: false, error: 'Publishing platform is required for scheduling canonical blogs' });
      }

      const Blog = require('../models/Blog');
      const blog = await Blog.findById(blogId);
      if (!blog) {
        return res.status(404).json({ success: false, error: 'Canonical blog post not found' });
      }

      if (blog.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to schedule this blog' });
      }

      if (blog.status !== 'approved' && blog.status !== 'draft') {
        return res.status(400).json({ success: false, error: `Cannot schedule blog from status: ${blog.status}` });
      }

      blog.status = 'scheduled';
      blog.publishDate = new Date(scheduledDate);
      await blog.save();

      scheduleData.blogId = blogId;
      scheduleData.publishPlatform = publishPlatform.toLowerCase();
      scheduleData.publishOptions = publishOptions || {};
    }

    // Create schedule record
    const schedule = await Schedule.create(scheduleData);

    // Populate the newly created schedule
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate({
        path: 'platformBlogId',
        populate: { path: 'blogId' }
      })
      .populate('blogId');

    res.status(201).json({
      success: true,
      data: populatedSchedule,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming schedules for the logged in user's company context
// @route   GET /api/schedule
// @access  Private
exports.getSchedules = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const schedules = await Schedule.find({
      companyId: req.user.companyId,
    })
      .populate({
        path: 'platformBlogId',
        populate: { path: 'blogId' }
      })
      .populate('blogId')
      .sort({ scheduledDate: 1 }); // Sort chronologically

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a scheduled publication (Delete schedule)
// @route   DELETE /api/schedule/:id
// @access  Private
exports.cancelSchedule = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule record not found' });
    }

    // Verify ownership
    if (schedule.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this schedule' });
    }

    // Revert canonical blog status if scheduled
    if (schedule.blogId) {
      const Blog = require('../models/Blog');
      const blog = await Blog.findById(schedule.blogId);
      if (blog && blog.status === 'scheduled') {
        blog.status = 'draft';
        blog.publishDate = null;
        await blog.save();
      }
    }

    // Delete schedule
    await Schedule.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Scheduled publication successfully cancelled.',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
