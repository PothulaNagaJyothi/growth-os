import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useTasks } from '../../context/TaskContext';
import {
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Share2,
  Download,
  Image as ImageIcon,
  ArrowLeft,
  Repeat2,
  Save,
  X
} from 'lucide-react';
import { LinkedInPreview } from '../previews/LinkedInPreview';
import { MediumPreview } from '../previews/MediumPreview';
import { CompanyBlogPreview } from '../previews/CompanyBlogPreview';
import { DevToPreview } from '../previews/DevToPreview';
import { SubstackPreview } from '../previews/SubstackPreview';
import { renderMarkdownToHTML } from '../../utils/markdown';

const resolvedPlatformNames = {
  linkedin: 'LinkedIn',
  medium: 'Medium',
  blog: 'Company Blog',
  devto: 'Dev.to',
  substack: 'Substack',
};

export const BlogPreview = ({ blogId, onBack }) => {
  const queryClient = useQueryClient();
  const { tasks, startTask, clearTask } = useTasks();
  
  const [activeTab, setActiveTab] = useState('canonical');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 1. Fetch active blog record
  const { data: blogRecord, isLoading: blogLoading, isError, error } = useQuery({
    queryKey: ['blog-preview-data', blogId],
    queryFn: async () => {
      const response = await api.get(`/blogs/${blogId}`);
      return response.data.data;
    },
    enabled: !!blogId,
    retry: false
  });

  // 2. Fetch rendered platform adaptation
  const resolvedPlatformName = resolvedPlatformNames[activeTab] || null;

  const {
    data: renderedRecord,
    isLoading: renderedLoading,
  } = useQuery({
    queryKey: ['rendered', blogId, resolvedPlatformName],
    queryFn: async () => {
      if (!blogId || !resolvedPlatformName) return null;
      try {
        const response = await api.get(`/render/blog/${blogId}/platform/${resolvedPlatformName}`);
        return response.data.data;
      } catch (err) {
        const is404 =
          (err && err.response && err.response.status === 404) ||
          (typeof err === 'string' && (
            err.toLowerCase().includes('no rendered') ||
            err.toLowerCase().includes('not found') ||
            err.toLowerCase().includes('404')
          ));
        if (is404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!blogId && !!resolvedPlatformName,
    retry: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCopy, setEditCopy] = useState('');
  const [editHashtags, setEditHashtags] = useState([]);

  // Sync edit states when renderedRecord changes
  useEffect(() => {
    if (renderedRecord) {
      setEditTitle(renderedRecord.title || '');
      setEditCopy(renderedRecord.copy || '');
      setEditHashtags(renderedRecord.hashtags || []);
    } else {
      setEditTitle('');
      setEditCopy('');
      setEditHashtags([]);
    }
  }, [renderedRecord]);

  // Sync mutation to save platform rendered post
  const updateRenderMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(`/render/${renderedRecord._id}`, payload);
      return response.data.data;
    },
    onSuccess: (updatedRender) => {
      queryClient.setQueryData(['rendered', blogId, resolvedPlatformName], updatedRender);
      queryClient.invalidateQueries({ queryKey: ['rendered', blogId, resolvedPlatformName] });
      setIsEditing(false);
      triggerToast(`${resolvedPlatformName} copy updated & SEO score recalculated!`);
    }
  });

  // 3. Fetch images for cover art
  const { data: blogImages = [] } = useQuery({
    queryKey: ['images', blogId],
    queryFn: async () => {
      if (!blogId) return [];
      const response = await api.get(`/images/${blogId}`);
      return response.data.data || [];
    },
    enabled: !!blogId
  });

  const coverImageTaskId = blogId && activeTab ? `preview_image_generate_${blogId}_${activeTab}` : null;
  const adaptTaskId = blogId && activeTab ? `preview_adapt_${blogId}_${activeTab}` : null;
  const optimizeRenderTaskId = blogId && activeTab ? `preview_optimize_${blogId}_${activeTab}` : null;

  // Sync background cover image generation task
  useEffect(() => {
    if (!coverImageTaskId) return;
    const task = tasks[coverImageTaskId];
    if (task) {
      if (task.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['images', blogId] });
        triggerToast('Cover image generated successfully!');
        clearTask(coverImageTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Cover image generation failed.', 'error');
        clearTask(coverImageTaskId);
      }
    }
  }, [tasks, coverImageTaskId, blogId, queryClient, clearTask]);

  // Sync background platform adaptation task
  useEffect(() => {
    if (!adaptTaskId) return;
    const task = tasks[adaptTaskId];
    if (task) {
      if (task.status === 'success') {
        const newRendered = task.data;
        queryClient.setQueryData(['rendered', blogId, resolvedPlatformName], newRendered);
        triggerToast(`Content adapted for ${resolvedPlatformName} successfully!`);
        clearTask(adaptTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Content adaptation failed.', 'error');
        clearTask(adaptTaskId);
      }
    }
  }, [tasks, adaptTaskId, blogId, resolvedPlatformName, queryClient, clearTask]);

  // Sync background platform optimization task
  useEffect(() => {
    if (!optimizeRenderTaskId) return;
    const task = tasks[optimizeRenderTaskId];
    if (task) {
      if (task.status === 'success') {
        const optimizedRender = task.data;
        queryClient.setQueryData(['rendered', blogId, resolvedPlatformName], optimizedRender);
        triggerToast(`${resolvedPlatformName} copy auto-optimized successfully!`);
        clearTask(optimizeRenderTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Optimization failed.', 'error');
        clearTask(optimizeRenderTaskId);
      }
    }
  }, [tasks, optimizeRenderTaskId, blogId, resolvedPlatformName, queryClient, clearTask]);

  const getPlatformDisplaySize = () => {
    if (activeTab === 'linkedin') return '1200x644';
    if (activeTab === 'medium') return '1400x788';
    if (activeTab === 'devto') return '1000x420';
    if (activeTab === 'substack') return '1456x1048';
    return '1792x1024';
  };

  const getPlatformDimensions = () => {
    if (activeTab === 'linkedin') return '1200x644';
    if (activeTab === 'medium') return '1400x788';
    if (activeTab === 'devto') return '1000x420';
    if (activeTab === 'substack') return '1456x1048';
    return '1792x1024';
  };

  const handleGenerateCoverImage = () => {
    if (!blogId || !coverImageTaskId) return;
    const dimensions = getPlatformDimensions();
    startTask(coverImageTaskId, async () => {
      const response = await api.post('/images/generate', {
        blogId,
        dimensions,
        platform: resolvedPlatformName || 'Canonical'
      });
      return response.data.data;
    });
  };

  const getCoverImageForPlatform = () => {
    if (!blogImages || blogImages.length === 0) return null;
    const sortedImages = [...blogImages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const targetDim = getPlatformDimensions();
    const matchingImg = sortedImages.find(img => img.dimensions === targetDim);
    if (matchingImg) return matchingImg.imageUrl;
    const anyLandscape = sortedImages.find(img => img.dimensions === '1792x1024' || img.dimensions === 'custom');
    if (anyLandscape) return anyLandscape.imageUrl;
    return sortedImages[0].imageUrl;
  };

  const coverImage = getCoverImageForPlatform();
  const resolvedCoverImageUrl = coverImage
    ? (coverImage.startsWith('/uploads') ? `http://localhost:4000${coverImage}` : coverImage)
    : null;

  const handleDownloadCoverImage = async () => {
    if (!resolvedCoverImageUrl) return;
    try {
      const response = await fetch(resolvedCoverImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = resolvedCoverImageUrl.split('.').pop().split('?')[0] || 'png';
      link.setAttribute("download", `cover_image_${activeTab}_${blogRecord?.slug || 'post'}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast('Cover image downloaded successfully!');
    } catch (err) {
      console.error('Failed to download cover image: ', err);
      window.open(resolvedCoverImageUrl, '_blank');
      triggerToast('Opened image in new tab.');
    }
  };

  const handleAdapt = () => {
    if (!blogId || !resolvedPlatformName || !adaptTaskId) return;
    startTask(adaptTaskId, async () => {
      const response = await api.post(`/render/${resolvedPlatformName.replace(' ', '-')}`, { blogId });
      return response.data.data;
    });
  };

  const handleOptimizeRender = () => {
    if (!renderedRecord || !optimizeRenderTaskId) return;
    startTask(optimizeRenderTaskId, async () => {
      const response = await api.post(`/render/${renderedRecord._id}/optimize`);
      return response.data.data;
    });
  };

  const copyToClipboard = async (plainText, htmlText) => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const clipboardData = {
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        };
        if (htmlText) {
          clipboardData['text/html'] = new Blob([htmlText], { type: 'text/html' });
        }
        const item = new ClipboardItem(clipboardData);
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      triggerToast('Copied content to clipboard successfully!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      try {
        await navigator.clipboard.writeText(plainText);
        triggerToast('Copied plain text content to clipboard!');
      } catch (fallbackErr) {
        triggerToast('Failed to copy to clipboard.');
      }
    }
  };

  const handleCopy = async () => {
    if (activeTab === 'canonical') {
      if (!blogRecord) return;
      let plainText = `# ${blogRecord.title}\n\n`;
      let htmlText = `<h1>${blogRecord.title}</h1>\n`;
      if (resolvedCoverImageUrl) {
        plainText += `![Cover Image](${resolvedCoverImageUrl})\n\n`;
        htmlText += `<img src="${resolvedCoverImageUrl}" alt="Cover Image" style="width:100%; max-width:680px; height:auto; border-radius:12px; margin-bottom:24px; display:block;" />\n`;
      }
      plainText += blogRecord.content;
      htmlText += renderMarkdownToHTML(blogRecord.content);
      await copyToClipboard(plainText, htmlText);
    } else {
      if (!renderedRecord) return;
      let plainText = "";
      let htmlText = "";

      if (activeTab === 'linkedin') {
        if (renderedRecord.title) plainText += `${renderedRecord.title}\n\n`;
        if (resolvedCoverImageUrl) plainText += `[Image Attachment: ${resolvedCoverImageUrl}]\n\n`;
        plainText += renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
      } else if (activeTab === 'medium' || activeTab === 'blog' || activeTab === 'substack') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = `# ${titleText}\n\n`;
        htmlText = `<h1>${titleText}</h1>\n`;
        if (resolvedCoverImageUrl) {
          plainText += `![Cover Image](${resolvedCoverImageUrl})\n\n`;
          htmlText += `<img src="${resolvedCoverImageUrl}" alt="Cover Image" style="width:100%; max-width:680px; height:auto; border-radius:12px; margin-bottom:24px; display:block;" />\n`;
        }
        plainText += renderedRecord.copy;
        htmlText += renderMarkdownToHTML(renderedRecord.copy);
      } else if (activeTab === 'devto') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = `# ${titleText}\n\n`;
        htmlText = `<h1>${titleText}</h1>\n`;
        if (resolvedCoverImageUrl) {
          plainText += `![Cover Image](${resolvedCoverImageUrl})\n\n`;
          htmlText += `<img src="${resolvedCoverImageUrl}" alt="Cover Image" style="width:100%; max-width:680px; height:auto; border-radius:12px; margin-bottom:24px; display:block;" />\n`;
        }
        let copyWithTags = renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          copyWithTags += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        plainText += copyWithTags;
        htmlText += renderMarkdownToHTML(copyWithTags);
      }
      await copyToClipboard(plainText, htmlText);
    }
  };

  const handleDownloadMD = () => {
    let plainText = "";
    let filename = "";

    if (!blogRecord) return;
    const author = blogRecord.author || 'Unassigned';
    const category = blogRecord.keywordCategory || 'General';
    const date = blogRecord.publishDate ? new Date(blogRecord.publishDate).toLocaleDateString() : new Date().toLocaleDateString();

    const yamlFrontMatter = `---\ntitle: "${blogRecord.title}"\nauthor: "${author}"\ncategory: "${category}"\ndate: "${date}"\n---\n\n`;

    if (activeTab === 'canonical') {
      plainText = yamlFrontMatter + `# ${blogRecord.title}\n\n`;
      if (resolvedCoverImageUrl) {
        plainText += `![Cover Image](${resolvedCoverImageUrl})\n\n`;
      }
      plainText += blogRecord.content;
      filename = `${blogRecord.slug || 'canonical'}.md`;
    } else {
      if (!renderedRecord) return;
      const slugName = blogRecord?.slug || 'post';

      if (activeTab === 'linkedin') {
        plainText = `Author: ${author}\nCategory: ${category}\nDate: ${date}\n\n`;
        if (renderedRecord.title) plainText += `${renderedRecord.title}\n\n`;
        if (resolvedCoverImageUrl) plainText += `[Image Attachment: ${resolvedCoverImageUrl}]\n\n`;
        plainText += renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        filename = `linkedin_${slugName}.txt`;
      } else if (activeTab === 'medium' || activeTab === 'blog' || activeTab === 'substack') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = yamlFrontMatter + `# ${titleText}\n\n`;
        if (resolvedCoverImageUrl) {
          plainText += `![Cover Image](${resolvedCoverImageUrl})\n\n`;
        }
        plainText += renderedRecord.copy;
        filename = `${activeTab}_${slugName}.md`;
      } else if (activeTab === 'devto') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = yamlFrontMatter + `# ${titleText}\n\n`;
        if (resolvedCoverImageUrl) {
          plainText += `![Cover Image](${resolvedCoverImageUrl})\n\n`;
        }
        plainText += renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        filename = `devto_${slugName}.md`;
      }
    }

    if (!plainText) return;

    try {
      const blob = new Blob([plainText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast(`Downloaded ${filename} successfully!`);
    } catch (err) {
      console.error('Failed to download MD: ', err);
      triggerToast('Failed to download Markdown file.');
    }
  };

  const handleDownloadHTML = () => {
    let titleText = "";
    let bodyHtml = "";
    let filename = "";

    if (!blogRecord) return;
    const author = blogRecord.author || 'Unassigned';
    const category = blogRecord.keywordCategory || 'General';
    const date = blogRecord.publishDate ? new Date(blogRecord.publishDate).toLocaleDateString() : new Date().toLocaleDateString();

    if (activeTab === 'canonical') {
      titleText = blogRecord.title;
      bodyHtml = renderMarkdownToHTML(blogRecord.content);
      filename = `${blogRecord.slug || 'canonical'}.html`;
    } else {
      if (!renderedRecord) return;
      const slugName = blogRecord?.slug || 'post';
      titleText = renderedRecord.title || blogRecord.title;

      if (activeTab === 'linkedin') {
        let plainText = "";
        if (renderedRecord.title) plainText += `${renderedRecord.title}\n\n`;
        plainText += renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        bodyHtml = plainText.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('\n');
        filename = `linkedin_${slugName}.html`;
      } else if (activeTab === 'medium' || activeTab === 'blog' || activeTab === 'substack') {
        bodyHtml = renderMarkdownToHTML(renderedRecord.copy);
        filename = `${activeTab}_${slugName}.html`;
      } else if (activeTab === 'devto') {
        let copyWithTags = renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          copyWithTags += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        bodyHtml = renderMarkdownToHTML(copyWithTags);
        filename = `devto_${slugName}.html`;
      }
    }

    if (!bodyHtml) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${titleText}</title>
  <meta name="author" content="${author}">
  <meta name="category" content="${category}">
  <meta name="date" content="${date}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.62;
      color: #292929;
      max-width: 680px;
      margin: 40px auto;
      padding: 0 20px;
      -webkit-font-smoothing: antialiased;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      line-height: 1.25;
      color: #1a1a1a;
    }
    h2 {
      font-size: 1.6rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }
    p {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
      color: #292929;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 1.5rem;
      padding-left: 2rem;
      font-size: 1.1rem;
    }
    pre {
      background: #f9f9f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
      overflow-x: auto;
    }
    code {
      background: #f1f5f9;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }
    a {
      color: #f25b18;
      text-decoration: underline;
    }
    a:hover {
      color: #d1460f;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.95rem;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.75rem;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <h1>${titleText}</h1>
  <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 24px; font-weight: 500; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
    By <strong>${author}</strong> &bull; Category: <strong>${category}</strong> &bull; Date: <strong>${date}</strong>
  </div>
  ${resolvedCoverImageUrl ? `<img src="${resolvedCoverImageUrl}" alt="Cover Image" style="width:100%; max-width:680px; height:auto; border-radius:12px; margin-bottom:24px; display:block;" />` : ''}
  ${bodyHtml}
</body>
</html>`;

    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast(`Downloaded ${filename} successfully!`);
    } catch (err) {
      console.error('Failed to download HTML: ', err);
      triggerToast('Failed to download HTML file.');
    }
  };

  if (blogLoading) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading preview center...</p>
      </div>
    );
  }

  if (isError || !blogRecord) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-red-200">Failed to Load Blog</h3>
        <p className="text-xs text-slate-400">{error?.message || 'Blog not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Floating Success Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 glass-card bg-white/95 border border-primary/20 text-foreground text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Check size={14} />
          </div>
          <span className="font-semibold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {/* Preview Header & Back Button */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={onBack}
          className="px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Back to directory</span>
        </button>
        <span className="text-xs text-slate-500 font-mono">Platform Simulator Previews</span>
      </div>

      <div className="space-y-6">
        {/* Platform Tab Selector */}
        <div className="flex flex-wrap md:flex-nowrap border border-white/5 rounded-2xl overflow-hidden bg-background/50 p-1.5 shrink-0 w-full max-w-4xl gap-1 mx-auto">
          {['canonical', 'linkedin', 'medium', 'blog', 'devto', 'substack'].map((tab) => {
            const label =
              tab === 'canonical'
                ? 'Canonical'
                : tab === 'linkedin'
                ? 'LinkedIn Article'
                : tab === 'medium'
                ? 'Medium Story'
                : tab === 'blog'
                ? 'Company Blog'
                : tab === 'devto'
                ? 'Dev.to Post'
                : 'Substack';

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsEditing(false);
                }}
                className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-primary/10 to-primary/20 text-primary border border-primary/20 shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Cover Image Assistant Panel */}
        <div className="glass-card rounded-2xl border border-white/5 p-4 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] select-none mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary relative overflow-hidden shrink-0 select-none">
              {resolvedCoverImageUrl ? (
                <img src={resolvedCoverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-slate-500" />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span>Cover Image Assistant</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono font-medium lowercase">
                  {getPlatformDisplaySize()}
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {resolvedCoverImageUrl
                  ? `Loaded cover visual for this topic/platform. Will embed in downloaded files.`
                  : `No tailored cover image found. Generate one matching active platform rules.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {resolvedCoverImageUrl && (
              <button
                onClick={handleDownloadCoverImage}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={13} />
                <span>Download Image</span>
              </button>
            )}
            <button
              onClick={handleGenerateCoverImage}
              disabled={coverImageTaskId && tasks[coverImageTaskId]?.status === 'running'}
              className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary border border-primary/20 hover:border-primary/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-glow-sm cursor-pointer disabled:opacity-50"
            >
              {coverImageTaskId && tasks[coverImageTaskId]?.status === 'running' ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>{resolvedCoverImageUrl ? 'Regenerate Cover' : 'Generate Cover'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Display Area */}
        <div className="min-h-[480px]">
          {/* A. CANONICAL PREVIEW TAB */}
          {activeTab === 'canonical' && (
            <div className="glass-card rounded-3xl border border-white/5 p-8 w-full max-w-4xl space-y-6 mx-auto">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest font-mono mb-2">
                    Canonical Article Draft
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{blogRecord.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">Meta Description: {blogRecord.metaDescription}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleDownloadMD}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={13} />
                    <span>MD</span>
                  </button>
                  <button
                    onClick={handleDownloadHTML}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={13} />
                    <span>HTML</span>
                  </button>
                </div>
              </div>

              {/* Canonical SEO scorecard */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">SEO Score</span>
                  <span className={`text-base font-extrabold font-mono ${
                    blogRecord.seoScore >= 80 ? 'text-emerald-400' : blogRecord.seoScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {blogRecord.seoScore || 0}/100
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Words</span>
                  <span className="text-base font-extrabold font-mono text-slate-300">
                    {blogRecord.content ? blogRecord.content.trim().split(/\s+/).filter(Boolean).length : 0}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Readability</span>
                  <span className="text-base font-extrabold font-mono text-slate-300">
                    {blogRecord.seoAnalysis?.readabilityScore || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Density</span>
                  <span className="text-base font-extrabold font-mono text-slate-300">
                    {blogRecord.seoAnalysis?.keywordDensity !== undefined ? `${blogRecord.seoAnalysis.keywordDensity}%` : '0%'}
                  </span>
                </div>
              </div>
              
              {resolvedCoverImageUrl && (
                <div className="w-full rounded-2xl overflow-hidden border border-white/5 max-h-[300px] bg-slate-950 select-none mb-6">
                  <img src={resolvedCoverImageUrl} alt="Canonical Cover" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div 
                className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-2 scrollbar-glass"
                dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(blogRecord.content) }}
              />
            </div>
          )}

          {/* B. ADAPTED VIEWS */}
          {activeTab !== 'canonical' && (
            <div className="w-full">
              {(adaptTaskId && tasks[adaptTaskId]?.status === 'running') ? (
                <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px] relative overflow-hidden bg-background/80 w-full max-w-3xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center animate-spin duration-[3.5s] shadow-glow" />
                    <Sparkles size={28} className="absolute inset-0 m-auto text-background animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Adapting Content for {resolvedPlatformName}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Restructuring canonical Markdown copy for <strong>{resolvedPlatformName}</strong> specific settings...
                    </p>
                  </div>
                </div>
              ) : renderedLoading ? (
                <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-sm font-semibold tracking-wider text-slate-400">Loading platform rendering...</p>
                </div>
              ) : !renderedRecord ? (
                <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] w-full max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                    <Zap size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gradient">Adaptation Required</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      No customized post rendered for <strong>{resolvedPlatformName}</strong> yet. Adapt the canonical content dynamically.
                    </p>
                  </div>
                  <button
                    onClick={handleAdapt}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={16} />
                    <span>Render for {resolvedPlatformName}</span>
                  </button>
                </div>
              ) : (
                /* Visual Simulators */
                <div className="w-full space-y-4 animate-fade-in">
                  <div className={`flex justify-end gap-2 ${
                    activeTab === 'linkedin' || activeTab === 'medium' || activeTab === 'devto' || activeTab === 'substack' ? 'max-w-2xl' : 'max-w-4xl'
                  } mx-auto px-1`}>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer mr-auto"
                        >
                          <FileText size={13} />
                          <span>Edit Platform Copy</span>
                        </button>
                        <button
                          onClick={handleOptimizeRender}
                          disabled={(optimizeRenderTaskId && tasks[optimizeRenderTaskId]?.status === 'running')}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-500/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-glow-sm cursor-pointer mr-2"
                        >
                          {(optimizeRenderTaskId && tasks[optimizeRenderTaskId]?.status === 'running') ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Sparkles size={13} />
                          )}
                          <span>Auto Optimize SEO</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 size={13} />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={handleDownloadMD}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download size={13} />
                      <span>MD</span>
                    </button>
                    <button
                      onClick={handleDownloadHTML}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download size={13} />
                      <span>HTML</span>
                    </button>
                    <button
                      onClick={handleAdapt}
                      disabled={(adaptTaskId && tasks[adaptTaskId]?.status === 'running')}
                      className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary border border-primary/20 hover:border-primary/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-glow-sm cursor-pointer"
                    >
                      <Repeat2 size={13} className={(adaptTaskId && tasks[adaptTaskId]?.status === 'running') ? "animate-spin" : ""} />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {/* Adapted SEO scorecard */}
                  <div className={`grid grid-cols-4 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-center text-xs ${
                    activeTab === 'linkedin' || activeTab === 'medium' || activeTab === 'devto' || activeTab === 'substack' ? 'max-w-2xl' : 'max-w-4xl'
                  } mx-auto`}>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Platform SEO Score</span>
                      <span className={`text-base font-extrabold font-mono ${
                        renderedRecord.seoScore >= 80 ? 'text-emerald-400' : renderedRecord.seoScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {renderedRecord.seoScore || 0}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Words</span>
                      <span className="text-base font-extrabold font-mono text-slate-300">
                        {renderedRecord.copy ? renderedRecord.copy.trim().split(/\s+/).filter(Boolean).length : 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Readability</span>
                      <span className="text-base font-extrabold font-mono text-slate-300">
                        {renderedRecord.seoAnalysis?.readabilityScore || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Density</span>
                      <span className="text-base font-extrabold font-mono text-slate-300">
                        {renderedRecord.seoAnalysis?.keywordDensity !== undefined ? `${renderedRecord.seoAnalysis.keywordDensity}%` : '0%'}
                      </span>
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className={`glass-card rounded-3xl border border-white/5 p-6 md:p-8 w-full ${
                      activeTab === 'linkedin' || activeTab === 'medium' || activeTab === 'devto' || activeTab === 'substack' ? 'max-w-2xl' : 'max-w-4xl'
                    } mx-auto space-y-4 text-left`}>
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Edit {resolvedPlatformName} Post</h4>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Title / Headline Hook</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Body Copy (Markdown)</label>
                        <textarea
                          rows={12}
                          value={editCopy}
                          onChange={(e) => setEditCopy(e.target.value)}
                          className="w-full p-4 bg-background/60 border border-white/10 rounded-xl text-white text-xs font-mono leading-relaxed focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                      </div>

                      {['linkedin', 'devto'].includes(activeTab) && (
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Hashtags (Comma Separated)</label>
                          <input
                            type="text"
                            value={editHashtags.join(', ')}
                            onChange={(e) => setEditHashtags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      )}

                      <div className="pt-4 flex justify-end gap-2 border-t border-white/5 mt-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            updateRenderMutation.mutate({
                              title: editTitle,
                              copy: editCopy,
                              hashtags: editHashtags,
                            });
                          }}
                          disabled={updateRenderMutation.isPending}
                          className="px-5 py-2 bg-gradient-to-r from-primary to-accent text-background font-extrabold rounded-xl text-xs transition-all shadow-glow flex items-center gap-1.5 cursor-pointer"
                        >
                          {updateRenderMutation.isPending ? (
                            <>
                              <Loader2 className="animate-spin" size={13} />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save size={13} />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'linkedin' && (
                        <LinkedInPreview
                          title={renderedRecord.title}
                          copy={renderedRecord.copy}
                          hashtags={renderedRecord.hashtags}
                          imageUrl={resolvedCoverImageUrl}
                        />
                      )}

                      {activeTab === 'medium' && (
                        <MediumPreview
                          title={renderedRecord.title}
                          copy={renderedRecord.copy}
                          imageUrl={resolvedCoverImageUrl}
                        />
                      )}

                      {activeTab === 'blog' && (
                        <CompanyBlogPreview
                          title={renderedRecord.title}
                          copy={renderedRecord.copy}
                          imageUrl={resolvedCoverImageUrl}
                        />
                      )}

                      {activeTab === 'devto' && (
                        <DevToPreview
                          title={renderedRecord.title}
                          copy={renderedRecord.copy}
                          hashtags={renderedRecord.hashtags}
                          imageUrl={resolvedCoverImageUrl}
                        />
                      )}

                      {activeTab === 'substack' && (
                        <SubstackPreview
                          title={renderedRecord.title}
                          copy={renderedRecord.copy}
                          imageUrl={resolvedCoverImageUrl}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPreview;
