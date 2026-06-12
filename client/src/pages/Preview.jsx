import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Heart,
  Bookmark,
  Share2,
  Mail,
  ArrowLeft,
  Download
} from 'lucide-react';
import { LinkedInPreview } from '../components/previews/LinkedInPreview';
import { MediumPreview } from '../components/previews/MediumPreview';
import { CompanyBlogPreview } from '../components/previews/CompanyBlogPreview';
import { DevToPreview } from '../components/previews/DevToPreview';
import { SubstackPreview } from '../components/previews/SubstackPreview';
import { renderMarkdownToHTML } from '../utils/markdown';
import { useTasks } from '../context/TaskContext';

const statusColors = {
  Draft: 'border-l-slate-500/80 bg-slate-500/[0.02]',
  Scheduled: 'border-l-amber-500/80 bg-amber-500/[0.02]',
  Published: 'border-l-emerald-500/80 bg-emerald-500/[0.02]',
  Archived: 'border-l-rose-500/80 bg-rose-500/[0.02]',
};

const badgeColors = {
  Draft: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
  Scheduled: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  Published: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  Archived: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
};

const normalizeStatus = (value) => {
  const next = `${value || 'Draft'}`.trim().toLowerCase();

  if (next === 'scheduled' || next === 'pending') return 'Scheduled';
  if (next === 'published' || next === 'live') return 'Published';
  if (next === 'archived' || next === 'closed') return 'Archived';

  return 'Draft';
};

export const Preview = () => {
  const queryClient = useQueryClient();
  const { tasks, startTask, clearTask } = useTasks();

  // Active platform preview tabs
  const [activeTab, setActiveTab] = useState('canonical'); // 'canonical', 'linkedin', 'medium', 'blog'
  
  // Selected blog context
  const [selectedBlogId, setSelectedBlogId] = useState('');

  // Status notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 1. Fetch all blogs to populate directory and switcher
  const { data: blogsList, isLoading: blogsLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const response = await api.get('/blogs');
      return response.data.data || [];
    }
  });

  // 2. Fetch selected blog details
  const { data: blogRecord, isLoading: blogLoading } = useQuery({
    queryKey: ['blog-preview', selectedBlogId],
    queryFn: async () => {
      if (!selectedBlogId) return null;
      const response = await api.get(`/blogs/${selectedBlogId}`);
      return response.data.data;
    },
    enabled: !!selectedBlogId,
    retry: false
  });

  // 3. Fetch rendered platform adaptation associated with selected blog and tab name
  const resolvedPlatformName =
    activeTab === 'linkedin'
      ? 'LinkedIn'
      : activeTab === 'medium'
      ? 'Medium'
      : activeTab === 'blog'
      ? 'Company Blog'
      : activeTab === 'devto'
      ? 'Dev.to'
      : activeTab === 'substack'
      ? 'Substack'
      : null;

  const {
    data: renderedRecord,
    isLoading: renderedLoading,
    refetch: refetchRender
  } = useQuery({
    queryKey: ['rendered', blogRecord?._id, resolvedPlatformName],
    queryFn: async () => {
      if (!blogRecord?._id || !resolvedPlatformName) return null;
      try {
        const response = await api.get(`/render/blog/${blogRecord._id}/platform/${resolvedPlatformName}`);
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
    enabled: !!blogRecord?._id && !!resolvedPlatformName,
    retry: false
  });

  const adaptTaskId = blogRecord?._id && activeTab ? `preview_adapt_${blogRecord._id}_${activeTab}` : null;

  // Sync background platform adaptation task
  useEffect(() => {
    if (!adaptTaskId) return;
    const task = tasks[adaptTaskId];
    if (task) {
      if (task.status === 'success') {
        const newRendered = task.data;
        queryClient.setQueryData(['rendered', blogRecord?._id, resolvedPlatformName], newRendered);
        triggerToast(`Content successfully adapted for ${resolvedPlatformName}!`);
        clearTask(adaptTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Content adaptation failed.', 'error');
        clearTask(adaptTaskId);
      }
    }
  }, [tasks, adaptTaskId, blogRecord?._id, resolvedPlatformName, queryClient, clearTask]);

  const handleAdapt = () => {
    if (!blogRecord?._id || !resolvedPlatformName || !adaptTaskId) return;
    startTask(adaptTaskId, async () => {
      const response = await api.post(`/render/${resolvedPlatformName.replace(' ', '-')}`, { blogId: blogRecord._id });
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
      const plainText = `# ${blogRecord.title}\n\n${blogRecord.content}`;
      const htmlText = `<h1>${blogRecord.title}</h1>\n${renderMarkdownToHTML(blogRecord.content)}`;
      await copyToClipboard(plainText, htmlText);
    } else {
      if (!renderedRecord) return;
      
      let plainText = "";
      let htmlText = "";

      if (activeTab === 'linkedin') {
        if (renderedRecord.title) plainText += `${renderedRecord.title}\n\n`;
        plainText += renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
      } else if (activeTab === 'medium' || activeTab === 'blog' || activeTab === 'substack') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = `# ${titleText}\n\n${renderedRecord.copy}`;
        htmlText = `<h1>${titleText}</h1>\n${renderMarkdownToHTML(renderedRecord.copy)}`;
      } else if (activeTab === 'devto') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = `# ${titleText}\n\n${renderedRecord.copy}`;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        htmlText = `<h1>${titleText}</h1>\n${renderMarkdownToHTML(renderedRecord.copy)}`;
      }

      await copyToClipboard(plainText, htmlText);
    }
  };

  const handleDownloadMD = () => {
    let plainText = "";
    let filename = "";

    if (activeTab === 'canonical') {
      if (!blogRecord) return;
      plainText = `# ${blogRecord.title}\n\n${blogRecord.content}`;
      filename = `${blogRecord.slug || 'canonical'}.md`;
    } else {
      if (!renderedRecord) return;
      const slugName = blogRecord?.slug || 'post';

      if (activeTab === 'linkedin') {
        if (renderedRecord.title) plainText += `${renderedRecord.title}\n\n`;
        plainText += renderedRecord.copy;
        if (renderedRecord.hashtags && renderedRecord.hashtags.length > 0) {
          plainText += `\n\n${renderedRecord.hashtags.map(t => `#${t}`).join(' ')}`;
        }
        filename = `linkedin_${slugName}.txt`;
      } else if (activeTab === 'medium' || activeTab === 'blog' || activeTab === 'substack') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = `# ${titleText}\n\n${renderedRecord.copy}`;
        filename = `${activeTab}_${slugName}.md`;
      } else if (activeTab === 'devto') {
        const titleText = renderedRecord.title || blogRecord.title;
        plainText = `# ${titleText}\n\n${renderedRecord.copy}`;
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

    if (activeTab === 'canonical') {
      if (!blogRecord) return;
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
    h3 {
      font-size: 1.3rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }
    h4 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 1.25rem;
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
    li {
      margin-bottom: 0.5rem;
    }
    strong {
      font-weight: 700;
      color: #1a1a1a;
    }
    em {
      font-style: italic;
    }
    pre {
      background: #f9f9f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
      overflow-x: auto;
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 0.9rem;
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    code {
      background: #f1f5f9;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 0.9rem;
      color: #0f172a;
    }
    pre code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: inherit;
    }
  </style>
</head>
<body>
  <h1>${titleText}</h1>
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

  return (
    <div className="space-y-6 relative">
      {/* Floating Success Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 glass-card bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check size={14} className="text-emerald-400" />
          </div>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {!selectedBlogId ? (
        /* BLOG PREVIEWS DIRECTORY VIEW */
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Adaptive Preview Center</h2>
            <p className="text-xs text-slate-400 mt-1">
              Transform canonical articles into tailored social posts using rules dynamically driven from MongoDB.
            </p>
          </div>

          {blogsLoading ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Content drafts...</p>
            </div>
          ) : !blogsList || blogsList.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                <FileText size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gradient">No Articles Generated</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Create a blog draft using the Quick Blog Generator or Blog Studio first, then adapt it for social networks here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-slate-400">Available Articles Directory</h3>
                <span className="text-xs text-slate-500 font-mono">{blogsList.length} Articles</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogsList.map((blog) => {
                  const campaignName = blog.campaignId?.campaignName || 'Standalone Post';
                  const statusLabel = normalizeStatus(blog.status);
                  return (
                    <div
                      key={blog._id}
                      className={`glass-card rounded-2xl border-t border-b border-r border-white/5 border-l-4 ${statusColors[statusLabel] || statusColors.Draft} hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 flex flex-col p-6 space-y-4 justify-between relative overflow-hidden group cursor-pointer`}
                      onClick={() => setSelectedBlogId(blog._id)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">
                              {campaignName}
                            </span>
                            <h3 className="text-base font-bold text-white leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                              {blog.title || 'Untitled Blog Draft'}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                          <div>
                            <span className="font-medium text-slate-500 block">Author</span>
                            <span className="text-slate-300 truncate block">{blog.author || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-500 block">Category</span>
                            <span className="text-slate-300 truncate block">{blog.keywordCategory || 'General'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${badgeColors[statusLabel] || badgeColors.Draft}`}>
                          {statusLabel}
                        </span>
                        <span className="text-primary group-hover:text-accent font-bold text-xs flex items-center gap-1 transition-all">
                          <span>Open Preview</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN PREVIEW DASHBOARD WORKSPACE */
        <div className="space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Adaptive Preview Center</h2>
              <p className="text-xs text-slate-400 mt-1">
                Transform canonical articles into tailored social posts using rules dynamically driven from MongoDB.
              </p>
            </div>

            {/* Switcher & Back Buttons */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <button
                onClick={() => setSelectedBlogId('')}
                className="px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>View Directory</span>
              </button>

              <select
                value={selectedBlogId}
                onChange={(e) => {
                  setSelectedBlogId(e.target.value);
                  setActiveTab('canonical');
                }}
                disabled={(adaptTaskId && tasks[adaptTaskId]?.status === 'running')}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[200px]"
              >
                <option value="" className="bg-background text-slate-400">-- Select a Blog --</option>
                {blogsList?.map((b) => (
                  <option key={b._id} value={b._id} className="bg-background text-white">
                    {b.title || 'Untitled Blog Draft'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {blogLoading ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Content draft...</p>
            </div>
          ) : !blogRecord ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                <FileText size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gradient">Article Required</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Please select an article from the directory or dropdown switcher to adaptive-preview its contents.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Platform Tab Selector */}
              <div className="flex flex-wrap md:flex-nowrap border border-white/5 rounded-2xl overflow-hidden bg-background/50 p-1.5 shrink-0 max-w-4xl gap-1">
                {['canonical', 'linkedin', 'medium', 'blog', 'devto', 'substack'].map((tab) => {
                  const label =
                    tab === 'canonical'
                      ? 'Canonical'
                      : tab === 'linkedin'
                      ? 'LinkedIn Feed'
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
                      onClick={() => setActiveTab(tab)}
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

              {/* Tab Display Area */}
              <div className="min-h-[480px]">
                {/* 1. CANONICAL PREVIEW TAB */}
                {activeTab === 'canonical' && (
                  <div className="glass-card rounded-3xl border border-white/5 p-8 max-w-4xl mx-auto space-y-6">
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
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Share2 size={13} />
                          <span>Copy Content</span>
                        </button>
                        <button
                          onClick={handleDownloadMD}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Download MD</span>
                        </button>
                        <button
                          onClick={handleDownloadHTML}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Download HTML</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Scrollable Markdown preview */}
                    <div 
                      className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-2 scrollbar-glass"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(blogRecord.content) }}
                    />
                  </div>
                )}

                {/* 2. RENDERED PLATFORM VIEWS */}
                {activeTab !== 'canonical' && (
                  <div className="w-full">
                    {(adaptTaskId && tasks[adaptTaskId]?.status === 'running') ? (
                      /* Generating platforms adaptation micro-animations */
                      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px] relative overflow-hidden bg-background/80 max-w-3xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
                        
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center animate-spin duration-[3.5s] shadow-glow" />
                          <Sparkles size={28} className="absolute inset-0 m-auto text-background animate-pulse" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Adapting Content for {resolvedPlatformName}</h3>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            GPT-5.4 is reading dynamic platform rules for **{resolvedPlatformName}** from MongoDB and restructuring canonical Markdown copy...
                          </p>
                        </div>

                        {/* Progress log */}
                        <div className="w-full max-w-md p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[10px] text-primary space-y-1.5 shadow-2xl">
                          <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2 mb-2">
                            <span>PLATFORM ENGINE SYNTHESIS</span>
                            <span className="animate-pulse text-emerald-400">● RENDERING PLATFORM</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 size={10} />
                            <span>[DB] Loaded MongoDB config rule matrix for {resolvedPlatformName}.</span>
                          </div>
                          <div className="flex items-center gap-2 text-accent animate-pulse">
                            <Loader2 size={10} className="animate-spin" />
                            <span>[AI] Restructuring title hooks and paragraph lengths...</span>
                          </div>
                        </div>
                      </div>
                    ) : renderedLoading ? (
                      /* Loading rendered blog record */
                      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading platform renderings...</p>
                      </div>
                    ) : !renderedRecord ? (
                      /* Render Placeholder */
                      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] max-w-xl mx-auto">
                        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                          <Zap size={32} />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gradient">Adaptation Required</h3>
                          <p className="text-sm text-slate-400 max-w-sm mx-auto">
                            No customized post has been rendered for **{resolvedPlatformName}** yet. Adapt the canonical content dynamically.
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
                        <div className={`flex justify-end gap-3 ${
                          activeTab === 'linkedin' ? 'max-w-xl' : (activeTab === 'medium' || activeTab === 'devto' || activeTab === 'substack') ? 'max-w-2xl' : 'max-w-4xl'
                        } mx-auto px-1`}>
                          <button
                            onClick={handleCopy}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Share2 size={13} />
                            <span>Copy Content</span>
                          </button>
                          <button
                            onClick={handleDownloadMD}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Download size={13} />
                            <span>Download MD</span>
                          </button>
                          <button
                            onClick={handleDownloadHTML}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Download size={13} />
                            <span>Download HTML</span>
                          </button>
                          
                          <button
                            onClick={handleAdapt}
                            disabled={(adaptTaskId && tasks[adaptTaskId]?.status === 'running')}
                            className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary border border-primary/20 hover:border-primary/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-glow-sm cursor-pointer"
                          >
                            <Repeat2 size={13} className={(adaptTaskId && tasks[adaptTaskId]?.status === 'running') ? "animate-spin" : ""} />
                            <span>Regenerate Content</span>
                          </button>
                        </div>
                        
                        {/* A. LINKEDIN FEED SIMULATOR */}
                        {activeTab === 'linkedin' && (
                          <LinkedInPreview
                            title={renderedRecord.title}
                            copy={renderedRecord.copy}
                            hashtags={renderedRecord.hashtags}
                          />
                        )}

                        {/* B. MEDIUM STORY SIMULATOR */}
                        {activeTab === 'medium' && (
                          <MediumPreview
                            title={renderedRecord.title}
                            copy={renderedRecord.copy}
                          />
                        )}

                        {/* C. COMPANY BLOG SIMULATOR */}
                        {activeTab === 'blog' && (
                          <CompanyBlogPreview
                            title={renderedRecord.title}
                            copy={renderedRecord.copy}
                          />
                        )}

                        {/* D. DEV.TO SIMULATOR */}
                        {activeTab === 'devto' && (
                          <DevToPreview
                            title={renderedRecord.title}
                            copy={renderedRecord.copy}
                            hashtags={renderedRecord.hashtags}
                          />
                        )}

                        {/* E. SUBSTACK SIMULATOR */}
                        {activeTab === 'substack' && (
                          <SubstackPreview
                            title={renderedRecord.title}
                            copy={renderedRecord.copy}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Preview;
