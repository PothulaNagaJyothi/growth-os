/**
 * Compiles the blog post into a clean Markdown document with Front Matter metadata.
 * @param {Object} blog - The Blog mongoose document
 * @param {Object} options - Custom configuration parameters (optional)
 * @returns {Promise<Object>} The publication results
 */
exports.exportMarkdown = async (blog, options = {}) => {
  const frontMatter = [
    '---',
    `title: "${blog.title.replace(/"/g, '\\"')}"`,
    `metaDescription: "${(blog.metaDescription || '').replace(/"/g, '\\"')}"`,
    `keyword: "${(blog.keyword || '').replace(/"/g, '\\"')}"`,
    `slug: "${blog.slug}"`,
    `seoScore: ${blog.seoScore || 0}`,
    `exportedAt: "${new Date().toISOString()}"`,
    '---',
    ''
  ].join('\n');

  const markdownDocument = `${frontMatter}\n# ${blog.title}\n\n${blog.content}`;

  return {
    success: true,
    externalId: 'md-' + Date.now(),
    url: '',
    exportData: markdownDocument,
    message: 'Markdown document compiled successfully.'
  };
};
