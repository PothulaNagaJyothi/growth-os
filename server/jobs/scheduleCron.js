const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const logger = require('../utils/logger');

const initScheduleCron = () => {
  logger.info('Node-Cron Scheduler Background Worker service initialized.');
  
  // Execute every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find all scheduled posts that have reached or passed their publication date
      const pendingSchedules = await Schedule.find({
        status: 'scheduled',
        scheduledDate: { $lte: now }
      }).populate('platformBlogId');

      if (pendingSchedules.length > 0) {
        logger.info(`[CRON WORKER] Found ${pendingSchedules.length} pending publications at ${now.toLocaleString()}`);

        for (const schedule of pendingSchedules) {
          if (schedule.blogId) {
            const Blog = require('../models/Blog');
            const blog = await Blog.findById(schedule.blogId);
            
            if (blog) {
              logger.info(`[CRON WORKER] [PUBLISHING] Publishing canonical blog "${blog.title}" to ${schedule.publishPlatform}...`);
              
              const publishers = require('../services/publishers');
              const result = await publishers.publish(blog, schedule.publishPlatform, schedule.publishOptions || {});
              
              if (result.success) {
                blog.status = 'published';
                blog.publishDate = new Date();
                blog.publishInfo = {
                  platform: schedule.publishPlatform,
                  publishedAt: new Date(),
                  externalId: result.externalId,
                  url: result.url || '',
                  exportData: result.exportData || '',
                };

                // Add a version entry on publication
                const nextVersion = (blog.versions && blog.versions.length > 0)
                  ? Math.max(...blog.versions.map(v => v.version)) + 1
                  : 1;

                blog.versions.push({
                  version: nextVersion,
                  title: blog.title,
                  metaDescription: blog.metaDescription,
                  content: blog.content,
                  seoScore: blog.seoScore,
                  createdAt: new Date(),
                });

                await blog.save();
                logger.info(`[CRON WORKER] [SUCCESS] Canonical blog published successfully!`);
              }
            } else {
              logger.warn(`[CRON WORKER] Canonical blog not found for schedule ID: ${schedule._id}`);
            }
          } else {
            // Legacy social platform post scheduling
            const postTitle = schedule.platformBlogId?.title || 'Untitled Post';
            const platform = schedule.platformBlogId?.platformName || 'Unknown Platform';
            
            logger.info(`[CRON WORKER] [PUBLISHING] Simulating publish of "${postTitle}" to ${platform}...`);
          }
          
          // Transition status to published
          schedule.status = 'published';
          await schedule.save();

          logger.info(`[CRON WORKER] [SUCCESS] Published schedule ID: ${schedule._id}`);
        }
      }
    } catch (error) {
      logger.error(`[CRON WORKER ERROR] Failed during scheduled publication sweep: ${error.message}`);
    }
  });
};

module.exports = initScheduleCron;
