import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

export const VersionHistoryDrawer = ({
  isOpen,
  onClose,
  blogId,
  currentTitle,
  currentMeta,
  currentContent,
  onRestoreSuccess
}) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && blogId) {
      fetchVersions();
    }
  }, [isOpen, blogId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/blogs/${blogId}/versions`);
      // Sort versions in reverse chronological order (newest first)
      const sorted = (response.data.data || []).sort((a, b) => b.version - a.version);
      setVersions(sorted);
      
      // Auto-select the previous version (index 1 if available, otherwise index 0)
      if (sorted.length > 0) {
        setSelectedVersion(sorted[0]);
      } else {
        setSelectedVersion(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load versions history.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionNum) => {
    if (!window.confirm(`Are you sure you want to restore the blog to Version ${versionNum}? This will save your current state as a new version and load Version ${versionNum}.`)) {
      return;
    }
    setRestoring(true);
    try {
      const response = await api.post(`/blogs/${blogId}/restore/${versionNum}`);
      if (response.data.success) {
        onRestoreSuccess(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to restore version.');
    } finally {
      setRestoring(false);
    }
  };

  if (!isOpen) return null;

  // Formatting helpers
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-6xl h-full bg-background border-l border-slate-200 shadow-2xl flex flex-col z-10 animate-slide-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="text-primary" size={20} />
            <div>
              <h3 className="text-base font-bold text-slate-800">Version History</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Compare modifications and restore to previous snapshots</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Timeline / Versions List Column */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/30">
            <div className="p-4 border-b border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Select Snapshot</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-xs text-slate-400">Loading history...</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-12">No version logs found for this blog.</p>
              ) : (
                versions.map((ver, idx) => {
                  const isSelected = selectedVersion?.version === ver.version;
                  const isLatest = idx === 0;
                  return (
                    <button
                      key={ver.version}
                      onClick={() => setSelectedVersion(ver)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 relative ${
                        isSelected 
                          ? 'bg-primary/5 border-primary shadow-sm text-primary' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-xs font-bold font-mono ${isSelected ? 'text-primary' : 'text-slate-800'}`}>Version {ver.version}</span>
                        {isLatest && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold uppercase font-mono tracking-wider">
                            Latest
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Calendar size={10} />
                        <span>{formatDate(ver.createdAt)}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-slate-400 font-mono">
                          Words: ~{ver.content ? ver.content.split(/\s+/).filter(Boolean).length : 0}
                        </span>
                        
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold font-mono ${getScoreColor(ver.seoScore)}`}>
                          SEO: {ver.seoScore}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Comparison Panels Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/10">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Comparison Header controls */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between shrink-0">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Comparing Version {selectedVersion.version} with Current State
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Created on {formatDate(selectedVersion.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion.version)}
                    disabled={restoring}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {restoring ? (
                      <Loader2 className="animate-spin text-white" size={13} />
                    ) : (
                      <RotateCcw size={13} />
                    )}
                    <span>Restore Version {selectedVersion.version}</span>
                  </button>
                </div>

                {/* Comparison Details Grid */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Title Comparison */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SEO Title</span>
                      {currentTitle !== selectedVersion.title && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[8px] font-bold font-mono uppercase">
                          Changed
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Selected Version */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Version {selectedVersion.version}</span>
                        <div className="text-slate-700 font-semibold">{selectedVersion.title}</div>
                      </div>
                      
                      {/* Current Version */}
                      <div className={`p-3 border rounded-xl text-xs ${
                        currentTitle !== selectedVersion.title ? 'bg-amber-50 border-amber-200 text-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Current (Live Editor)</span>
                        <div className="text-slate-800 font-semibold">{currentTitle}</div>
                      </div>
                    </div>
                  </div>

                  {/* Meta Description Comparison */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta Description</span>
                      {currentMeta !== selectedVersion.metaDescription && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[8px] font-bold font-mono uppercase">
                          Changed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Selected Version */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-700">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Version {selectedVersion.version}</span>
                        {selectedVersion.metaDescription || <span className="text-slate-400 italic">None</span>}
                      </div>

                      {/* Current Version */}
                      <div className={`p-3 border rounded-xl text-xs leading-relaxed text-slate-700 ${
                        currentMeta !== selectedVersion.metaDescription ? 'bg-amber-50 border-amber-200 text-slate-850' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Current (Live Editor)</span>
                        {currentMeta || <span className="text-slate-400 italic">None</span>}
                      </div>
                    </div>
                  </div>

                  {/* Content (Body Markdown) Comparison */}
                  <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article Content</span>
                      {currentContent !== selectedVersion.content && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[8px] font-bold font-mono uppercase">
                          Changed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 min-h-[250px]">
                      {/* Selected Version */}
                      <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-100 text-[9px] text-slate-500 font-bold shrink-0">
                          Version {selectedVersion.version} Content
                        </div>
                        <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] text-slate-600 bg-white leading-normal whitespace-pre-wrap select-text selection:bg-primary/20">
                          {selectedVersion.content}
                        </div>
                      </div>

                      {/* Current Version */}
                      <div className={`flex flex-col h-full border rounded-xl overflow-hidden ${
                        currentContent !== selectedVersion.content ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-100 text-[9px] text-slate-500 font-bold shrink-0">
                          Current Content (Live Editor)
                        </div>
                        <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] text-slate-700 bg-white leading-normal whitespace-pre-wrap select-text selection:bg-primary/20">
                          {currentContent}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Snapshot Selected</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Select a version history snapshot from the left timeline panel to compare changes side-by-side.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default VersionHistoryDrawer;
