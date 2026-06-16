import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useTasks } from '../context/TaskContext';
import {
  Search,
  BookOpen,
  Trash2,
  TrendingUp,
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Check,
  TrendingDown,
  CheckCircle2,
  FileText,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

export const Research = () => {
  const queryClient = useQueryClient();
  const { tasks, startTask, clearTask } = useTasks();

  // Tab navigation inside details report
  const [activeTab, setActiveTab] = useState('news'); // 'news', 'keywords', 'gaps', 'angles'
  
  // Selected topic to run research for
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // Status notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 1. Fetch topics to populate selection dropdown
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data.data;
    }
  });

  // Fetch all research reports to check synthesis status
  const { data: researchList, isLoading: researchListLoading } = useQuery({
    queryKey: ['researches'],
    queryFn: async () => {
      const response = await api.get('/research');
      return response.data.data || [];
    }
  });

  // 2. Fetch specific topic research record
  const {
    data: researchRecord,
    isLoading: researchLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['research', selectedTopicId],
    queryFn: async () => {
      if (!selectedTopicId) return null;
      try {
        const response = await api.get(`/research/${selectedTopicId}`);
        return response.data.data;
      } catch (err) {
        const is404 =
          (err && err.response && err.response.status === 404) ||
          (typeof err === 'string' && (
            err.includes('No research report found') ||
            err.includes('not found') ||
            err.includes('404')
          ));
        if (is404) {
          return null; // Return null so we can show generation placeholder
        }
        throw err;
      }
    },
    enabled: !!selectedTopicId,
    retry: false
  });

  const researchTaskId = selectedTopicId ? `research_generate_${selectedTopicId}` : null;

  // Sync background research synthesis task
  useEffect(() => {
    if (!researchTaskId) return;
    const task = tasks[researchTaskId];
    if (task) {
      if (task.status === 'success') {
        const newReport = task.data;
        queryClient.setQueryData(['research', selectedTopicId], newReport);
        queryClient.invalidateQueries({ queryKey: ['researches'] });
        triggerToast('AI Aligned Research synthesized successfully!');
        setActiveTab('news');
        clearTask(researchTaskId);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Research synthesis failed.', 'error');
        clearTask(researchTaskId);
      }
    }
  }, [tasks, researchTaskId, selectedTopicId, queryClient, clearTask]);

  const handleGenerate = () => {
    if (!selectedTopicId || !researchTaskId) return;
    startTask(researchTaskId, async () => {
      const response = await api.post('/research/generate', { topicId: selectedTopicId });
      return response.data.data;
    });
  };

  const activeTopic = topics?.find((t) => t._id === selectedTopicId);

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

      {!selectedTopicId ? (
        /* TOPICS DIRECTORY VIEW */
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Research Console</h2>
            <p className="text-xs text-slate-400 mt-1">
              Grounded market intelligence, keyword analysis, competitor content gaps, and search intent synthesis.
            </p>
          </div>

          {topicsLoading || researchListLoading ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Topics & Research Reports...</p>
            </div>
          ) : !topics || topics.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                <Search size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gradient">No Active Topics</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Create a blog topic first to unlock AI-aligned keyword intent and market intelligence synthesis.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-slate-400">Topics Intelligence Directory</h3>
                <span className="text-xs text-slate-500 font-mono">{topics.length} Topics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((t) => {
                  const hasResearch = researchList?.some(
                    (r) => (r.topicId?._id || r.topicId) === t._id
                  );

                  return (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTopicId(t._id)}
                      className="glass-card rounded-2xl border border-white/5 bg-[#0B0F1C]/90 hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 flex flex-col p-6 space-y-4 justify-between relative overflow-hidden group cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-mono">
                              {t.personaId?.personaName || 'Unknown Persona'}
                            </span>
                            <h3 className="text-base font-bold text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                              {t.topicName}
                            </h3>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border shrink-0 ${
                              hasResearch
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}
                          >
                            {hasResearch ? 'Synthesized' : 'Not Synthesized'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Topic Details</p>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{t.topic}</p>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Keywords</p>
                          <p className="text-xs text-slate-300 truncate">
                            {t.keywords && t.keywords.length > 0
                              ? t.keywords.map(k => `#${k}`).join(', ')
                              : 'None specified'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-500 font-mono capitalize">
                          {t.status}
                        </span>
                        <button
                          onClick={() => setSelectedTopicId(t._id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            hasResearch
                              ? 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                              : 'bg-gradient-to-r from-primary to-accent text-background hover:opacity-90 shadow-glow-sm'
                          }`}
                        >
                          <Sparkles size={12} />
                          <span>{hasResearch ? 'View Intelligence' : 'Synthesize'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TOPICS RESEARCH WORKSPACE */
        <div className="space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Research Console</h2>
              <p className="text-xs text-slate-400 mt-1">
                Grounded market intelligence, keyword analysis, competitor content gaps, and search intent synthesis.
              </p>
            </div>

            {/* Selection Header Toolbar */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <button
                onClick={() => setSelectedTopicId('')}
                className="px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 font-sans cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Topics Directory</span>
              </button>

              <select
                value={selectedTopicId}
                onChange={(e) => {
                  setSelectedTopicId(e.target.value);
                  setActiveTab('news');
                }}
                disabled={(researchTaskId && tasks[researchTaskId]?.status === 'running')}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[200px]"
              >
                <option value="" className="bg-background text-slate-400">-- Topics Directory --</option>
                {topicsLoading ? (
                  <option>Loading topics...</option>
                ) : topics && topics.length > 0 ? (
                  topics.map((t) => (
                    <option key={t._id} value={t._id} className="bg-background text-white">
                      {t.topicName}
                    </option>
                  ))
                ) : (
                  <option value="">No Topics Sourced</option>
                )}
              </select>
            </div>
          </div>

          {/* Primary Content Panel Grid */}
          <div className="w-full">
            {(researchTaskId && tasks[researchTaskId]?.status === 'running') ? (
              /* Live Synthesis Loader */
              <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[480px] relative overflow-hidden bg-background/80">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
                
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center animate-spin duration-[3.5s] shadow-glow" />
                  <Sparkles size={28} className="absolute inset-0 m-auto text-background animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Running AI Synthesis Engine</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    GPT-5.4 is extracting news summary feeds, SEO keywords, search intent maps, and competitor gaps...
                  </p>
                </div>

                {/* Monospace Logs */}
                <div className="w-full max-w-md p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[10px] text-primary space-y-1.5 shadow-2xl">
                  <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2 mb-2">
                    <span>SYSTEM SYNTHESIS STATUS</span>
                    <span className="animate-pulse text-emerald-400">● EXECUTION OPEN</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={10} />
                    <span>[DB] Verified active Blog Topic: "{activeTopic?.topic || 'N/A'}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={10} />
                    <span>[DB] Grounded with Persona details: "{activeTopic?.personaId?.personaName || 'Technical Persona'}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <Loader2 size={10} className="animate-spin" />
                    <span>[AI] Synthesizing Trending News feeds & Competitor content gaps...</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>[AI] Constructing search intent difficulty index table...</span>
                  </div>
                </div>
              </div>
            ) : researchLoading ? (
              /* Basic Loading Indicator */
              <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm font-semibold tracking-wider text-slate-400">Querying topic research records...</p>
              </div>
            ) : isError ? (
              /* Error Page */
              <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto min-h-[300px] flex flex-col justify-center">
                <AlertCircle size={40} className="text-red-400 mx-auto" />
                <h3 className="text-xl font-bold text-red-200">Failed to Load Research</h3>
                <p className="text-xs text-slate-400">{typeof error === 'string' ? error : (error.message || 'Unknown network error.')}</p>
              </div>
            ) : !researchRecord ? (
              /* Empty Generation Placeholder */
              <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                  <Search size={32} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gradient">No Research Available</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    No market intelligence has been synthesized for the topic **"{activeTopic?.topicName || 'Selected Topic'}"** yet. Trigger the AI synthesis engine to generate results.
                  </p>
                </div>

                {/* Topic Parameters preview */}
                {activeTopic && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 max-w-md text-left text-xs space-y-2">
                    <p className="font-semibold text-white">Focus Inputs Context:</p>
                    <div className="grid grid-cols-3 gap-2 text-slate-400">
                      <span className="font-medium">Topic Details:</span>
                      <span className="col-span-2 text-slate-300 truncate">{activeTopic.topic}</span>
                      <span className="font-medium">Goal:</span>
                      <span className="col-span-2 text-slate-300 truncate">{activeTopic.goal || 'General growth'}</span>
                      <span className="font-medium">Keywords:</span>
                      <span className="col-span-2 text-slate-300 truncate">
                        {activeTopic.keywords && activeTopic.keywords.length > 0
                          ? activeTopic.keywords.join(', ')
                          : 'None specified'}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!selectedTopicId}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Synthesize Research Now</span>
                </button>
              </div>
            ) : (
              /* Full AI Aligned Research Dashboard */
              <div className="glass-card rounded-3xl border border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Header Details */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wider uppercase font-mono">
                      Grounded Synthesis Active
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">Topic: {researchRecord.topicId?.topic || 'Market Context'}</h3>
                    <p className="text-xs text-slate-400">Target Goal: <span className="text-slate-300">{researchRecord.topicId?.goal || 'General branding'}</span></p>
                  </div>

                  {/* Rerun Synthesis */}
                  <button
                    onClick={handleGenerate}
                    disabled={(researchTaskId && tasks[researchTaskId]?.status === 'running')}
                    className="px-4 py-2 border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/15 text-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-center shadow-glow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Zap size={13} />
                    <span>Rerun Synthesis</span>
                  </button>
                </div>

                {/* Tab navigation */}
                <div className="flex border-b border-white/5 overflow-x-auto bg-background/40 scrollbar-none">
                  <button
                    onClick={() => setActiveTab('news')}
                    className={`flex-1 py-4 px-6 text-center text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'news'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Trending News Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('keywords')}
                    className={`flex-1 py-4 px-6 text-center text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'keywords'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Keyword Suggestions & Intent
                  </button>
                  <button
                    onClick={() => setActiveTab('gaps')}
                    className={`flex-1 py-4 px-6 text-center text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'gaps'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Competitor Content Gaps
                  </button>
                  <button
                    onClick={() => setActiveTab('angles')}
                    className={`flex-1 py-4 px-6 text-center text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'angles'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Suggested Blog Angles
                  </button>
                </div>

                {/* Tab details display content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  
                  {/* Tab 1: Trending News Summary */}
                  {activeTab === 'news' && (
                    <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                      {researchRecord.news ? (
                        researchRecord.news.split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('###')) {
                            return <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2">{trimmed.replace('###', '')}</h4>;
                          }
                          if (trimmed.startsWith('####')) {
                            return <h5 key={idx} className="text-sm font-bold text-primary mt-3 mb-1">{trimmed.replace('####', '')}</h5>;
                          }
                          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                            return <li key={idx} className="list-disc ml-5 mb-1.5">{trimmed.substring(1).trim()}</li>;
                          }
                          if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
                            return <li key={idx} className="list-decimal ml-5 mb-1.5">{trimmed.substring(2).trim()}</li>;
                          }
                          return trimmed ? <p key={idx} className="mb-3">{trimmed}</p> : null;
                        })
                      ) : (
                        <p className="text-xs text-slate-500">No news summary available.</p>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Keyword Suggestions & Search Intent Analysis */}
                  {activeTab === 'keywords' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-2">Keyword Intent & Volumetrics</h4>
                        <p className="text-xs text-slate-400">SEO target ideas optimized for this topic and persona demographics.</p>
                      </div>

                      <div className="border border-white/5 rounded-xl overflow-hidden bg-background/50">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 bg-white/5 text-slate-400 text-[10px] font-semibold tracking-wider uppercase">
                                <th className="px-4 py-3">Suggested Keyword</th>
                                <th className="px-4 py-3">Search Volume</th>
                                <th className="px-4 py-3">SEO Difficulty</th>
                                <th className="px-4 py-3 text-right">Search Intent</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                              {researchRecord.keywords?.map((seo, idx) => {
                                const difficultyColor =
                                  seo.difficulty === 'Easy'
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : seo.difficulty === 'Medium'
                                    ? 'text-amber-400 bg-amber-500/10'
                                    : 'text-rose-400 bg-rose-500/10';

                                const volumeIcon =
                                  seo.volume === 'High' ? (
                                    <TrendingUp size={12} className="text-emerald-400 animate-pulse" />
                                  ) : (
                                    <TrendingDown size={12} className="text-amber-400" />
                                  );

                                return (
                                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{seo.keyword}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="flex items-center gap-1.5 font-semibold">
                                        {volumeIcon}
                                        {seo.volume}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[9px] ${difficultyColor}`}>
                                        {seo.difficulty}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 font-mono text-[9px] tracking-wide uppercase border border-white/5">
                                        {seo.intent}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Competitor Content Gaps */}
                  {activeTab === 'gaps' && (
                    <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                      {researchRecord.competitorAnalysis ? (
                        researchRecord.competitorAnalysis.split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('###')) {
                            return <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2">{trimmed.replace('###', '')}</h4>;
                          }
                          if (trimmed.startsWith('####')) {
                            return <h5 key={idx} className="text-sm font-bold text-accent mt-3 mb-1">{trimmed.replace('####', '')}</h5>;
                          }
                          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                            return <li key={idx} className="list-disc ml-5 mb-1.5">{trimmed.substring(1).trim()}</li>;
                          }
                          if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
                            return <li key={idx} className="list-decimal ml-5 mb-1.5">{trimmed.substring(2).trim()}</li>;
                          }
                          return trimmed ? <p key={idx} className="mb-3">{trimmed}</p> : null;
                        })
                      ) : (
                        <p className="text-xs text-slate-500">No competitive gaps analysis.</p>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Suggested Blog Angles */}
                  {activeTab === 'angles' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-2">Targeted Content Copy Angles</h4>
                        <p className="text-xs text-slate-400">These structures are tailor-designed to bypass competitor gaps and capture informational user intent.</p>
                      </div>

                      <div className="space-y-4">
                        {researchRecord.suggestedAngles?.map((angle, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all flex items-start gap-4"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-glow-sm">
                              0{idx + 1}
                            </div>
                            <div className="space-y-1.5 pr-2">
                              <p className="text-xs font-semibold text-white leading-relaxed">{angle}</p>
                              <span className="inline-block text-[8px] font-mono font-bold bg-white/5 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                Ready to generate
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Research;
