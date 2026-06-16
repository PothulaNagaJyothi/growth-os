import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useTasks } from '../context/TaskContext';
import {
  Image as ImageIcon,
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle2,
  Upload,
  Download,
  Eye,
  Layers,
  X,
  FileImage
} from 'lucide-react';

export const ImageStudio = () => {
  const queryClient = useQueryClient();
  const { tasks, startTask, clearTask } = useTasks();

  // Selected campaign/blog state
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  // Image Generation States
  const [prompt, setPrompt] = useState('');
  const [dimensions, setDimensions] = useState('1024x1024');
  const [dimensionMode, setDimensionMode] = useState('presets'); // 'presets', 'custom'
  const [customWidth, setCustomWidth] = useState('1200');
  const [customHeight, setCustomHeight] = useState('630');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Monospace modal preview overlays
  const [previewImage, setPreviewImage] = useState(null);

  // Status notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  // Pre-select first campaign when loaded
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0]._id);
    }
  }, [campaigns, selectedCampaignId]);

  // 2. Fetch canonical blog associated with selected campaign
  const { data: blogRecord, isLoading: blogLoading } = useQuery({
    queryKey: ['blog', selectedCampaignId],
    queryFn: async () => {
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
    enabled: !!selectedCampaignId,
    retry: false
  });

  // 3. Fetch images associated with canonical blog
  const {
    data: imagesList,
    isLoading: imagesLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['images', blogRecord?._id],
    queryFn: async () => {
      if (!blogRecord?._id) return [];
      const response = await api.get(`/images/${blogRecord._id}`);
      return response.data.data;
    },
    enabled: !!blogRecord?._id
  });

  const imageTaskId = blogRecord?._id ? `image_generate_${blogRecord._id}` : null;

  // Sync background image generation task
  useEffect(() => {
    if (!imageTaskId) return;
    const task = tasks[imageTaskId];
    if (task) {
      if (task.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['images', blogRecord?._id] });
        triggerToast('AI Image successfully generated!');
        setPrompt('');
        clearTask(imageTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Image generation failed.', 'error');
        clearTask(imageTaskId);
      }
    }
  }, [tasks, imageTaskId, blogRecord?._id, queryClient, clearTask]);

  // 5. Mutation: Upload Image manually
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', blogRecord?._id] });
      triggerToast('Manual image uploaded successfully!');
      setSelectedFile(null);
    }
  });

  // Action: Suggest visual prompt based on campaign context
  const handleSuggestPrompt = async () => {
    if (!blogRecord?._id) return;
    try {
      triggerToast('Generating tailored prompt...');
      const response = await api.post('/images/suggest-prompt', { blogId: blogRecord._id });
      setPrompt(response.data.data);
      triggerToast('Branded prompt suggested successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to suggest prompt. Using default fallback.');
      setPrompt(`A clean, minimalist 3D isometric vector illustration depicting "${activeCampaign?.topic || 'topic'}", no text.`);
    }
  };

  // Helper to determine snaps/dimensions
  const getResolvedDimensions = () => {
    if (dimensionMode === 'presets') {
      return dimensions;
    }
    const w = parseInt(customWidth, 10) || 1024;
    const h = parseInt(customHeight, 10) || 1024;
    const ratio = w / h;
    if (ratio >= 1.3) {
      return '1792x1024';
    } else if (ratio <= 0.77) {
      return '1024x1792';
    } else {
      return '1024x1024';
    }
  };

  const triggerImageDownload = async (imageUrl, promptText, imgDim) => {
    try {
      triggerToast('Starting file download...');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanPrompt = (promptText || 'dalle_image')
        .slice(0, 30)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');
      link.download = `${cleanPrompt}_${imgDim}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      triggerToast('Download completed successfully!');
    } catch (err) {
      console.error('Failed to download image: ', err);
      window.open(imageUrl, '_blank');
      triggerToast('Image opened in a new tab.');
    }
  };

  // Action: Generate Image Trigger
  const handleGenerate = (e) => {
    e.preventDefault();
    if (!blogRecord?._id || !imageTaskId) return;
    const resolvedDims = getResolvedDimensions();
    startTask(imageTaskId, async () => {
      const response = await api.post('/images/generate', {
        blogId: blogRecord._id,
        prompt: prompt.trim(),
        dimensions: resolvedDims
      });
      return response.data.data;
    });
  };

  // Action: Upload File Trigger
  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!selectedFile || !blogRecord?._id) return;

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('blogId', blogRecord._id);

    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const activeCampaign = campaigns?.find((c) => c._id === selectedCampaignId);

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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Image Studio</h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate customized AI visuals via DALL-E or upload manual branding image assets bound to your blogs.
          </p>
        </div>

        {/* Campaign Selection Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Active Campaign:</span>
          <select
            value={selectedCampaignId}
            onChange={(e) => {
              setSelectedCampaignId(e.target.value);
            }}
            disabled={((imageTaskId && tasks[imageTaskId]?.status === 'running') || uploadMutation.isPending)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[200px]"
          >
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

      {/* Primary Split Console Panel */}
      {blogLoading ? (
        <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Content drafts...</p>
        </div>
      ) : !blogRecord ? (
        /* Empty State: Canonical Blog needs to be built first */
        <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
            <ImageIcon size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gradient">Canonical Blog Post Required</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Before managing image assets, you must generate a Canonical Blog in the Blog Content Studio for the campaign <strong>"{activeCampaign?.campaignName || 'Selected Campaign'}"</strong>.
            </p>
          </div>
        </div>
      ) : (
        /* Main Image Workspace Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Generative & Upload Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Generative Panel */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={18} className="animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI prompt generator</h3>
                </div>
                
                <button
                  type="button"
                  onClick={handleSuggestPrompt}
                  className="text-[10px] text-accent hover:underline font-semibold font-mono"
                >
                  [Suggest Prompt]
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Image Description Prompt *</label>
                  <textarea
                    rows={4}
                    required
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the subject, visual art style, color palettes, and lighting constraints for DALL-E..."
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                  />
                </div>

                {dimensionMode === 'presets' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-400">Dimensions *</label>
                        <button
                          type="button"
                          onClick={() => setDimensionMode('custom')}
                          className="text-[9px] text-accent hover:underline font-mono bg-transparent border-none p-0 cursor-pointer"
                        >
                          [Type Size]
                        </button>
                      </div>
                      <select
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        className="w-full px-3 py-2 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="1024x1024">Square (1024x1024) - Inline</option>
                        <option value="1792x1024">Landscape Cover (1792x1024)</option>
                        <option value="1024x1792">Vertical (1024x1792)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Model Deployment</label>
                      <div className="px-3 py-2 bg-white/5 border border-white/5 text-slate-400 text-xs rounded-xl font-mono">
                        gpt-image-2
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-400">Custom Size (px) *</label>
                      <button
                        type="button"
                        onClick={() => setDimensionMode('presets')}
                        className="text-[9px] text-accent hover:underline font-mono bg-transparent border-none p-0 cursor-pointer"
                      >
                        [Use Presets]
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Width (px)</label>
                        <input
                          type="number"
                          min="512"
                          max="2048"
                          required
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full px-3 py-2 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Height (px)</label>
                        <input
                          type="number"
                          min="512"
                          max="2048"
                          required
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full px-3 py-2 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    
                    <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
                      Note: Custom size of {customWidth}x{customHeight} will generate as {getResolvedDimensions()} to match DALL-E's high-res grid.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!prompt.trim() || (imageTaskId && tasks[imageTaskId]?.status === 'running')}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-background font-bold rounded-xl shadow-glow transition-all"
                >
                  {(imageTaskId && tasks[imageTaskId]?.status === 'running') ? (
                    <>
                      <Loader2 className="animate-spin text-background" size={16} />
                      <span>Generating Visuals...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Generate AI Image</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Upload Panel */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <Upload size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Manual Asset</h3>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Select Image File (PNG, JPG, WEBP) *</label>
                  
                  <div className="relative border border-dashed border-white/10 rounded-xl p-6 bg-background/40 hover:bg-background/80 hover:border-accent/40 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    
                    <FileImage size={24} className="text-slate-500 group-hover:text-accent group-hover:scale-110 transition-all" />
                    
                    <p className="text-[10px] text-slate-300 font-semibold mt-2 truncate max-w-[200px]">
                      {selectedFile ? selectedFile.name : 'Choose file or drag here'}
                    </p>
                    
                    <p className="text-[8px] text-slate-500 mt-1">Max Size: 5MB</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-50 font-bold rounded-xl transition-all"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={15} />
                      <span>Uploading File...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Upload Image File</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Right Side: Image Gallery Grid */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Gallery Board */}
            <div className="glass-card rounded-3xl border border-white/5 p-6 flex flex-col min-h-[500px]">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <Layers size={18} className="text-secondary" />
                  <h3 className="text-sm font-bold tracking-tight">Active Image Assets Gallery</h3>
                </div>
                
                <span className="text-[10px] text-slate-500 font-mono">
                  Sourced: {imagesList?.length || 0} Assets
                </span>
              </div>

              <div className="flex-1 min-h-0">
                {imagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-72 gap-2">
                    <Loader2 className="animate-spin text-primary" size={28} />
                    <p className="text-xs text-slate-500 font-medium">Loading Visual Assets...</p>
                  </div>
                ) : isError ? (
                  <p className="text-xs text-red-400 text-center py-12">Failed to load visual gallery.</p>
                ) : !imagesList || imagesList.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <ImageIcon size={36} className="text-slate-600 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-400 font-semibold">No image assets generated or uploaded.</p>
                    <p className="text-[9px] text-slate-500 max-w-[220px] mx-auto">Use the panels on the left to initialize AI generations or select files.</p>
                  </div>
                ) : (
                  /* Gallery Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto max-h-[460px] pr-2 scrollbar-glass">
                    {imagesList.map((img) => (
                      <div
                        key={img._id}
                        className="group glass-card rounded-xl border border-white/5 overflow-hidden flex flex-col bg-background/50 hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 relative"
                      >
                        {/* Image Preview Canvas */}
                        <div className="h-32 bg-slate-900 border-b border-white/5 overflow-hidden relative">
                          <img
                            src={img.imageUrl.startsWith('/uploads') ? `http://localhost:4000${img.imageUrl}` : img.imageUrl}
                            alt={img.prompt}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s]"
                          />
                          
                          {/* Floating badges */}
                          <div className="absolute top-2 left-2 flex gap-1.5 text-[8px] font-bold font-mono">
                            <span className={`px-2 py-0.5 rounded-full capitalize border ${
                              img.type === 'generated'
                                ? 'bg-primary/25 border-primary/20 text-primary'
                                : 'bg-accent/25 border-accent/20 text-accent'
                            }`}>
                              {img.type}
                            </span>
                            
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/5">
                              {img.dimensions}
                            </span>
                          </div>

                          {/* Quick view button */}
                          <button
                            onClick={() => setPreviewImage(img)}
                            className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye size={16} />
                          </button>
                        </div>

                        {/* Image Prompt details */}
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed hover:text-white transition-colors cursor-help" title={img.prompt}>
                            {img.prompt || 'Manual upload'}
                          </p>
                          
                           <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-500 font-mono shrink-0">
                            <span>Sourced: {new Date(img.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => triggerImageDownload(
                                img.imageUrl.startsWith('/uploads') ? `http://localhost:4000${img.imageUrl}` : img.imageUrl,
                                img.prompt,
                                img.dimensions
                              )}
                              className="text-primary hover:underline flex items-center gap-1 font-bold bg-transparent border-none p-0 cursor-pointer"
                            >
                              <span>Download</span>
                              <Download size={10} />
                            </button>
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
      )}

      {/* Mono Monospace Modal Image Preview Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl glass-card rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Image Preview Console</h4>
                <p className="text-[9px] text-slate-400">Dimensions: {previewImage.dimensions} | Created: {new Date(previewImage.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerImageDownload(
                    previewImage.imageUrl.startsWith('/uploads') ? `http://localhost:4000${previewImage.imageUrl}` : previewImage.imageUrl,
                    previewImage.prompt,
                    previewImage.dimensions
                  )}
                  className="p-1.5 bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Download Image"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 max-h-[60vh] overflow-hidden">
              <img
                src={previewImage.imageUrl.startsWith('/uploads') ? `http://localhost:4000${previewImage.imageUrl}` : previewImage.imageUrl}
                alt={previewImage.prompt}
                className="max-w-full max-h-[50vh] object-contain rounded-lg"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 bg-white/5 border-t border-white/5 text-[10px] text-slate-300 leading-relaxed font-mono shrink-0">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block mb-1">DALL-E Visual prompt:</span>
              {previewImage.prompt || 'No Prompt context defined.'}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ImageStudio;
