const PlatformConfig = require('../models/PlatformConfig');

const seedPlatforms = async () => {
  try {
    console.log('[DB SEED] Synchronizing platform configurations...');

    const defaultConfigs = [
      {
        platformName: 'LinkedIn',
        titleRules: 'Create a short, high-curiosity hook under 80 characters. Start with an emoji. Emphasize a contrarian viewpoint or a major metric (e.g. "We cut cluster costs by 60% with one simple tweak"). Avoid generic corporate announcements.',
        structureRules: 'Format in mobile-friendly blocks: maximum 1-2 sentences per paragraph. Use structured emoji bullets (e.g. 🚀, 💡, 📈). Add clean white space breaks between thoughts. Place 3-5 relevant tactical hashtags at the very bottom.',
        seoRules: 'No strict keyword density rules needed. Prioritize viral tag visibility and immediate hook readability to maximize algorithmic organic reach.',
        imageRules: 'Prompts for vibrant isometric 3D illustrations or high-contrast infographics mapping optimization workflows.',
        ctaRules: 'Invite readers to share their feedback or experiences in the comments section below to trigger algorithmic comments engagement. Do not include external outbound links in the post body.'
      },
      {
        platformName: 'Medium',
        titleRules: 'Design a compelling, narrative-driven, journalistic title between 60-90 characters. Pair it with a highly descriptive subtitle.',
        structureRules: 'Adopt an immersive storytelling format. Use rich technical explanations, quote blocks for key statements, code-blocks for tech parameters, and detailed paragraphs. Break content with bold key takeaways. IMPORTANT: Do NOT summarize the canonical post into a short overview. Write a comprehensive, detailed, long-form post (minimum 800-1200 words) that fully covers the topics, step-by-step guides, and detailed implementations from the original post.',
        seoRules: 'Integrate secondary keywords naturally inside content (density ~0.5%). Configure a compelling meta description under 150 characters to index on search engines.',
        imageRules: 'Prompts for deep editorial custom hero photographs depicting high-tech server networks or abstract tech processes.',
        ctaRules: 'End with a high-value CTA inviting readers to clap for the article, write responses, and follow the publisher account for further technical deep-dives.'
      },
      {
        platformName: 'Company Blog',
        titleRules: 'Generate an SEO-optimized title containing the primary campaign keywords. Keep it between 50-70 characters. Ensure high search query alignment.',
        structureRules: 'Establish clear technical readability: use H2 and H3 structural section headers. Incorporate lists for technical steps, bold accents for metrics, and tables for data. Keep paragraphs concise and highly educational. IMPORTANT: Write a complete, comprehensive, detailed article (minimum 800-1200 words) matching the canonical blog length.',
        seoRules: 'Maintain a 1.5% primary keyword density naturally across the content. Ensure header text (H2/H3) utilizes primary/secondary keyword targets.',
        imageRules: 'Prompts for detailed wireframe schematics, performance graphs, or system architectural diagrams.',
        ctaRules: 'Integrate a high-impact corporate call-to-action inviting users to request an enterprise product demo, start a free trial, or download a technical whitepaper.'
      },
      {
        platformName: 'Dev.to',
        titleRules: 'Create a developer-focused title, highly engaging for tech-savvy readers. Can use code blocks or software terminology. Keep it between 50-80 characters. E.g., "How we built a scale-out K8s operator from scratch".',
        structureRules: 'Use developer-friendly Markdown formatting. Include code block examples (e.g., yaml, javascript, go), structured lists, and bold callouts for core takeaways. Keep it technical, structured, and informative. Adopt a helpful peer-to-peer developer tone. IMPORTANT: Write a complete, comprehensive, detailed long-form post (minimum 800-1200 words).',
        seoRules: 'Focus on relevant technical tags and natural integration of development keywords. Optimize for developer search queries.',
        imageRules: 'Prompts for pixel art, funny tech memes (used in context), or high-contrast developer workspace/dashboard screenshots.',
        ctaRules: 'Encourage readers to bookmark, comment with their own tech stack implementations, and follow the organization on Dev.to.'
      },
      {
        platformName: 'Substack',
        titleRules: 'Design a warm, personal, newsletter-style headline. Can be slightly informal but highly intriguing, encouraging subscribers to open the email (50-70 characters).',
        structureRules: 'Write in a direct, reader-focused email newsletter layout. Start with an editorial opening statement or personal touch. Use rich paragraphs, clear bullet lists, and bold highlights. Keep formatting elegant and readable on both mobile email and web. IMPORTANT: Write a complete, comprehensive, detailed newsletter post (minimum 800-1200 words).',
        seoRules: 'Configure an enticing meta excerpt for search engine indexation and preview snippet text. Focus on subscriber retention terms.',
        imageRules: 'Prompts for minimal, stylized editorial drawings, custom flat illustration hero graphics, or clean schematic diagrams.',
        ctaRules: 'Conclude with a clear newsletter signup CTA, asking readers to subscribe to the publication, share the newsletter with their network, or upgrade to a paid subscription.'
      }
    ];

    for (const config of defaultConfigs) {
      await PlatformConfig.findOneAndUpdate(
        { platformName: config.platformName },
        config,
        { upsert: true, new: true }
      );
    }
    console.log('[DB SEED] Default platform configurations synchronized successfully!');
  } catch (error) {
    console.error('[DB SEED ERROR] Seeding platform configurations failed:', error);
  }
};

module.exports = seedPlatforms;
