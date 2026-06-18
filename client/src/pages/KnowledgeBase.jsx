import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FileText,
  UploadCloud,
  File,
  Eye,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  ExternalLink,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';

export const KnowledgeBase = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [dragActive, setDragActive] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);

  // Notices
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  // 1. React Query: Fetch Sourced Documents List
  const { data: documentsData, isLoading, isError, error } = useQuery({
    queryKey: ['knowledge'],
    queryFn: async () => {
      const response = await api.get('/knowledge');
      return response.data.data;
    }
  });

  // 2. React Query: Upload File Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      triggerToast('Document successfully uploaded & text extracted!');
      setUploadProgress(null);
    },
    onError: (err) => {
      setErrorAlert(err || 'Failed to upload document.');
      setUploadProgress(null);
    }
  });

  // 3. React Query: Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      triggerToast('Document removed.');
      setSelectedText(null);
    }
  });

  // Trigger floating notifications
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorAlert('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    setErrorAlert('');
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Perform client-side constraints validations
  const processFile = (file) => {
    const allowedExtensions = ['pdf', 'docx', 'txt'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setErrorAlert('Supported file types are: .pdf, .docx, and .txt only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorAlert('File size exceeds the 10MB limits boundary.');
      return;
    }

    uploadMutation.mutate(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this reference document?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewText = (doc) => {
    setSelectedFileName(doc.fileName);
    setSelectedText(doc.summaryText || doc.extractedText);
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

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
        <p className="text-xs text-slate-400 mt-1">Upload reference documents (PDF, DOCX, TXT) to ground AI content generation and feed product details.</p>
      </div>

      {/* Global Error Banner */}
      {errorAlert && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0 text-red-400" />
            <span>{errorAlert}</span>
          </div>
          <button onClick={() => setErrorAlert('')} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Card Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`glass-card rounded-2xl border p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
          dragActive 
            ? 'border-primary bg-primary/5 shadow-glow scale-[0.99]' 
            : 'border-white/5 hover:border-white/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
        />

        {uploadProgress !== null ? (
          <div className="space-y-4 py-6 w-full max-w-xs">
            <Loader2 className="animate-spin text-primary mx-auto" size={36} />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-300">Extracting Text & Syncing Assets...</p>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-primary font-bold">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 cursor-pointer" onClick={triggerFileSelect}>
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 hover:border-primary/20 flex items-center justify-center mx-auto text-slate-400 hover:text-primary transition-all shadow-inner group">
              <UploadCloud size={28} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                Drag and drop your reference file here, or <span className="text-primary hover:underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500">Supports PDF, DOCX, and TXT documents up to 10MB limits</p>
            </div>
          </div>
        )}
      </div>

      {/* Sourced Files Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Uploaded Reference Resources</h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
            <Loader2 className="animate-spin text-primary animate-pulse" size={24} />
            <p className="text-xs text-slate-500">Scanning Knowledge Base...</p>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
            Failed to resolve files. {typeof error === 'string' ? error : (error.message || 'Unknown network error.')}
          </div>
        ) : documentsData.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 border border-white/5 text-center text-slate-500 italic text-sm">
            No reference materials uploaded yet. Sourced context will be displayed here once synced.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentsData.map((doc) => (
              <div 
                key={doc._id} 
                className="glass-card rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 group hover:shadow-glow-purple"
              >
                <div className="space-y-3 min-w-0">
                  {/* Icon & File Name */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/15 border border-secondary/20 text-accent flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-white" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 mt-1 rounded bg-white/5 text-primary border border-white/5 uppercase tracking-wide">
                        .{doc.fileType}
                      </span>
                    </div>
                  </div>

                  {/* Character stats & Date Sourced */}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <BookOpen size={12} className="text-slate-500" />
                      <span>{doc.extractedText ? `${doc.extractedText.length.toLocaleString()} characters extracted` : '0 characters'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-500" />
                      <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between">
                  <a
                    href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:4000${doc.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Raw Document</span>
                    <ExternalLink size={10} />
                  </a>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleViewText(doc)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold"
                      title="View AI Grounding Summary"
                    >
                      <Eye size={12} />
                      <span>View Summary</span>
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                      title="Delete File"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extracted Text Dialog Popup Modal Overlay */}
      {selectedText !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl glass-card rounded-2xl border border-white/10 shadow-2xl relative flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">AI Grounding Summary Context</h3>
                <p className="text-[10px] text-primary truncate mt-0.5 max-w-sm sm:max-w-md">{selectedFileName}</p>
              </div>
              <button
                onClick={() => setSelectedText(null)}
                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Text Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-background/40">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-black/40 border border-white/5 p-4 rounded-xl select-text max-h-[50vh]">
                {selectedText || 'No text content parsed in this reference document.'}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedText(null)}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all text-background font-bold rounded-xl text-xs shadow-glow"
              >
                Done View Context
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Navigation guide to Topics & Research */}
      {!isLoading && !isError && documentsData && documentsData.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 animate-fade-in">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <Check className="text-emerald-400" size={16} />
              <span>Knowledge Base Grounding Active</span>
            </h4>
            <p className="text-xs text-slate-400">
              Your company profile has reference documents loaded. You are ready to create a campaign topic and start research.
            </p>
          </div>
          <button
            onClick={() => navigate('/topics')}
            className="px-5 py-3 bg-gradient-to-r from-primary to-accent text-background font-extrabold rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center gap-2 text-xs cursor-pointer shrink-0"
          >
            <span>Create Topic & Rerun Research</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
