import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Megaphone,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Compass,
  Sparkles,
  ArrowLeft,
  Globe,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

export const Campaigns = () => {
  const queryClient = useQueryClient();

  // Navigation / Modal View modes
  const [modalOpen, setModalOpen] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState(null);
  const [viewCampaignDetails, setViewCampaignDetails] = useState(null);

  // Form Fields
  const [campaignName, setCampaignName] = useState('');
  const [topic, setTopic] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('draft');

  // Tag inputs helper
  const [newKeyword, setNewKeyword] = useState('');

  // Notices
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // 1. React Query: List campaigns
  const { data: campaignsData, isLoading: campaignsLoading, isError: campaignsError, error: cErr } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await api.get('/campaigns');
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

  // 3. React Query: Create Campaign
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/campaigns', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      triggerToast('Campaign created successfully!');
      closeModal();
    }
  });

  // 4. React Query: Update Campaign
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/campaigns/${id}`, payload);
      return response.data.data;
    },
    onSuccess: (updatedCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      triggerToast('Campaign updated successfully!');
      
      // If we are currently viewing details, sync detail card state
      if (viewCampaignDetails && viewCampaignDetails._id === updatedCampaign._id) {
        setViewCampaignDetails(updatedCampaign);
      }
      closeModal();
    }
  });

  // 5. React Query: Delete Campaign
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      triggerToast('Campaign removed.');
      setViewCampaignDetails(null); // Return to list
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
    setEditCampaignId(null);
    setCampaignName('');
    setTopic('');
    setPersonaId('');
    setKeywords([]);
    setPlatforms([]);
    setGoal('');
    setStatus('draft');
    setValidationError('');
    setModalOpen(true);
  };

  // Open modal for Edit mode
  const openEditModal = (campaign) => {
    setEditCampaignId(campaign._id);
    setCampaignName(campaign.campaignName || '');
    setTopic(campaign.topic || '');
    setPersonaId(campaign.personaId?._id || campaign.personaId || '');
    setKeywords(campaign.keywords || []);
    setPlatforms(campaign.platforms || []);
    setGoal(campaign.goal || '');
    setStatus(campaign.status || 'draft');
    setValidationError('');
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setEditCampaignId(null);
    setValidationError('');
  };

  // Deletion confirm
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this marketing campaign?')) {
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

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!campaignName.trim()) {
      setValidationError('Campaign Name is required.');
      return;
    }
    if (!topic.trim()) {
      setValidationError('Campaign Topic is required.');
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
      campaignName: campaignName.trim(),
      topic: topic.trim(),
      personaId,
      keywords,
      platforms,
      goal: goal.trim(),
      status
    };

    if (editCampaignId) {
      updateMutation.mutate({ id: editCampaignId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (campaignsLoading || personasLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Campaigns Engine...</p>
      </div>
    );
  }

  if (campaignsError) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-red-200">Failed to Load Campaigns</h3>
        <p className="text-xs text-slate-400">{typeof cErr === 'string' ? cErr : (cErr.message || 'Unknown network error.')}</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: CAMPAIGN DETAILS PANEL
  // ----------------------------------------------------
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

      {viewCampaignDetails ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back Link Breadcrumb */}
          <button
            onClick={() => setViewCampaignDetails(null)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white hover:underline transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to campaigns list</span>
          </button>

          {/* Header Board */}
          <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                  viewCampaignDetails.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' :
                  viewCampaignDetails.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                  'bg-slate-500/10 border-slate-500/20 text-slate-400'
                }`}>
                  {viewCampaignDetails.status}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">{viewCampaignDetails.campaignName}</h2>
              </div>
              <p className="text-sm text-slate-300 max-w-xl">
                Topic: <strong className="text-primary font-medium">{viewCampaignDetails.topic}</strong>
              </p>
            </div>

            <div className="flex gap-2 z-10">
              <button
                onClick={() => openEditModal(viewCampaignDetails)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all rounded-xl font-bold text-xs"
              >
                <Edit2 size={14} />
                <span>Edit Info</span>
              </button>
              <button
                onClick={() => handleDelete(viewCampaignDetails._id)}
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
                  <span>Campaign Intent & Goals</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {viewCampaignDetails.goal || 'No targeted goals specified for this campaign.'}
                </p>
              </div>

              {/* Targeted Keywords */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles size={16} className="text-accent" />
                  <span>SEO Keywords Targeted ({viewCampaignDetails.keywords?.length || 0})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {!viewCampaignDetails.keywords || viewCampaignDetails.keywords.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No custom SEO keywords specified.</p>
                  ) : (
                    viewCampaignDetails.keywords.map((kw) => (
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
                      {viewCampaignDetails.personaId?.personaName || 'Unknown Persona'}
                    </p>
                    <div className="flex gap-2 text-[10px] text-primary mt-2 font-semibold">
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/10 rounded-full">
                        Tone: {viewCampaignDetails.personaId?.tone || '—'}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/10 rounded-full">
                        Audience: {viewCampaignDetails.personaId?.audienceType || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Platforms Sourced */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Targeted Platforms</h4>
                  <div className="space-y-2">
                    {viewCampaignDetails.platforms?.map((platform) => (
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
              <h2 className="text-2xl font-bold tracking-tight">Campaign Engine</h2>
              <p className="text-xs text-slate-400 mt-1">Design marketing campaigns, customize platforms, and configure SEO value propositions.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-bold text-background rounded-xl shadow-glow self-start sm:self-center"
            >
              <Plus size={18} />
              <span>Create Campaign</span>
            </button>
          </div>

          {/* Primary Listings Table */}
          {campaignsData.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
                <Megaphone size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gradient">No Campaigns Active</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Your growth engine does not have any campaigns active. Create your first campaign to generate multi-platform SEO content.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-xl shadow-glow transition-all"
              >
                Launch Campaign Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignsData.map((campaign) => (
                <div 
                  key={campaign._id} 
                  onClick={() => setViewCampaignDetails(campaign)}
                  className="glass-card rounded-2xl border border-white/5 bg-[#0B0F1C]/90 hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 flex flex-col p-6 space-y-4 justify-between relative overflow-hidden group cursor-pointer"
                >
                  {/* Subtle top glowing bar based on status */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    campaign.status === 'active' ? 'from-primary to-accent' :
                    campaign.status === 'completed' ? 'from-emerald-500 to-teal-400' :
                    'from-slate-600 to-slate-400'
                  }`} />

                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-mono">
                          {campaign.personaId?.personaName || 'Unknown Persona'}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                          {campaign.campaignName}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border shrink-0 ${
                        campaign.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' :
                        campaign.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>

                    {/* Core Topic Description */}
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Topic</p>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{campaign.topic}</p>
                    </div>

                    {/* Platforms target list */}
                    <div className="space-y-1.5">
                      <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Platforms</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.platforms.map(p => (
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
                      {campaign.keywords?.length || 0} Keywords
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewCampaignDetails(campaign)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/10"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(campaign)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/10"
                        title="Edit Campaign"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="p-2 bg-red-500/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-red-500/10 hover:border-red-500/20"
                        title="Delete Campaign"
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
                {editCampaignId ? 'Modify Marketing Campaign' : 'Initialize Campaign Context'}
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

              {/* Campaign Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Q3 Enterprise Expansion"
                  className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Topic */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Core Topic *</label>
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
                <label className="text-xs font-semibold text-slate-400">Target Audience Persona *</label>
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
                {personasData?.length === 0 && (
                  <p className="text-[10px] text-amber-400 pt-1 italic">
                    No active personas discovered. Please create a persona in Persona Settings first!
                  </p>
                )}
              </div>

              {/* Targeted Platforms Grid Checklist */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-400">Target Multi-Channel Platforms *</label>
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
                <label className="text-xs font-semibold text-slate-400">Target SEO Keywords</label>
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

              {/* Campaign Goals */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Campaign Objectives & Details</label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe your goals, targets, core call-to-actions, and messaging strategies..."
                  className="w-full px-4 py-3 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary resize-none placeholder:text-slate-600"
                />
              </div>

              {/* Status & Options Grid */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Campaign Operations Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="draft" className="bg-surface">Draft</option>
                  <option value="active" className="bg-surface">Active</option>
                  <option value="completed" className="bg-surface">Completed</option>
                </select>
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
                      <span>{editCampaignId ? 'Save Changes' : 'Initialize Campaign'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
