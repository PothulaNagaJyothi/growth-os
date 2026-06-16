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
  const [brandColors, setBrandColors] = useState([]);
  const [brandColorsDescription, setBrandColorsDescription] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Tag input state for competitors
  const [newCompetitor, setNewCompetitor] = useState('');

  // Status Alerts
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
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
      setBrandColors(companyData.brandColors || []);
      setBrandColorsDescription(companyData.brandColorsDescription || '');
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
      setToastMessage('Company profile successfully saved!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filetypes = /png|jpg|jpeg|webp/;
    const extname = file.name.split('.').pop().toLowerCase();
    if (!filetypes.test(extname)) {
      setValidationError('Supported image formats are: .png, .jpg, .jpeg, and .webp only.');
      return;
    }

    setUploadingLogo(true);
    setValidationError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/company/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedCompany = response.data.data;
      setLogo(updatedCompany.logo || '');
      setBrandColors(updatedCompany.brandColors || []);
      setBrandColorsDescription(updatedCompany.brandColorsDescription || '');
      
      queryClient.setQueryData(['company'], updatedCompany);
    } catch (err) {
      console.error('Logo upload failed:', err);
      setValidationError(err.response?.data?.error || 'Failed to upload logo image asset.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the company logo? This will also clear the brand colors context.')) {
      return;
    }

    setValidationError('');
    
    try {
      const response = await api.delete('/company/delete-logo');
      const updatedCompany = response.data.data;
      
      setLogo('');
      setBrandColors([]);
      setBrandColorsDescription('');
      
      queryClient.setQueryData(['company'], updatedCompany);
      setToastMessage('Company logo successfully removed!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error('Logo deletion failed:', err);
      setValidationError(err.response?.data?.error || 'Failed to remove company logo.');
    }
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!companyName.trim()) {
      setValidationError('Company Name is a required field.');
      return;
    }

    if (!website.trim()) {
      setValidationError('Website URL is a required field.');
      return;
    }

    if (!logo.trim()) {
      setValidationError('Company Logo is a required field. Please upload a logo file.');
      return;
    }

    if (!productDescription.trim()) {
      setValidationError('Product / Service Description is a required field.');
      return;
    }

    if (!targetAudience.trim()) {
      setValidationError('Target Audience Description is a required field.');
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
      competitors,
      brandColors,
      brandColorsDescription
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
      {showToast && (
        <div className="fixed top-20 right-6 z-50 glass-card bg-white/95 border border-primary/20 text-foreground text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Check size={14} />
          </div>
          <span className="font-semibold text-slate-800">{toastMessage}</span>
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
                <label className="text-xs font-semibold text-slate-400">Website URL *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Globe size={16} />
                  </span>
                  <input
                    type="text"
                    required
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

              {/* Logo Section */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400">Company Logo *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Zone */}
                  <div className="flex flex-col gap-2">
                    <div className="relative border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center bg-background/40 hover:border-primary/50 transition-all text-center group min-h-[110px]">
                      {uploadingLogo ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-primary" size={20} />
                          <span className="text-xs text-slate-400">Uploading & analyzing logo...</span>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <ImageIcon size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                          <span className="text-xs font-bold text-white mt-1 group-hover:text-primary transition-colors">
                            Upload Logo Image
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            PNG, JPG, WEBP (Max 2MB)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Logo Preview & Detected Colors */}
                  <div className="border border-white/10 bg-background/30 rounded-xl p-4 flex flex-col justify-center min-h-[110px]">
                    {logo ? (
                      <div className="flex items-start gap-3.5">
                        {/* Logo Image Preview */}
                        <div className="relative group/preview shrink-0">
                          <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-2 border border-slate-200 shadow-sm overflow-hidden">
                            <img
                              src={logo}
                              alt="Company Logo Preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          
                          {/* Trash Delete Action Button */}
                          <button
                            type="button"
                            onClick={handleLogoDelete}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors cursor-pointer border border-white/20 flex items-center justify-center"
                            title="Remove logo"
                            style={{ color: '#ffffff' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                        {/* Brand Colors Meta */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                            Logo Preview & Colors
                          </span>
                          {brandColors && brandColors.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {brandColors.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-3.5 h-3.5 rounded-full border border-white/15"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">No colors analyzed yet</p>
                          )}
                          <p className="text-[10px] text-slate-450 leading-relaxed max-h-[40px] overflow-y-auto" title={brandColorsDescription}>
                            {brandColorsDescription || 'Logo uploaded successfully. Ready for asset generation.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center text-slate-500 py-4">
                        <ImageIcon size={20} className="opacity-40" />
                        <span className="text-[10px] italic mt-1">No logo uploaded yet</span>
                      </div>
                    )}
                  </div>
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
              <label className="text-xs font-semibold text-slate-400">Product / Service Description *</label>
              <textarea
                rows={4}
                required
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe what your product does, value proposition, and key features..."
                className="w-full p-4 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Audience Description *</label>
              <textarea
                rows={3}
                required
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
                  className="p-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all duration-200 rounded-xl flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.97] hover:scale-[1.02]"
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
