import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { 
  Building, 
  Globe, 
  Tag, 
  FileText, 
  Users, 
  Volume2, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

export const Settings = () => {
  const queryClient = useQueryClient();

  // Local Form states
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [logo, setLogo] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [competitors, setCompetitors] = useState([]);
  
  // Tag input state for competitors
  const [newCompetitor, setNewCompetitor] = useState('');

  // Status Alerts
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [validationError, setValidationError] = useState('');

  // 1. React Query: Fetch Company profile
  const { data: companyData, isLoading, isError, error } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await api.get('/company');
      return response.data.data;
    }
  });

  // Sync server data to local form states on mount or refetch
  useEffect(() => {
    if (companyData) {
      setCompanyName(companyData.companyName || '');
      setWebsite(companyData.website || '');
      setIndustry(companyData.industry || '');
      setLogo(companyData.logo || '');
      setProductDescription(companyData.productDescription || '');
      setTargetAudience(companyData.targetAudience || '');
      setBrandVoice(companyData.brandVoice || '');
      setCompetitors(companyData.competitors || []);
    }
  }, [companyData]);

  // 2. React Query: Save/Update Company profile Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedPayload) => {
      const response = await api.put(`/company/${companyData._id}`, updatedPayload);
      return response.data.data;
    },
    onSuccess: (updatedData) => {
      // Invalidate the cache to trigger a clean sync and keep state current
      queryClient.setQueryData(['company'], updatedData);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  });

  // Competitor tags helpers
  const handleAddCompetitor = (e) => {
    e.preventDefault();
    if (!newCompetitor.trim()) return;
    if (competitors.includes(newCompetitor.trim())) {
      setNewCompetitor('');
      return;
    }
    setCompetitors([...competitors, newCompetitor.trim()]);
    setNewCompetitor('');
  };

  const handleRemoveCompetitor = (competitorToRemove) => {
    setCompetitors(competitors.filter(c => c !== competitorToRemove));
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!companyName.trim()) {
      setValidationError('Company Name is a required field.');
      return;
    }

    const payload = {
      companyName: companyName.trim(),
      website: website.trim(),
      industry: industry.trim(),
      logo: logo.trim(),
      productDescription: productDescription.trim(),
      targetAudience: targetAudience.trim(),
      brandVoice: brandVoice.trim(),
      competitors
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Fetching Company Metadata...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-red-200">Failed to Load Profile</h3>
        <p className="text-xs text-slate-400">Sourced error: {typeof error === 'string' ? error : (error.message || 'Unknown network error.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Floating Success Notification */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 glass-card bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check size={14} className="text-emerald-400" />
          </div>
          <span className="font-semibold">Company profile successfully saved!</span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company Settings</h2>
          <p className="text-xs text-slate-400 mt-1">Configure your product profile, brand voice, and industry competitors</p>
        </div>
      </div>

      {/* Validation Banner */}
      {validationError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Primary Details Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Company Bio */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-md font-bold flex items-center gap-2 border-b border-white/5 pb-3">
              <Building size={18} className="text-primary" />
              <span>Core Profile Info</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Company Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Website URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Globe size={16} />
                  </span>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Industry / Sector</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Tag size={16} />
                  </span>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. B2B SaaS, FinTech"
                    className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Logo Image URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <ImageIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Brand Context Details */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-md font-bold flex items-center gap-2 border-b border-white/5 pb-3">
              <FileText size={18} className="text-accent" />
              <span>Brand Narrative & Context</span>
            </h3>

            {/* Product Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Product / Service Description</label>
              <textarea
                rows={4}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe what your product does, value proposition, and key features..."
                className="w-full p-4 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Audience Description</label>
              <textarea
                rows={3}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. CMOs at mid-market tech companies, founders seeking pre-seed capital..."
                className="w-full p-4 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Settings & Tagging Panel */}
        <div className="space-y-6">
          
          {/* Section: Brand Voice & Competitors */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 flex flex-col h-full">
            <h3 className="text-md font-bold flex items-center gap-2 border-b border-white/5 pb-3">
              <Volume2 size={18} className="text-secondary" />
              <span>Identity & Competitors</span>
            </h3>

            {/* Brand Voice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Brand Voice / Tone</label>
              <textarea
                rows={3}
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="e.g. Professional, authoritative, yet approachable and forward-thinking..."
                className="w-full p-4 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 resize-none"
              />
            </div>

            {/* Competitors Tag/Chip Manager */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-400">Key Competitors</label>
              
              {/* Input for competitor */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="Add competitor"
                  className="flex-1 px-3 py-2 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary placeholder:text-slate-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCompetitor(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCompetitor}
                  className="p-2 bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all rounded-xl flex items-center justify-center shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Chips container */}
              <div className="flex flex-wrap gap-2 pt-2 max-h-[140px] overflow-y-auto pr-1">
                {competitors.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No competitors configured yet.</p>
                ) : (
                  competitors.map((comp) => (
                    <div
                      key={comp}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300"
                    >
                      <span>{comp}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompetitor(comp)}
                        className="p-0.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-6 mt-auto">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-background font-bold rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 text-sm"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save Company profile</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};

export default Settings;
