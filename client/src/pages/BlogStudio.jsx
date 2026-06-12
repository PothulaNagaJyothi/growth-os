import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import VersionHistoryDrawer from '../components/VersionHistoryDrawer';
import { useTasks } from '../context/TaskContext';
import {
  BookOpen,
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Save,
  Globe,
  Sliders,
  FileEdit,
  RotateCw,
  Gauge,
  History,
  X
} from 'lucide-react';

export const BlogStudio = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Selected campaign context selector
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { tasks, startTask, clearTask } = useTasks();

  useEffect(() => {
    if (blogId) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [blogId]);

  // Editing state fields
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [publishDate, setPublishDate] = useState('');
  const [author, setAuthor] = useState('');
  const [keywordCategory, setKeywordCategory] = useState('');
  const [keyword, setKeyword] = useState('');

  // Status notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 1. Fetch campaigns to populate selection dropdown
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await api.get('/campaigns');
      return response.data.data;
    }
  });

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
    if (!blogId) {
      fetchBlogsList();
    }
  }, [blogId]);

  // 2. Fetch blog associated with selected campaign
  const {
    data: blogRecord,
    isLoading: blogLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['blog', blogId || selectedCampaignId],
    queryFn: async () => {
      if (blogId) {
        const response = await api.get(`/blogs/${blogId}`);
        return response.data.data;
      }

      if (!selectedCampaignId) return null;
      try {
        const response = await api.get(`/blogs/campaign/${selectedCampaignId}`);
        return response.data.data;
      } catch (err) {
        const is404 =
          (err && err.response && err.response.status === 404) ||
          (typeof err === 'string' && (
            err.toLowerCase().includes('no canonical blog') ||
            err.toLowerCase().includes('no blog') ||
            err.toLowerCase().includes('not found') ||
            err.toLowerCase().includes('404')
          ));
        if (is404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!(blogId || selectedCampaignId),
    retry: false
  });

  const taskId = selectedCampaignId ? `blog_generate_${selectedCampaignId}` : null;
  const optimizeTaskId = blogRecord?._id ? `blog_optimize_${blogRecord._id}` : null;

  // Synchronize edit fields when blog record updates
  useEffect(() => {
    if (blogRecord?.campaignId) {
      const campaignId = typeof blogRecord.campaignId === 'object' ? blogRecord.campaignId._id : blogRecord.campaignId;
      if (campaignId) setSelectedCampaignId(campaignId);
    }

    if (blogRecord) {
      setTitle(blogRecord.title || '');
      setMetaDescription(blogRecord.metaDescription || '');
      setContent(blogRecord.content || '');
      setStatus(blogRecord.status || 'draft');
      setAuthor(blogRecord.author || '');
      setKeywordCategory(blogRecord.keywordCategory || '');
      setKeyword(blogRecord.keyword || '');
      if (blogRecord.publishDate) {
        const localDate = new Date(blogRecord.publishDate);
        const tzOffset = localDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(localDate - tzOffset)).toISOString().slice(0, 16);
        setPublishDate(localISOTime);
      } else {
        setPublishDate('');
      }
    } else {
      setTitle('');
      setMetaDescription('');
      setContent('');
      setStatus('draft');
      setAuthor('');
      setKeywordCategory('');
      setKeyword('');
      setPublishDate('');
    }
  }, [blogRecord]);

  // Sync URL route parameter with loaded blog document
  useEffect(() => {
    if (isEditing && blogRecord && !blogId) {
      navigate(`/blog-studio/${blogRecord._id}`, { replace: true });
    }
  }, [blogRecord, blogId, isEditing, navigate]);

  // Sync background generation task
  useEffect(() => {
    if (!taskId) return;
    const task = tasks[taskId];
    if (task) {
      if (task.status === 'success') {
        const newBlog = task.data;
        queryClient.setQueryData(['blog', blogId || selectedCampaignId], newBlog);
        queryClient.invalidateQueries({ queryKey: ['blogs'] });
        triggerToast('AI Canonical Blog successfully generated!');
        setIsEditing(true);
        clearTask(taskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Generation failed. Please try again.', 'error');
        clearTask(taskId);
      }
    }
  }, [tasks, taskId, blogId, selectedCampaignId, queryClient, clearTask]);

  // Sync background SEO optimization task
  useEffect(() => {
    if (!optimizeTaskId) return;
    const task = tasks[optimizeTaskId];
    if (task) {
      if (task.status === 'success') {
        const resData = task.data;
        queryClient.invalidateQueries({ queryKey: ['blog', blogId || selectedCampaignId] });
        triggerToast(`SEO Auto-Optimized successfully! Score: ${resData.oldScore} -> ${resData.newScore}`);
        clearTask(optimizeTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'SEO optimization failed.', 'error');
        clearTask(optimizeTaskId);
      }
    }
  }, [tasks, optimizeTaskId, blogId, selectedCampaignId, queryClient, clearTask]);

  // 4. Mutation: Update Blog content (Save/Publish edits)
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/blogs/${id}`, payload);
      return response.data.data;
    },
    onSuccess: (updatedBlog) => {
      queryClient.setQueryData(['blog', blogId || selectedCampaignId], updatedBlog);
      triggerToast('Canonical Blog modifications saved successfully.');
    }
  });

  const handleGenerate = (overwrite = false) => {
    if (!selectedCampaignId || !taskId) return;
    const payload = { campaignId: selectedCampaignId };
    
    // In one-to-one mapping, check if a blog already exists in our blogsList for this campaign
    const campaignBlog = blogsList.find(b => (b.campaignId?._id || b.campaignId) === selectedCampaignId);
    if ((overwrite || campaignBlog) && (blogRecord || campaignBlog)) {
      payload.blogId = blogRecord?._id || campaignBlog?._id;
    }
    
    startTask(taskId, async () => {
      const response = await api.post('/blogs/generate', payload);
      return response.data.data;
    });
  };

  const handleSave = (targetStatus = null) => {
    if (!blogRecord) return;
    const finalStatus = targetStatus || status;
    updateMutation.mutate({
      id: blogRecord._id,
      payload: {
        title: title.trim(),
        metaDescription: metaDescription.trim(),
        content: content.trim(),
        status: finalStatus,
        publishDate: publishDate ? new Date(publishDate).toISOString() : null,
        author: author.trim(),
        keywordCategory: keywordCategory.trim(),
        keyword: keyword.trim()
      }
    });
  };

  const handleOptimize = () => {
    if (!blogRecord || !optimizeTaskId) return;
    startTask(optimizeTaskId, async () => {
      const response = await api.post(`/blogs/${blogRecord._id}/optimize`);
      return response.data;
    });
  };

  const activeCampaign = campaigns?.find((c) => c._id === selectedCampaignId);

  // Compute SEO / validation stats using live content state for reactive feedback
  const liveWordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const wordCount = liveWordCount;
  const wordCountValid = wordCount >= 800 && wordCount <= 1200;
  const h2Count = blogRecord?.seoAnalysis?.checks?.h2Count || 0;
  const h2Valid = h2Count >= 4;
  const h1Valid = blogRecord?.seoAnalysis?.checks?.keywordInH1 || false;
  const metaValid = !!metaDescription;
  const slugValid = !!blogRecord?.slug;
  const conclusionValid = blogRecord?.seoAnalysis?.checks?.conclusionPresence || false;

  const isValidationPassed = wordCountValid && h2Valid && h1Valid && metaValid && slugValid && conclusionValid;

  const latestOpt = blogRecord?.optimizationHistory && blogRecord.optimizationHistory.length > 0
    ? blogRecord.optimizationHistory[blogRecord.optimizationHistory.length - 1]
    : null;

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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Blog Content Studio</h2>
          <p className="text-xs text-slate-400 mt-1">
            Synthesize, outline, draft, and modify 1800-2500 word canonical articles grounded in custom campaign objectives.
          </p>
        </div>

        {/* Campaign Selection Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Active Campaign:</span>
          <select
            value={selectedCampaignId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCampaignId(val);
              navigate('/blog-studio');
            }}
            disabled={((taskId && tasks[taskId]?.status === 'running') || updateMutation.isPending)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[200px]"
          >
            <option value="" className="bg-background text-slate-400">Select a Campaign...</option>
            {campaignsLoading ? (
              <option>Loading campaigns...</option>
            ) : campaigns && campaigns.length > 0 ? (
              campaigns.map((c) => (
                <option key={c._id} value={c._id} className="bg-background text-white">
                  {c.campaignName}
                </option>
              ))
            ) : (
              <option value="">No Campaigns Sourced</option>
            )}
          </select>
        </div>
      </div>

      {/* Primary Workspace */}
      <div className="w-full">
        {((taskId && tasks[taskId]?.status === 'running')) ? (
          /* Live Synthesis Loader Animation */
          <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px] relative overflow-hidden bg-background/80">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
            
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent to-secondary flex items-center justify-center animate-spin duration-[3.5s] shadow-glow-purple" />
              <Sparkles size={28} className="absolute inset-0 m-auto text-background animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Generating Canonical Content</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                GPT-5.4 is synthesizing campaign goals, brand voices, competitor voids, and knowledge context into an 1800-2500 word post...
              </p>
            </div>

            {/* Telemetry Console Logs */}
            <div className="w-full max-w-md p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[10px] text-accent space-y-1.5 shadow-2xl">
              <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2 mb-2">
                <span>SYSTEM WRITER ENGAGED</span>
                <span className="animate-pulse text-accent">● WRITING BLOG</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={10} />
                <span>[DB] Grounded with Campaign keywords & target objectives.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={10} />
                <span>[DB] Grounded with Persona details and competitor analysis records.</span>
              </div>
              <div className="flex items-center gap-2 text-accent animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span>[AI] Writing comprehensive 1800-word canonical structure...</span>
              </div>
            </div>
          </div>
        ) : blogLoading ? (
          /* Workspace loading skeleton */
          <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm font-semibold tracking-wider text-slate-400">Querying campaign content records...</p>
          </div>
        ) : isError ? (
          /* Error card */
          <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto min-h-[300px] flex flex-col justify-center">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <h3 className="text-xl font-bold text-red-200">Failed to Load Content Engine</h3>
            <p className="text-xs text-slate-400">{typeof error === 'string' ? error : (error.message || 'Unknown network error.')}</p>
          </div>
        ) : (!blogId && !selectedCampaignId) ? (
          /* Split View: Sourcing info & Directory list */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Sourcing Context Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-white/5 flex flex-col space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gradient">Content Studio Sourcing</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Select an active campaign from the dropdown in the header to view or generate its canonical blog post, or choose an existing generated blog from the directory to configure CMS publishing and schedule metadata.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Blogs Directory list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-white/5 min-h-[400px] flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-secondary" />
                  <span>Content Studio Directory</span>
                </h3>

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-glass max-h-[500px]">
                  {loadingList ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                      <Loader2 className="animate-spin text-primary" size={28} />
                      <span className="text-xs text-slate-400">Loading directory...</span>
                    </div>
                  ) : blogsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                      <Sliders size={24} className="text-slate-500 animate-pulse" />
                      <p className="text-xs text-slate-400 font-semibold">No posts generated yet</p>
                      <p className="text-[10px] text-slate-500 max-w-xs">Generate a post in Quick Blog or connect a Campaign to start.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                      {blogsList.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => {
                            setSelectedCampaignId('');
                            navigate(`/blog-studio/${item._id}`);
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
        ) : (selectedCampaignId && !isEditing) ? (
          /* Campaign details preview with associated blogs list */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left/Main Column: Campaign details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header card preview */}
              {activeCampaign && (
                <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between gap-4">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="space-y-2 relative z-10">
                    <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold tracking-wide uppercase">
                      Campaign Context
                    </span>
                    <h3 className="text-xl font-bold text-white">{activeCampaign.campaignName}</h3>
                    <p className="text-xs text-slate-300">
                      Topic: <strong className="text-primary font-medium">{activeCampaign.topic}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Campaign Intent & Goals */}
              {activeCampaign && (
                <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaign Intent & Goals</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeCampaign.goal || 'No targeted goals specified for this campaign.'}
                  </p>
                </div>
              )}

              {/* Persona & platforms detail row */}
              {activeCampaign && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Persona details */}
                  <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Persona</h4>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs font-bold text-white">
                        {activeCampaign.personaId?.personaName || 'Unknown Persona'}
                      </p>
                      <div className="flex gap-1.5 text-[9px] text-primary mt-1.5 font-bold">
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/15 rounded-full">
                          Tone: {activeCampaign.personaId?.tone || '—'}
                        </span>
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/15 rounded-full">
                          Audience: {activeCampaign.personaId?.audienceType || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Platforms list */}
                  <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Targeted Platforms</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCampaign.platforms?.map((plat) => (
                        <span key={plat} className="inline-block text-[9px] font-semibold px-2 py-0.5 rounded bg-white/5 text-accent border border-white/5 capitalize">
                          {plat.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords list */}
              {activeCampaign && (
                <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target SEO Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {!activeCampaign.keywords || activeCampaign.keywords.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No custom SEO keywords specified.</p>
                    ) : (
                      activeCampaign.keywords.map((kw) => (
                        <span key={kw} className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 font-medium">
                          #{kw}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Sourcing Card / Blog generated for this campaign */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#0B0F1C]/90 flex flex-col min-h-[400px]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span>Campaign Blog Post</span>
                </h3>

                {(() => {
                  const campaignBlog = blogsList.find(b => (b.campaignId?._id || b.campaignId) === selectedCampaignId);
                  
                  if (!campaignBlog) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 flex-grow">
                        <BookOpen size={24} className="text-slate-500 animate-pulse" />
                        <div>
                          <p className="text-xs text-slate-400 font-semibold">No Blog Generated Yet</p>
                          <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 mx-auto leading-relaxed">
                            Generate a canonical long-form article dynamically for this marketing campaign.
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleGenerate(false)}
                          className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold text-xs rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-1.5 mt-2"
                        >
                          <Sparkles size={14} />
                          <span>Generate Canonical Blog</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col justify-between flex-grow gap-4 h-full">
                      <div
                        onClick={() => navigate(`/blog-studio/${campaignBlog._id}`)}
                        className="relative p-5 bg-white/5 border border-white/5 hover:border-primary/30 rounded-2xl flex flex-col gap-4 transition-all duration-300 hover:shadow-glow-sm cursor-pointer group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase border ${
                              campaignBlog.status?.toLowerCase() === 'published'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : campaignBlog.status?.toLowerCase() === 'scheduled'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-white/5 text-slate-300 border-white/10'
                            }`}>
                              {campaignBlog.status || 'draft'}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              SEO Score: {campaignBlog.seoScore || 0}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-3" title={campaignBlog.title}>
                            {campaignBlog.title}
                          </h4>
                        </div>

                        <div className="border-t border-white/5 pt-4 space-y-1.5 text-[10px] text-slate-400">
                          <div className="flex justify-between">
                            <span className="font-semibold">Author:</span>
                            <span className="text-slate-300">{campaignBlog.author || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Last Updated:</span>
                            <span className="text-slate-300">{new Date(campaignBlog.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-auto space-y-2">
                        <button
                          onClick={() => navigate(`/blog-studio/${campaignBlog._id}`)}
                          className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <FileEdit size={14} className="text-slate-400" />
                          <span>Open Blog Editor</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm("This will overwrite the existing blog version and generate new AI content. Are you sure?")) {
                              handleGenerate(true);
                            }
                          }}
                          className="w-full py-2.5 border border-primary/20 hover:border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-glow-sm"
                        >
                          <RotateCw size={13} className="text-primary" />
                          <span>Regenerate Content</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          /* Full Content Editor Workspace */
          <div className="space-y-6">
            
            {/* Top Workspace Section: Metadata and SEO Dashboard side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Blog Document Configuration */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sliders size={16} className="text-primary" />
                  <span>Metadata Configurations</span>
                </h3>

                {/* SEO Title */}
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

                {/* Meta Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Meta Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Target Keyword */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Target Keyword</label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. nodejs scaling"
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Keyword Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Keyword Category</label>
                  <input
                    type="text"
                    value={keywordCategory}
                    onChange={(e) => setKeywordCategory(e.target.value)}
                    placeholder="e.g. Backend"
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Slug display */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">URL Slug</label>
                  <div className="w-full px-4 py-2.5 bg-background/30 border border-white/10 rounded-xl text-slate-400 text-xs font-mono select-all truncate" title={blogRecord?.slug || ''}>
                    {blogRecord?.slug || 'Not generated yet'}
                  </div>
                </div>

                {/* Status indicator / selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Post Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="draft" className="bg-background text-white">Draft</option>
                    <option value="scheduled" className="bg-background text-white">Scheduled</option>
                    <option value="published" className="bg-background text-white">Published</option>
                    <option value="archived" className="bg-background text-white">Archived</option>
                  </select>
                </div>

                {/* Publish date & time editor */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Scheduled Publish Date & Time</label>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors text-center cursor-pointer"
                  />
                </div>
              </div>

              {/* SEO Analytics Dashboard Panel */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Gauge size={16} className="text-primary" />
                    <span>SEO Dashboard</span>
                  </h3>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center items-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">SEO Score</span>
                      <span className={`text-lg font-extrabold font-mono mt-0.5 ${
                        blogRecord.seoScore >= 80 ? 'text-emerald-400' : blogRecord.seoScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {blogRecord.seoScore || 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center items-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Word Count</span>
                      <span className={`text-lg font-extrabold font-mono mt-0.5 ${
                        wordCountValid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {wordCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center items-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Readability</span>
                      <span className="text-lg font-extrabold font-mono text-slate-300 mt-0.5">
                        {blogRecord.seoAnalysis?.readabilityScore || 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center items-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Density</span>
                      <span className="text-lg font-extrabold font-mono text-slate-300 mt-0.5">
                        {blogRecord.seoAnalysis?.keywordDensity !== undefined ? `${blogRecord.seoAnalysis.keywordDensity}%` : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Validation Status Section */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Validation Status</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                        isValidationPassed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isValidationPassed ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className={wordCountValid ? 'text-emerald-400' : 'text-rose-400'}>{wordCountValid ? '✓' : '✗'}</span>
                        <span className="text-slate-300 truncate">Length: {wordCount} w</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={h2Valid ? 'text-emerald-400' : 'text-rose-400'}>{h2Valid ? '✓' : '✗'}</span>
                        <span className="text-slate-300 truncate">Min 4 H2s: {h2Count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={h1Valid ? 'text-emerald-400' : 'text-rose-400'}>{h1Valid ? '✓' : '✗'}</span>
                        <span className="text-slate-300 truncate">H1 Keyword</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={conclusionValid ? 'text-emerald-400' : 'text-rose-400'}>{conclusionValid ? '✓' : '✗'}</span>
                        <span className="text-slate-300 truncate">Conclusion</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Checklist */}
                  <div className="space-y-2.5 border-t border-white/5 pt-3 mt-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5 font-mono">SEO Checklists</span>
                    {blogRecord.seoAnalysis?.checks ? (
                      (() => {
                        const checks = blogRecord.seoAnalysis.checks;
                        const coreChecks = [
                          { label: 'Keyword in Title', ok: checks.keywordInTitle, missing: 'Missing Title Keyword' },
                          { label: 'Keyword in Meta Description', ok: checks.keywordInMetaDescription, missing: 'Missing Meta Keyword' },
                          { label: 'Keyword in First Paragraph', ok: checks.keywordInFirstParagraph, missing: 'Missing First Paragraph Keyword' },
                          { label: 'Keyword in H1', ok: checks.keywordInH1, missing: 'Missing H1 Keyword' },
                          { label: 'FAQ Section', ok: checks.faqPresence, missing: 'Missing FAQ' },
                          { label: 'Internal Links', ok: checks.internalLinks >= 1, missing: 'Missing Internal Links' }
                        ];

                        return coreChecks.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                            {item.ok ? (
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span>{item.label}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">⚠</span>
                                <span className="text-slate-400 font-medium">{item.missing}</span>
                              </span>
                            )}
                            <span className={`text-[9px] font-mono uppercase font-bold ${item.ok ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                              {item.ok ? 'Pass' : 'Alert'}
                            </span>
                          </div>
                        ));
                      })()
                    ) : (
                      <p className="text-[10px] text-slate-500 py-1 text-center font-semibold">Audit checks data unavailable.</p>
                    )}
                  </div>

                  {/* Recommendations Section */}
                  <div className="space-y-2 border-t border-white/5 pt-3 mt-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5 font-mono">Recommendations</span>
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 scrollbar-glass">
                      {blogRecord.seoAnalysis?.recommendations && blogRecord.seoAnalysis.recommendations.length > 0 ? (
                        blogRecord.seoAnalysis.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-2 bg-white/5 border border-white/5 text-[10px] text-slate-300 rounded-lg leading-normal">
                            - {rec}
                          </div>
                        ))
                      ) : (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-center rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5">
                          <Check size={12} />
                          <span>Post is fully optimized!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto Optimize Button & History */}
                <div className="space-y-3 pt-3 border-t border-white/5 mt-4">
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={((optimizeTaskId && tasks[optimizeTaskId]?.status === 'running') || (taskId && tasks[taskId]?.status === 'running') || updateMutation.isPending)}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-background font-bold text-xs rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                  >
                    {((optimizeTaskId && tasks[optimizeTaskId]?.status === 'running')) ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-background" />
                        <span>Optimizing Content...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>Auto Optimize SEO</span>
                      </>
                    )}
                  </button>

                  {latestOpt && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-slate-400">
                        <span>Optimization Pipeline</span>
                        <span className="text-primary font-bold">Attempt #{latestOpt.attempt}</span>
                      </div>
                      <div className="flex justify-between items-center font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Current Score</span>
                          <span className="text-slate-400 line-through text-sm">{latestOpt.oldScore}</span>
                        </div>
                        <span className="text-slate-400 text-lg">➔</span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Improved Score</span>
                          <span className="text-emerald-400 font-extrabold text-sm">{latestOpt.newScore}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Workspace Section: Versions/Outlines stacked on left, Markdown Editor on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Stacked Version History & AI Outline */}
              <div className="lg:col-span-1 space-y-6 flex flex-col justify-start">
                
                {/* Version History List Panel */}
                <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col max-h-[300px]">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History size={16} className="text-accent" />
                    <span>Version History</span>
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-glass">
                    {blogRecord.versions && blogRecord.versions.length > 0 ? (
                      [...blogRecord.versions]
                        .sort((a, b) => b.version - a.version)
                        .slice(0, 5)
                        .map((ver, idx) => (
                          <div key={ver.version} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold font-mono text-white">v{ver.version}</span>
                                {idx === 0 && (
                                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded font-mono uppercase font-bold">
                                    Current
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 block font-mono">
                                {new Date(ver.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-slate-300">
                                SEO: {ver.seoScore}
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-[10px] text-slate-500 py-6 text-center font-semibold">No version snapshots created yet.</p>
                    )}
                  </div>
                </div>

                {/* Outline Display panel */}
                <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col max-h-[360px]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-accent" />
                    <span>AI Structural Outline</span>
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-glass">
                    {blogRecord.outline && blogRecord.outline.length > 0 ? (
                      blogRecord.outline.map((sec, idx) => (
                        <div key={idx} className="p-3 bg-white/5 border border-white/5 hover:border-white/10 transition-all rounded-xl space-y-1.5">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-[9px]">
                              {idx + 1}
                            </span>
                            <span className="truncate">{sec.sectionTitle}</span>
                          </p>
                          
                          {sec.talkingPoints && sec.talkingPoints.length > 0 && (
                            <ul className="list-disc ml-6 text-[10px] text-slate-400 space-y-1">
                              {sec.talkingPoints.map((tp, i) => (
                                <li key={i}>{tp}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 py-6 text-center font-semibold">No custom outline structures defined.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Markdown Editor */}
              <div className="lg:col-span-2 flex flex-col">
                <div className="glass-card rounded-3xl border border-white/5 overflow-hidden flex flex-col flex-grow h-full min-h-[680px]">
                  
                  {/* Editor Header Toolbar Controls */}
                  <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-white">
                      <FileEdit size={18} className="text-accent" />
                      <h3 className="text-sm font-bold tracking-tight">Canonical Markdown Editor</h3>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCampaignId) {
                            setIsEditing(false);
                            navigate('/blog-studio');
                          } else {
                            setSelectedCampaignId('');
                            navigate('/blog-studio');
                          }
                        }}
                        className="px-4 py-2 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-rose-950/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <X size={13} className="text-rose-400" />
                        <span>Close Editor</span>
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
                        onClick={() => handleGenerate(true)}
                        disabled={((taskId && tasks[taskId]?.status === 'running') || updateMutation.isPending)}
                        className="px-4 py-2 border border-primary/20 hover:border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <RotateCw size={13} className="text-primary" />
                        <span>Regenerate Content</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave(status)}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 border border-accent/20 hover:border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="animate-spin text-accent" size={13} />
                        ) : (
                          <Save size={13} className="text-accent" />
                        )}
                        <span>Save Changes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave('published')}
                        disabled={updateMutation.isPending}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-background text-xs font-bold rounded-xl shadow-glow hover:shadow-[0_0_25px_rgba(0,242,254,0.35)] transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {updateMutation.isPending && status === 'published' ? (
                          <Loader2 className="animate-spin text-background" size={13} />
                        ) : (
                          <Globe size={13} />
                        )}
                        <span>Publish Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Text Editor Workspace Area */}
                  <div className="flex-1 p-6 relative flex flex-col min-h-0 bg-background/25">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your comprehensive canonical content in structured Markdown formats..."
                      className="w-full flex-1 bg-transparent border-0 resize-none font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-0 overflow-y-auto pr-2 scrollbar-glass font-sans"
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

          </div>
        )}
      </div>

      {blogRecord && (
        <VersionHistoryDrawer
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          blogId={blogRecord._id}
          currentTitle={title}
          currentMeta={metaDescription}
          currentContent={content}
          onRestoreSuccess={(updatedBlog) => {
            queryClient.setQueryData(['blog', blogId || selectedCampaignId], updatedBlog);
            setTitle(updatedBlog.title || '');
            setMetaDescription(updatedBlog.metaDescription || '');
            setContent(updatedBlog.content || '');
            setStatus(updatedBlog.status || 'draft');
            setAuthor(updatedBlog.author || '');
            setKeywordCategory(updatedBlog.keywordCategory || '');
            setKeyword(updatedBlog.keyword || '');
            triggerToast('Blog restored to previous version successfully!');
          }}
        />
      )}
    </div>
  );
};

export default BlogStudio;
