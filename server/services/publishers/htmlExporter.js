const { convertMarkdownToHtml } = require('./wordpressPublisher');

/**
 * Compiles the blog post into a clean HTML document.
 * @param {Object} blog - The Blog mongoose document
 * @param {Object} options - Custom configuration parameters (optional)
 * @returns {Promise<Object>} The publication results
 */
exports.exportHtml = async (blog, options = {}) => {
  const htmlContent = convertMarkdownToHtml(blog.content);

  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blog.title}</title>
  <meta name="description" content="${blog.metaDescription || ''}">
  <meta name="keywords" content="${blog.keyword || ''}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      background-color: #fafafa;
    }
    article {
      background-color: #ffffff;
      padding: 2.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #f0f0f0;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 1rem;
      color: #111111;
    }
    h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid #eaeaea;
      padding-bottom: 0.5rem;
      color: #222222;
    }
    h3 {
      font-size: 1.35rem;
      font-weight: 600;
      margin-top: 1.75rem;
      margin-bottom: 0.75rem;
      color: #333333;
    }
    p {
      margin-bottom: 1.25rem;
    }
    ul, ol {
      margin-bottom: 1.25rem;
      padding-left: 2.25rem;
    }
    li {
      margin-bottom: 0.5rem;
    }
    pre {
      background-color: #f5f5f7;
      padding: 1.25rem;
      overflow-x: auto;
      border-radius: 6px;
      border: 1px solid #e5e5ea;
      margin-bottom: 1.25rem;
    }
    code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9em;
      background-color: #f5f5f7;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    pre code {
      padding: 0;
      background-color: transparent;
    }
    .meta-desc {
      font-size: 1.1rem;
      color: #666666;
      margin-bottom: 2rem;
      line-height: 1.5;
      padding-left: 1rem;
      border-left: 4px solid #0066cc;
      font-style: italic;
    }
  </style>
</head>
<body>
  <article>
    <header>
      <h1>${blog.title}</h1>
      ${blog.metaDescription ? `<div class="meta-desc">${blog.metaDescription}</div>` : ''}
    </header>
    <main>
      ${htmlContent}
    </main>
  </article>
</body>
</html>`;

  return {
    success: true,
    externalId: 'html-' + Date.now(),
    url: '',
    exportData: htmlDocument,
    message: 'HTML document compiled successfully.'
  };
};
