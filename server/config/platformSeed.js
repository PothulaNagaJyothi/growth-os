const PlatformConfig = require('../models/PlatformConfig');

const seedPlatforms = async () => {
  try {
    console.log('[DB SEED] Synchronizing platform configurations...');

    const defaultConfigs = [
      {
        platformName: 'LinkedIn',
        titleRules: 'Create a short, high-curiosity hook under 80 characters. Start with an emoji (e.g. 🤖, ⚡, 📈). Emphasize a contrarian viewpoint or a major metric (e.g. "We cut cluster costs by 60% with one simple tweak"). Avoid generic corporate announcements.',
        structureRules: 'Format in mobile-friendly blocks: maximum 1-2 sentences per paragraph. Use structured emoji bullets (e.g. 🚀, 💡, 📈). Add clean white space breaks between thoughts. Place 3-5 relevant tactical hashtags at the very bottom.',
        seoRules: 'Must include the primary keyword naturally within the copy. Ensure there are 3-5 relevant hashtags at the bottom to maximize organic search visibility.',
        imageRules: 'Prompts for vibrant isometric 3D illustrations or high-contrast infographics mapping optimization workflows.',
        ctaRules: 'Invite readers to share their feedback or experiences in the comments section below to trigger comments engagement. Do not include external outbound links in the post body.'
      },
      {
        platformName: 'Medium',
        titleRules: 'Design a compelling, narrative-driven, journalistic title between 60-90 characters. Pair it with a highly descriptive subtitle. Ensure the primary keyword is included naturally in the title.',
        structureRules: 'Adopt an immersive storytelling format. Use H2 and H3 structural section headers, quote blocks, code-blocks, lists, and tables. IMPORTANT: Do NOT summarize the canonical post into a short overview. Write a comprehensive, detailed, long-form post (minimum 800-1200 words) that fully covers all sections, implementations, step-by-step guides, FAQ, and Conclusion/Key Takeaways from the original post.',
        seoRules: 'Integrate the target primary keyword naturally in the title, first paragraph, and H2 headings. Keep density around 1.0-1.5%. Configure a meta description under 160 characters. Preserve all internal links pointing to the company website and external authoritative links, formatting them correctly.',
        imageRules: 'Prompts for deep editorial custom hero photographs depicting high-tech server networks or abstract tech processes.',
        ctaRules: 'End with a high-value CTA inviting readers to clap for the article, write responses, follow the publisher account, and visit the company website link.'
      },
      {
        platformName: 'Company Blog',
        titleRules: 'Generate an SEO-optimized title containing the primary campaign keywords. Keep it between 50-70 characters. Ensure high search query alignment.',
        structureRules: 'Establish clear technical readability: use H2 and H3 structural section headers. Incorporate lists for technical steps, bold accents for metrics, tables for data, a FAQ section, and a Conclusion/Key Takeaways section. IMPORTANT: Write a complete, comprehensive, detailed article (minimum 800-1200 words) matching the canonical blog length.',
        seoRules: 'Maintain a 1.0-1.5% primary keyword density naturally across content. Ensure target keyword is in the title, first paragraph, H1, and H2 headings. Preserve all relative internal links pointing to the company website and external links.',
        imageRules: 'Prompts for detailed wireframe schematics, performance graphs, or system architectural diagrams.',
        ctaRules: 'Integrate a high-impact corporate call-to-action inviting users to request an enterprise product demo, start a free trial, or download a technical whitepaper, accompanied by links.'
      },
      {
        platformName: 'Dev.to',
        titleRules: 'Create a developer-focused title between 50-80 characters, highly engaging for tech-savvy readers. Can use code blocks or software terminology. Include the primary target keyword naturally in the title.',
        structureRules: 'Use developer-friendly Markdown formatting. Include H2/H3 headers, code block examples (e.g. yaml, javascript, go), structured lists, a FAQ section, and a Conclusion/Key Takeaways section. IMPORTANT: Write a complete, comprehensive, detailed long-form post (minimum 800-1200 words) matching the canonical blog length.',
        seoRules: 'Place the target keyword in the title, first paragraph, H1, and headings. Preserve all internal links pointing to the company website and external authoritative links.',
        imageRules: 'Prompts for pixel art, funny tech memes (used in context), or high-contrast developer workspace/dashboard screenshots.',
        ctaRules: 'Encourage readers to bookmark, comment with their own tech stack implementations, follow the organization, and check out the company website.'
      },
      {
        platformName: 'Substack',
        titleRules: 'Design a warm, personal, newsletter-style headline. Can be slightly informal but highly intriguing, encouraging subscribers to open the email (50-70 characters). Include the primary keyword naturally in the title.',
        structureRules: 'Write in a direct, reader-focused email newsletter layout. Start with an editorial opening statement or personal touch. Use H2/H3 headers, clear lists, code blocks, a FAQ section, and a Conclusion. IMPORTANT: Write a complete, comprehensive, detailed newsletter post (minimum 800-1200 words) matching the canonical blog length.',
        seoRules: 'Place target keyword in the title, first paragraph, and H2 headings. Configure a meta excerpt under 160 characters. Preserve all internal links pointing to the company website and external links.',
        imageRules: 'Prompts for minimal, stylized editorial drawings, custom flat illustration hero graphics, or clean schematic diagrams.',
        ctaRules: 'Conclude with a clear newsletter signup CTA, asking readers to subscribe to the publication, share the newsletter with their network, and visit the company website.'
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
