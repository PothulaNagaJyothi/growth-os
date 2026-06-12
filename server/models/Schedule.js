const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    platformBlogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RenderedBlog',
      required: false,
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: false,
    },
    publishPlatform: {
      type: String,
      enum: ['wordpress', 'html', 'markdown'],
      required: false,
    },
    publishOptions: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'published', 'failed', 'cancelled'],
      default: 'scheduled',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Schedule', ScheduleSchema);
