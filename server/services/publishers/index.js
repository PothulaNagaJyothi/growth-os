const wordpressPublisher = require('./wordpressPublisher');
const htmlExporter = require('./htmlExporter');
const markdownExporter = require('./markdownExporter');

/**
 * Dispatches publication details to the selected publisher adapter.
 * @param {Object} blog - The Blog mongoose document
 * @param {string} platform - The target platform ('wordpress', 'html', 'markdown')
 * @param {Object} options - Options context passed to the adapter
 * @returns {Promise<Object>} The publication results
 */
exports.publish = async (blog, platform, options = {}) => {
  if (!platform) {
    throw new Error('Publishing platform parameter is required.');
  }

  const lowerPlatform = platform.toLowerCase().trim();

  switch (lowerPlatform) {
    case 'wordpress':
      return await wordpressPublisher.publishToWordPress(blog, options);
    case 'html':
      return await htmlExporter.exportHtml(blog, options);
    case 'markdown':
      return await markdownExporter.exportMarkdown(blog, options);
    default:
      throw new Error(`Unsupported publishing platform: "${platform}". Supported platforms: wordpress, html, markdown.`);
  }
};
