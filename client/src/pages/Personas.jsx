import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  UserPlus,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Smile,
  Type,
  Users,
  FileText,
  ArrowLeft,
  X
} from 'lucide-react';

export const Personas = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Modal open states & Edit modes
  const [modalOpen, setModalOpen] = useState(false);
  const [editPersonaId, setEditPersonaId] = useState(null);
  const [viewPersonaDetails, setViewPersonaDetails] = useState(null);

  // Form fields state
  const [personaName, setPersonaName] = useState('');
  const [tone, setTone] = useState('');
  const [writingStyle, setWritingStyle] = useState('');
  const [audienceType, setAudienceType] = useState('');
  const [description, setDescription] = useState('');

  // Status indicators
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // 1. React Query: List Personas
  const { data: personasData, isLoading, isError, error } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await api.get('/personas');
      return response.data.data;
    }
  });

  // 2. React Query: Create Persona Mutation
  const createMutation = useMutation({
    mutationFn: async (newPersona) => {
      const response = await api.post('/personas', newPersona);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      triggerToast('Persona created successfully!');
      closeModal();
      
      const params = new URLSearchParams(location.search);
      if (params.get('redirect') === 'topics' || (location.state && location.state.redirect === 'topics')) {
        navigate('/topics', { state: { openTopicModal: true } });
      }
    }
  });

  // 3. React Query: Edit/Update Persona Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/personas/${id}`, payload);
      return response.data.data;
    },
    onSuccess: (updatedPersona) => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      triggerToast('Persona updated successfully!');
      
      // If we are currently viewing details, sync detail state
      if (viewPersonaDetails && viewPersonaDetails._id === updatedPersona._id) {
        setViewPersonaDetails(updatedPersona);
      }
      closeModal();
    }
  });

  // 4. React Query: Delete Persona Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/personas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      triggerToast('Persona removed.');
      setViewPersonaDetails(null); // Return to list view
    }
  });

  // Toast trigger helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Open modal for Create mode
  const openCreateModal = () => {
    setEditPersonaId(null);
    setPersonaName('');
    setTone('');
    setWritingStyle('');
    setAudienceType('');
    setDescription('');
    setValidationError('');
    setModalOpen(true);
  };

  // Open modal for Edit mode
  const openEditModal = (persona) => {
    setEditPersonaId(persona._id);
    setPersonaName(persona.personaName || '');
    setTone(persona.tone || '');
    setWritingStyle(persona.writingStyle || '');
    setAudienceType(persona.audienceType || '');
    setDescription(persona.description || '');
    setValidationError('');
    setModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setModalOpen(false);
    setEditPersonaId(null);
    setValidationError('');
  };

  // Delete Action Confirm
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this content persona?')) {
      deleteMutation.mutate(id);
    }
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!personaName.trim()) {
      setValidationError('Persona Name is a required field.');
      return;
    }
    if (!tone.trim()) {
      setValidationError('Brand Voice/Tone is a required field.');
      return;
    }

    const payload = {
      personaName: personaName.trim(),
      tone: tone.trim(),
      writingStyle: writingStyle.trim(),
      audienceType: audienceType.trim(),
      description: description.trim()
    };

    if (editPersonaId) {
      updateMutation.mutate({ id: editPersonaId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

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

      {viewPersonaDetails ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back Link Breadcrumb */}
          <button
            onClick={() => setViewPersonaDetails(null)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white hover:underline transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to personas list</span>
          </button>

          {/* Header Board */}
          <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/10 via-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center font-extrabold text-primary text-xl shadow-glow">
                {viewPersonaDetails.personaName ? viewPersonaDetails.personaName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'P'}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-white">{viewPersonaDetails.personaName}</h2>
                <p className="text-xs text-accent font-semibold tracking-wider uppercase">
                  {viewPersonaDetails.audienceType || 'General Audience'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 z-10">
              <button
                onClick={() => openEditModal(viewPersonaDetails)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all rounded-xl font-bold text-xs"
              >
                <Edit2 size={14} />
                <span>Edit Info</span>
              </button>
              <button
                onClick={() => handleDelete(viewPersonaDetails._id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs transition-all"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Details Content Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio Description */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                  <FileText size={16} className="text-primary" />
                  <span>Persona Biography & Description</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {viewPersonaDetails.description || 'No detailed biography specified for this persona.'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* voice & writing attributes */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voice & Tone</h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm font-bold text-primary">{viewPersonaDetails.tone}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Writing Style</h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm font-bold text-slate-300">{viewPersonaDetails.writingStyle || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Persona Management</h2>
              <p className="text-xs text-slate-400 mt-1">Design customized marketing personas to target tailored platform content and copy tone.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-bold text-background rounded-xl shadow-glow self-start sm:self-center"
            >
              <UserPlus size={18} />
              <span>Create Persona</span>
            </button>
          </div>

          {/* Primary Table View */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Content Personas...</p>
            </div>
          ) : isError ? (
            <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <h3 className="text-xl font-bold text-red-200">Failed to Load Personas</h3>
              <p className="text-xs text-slate-400">{typeof error === 'string' ? error : (error.message || 'Unknown network error.')}</p>
            </div>
          ) : personasData.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
                <Smile size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gradient">No Personas Sourced</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Your company profile does not have any content personas active. Create your first persona to generate platform-specific posts next.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-xl shadow-glow transition-all"
              >
                Create Persona Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personasData.map((persona) => {
                // Get initials for profile badge
                const initials = persona.personaName
                  ? persona.personaName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'P';
                  
                return (
                  <div 
                    key={persona._id} 
                    onClick={() => setViewPersonaDetails(persona)}
                    className="glass-card rounded-2xl border border-white/5 bg-[#0B0F1C]/90 hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 flex flex-col p-6 space-y-4 justify-between relative overflow-hidden group cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Top Profile Initials & Title */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/10 via-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-glow-sm select-none group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate leading-tight">
                            {persona.personaName}
                          </h3>
                          <p className="text-[10px] text-accent font-medium mt-0.5 tracking-wider uppercase truncate">
                            {persona.audienceType || 'General Audience'}
                          </p>
                        </div>
                      </div>

                      {/* Attributes Section */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Voice & Tone</span>
                          <p className="text-xs text-primary font-medium truncate">{persona.tone}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Writing Style</span>
                          <p className="text-xs text-slate-300 font-medium truncate">{persona.writingStyle || '—'}</p>
                        </div>
                      </div>

                      {/* Bio Description */}
                      {persona.description && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Description</span>
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                            {persona.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Action buttons */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-end mt-auto gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(persona)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all duration-200 rounded-xl font-bold text-xs cursor-pointer active:scale-[0.97] hover:scale-[1.02]"
                        style={{ color: undefined }}
                        title="Edit Persona"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(persona._id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500/30 transition-all duration-200 rounded-xl font-bold text-xs cursor-pointer active:scale-[0.97] hover:scale-[1.02]"
                        style={{ color: undefined }}
                        title="Delete Persona"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Creation / Editing Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-card rounded-2xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editPersonaId ? 'Modify Content Persona' : 'Design Content Persona'}
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
              
              {/* Validation Warning */}
              {validationError && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Persona Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Persona Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <UserPlus size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    placeholder="e.g. Thought Leader, Technical Founder"
                    className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Tone of Voice *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Smile size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g. Professional, Visionary, Snappy, Empathetic"
                    className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Writing Style */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Writing Style</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Type size={16} />
                    </span>
                    <input
                      type="text"
                      value={writingStyle}
                      onChange={(e) => setWritingStyle(e.target.value)}
                      placeholder="e.g. Minimalist, Storyteller, Technical"
                      className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Audience Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Target Audience Focus</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Users size={16} />
                    </span>
                    <input
                      type="text"
                      value={audienceType}
                      onChange={(e) => setAudienceType(e.target.value)}
                      placeholder="e.g. Pre-Seed Founders, Senior Devs"
                      className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Persona Description / Bio</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-500">
                    <FileText size={16} />
                  </span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this persona's focus, background, constraints, and target topics..."
                    className="w-full pl-9 pr-4 py-3 bg-background/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-800 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] hover:scale-[1.02]"
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
                      <span>{editPersonaId ? 'Save Changes' : 'Create Persona'}</span>
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

export default Personas;
