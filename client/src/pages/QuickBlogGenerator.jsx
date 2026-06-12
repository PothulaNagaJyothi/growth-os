import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTasks } from '../context/TaskContext';
import VersionHistoryDrawer from '../components/VersionHistoryDrawer';
import {
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Check,
  X,
  FileText,
  Save,
  Globe,
  Sliders,
  FileEdit,
  RotateCw,
  Compass,
  CheckCircle2,
  Gauge,
  History,
  BookOpen
} from 'lucide-react';

export const QuickBlogGenerator = () => {
  const navigate = useNavigate();
  const { tasks, startTask, clearTask } = useTasks();

  // Inputs
  const [keyword, setKeyword] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('formal');

  // Loading States
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Result Blog Context
  const [blog, setBlog] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Directory List States
  const [blogsList, setBlogsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchBlogsList = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/blogs');
      setBlogsList(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch blogs list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!blog) {
      fetchBlogsList();
    }
  }, [blog]);

  // Editing state fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

  // Status notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'warning' | 'error'

  const optimizeTaskId = blog?._id ? `quick_blog_optimize_${blog._id}` : null;

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Sync background quick blog generation task
  useEffect(() => {
    const task = tasks['quick_blog_generate'];
    if (task) {
      if (task.status === 'success') {
        const generatedBlog = task.data;
        setBlog(generatedBlog);
        setTitle(generatedBlog.title || '');
        setSlug(generatedBlog.slug || '');
        setMetaDescription(generatedBlog.metaDescription || '');
        setContent(generatedBlog.content || '');
        setStatus(generatedBlog.status || 'draft');
        triggerToast('Quick Blog draft successfully generated and optimized!');
        clearTask('quick_blog_generate');
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Generation failed. Please try again.', 'error');
        clearTask('quick_blog_generate');
      }
    }
  }, [tasks, clearTask]);

  // Sync background SEO optimization task
  useEffect(() => {
    if (!optimizeTaskId) return;
    const task = tasks[optimizeTaskId];
    if (task) {
      if (task.status === 'success') {
        const responseData = task.data;
        const updatedBlog = responseData.updatedBlog;
        setBlog(updatedBlog);
        setTitle(updatedBlog.title || '');
        setSlug(updatedBlog.slug || '');
        setMetaDescription(updatedBlog.metaDescription || '');
        setContent(updatedBlog.content || '');
        setStatus(updatedBlog.status || 'draft');
        triggerToast(`Blog optimized! Score: ${responseData.newScore}. Improvements: ${responseData.improvements?.length || 0}`);
        clearTask(optimizeTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'SEO optimization failed.', 'error');
        clearTask(optimizeTaskId);
      }
    }
  }, [tasks, optimizeTaskId, clearTask]);

  // 1. Generate Blog (Keyword -> SEO Brief -> Blog -> Analyzer -> Optimizer -> Draft)
  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    if (!keyword.trim() || !targetAudience.trim()) {
      triggerToast('Please provide a keyword and target audience.', 'error');
      return;
    }

    setBlog(null);

    startTask('quick_blog_generate', async () => {
      const response = await api.post('/blogs/generate', {
        keyword: keyword.trim(),
        targetAudience: targetAudience.trim(),
        tone: tone
      });
      return response.data.data;
    });
  };

  // 2. Save / Publish manually updated blog
  const handleSave = async (targetStatus = null) => {
    if (!blog) return;
    setSaving(true);
    const finalStatus = targetStatus || status;

    try {
      const response = await api.put(`/blogs/${blog._id}`, {
        title: title.trim(),
        metaDescription: metaDescription.trim(),
        content: content.trim(),
        status: finalStatus,
        keyword: blog.keyword,
        targetAudience: blog.targetAudience,
        tone: blog.tone
      });

      const updatedBlog = response.data.data;
      setBlog(updatedBlog);
      setTitle(updatedBlog.title || '');
      setSlug(updatedBlog.slug || '');
      setMetaDescription(updatedBlog.metaDescription || '');
      setContent(updatedBlog.content || '');
      setStatus(updatedBlog.status || 'draft');
      triggerToast('Blog modifications saved and re-analyzed successfully.');
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.error || 'Failed to save edits.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 3. Manually Optimize Blog if score is < 80
  const handleOptimize = () => {
    if (!blog || !optimizeTaskId) return;

    startTask(optimizeTaskId, async () => {
      const response = await api.post(`/blogs/${blog._id}/optimize`);
      const fetchRes = await api.get(`/blogs/${blog._id}`);
      return {
        newScore: response.data.newScore,
        improvements: response.data.improvements || [],
        updatedBlog: fetchRes.data.data
      };
    });
  };

  // Render score badge with dynamic threshold colors
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="space-y-6 relative">
      {/* Success/Error Toast Notifications */}
      {showToast && (
        <div className={`fixed top-20 right-6 z-50 glass-card border px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
          toastType === 'error'
            ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
            : toastType === 'warning'
            ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            toastType === 'error' ? 'bg-rose-500/20 text-rose-400' : toastType === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {toastType === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          </div>
          <span className="font-semibold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quick Blog Generator</h2>
        <p className="text-xs text-slate-400 mt-1">
          Instantly generate search-optimized drafts by keyword. The Content Engine automatically analyzes SEO metrics and heals headers, keyword densities, and links to target score 80+.
        </p>
      </div>

      <div className="w-full">
        {(tasks['quick_blog_generate']?.status === 'running') ? (
          /* Live Synthesis Loader Animation */
          <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[450px] relative overflow-hidden bg-background/80 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
            
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent to-secondary flex items-center justify-center animate-spin duration-[3.5s] shadow-glow-purple" />
              <Sparkles size={28} className="absolute inset-0 m-auto text-background animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Running Optimization Flow</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Synthesizing SEO Brief, drafting Canonical content, and checking criteria to deliver a score 80+ draft...
              </p>
            </div>

            {/* Live Telemetry Console Logs */}
            <div className="w-full max-w-md p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[10px] text-accent space-y-1.5 shadow-2xl">
              <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2 mb-2">
                <span>QUICK GENERATION CHANNEL</span>
                <span className="animate-pulse text-accent">● PIPELINE ENGAGED</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={10} />
                <span>[SEO BRIEF] Generated search intent and keyword vectors.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={10} />
                <span>[CONTENT] Canonical blog post draft generated.</span>
              </div>
              <div className="flex items-center gap-2 text-accent animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span>[OPTIMIZER] Evaluating SEO checkpoints & healing density gaps...</span>
              </div>
            </div>
          </div>
        ) : !blog ? (
          /* Directory Dashboard Split View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* Left Column: Generation Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-white/5 flex flex-col space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <span>Generate SEO Post</span>
                </h3>

                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Target SEO Keyword *</label>
                    <input
                      type="text"
                      required
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g. cloud security audit"
                      className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Target Audience *</label>
                    <input
                      type="text"
                      required
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. Security Engineers"
                      className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Desired Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer animate-fade-in"
                    >
                      <option value="formal" className="bg-background text-white">Formal / Professional</option>
                      <option value="casual" className="bg-background text-white">Casual / Conversational</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-background font-bold text-xs rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    <span>Generate Blog Post</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Blogs Directory list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-white/5 min-h-[400px] flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-secondary" />
                  <span>Generated Blogs Directory</span>
                </h3>

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-glass max-h-[500px]">
                  {loadingList ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                      <Loader2 className="animate-spin text-primary" size={28} />
                      <span className="text-xs text-slate-400">Loading directory...</span>
                    </div>
                  ) : blogsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                      <Compass size={24} className="text-slate-500 animate-pulse" />
                      <p className="text-xs text-slate-400 font-semibold">No posts generated yet</p>
                      <p className="text-[10px] text-slate-500 max-w-xs">Use the SEO generator form on the left to start drafting articles.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                      {blogsList.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => {
                            setBlog(item);
                            setTitle(item.title || '');
                            setSlug(item.slug || '');
                            setMetaDescription(item.metaDescription || '');
                            setContent(item.content || '');
                            setStatus(item.status || 'draft');
                          }}
                          className="relative group p-5 bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/5 hover:border-primary/30 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow cursor-pointer animate-fade-in animate-duration-300"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase border ${
                                item.status?.toLowerCase() === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : item.status?.toLowerCase() === 'scheduled'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-white/5 text-slate-300 border-white/10'
                              }`}>
                                {item.status || 'draft'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem]" title={item.title}>
                              {item.title}
                            </h4>
                          </div>

                          <div className="border-t border-white/5 pt-3 mt-auto space-y-1.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">Keyword:</span>
                              <span className="text-slate-300 truncate max-w-[120px] font-mono">"{item.keyword || 'None'}"</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">Category:</span>
                              <span className="text-slate-300 truncate max-w-[120px]">{item.keywordCategory || 'General'}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">Author:</span>
                              <span className="text-slate-300 truncate max-w-[120px]">{item.author || 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Active Content Editor Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* Left Column: SEO Score & Checks Checklist */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Score Gauge Card */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 flex flex-col items-center text-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start flex items-center gap-2">
                  <Gauge size={16} className="text-primary" />
                  <span>SEO Score Engine</span>
                </h3>

                <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shadow-2xl relative ${getScoreColorClass(blog.seoScore)}`}>
                  <span className="text-4xl font-extrabold font-mono tracking-tighter">{blog.seoScore}</span>
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider">Score / 100</span>
                </div>

                <div className="w-full text-xs text-left p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-slate-400"><span className="font-semibold text-white">Target Keyword:</span> "{blog.keyword}"</p>
                  <p className="text-slate-400"><span className="font-semibold text-white">Density:</span> {blog.seoAnalysis?.keywordDensity}%</p>
                  <p className="text-slate-400"><span className="font-semibold text-white">Readability:</span> {blog.seoAnalysis?.readabilityScore}/100</p>
                </div>

                {blog.seoScore < 80 && (
                  <div className="w-full space-y-3 pt-2">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[10px] rounded-xl text-left font-medium leading-normal">
                      ⚠️ Score is currently under 80. You can trigger auto-optimization to fix structural headers, FAQ sections, image alt attributes, and link targets automatically.
                    </div>
                    <button
                      onClick={handleOptimize}
                      disabled={((optimizeTaskId && tasks[optimizeTaskId]?.status === 'running') || saving)}
                      className="w-full py-2 bg-gradient-to-r from-primary to-accent text-background font-bold text-xs rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                    >
                      {((optimizeTaskId && tasks[optimizeTaskId]?.status === 'running')) ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-background" />
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          <span>Optimize SEO Now</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 13 SEO Checklist Panel */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent" />
                  <span>SEO Audit Checklist</span>
                </h3>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {blog.seoAnalysis?.checks ? (
                    (() => {
                      const checks = blog.seoAnalysis.checks;
                      const checkList = [
                        { label: 'Keyword in Title', ok: checks.keywordInTitle },
                        { label: 'Keyword in Meta Description', ok: checks.keywordInMetaDescription },
                        { label: 'Keyword in First Paragraph', ok: checks.keywordInFirstParagraph },
                        { label: 'Keyword in H1', ok: checks.keywordInH1 },
                        { label: 'Keyword in Slug', ok: checks.keywordInSlug },
                        { label: `Word Count Target (current: ${checks.wordCount})`, ok: checks.wordCount >= 800 && checks.wordCount <= 1200 },
                        { label: `At least two H2s (current: ${checks.h2Count})`, ok: checks.h2Count >= 2 },
                        { label: `At least one H3 (current: ${checks.h3Count})`, ok: checks.h3Count >= 1 },
                        { label: 'Structured FAQ Presence', ok: checks.faqPresence },
                        { label: 'Conclusion Section Present', ok: checks.conclusionPresence },
                        { label: `Internal Link Suggestion (current: ${checks.internalLinks})`, ok: checks.internalLinks >= 1 },
                        { label: `External Link Suggestion (current: ${checks.externalLinks})`, ok: checks.externalLinks >= 1 },
                        { label: 'Descriptive Image Alt Text', ok: checks.imageAltText },
                      ];

                      return checkList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 hover:bg-white/5 rounded-lg px-2 transition-colors">
                          <span className="text-slate-400">{item.label}</span>
                          {item.ok ? (
                            <span className="text-emerald-400 p-0.5 rounded-full bg-emerald-500/10"><Check size={12} /></span>
                          ) : (
                            <span className="text-rose-400 p-0.5 rounded-full bg-rose-500/10"><X size={12} /></span>
                          )}
                        </div>
                      ));
                    })()
                  ) : (
                    <p className="text-[10px] text-slate-500 py-6 text-center font-semibold">Checks audit data is unavailable.</p>
                  )}
                </div>
              </div>

              {/* Recommendations Panel */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={16} className="text-primary" />
                  <span>SEO Recommendations</span>
                </h3>

                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {blog.seoAnalysis?.recommendations && blog.seoAnalysis.recommendations.length > 0 ? (
                    blog.seoAnalysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-2 bg-white/5 border border-white/5 text-[10px] text-slate-300 rounded-lg leading-normal">
                        - {rec}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-center rounded-xl text-[10px] font-semibold flex items-center justify-center gap-2">
                      <Check size={14} />
                      <span>Post is fully optimized!</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Editor Panel */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Metadata Configuration */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 bg-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={16} className="text-primary" />
                  <span>SEO Metadata</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">SEO Post Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">URL Slug (slugified title)</label>
                    <input
                      type="text"
                      disabled
                      value={slug}
                      className="w-full px-4 py-2.5 bg-background/30 border border-white/5 rounded-xl text-slate-400 text-xs font-mono focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Meta Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block">Post Status</span>
                    <span className={`text-xs font-bold font-mono capitalize ${status === 'published' ? 'text-primary' : 'text-slate-400'}`}>
                      {status}
                    </span>
                  </div>
                  
                  {status === 'published' ? (
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold flex items-center gap-1 font-mono uppercase">
                      <Globe size={9} />
                      <span>Live</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 text-[9px] font-bold font-mono uppercase">
                      Draft
                    </span>
                  )}
                </div>
              </div>
              {/* Main Content Editor */}
              <div className="glass-card rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[520px]">
                
                {/* Editor Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 text-white">
                    <FileEdit size={18} className="text-accent" />
                    <h3 className="text-sm font-bold tracking-tight">Canonical Markdown Editor</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setBlog(null)}
                      className="px-4 py-2 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-rose-950/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <X size={13} className="text-rose-400" />
                      <span>Close Editor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/blog-studio/${blog._id}`)}
                      className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <BookOpen size={13} className="text-slate-400" />
                      <span>Open in Blog Studio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryOpen(true)}
                      className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <History size={13} className="text-slate-400" />
                      <span>Version History</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={(tasks['quick_blog_generate']?.status === 'running')}
                      className="px-4 py-2 border border-primary/20 hover:border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <RotateCw size={13} className="text-primary" />
                      <span>Regenerate Content</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="px-4 py-2 border border-accent/20 hover:border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {saving && status === 'draft' ? (
                        <Loader2 className="animate-spin text-accent" size={13} />
                      ) : (
                        <Save size={13} className="text-accent" />
                      )}
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSave('published')}
                      disabled={saving}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-background text-xs font-bold rounded-xl shadow-glow hover:shadow-[0_0_25px_rgba(0,242,254,0.35)] transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {saving && status === 'published' ? (
                        <Loader2 className="animate-spin text-background" size={13} />
                      ) : (
                        <Globe size={13} />
                      )}
                      <span>Publish Article</span>
                    </button>
                  </div>
                </div>

                {/* Editor textarea */}
                <div className="flex-1 p-6 relative flex flex-col min-h-0 bg-background/25">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your comprehensive canonical content in structured Markdown formats..."
                    className="w-full flex-1 bg-transparent border-0 resize-none font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-0 overflow-y-auto pr-2 scrollbar-glass"
                  />
                  
                  {/* Live Character Counters */}
                  <div className="mt-4 border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Markdown Enabled</span>
                    <span className="font-semibold text-slate-400">
                      Words: ~{content ? content.split(/\s+/).filter(Boolean).length : 0} | Characters: {content?.length || 0}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>

      {blog && (
        <VersionHistoryDrawer
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          blogId={blog._id}
          currentTitle={title}
          currentMeta={metaDescription}
          currentContent={content}
          onRestoreSuccess={(updatedBlog) => {
            setBlog(updatedBlog);
            setTitle(updatedBlog.title || '');
            setSlug(updatedBlog.slug || '');
            setMetaDescription(updatedBlog.metaDescription || '');
            setContent(updatedBlog.content || '');
            setStatus(updatedBlog.status || 'draft');
            triggerToast('Blog restored to previous version successfully!');
          }}
        />
      )}
    </div>
  );
};

export default QuickBlogGenerator;
