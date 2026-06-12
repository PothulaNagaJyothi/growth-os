/**
 * Renders raw Markdown string into clean, safe HTML tags
 */
export const renderMarkdownToHTML = (markdown) => {
  if (!markdown) return '';
  
  // Escape HTML first to prevent XSS
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Code blocks: ```language ... ``` (supporting both Unix \n and Windows \r\n line endings)
  html = html.replace(/```(?:[a-zA-Z0-9]+)?\r?\n([\s\S]*?)\r?\n```/g, (match, code) => {
    return `<pre class="bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-xs text-slate-300 my-4 overflow-x-auto select-text"><code>${code}</code></pre>`;
  });

  // 2. Inline code: `code`
  html = html.replace(/`([^`\n]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded font-mono text-xs text-primary">$1</code>');

  // 3. Headings: #, ##, ###
  html = html.replace(/^### (.*?)$/gm, '<h4 class="text-sm md:text-base font-bold text-white mt-5 mb-2">$1</h4>');
  html = html.replace(/^## (.*?)$/gm, '<h3 class="text-base md:text-lg font-bold text-white mt-6 mb-3">$1</h3>');
  html = html.replace(/^# (.*?)$/gm, '<h2 class="text-lg md:text-xl font-bold text-white mt-7 mb-4">$1</h2>');

  // 4. Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // 5. Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-300">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic text-slate-300">$1</em>');

  // 6. Lists and Paragraphs: line-by-line parsing
  let lines = html.split('\n');
  let inList = false;
  let inPre = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Track if we enter a <pre> block (code block) to avoid wrapping its internal lines in <p> tags
    if (line.includes('<pre')) {
      inPre = true;
    }

    if ((line.startsWith('- ') || line.startsWith('* ')) && !inPre) {
      let content = line.substring(2);
      if (!inList) {
        lines[i] = `<ul class="list-disc ml-5 my-3 text-slate-300 space-y-1"><li>${content}</li>`;
        inList = true;
      } else {
        lines[i] = `<li>${content}</li>`;
      }
    } else {
      if (inList) {
        lines[i - 1] += '</ul>';
        inList = false;
      }
      // Wrap non-empty lines that do not start with block-level HTML tags and are not inside a preformatted block
      const isBlockHtml = line.startsWith('<h') || line.startsWith('<pre') || line.startsWith('<code') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('</ul');
      if (line && !isBlockHtml && !inPre) {
        lines[i] = `<p class="mb-3 leading-relaxed text-slate-300">${line}</p>`;
      }
    }

    // Track if we leave the <pre> block
    if (line.includes('</pre>')) {
      inPre = false;
    }
  }
  if (inList) {
    lines[lines.length - 1] += '</ul>';
  }
  
  return lines.join('\n');
};
