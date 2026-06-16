const seoOptimizer = require('../services/seo-engine/seoOptimizer');
const contentValidator = require('../services/content-engine/contentValidator');

/**
 * Ensures that the blog meets the minimum SEO score (80) for publishing, scheduling, or approval.
 * Automatically runs the SEO optimizer if score < 80.
 * @param {Object} blog - The blog document to optimize.
 * @returns {Promise<boolean>} True if optimization was executed and updated the blog, false otherwise.
 */
async function ensureEligibleSEO(blog) {
  if (blog.seoScore < 80) {
    console.log(`[SEO-HELPER] Blog "${blog.title}" has SEO score ${blog.seoScore} (< 80). Running auto-optimization...`);
    const optimizationResult = await seoOptimizer.optimize(blog, blog.seoAnalysis);
    if (optimizationResult.optimized) {
      blog.title = optimizationResult.title;
      blog.metaDescription = optimizationResult.metaDescription;
      blog.content = optimizationResult.content;
      blog.slug = optimizationResult.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      blog.seoScore = optimizationResult.newScore;
      blog.seoAnalysis = optimizationResult.seoAnalysis;
      blog.wordCount = contentValidator.countWords(blog.content);

      if (optimizationResult.history && optimizationResult.history.length > 0) {
        blog.optimizationHistory = (blog.optimizationHistory || []).concat(optimizationResult.history);
      }

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
      console.log(`[SEO-HELPER] Blog successfully optimized to score ${blog.seoScore}`);
      return true;
    }
  }
  return false;
}

module.exports = {
  ensureEligibleSEO,
};
