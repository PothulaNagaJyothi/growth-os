import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Compass,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Globe,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

export const Topics = ({ onNavigateToResearch }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation / Modal View modes
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-open modal if requested via router state redirect
  useEffect(() => {
    if (location.state?.openTopicModal) {
      setModalOpen(true);
      // Clear location state to prevent repeating on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [editTopicId, setEditTopicId] = useState(null);
  const [viewTopicDetails, setViewTopicDetails] = useState(null);

  // Form Fields
  const [topicName, setTopicName] = useState('');
  const [topic, setTopic] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('active');

  // Tag inputs helper
  const [newKeyword, setNewKeyword] = useState('');
  const [suggestingKeywords, setSuggestingKeywords] = useState(false);

  // Notices
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [suggestResearchModalOpen, setSuggestResearchModalOpen] = useState(false);
  const [createdTopicId, setCreatedTopicId] = useState(null);

  // 1. React Query: List topics
  const { data: topicsData, isLoading: topicsLoading, isError: topicsError, error: tErr } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data.data;
    }
  });

  // 2. React Query: List personas (dropdown choices)
  const { data: personasData, isLoading: personasLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await api.get('/personas');
      return response.data.data;
    }
  });

  // 3. React Query: Create Topic
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/topics', payload);
      return response.data.data;
    },
    onSuccess: (newTopic) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      triggerToast('Blog Topic created successfully!');
      closeModal();
      if (newTopic && newTopic._id) {
        setCreatedTopicId(newTopic._id);
        setSuggestResearchModalOpen(true);
      }
    }
  });

  // 4. React Query: Update Topic
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/topics/${id}`, payload);
      return response.data.data;
    },
    onSuccess: (updatedTopic) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      triggerToast('Blog Topic updated successfully!');
      
      // If we are currently viewing details, sync detail card state
      if (viewTopicDetails && viewTopicDetails._id === updatedTopic._id) {
        setViewTopicDetails(updatedTopic);
      }
      closeModal();
    }
  });

  // 5. React Query: Delete Topic
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      triggerToast('Blog Topic removed.');
      setViewTopicDetails(null); // Return to list
    }
  });

  // Toast notifier
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Open modal for Create mode
  const openCreateModal = () => {
    setEditTopicId(null);
    setTopicName('');
    setTopic('');
    setPersonaId('');
    setKeywords([]);
    setPlatforms([]);
    setGoal('');
    setStatus('active');
    setValidationError('');
    setModalOpen(true);
  };

  // Open modal for Edit mode
  const openEditModal = (t) => {
    setEditTopicId(t._id);
    setTopicName(t.topicName || '');
    setTopic(t.topic || '');
    setPersonaId(t.personaId?._id || t.personaId || '');
    setKeywords(t.keywords || []);
    setPlatforms(t.platforms || []);
    setGoal(t.goal || '');
    setStatus(t.status || 'active');
    setValidationError('');
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setEditTopicId(null);
    setValidationError('');
  };

  // Deletion confirm
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this blog topic?')) {
      deleteMutation.mutate(id);
    }
  };

  // Platform checkbox helper
  const handlePlatformChange = (platformName) => {
    if (platforms.includes(platformName)) {
      setPlatforms(platforms.filter(p => p !== platformName));
    } else {
      setPlatforms([...platforms, platformName]);
    }
  };

  // Keyword tag helpers
  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    if (keywords.includes(newKeyword.trim().toLowerCase())) {
      setNewKeyword('');
      return;
    }
    setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleSuggestKeywords = async () => {
    if (!topicName.trim() || !topic.trim()) return;
    setSuggestingKeywords(true);
    try {
      const response = await api.post('/topics/suggest-keywords', {
        topicName: topicName.trim(),
        topic: topic.trim()
      });
      const suggested = response.data.data || [];
      if (suggested.length > 0) {
        const merged = [...keywords];
        suggested.forEach(kw => {
          const clean = kw.toLowerCase().trim();
          if (clean && !merged.includes(clean)) {
            merged.push(clean);
          }
        });
        setKeywords(merged);
        triggerToast('AI suggested keywords added successfully!');
      } else {
        triggerToast('No keywords generated.');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to suggest keywords.');
    } finally {
      setSuggestingKeywords(false);
    }
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!topicName.trim()) {
      setValidationError('Topic Name is required.');
      return;
    }
    if (!topic.trim()) {
      setValidationError('Topic Detail is required.');
      return;
    }
    if (!personaId) {
      setValidationError('Please select a Target Persona.');
      return;
    }
    if (platforms.length === 0) {
      setValidationError('Please select at least one target platform.');
      return;
    }

    const payload = {
      topicName: topicName.trim(),
      topic: topic.trim(),
      personaId,
      keywords,
      platforms,
      goal: goal.trim(),
      status: 'active'
    };

    if (editTopicId) {
      updateMutation.mutate({ id: editTopicId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (topicsLoading || personasLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Topics Engine...</p>
      </div>
    );
  }

  if (topicsError) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-red-200">Failed to Load Topics</h3>
        <p className="text-xs text-slate-400">{typeof tErr === 'string' ? tErr : (tErr.message || 'Unknown network error.')}</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: TOPIC DETAILS PANEL
  // ----------------------------------------------------
  return (
    <div className="space-y-6 relative">
      {/* Floating Success Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 glass-card bg-white/95 border border-primary/20 text-foreground text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Check size={14} />
          </div>
          <span className="font-semibold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {viewTopicDetails ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back Link Breadcrumb */}
          <button
            onClick={() => setViewTopicDetails(null)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white hover:underline transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to topics list</span>
          </button>

          {/* Header Board */}
          <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                  viewTopicDetails.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' :
                  viewTopicDetails.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                  'bg-slate-500/10 border-slate-500/20 text-slate-400'
                }`}>
                  {viewTopicDetails.status}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">{viewTopicDetails.topicName}</h2>
              </div>
              <p className="text-sm text-slate-300 max-w-xl">
                Core Topic: <strong className="text-primary font-medium">{viewTopicDetails.topic}</strong>
              </p>
            </div>

            <div className="flex gap-2 z-10">
              <button
                onClick={() => openEditModal(viewTopicDetails)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all rounded-xl font-bold text-xs"
              >
                <Edit2 size={14} />
                <span>Edit Info</span>
              </button>
              <button
                onClick={() => handleDelete(viewTopicDetails._id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs transition-all"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Content Details Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Info Blocks */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Targeted Goal */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                  <Compass size={16} className="text-primary" />
                  <span>Topic Intent & Goals</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {viewTopicDetails.goal || 'No targeted goals specified for this topic.'}
                </p>
              </div>

              {/* Targeted Keywords */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles size={16} className="text-accent" />
                  <span>SEO Keywords Targeted ({viewTopicDetails.keywords?.length || 0})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {!viewTopicDetails.keywords || viewTopicDetails.keywords.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No custom SEO keywords specified.</p>
                  ) : (
                    viewTopicDetails.keywords.map((kw) => (
                      <span key={kw} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 font-medium tracking-wide">
                        #{kw}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar configuration metadata */}
            <div className="space-y-6">
              
              {/* Persona card & Platform targets */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
                
                {/* Target Persona Sourced */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Persona</h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm font-bold text-white">
                      {viewTopicDetails.personaId?.personaName || 'Unknown Persona'}
                    </p>
                    <div className="flex gap-2 text-[10px] text-primary mt-2 font-semibold">
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/10 rounded-full">
                        Tone: {viewTopicDetails.personaId?.tone || '—'}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/10 rounded-full">
                        Audience: {viewTopicDetails.personaId?.audienceType || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Platforms Sourced */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Targeted Platforms</h4>
                  <div className="space-y-2">
                    {viewTopicDetails.platforms?.map((platform) => (
                      <div key={platform} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Globe size={12} className="text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 capitalize">
                          {platform.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Blog Topics</h2>
              <p className="text-xs text-slate-400 mt-1">Design blog topics, customize platform integrations, and configure SEO keywords.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-bold text-background rounded-xl shadow-glow self-start sm:self-center"
            >
              <Plus size={18} />
              <span>Create Topic</span>
            </button>
          </div>

          {/* Primary Listings Table */}
          {topicsData.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
                <Compass size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gradient">No Active Topics</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Your growth engine does not have any blog topics active. Create your first topic to configure multi-platform SEO blogs.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-xl shadow-glow transition-all"
              >
                Create Topic Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicsData.map((t) => (
                <div 
                  key={t._id} 
                  onClick={() => setViewTopicDetails(t)}
                  className="glass-card rounded-2xl border border-white/5 bg-[#0B0F1C]/90 hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 flex flex-col p-6 space-y-4 justify-between relative overflow-hidden group cursor-pointer"
                >
                  {/* Subtle top glowing bar based on status */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    t.status === 'active' ? 'from-primary to-accent' :
                    t.status === 'completed' ? 'from-emerald-500 to-teal-400' :
                    'from-slate-600 to-slate-400'
                  }`} />

                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-mono">
                          {t.personaId?.personaName || 'Unknown Persona'}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                          {t.topicName}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border shrink-0 ${
                        t.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' :
                        t.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    {/* Core Topic Description */}
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Topic Detail</p>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{t.topic}</p>
                    </div>

                    {/* Platforms target list */}
                    <div className="space-y-1.5">
                      <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Platforms</p>
                      <div className="flex flex-wrap gap-1">
                        {t.platforms.map(p => (
                          <span key={p} className="inline-block text-[9px] font-medium px-2 py-0.5 rounded bg-white/5 text-accent border border-white/5 capitalize">
                            {p.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {t.keywords?.length || 0} Keywords
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewTopicDetails(t)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/10"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/10"
                        title="Edit Topic"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="p-2 bg-red-500/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-red-500/10 hover:border-red-500/20"
                        title="Delete Topic"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Form Modal Dialog Popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl glass-card rounded-2xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editTopicId ? 'Modify Blog Topic' : 'Create Blog Topic Context'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Form Validation Warnings */}
              {validationError && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Topic Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center">
                  Topic Name <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Q3 Enterprise Expansion"
                  className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Topic Detail */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center">
                  Target Core Topic Details <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. AI-driven marketing automation value propositions"
                  className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Persona Selection Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center">
                  Target Audience Persona <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <select
                  required
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="" className="bg-surface text-slate-500">-- Select Brand Persona --</option>
                  {personasData?.map(p => (
                    <option key={p._id} value={p._id} className="bg-surface text-white">
                      {p.personaName} ({p.tone})
                    </option>
                  ))}
                </select>
                {personasData?.length === 0 ? (
                  <div className="pt-2 space-y-1.5 animate-pulse">
                    <p className="text-[10px] text-amber-400 italic">
                      No active personas discovered. Please create an audience persona in Brand Setup.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/brand?tab=personas&redirect=topics')}
                      className="px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      <span>Create a Persona Now</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Targeted Platforms Grid Checklist */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center">
                  Target Multi-Channel Platforms <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['linkedin', 'medium', 'company-blog', 'dev-to', 'substack'].map((plat) => {
                    const active = platforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => handlePlatformChange(plat)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all capitalize text-center ${
                          active
                            ? 'bg-primary/10 border-primary/40 text-primary shadow-glow'
                            : 'bg-background/40 border-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {plat.replace('-', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keywords Tag Manager */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400">Target SEO Keywords</label>
                  <button
                    type="button"
                    onClick={handleSuggestKeywords}
                    disabled={suggestingKeywords || !topicName.trim() || !topic.trim()}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:no-underline"
                  >
                    {suggestingKeywords ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        <span>Suggesting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={10} />
                        <span>Suggest via AI</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keywords (press enter)"
                    className="flex-1 px-3 py-2 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKeyword(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Tags chips list */}
                <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {keywords.map(kw => (
                    <div
                      key={kw}
                      className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300"
                    >
                      <span>#{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="p-0.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives Details */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Topic Objectives & Details</label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe your goals, targets, core call-to-actions, and messaging strategies..."
                  className="w-full px-4 py-3 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary resize-none placeholder:text-slate-600"
                />
              </div>

              {/* Submit triggers */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-background font-bold rounded-xl shadow-glow flex items-center gap-1.5 text-sm"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editTopicId ? 'Save Changes' : 'Create Topic'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Suggest Research Confirmation Modal */}
      {suggestResearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-primary">
              <Sparkles size={24} className="animate-pulse" />
              <h3 className="text-lg font-bold text-white text-base">Unlock High-Performance SEO 🔍</h3>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed">
              You've successfully saved your blog topic! To make this post highly effective, we suggest running <strong>AI Market Research</strong> next. 
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This gathers trending industry news, performs competitor gap audits, and extracts targeted keywords to guide the blog copywriting model.
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuggestResearchModalOpen(false);
                  setCreatedTopicId(null);
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuggestResearchModalOpen(false);
                  if (onNavigateToResearch && createdTopicId) {
                    onNavigateToResearch(createdTopicId);
                  }
                  setCreatedTopicId(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background font-bold rounded-xl shadow-glow text-xs cursor-pointer flex items-center gap-1.5"
              >
                Go to Research Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Topics;
