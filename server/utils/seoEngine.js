/**
 * SEO Optimization Analyzer for CanonicalBlog content
 * Computes scores and generates recommendations based on SEO best practices.
 */

function analyzeSEO(title = '', content = '', metaDescription = '', keyword = '') {
  const recommendations = [];
  const cleanKeyword = keyword.trim().toLowerCase();
  
  // Clean values to prevent null/undefined runtime issues
  const cleanTitle = (title || '').trim();
  const cleanContent = (content || '').trim();
  const cleanMeta = (metaDescription || '').trim();
  
  // 1. Title Score (Max 100)
  let titleScore = 0;
  if (cleanTitle) {
    titleScore += 40; // Exists
    if (cleanKeyword && cleanTitle.toLowerCase().includes(cleanKeyword)) {
      titleScore += 40; // Keyword match
    } else if (cleanKeyword) {
      recommendations.push('Include the target keyword in the blog title.');
    }
    
    const titleLen = cleanTitle.length;
    if (titleLen >= 40 && titleLen <= 70) {
      titleScore += 20; // Optimal length
    } else {
      recommendations.push(`Optimize title length to be between 40 and 70 characters (current: ${titleLen}).`);
    }
  } else {
    recommendations.push('Add a blog title.');
  }

  // 2. Meta Description Score (Max 100)
  let metaScore = 0;
  if (cleanMeta) {
    metaScore += 40; // Exists
    if (cleanKeyword && cleanMeta.toLowerCase().includes(cleanKeyword)) {
      metaScore += 40; // Keyword match
    } else if (cleanKeyword) {
      recommendations.push('Include the target keyword in the meta description.');
    }

    const metaLen = cleanMeta.length;
    if (metaLen >= 120 && metaLen <= 160) {
      metaScore += 20; // Optimal length
    } else {
      recommendations.push(`Optimize meta description length to be between 120 and 160 characters (current: ${metaLen}).`);
    }
  } else {
    recommendations.push('Add an engaging meta description under 160 characters.');
    if (cleanKeyword) {
      recommendations.push('Ensure the meta description contains the target keyword.');
    }
  }

  // 3. Heading Score (Max 100)
  let headingScore = 0;
  if (cleanContent) {
    // Check for H1 headings in markdown (# title) or HTML (<h1>title</h1>)
    const hasH1 = /^(#\s|<h1>)/mi.test(cleanContent);
    if (hasH1) {
      headingScore += 40;
    } else {
      recommendations.push("Add an H1 heading (Markdown '#' format) at the beginning of the content.");
    }

    // Count H2 headings (## heading) or HTML (<h2>heading</h2>)
    const h2Matches = cleanContent.match(/^(##\s|<h2>)/mig);
    const h2Count = h2Matches ? h2Matches.length : 0;
    if (h2Count >= 2) {
      headingScore += 40;
    } else {
      recommendations.push("Add at least two H2 headings (Markdown '##' format) to structure your content.");
    }

    // Check if target keyword is in any heading
    let keywordInHeadings = false;
    const lines = cleanContent.split('\n');
    for (const line of lines) {
      if (/^(#+|<h1>|<h2>|<h3>)/i.test(line) && cleanKeyword && line.toLowerCase().includes(cleanKeyword)) {
        keywordInHeadings = true;
        break;
      }
    }

    if (keywordInHeadings) {
      headingScore += 20;
    } else if (cleanKeyword) {
      recommendations.push('Include the target keyword in at least one heading (H1, H2, or H3).');
    }
  } else {
    recommendations.push('Add body content to the blog post.');
  }

  // 4. Keyword Density & Content Length Score (Max 100)
  let keywordDensity = 0;
  let densityScore = 0;
  
  // Word count (split by whitespace)
  const words = cleanContent ? cleanContent.split(/\s+/).filter(w => w.length > 0) : [];
  const wordCount = words.length;

  if (wordCount > 0) {
    if (wordCount >= 800 && wordCount <= 1200) {
      // Content length is ideal
    } else if (wordCount < 800) {
      recommendations.push(`Extend the article length to meet the target word count of 800-1200 words (current: ${wordCount}).`);
    } else {
      recommendations.push(`Condense the article length to fit the target word count of 800-1200 words (current: ${wordCount}).`);
    }

    if (cleanKeyword) {
      // Find occurrences of keyword (escaping special characters)
      const escapedKeyword = cleanKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const keywordRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      const matches = cleanContent.match(keywordRegex);
      const occurrences = matches ? matches.length : 0;
      
      keywordDensity = parseFloat(((occurrences / wordCount) * 100).toFixed(2));

      // Calculate score based on target 1.0% to 2.5%
      if (keywordDensity >= 1.0 && keywordDensity <= 2.5) {
        densityScore = 100;
      } else if (keywordDensity > 0 && keywordDensity < 1.0) {
        densityScore = Math.round(50 + (keywordDensity * 50));
        recommendations.push(`Increase keyword density to at least 1% (current: ${keywordDensity}%).`);
      } else if (keywordDensity > 2.5) {
        densityScore = Math.round(Math.max(10, 100 - ((keywordDensity - 2.5) * 20)));
        recommendations.push(`Reduce keyword density to avoid keyword stuffing (current: ${keywordDensity}%).`);
      } else {
        densityScore = 0;
        recommendations.push('Integrate your target keyword into the body content.');
      }
    } else {
      densityScore = 100; // No keyword provided
    }
  }

  // 5. Readability Score (Simple sentence length check)
  let readabilityScore = 100;
  if (cleanContent) {
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    
    if (sentenceCount > 0 && wordCount > 0) {
      const avgSentenceLength = wordCount / sentenceCount;
      readabilityScore = Math.round(Math.max(20, Math.min(100, 100 - (avgSentenceLength - 15) * 2)));
      if (avgSentenceLength > 25) {
        recommendations.push('Shorten long sentences to improve readability.');
      }
    }
  }

  // 6. Overall Score (Weighted average)
  const score = Math.round(
    (titleScore * 0.2) +
    (metaScore * 0.2) +
    (headingScore * 0.2) +
    (densityScore * 0.2) +
    (readabilityScore * 0.2)
  );

  return {
    score,
    readabilityScore,
    keywordDensity,
    titleScore,
    metaScore,
    headingScore,
    recommendations
  };
}

module.exports = { analyzeSEO };
