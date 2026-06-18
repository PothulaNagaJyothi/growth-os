import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTasks } from '../../context/TaskContext';
import {
  Compass,
  User,
  Building,
  FileText,
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

export const BlogGenerator = ({ initialTopicId, initialCustomAngle, onBack, onGenerationComplete }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tasks, startTask, clearTask } = useTasks();
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || '');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 1. Fetch active topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics-select'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data.data || [];
    }
  });

  // 2. Fetch Company details
  const { data: company } = useQuery({
    queryKey: ['company-context'],
    queryFn: async () => {
      const response = await api.get('/company');
      return response.data.data;
    }
  });

  // 3. Fetch Knowledge Base files
  const { data: knowledgeFiles = [] } = useQuery({
    queryKey: ['knowledge-context'],
    queryFn: async () => {
      const response = await api.get('/knowledge');
      return response.data.data || [];
    }
  });

  const activeTopic = topics.find((t) => t._id === selectedTopicId);
  const taskId = selectedTopicId ? `blog_generate_${selectedTopicId}` : null;

  // Sync background task progress
  useEffect(() => {
    if (!taskId) return;
    const task = tasks[taskId];
    if (task) {
      if (task.status === 'success') {
        const newBlog = task.data;
        queryClient.invalidateQueries({ queryKey: ['blogs-list'] });
        triggerToast('Grounded SEO Blog generated successfully!');
        clearTask(taskId);
        onGenerationComplete(newBlog._id);
      } else if (task.status === 'error') {
        const err = task.error;
        console.error(err);
        triggerToast(err.response?.data?.error || 'Blog generation failed.');
        clearTask(taskId);
      }
    }
  }, [tasks, taskId, queryClient, clearTask, onGenerationComplete]);

  const handleGenerate = () => {
    if (!selectedTopicId || !taskId) return;
    startTask(taskId, async () => {
      const response = await api.post('/blogs/generate', { 
        topicId: selectedTopicId,
        customAngle: initialCustomAngle
      });
      return response.data.data;
    });
  };

  const isGenerating = taskId && tasks[taskId]?.status === 'running';

  return (
    <div className="space-y-6">
      {/* Floating Success Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 glass-card bg-white/95 border border-primary/20 text-foreground text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 size={14} />
          </div>
          <span className="font-semibold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {/* Back button and title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft size={13} />
          <span>Back to directory</span>
        </button>
        <span className="text-xs text-slate-500 font-mono">Blogs Generation Hub</span>
      </div>

      {isGenerating ? (
        /* Live Synthesis Loader Console */
        <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[450px] relative overflow-hidden bg-background/80">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none" />
          
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center animate-spin duration-[3.5s] shadow-glow" />
            <Sparkles size={28} className="absolute inset-0 m-auto text-background animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Running AI Synthesis Engine</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Grounded GPT-5.4 models are outline scripting, drafting canonical contents, tuning word count, and validating SEO scorecards...
            </p>
          </div>

          {/* Telemetry Console logs */}
          <div className="w-full max-w-md p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[10px] text-primary space-y-1.5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              <span>SYSTEM GENERATION LOGS</span>
              <span className="animate-pulse text-emerald-400">● RUNNING</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={10} />
              <span>[SYSTEM] Topic model: "{activeTopic?.topicName}"</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={10} />
              <span>[SYSTEM] Audience Persona: "{activeTopic?.personaId?.personaName || 'Technical SRE'}"</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={10} />
              <span>[DB] Grounded in Company Profile: "{company?.companyName || 'Axiom Tech'}"</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={10} />
              <span>[DB] Grounded in Knowledge Base: {knowledgeFiles.length} files active</span>
            </div>
            <div className="flex items-center gap-2 text-accent">
              <Loader2 size={10} className="animate-spin" />
              <span>[AI] Outlining canonical drafts and tuning SEO keywords...</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
              <span>[AI] Applying length trimming and scoring search engine metrics...</span>
            </div>
          </div>
        </div>
      ) : knowledgeFiles.length === 0 ? (
        /* Blocked state when no knowledge files are uploaded */
        <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] relative overflow-hidden bg-[#0B0F19]/90">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-amber-500/5 pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-glow-sm">
            <AlertCircle size={32} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold tracking-tight text-white animate-pulse">Knowledge Base Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              To ensure high-quality blog posts grounded in your company's actual metrics, services, and product details, you must upload at least one reference document before generating blogs.
            </p>
          </div>

          <button
            onClick={() => navigate('/brand?tab=knowledge')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-background font-extrabold rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center gap-2 text-xs cursor-pointer active:scale-[0.98]"
          >
            <Sparkles size={14} />
            <span>Go to Brand Setup to Upload</span>
          </button>
        </div>
      ) : (
        /* Form configuration */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main selection form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                <Compass size={16} className="text-primary" />
                <span>Select Blog Topic Context</span>
              </h3>

              {initialCustomAngle && (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary space-y-1 animate-fade-in mb-2">
                  <p className="font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <Sparkles size={11} className="animate-pulse" />
                    <span>Targeted AI Content Copy Angle Active:</span>
                  </p>
                  <p className="font-medium text-white leading-relaxed italic">"{initialCustomAngle}"</p>
                  <p className="text-[10px] text-slate-400 mt-1">The AI content generation pipeline will prioritize this strategic angle and title structure.</p>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Blog Topic *</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-4 py-3 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="" className="bg-background text-slate-400">-- Select an active topic --</option>
                  {topics.map((t) => (
                    <option key={t._id} value={t._id} className="bg-background text-white">
                      {t.topicName}
                    </option>
                  ))}
                </select>
                {topics.length === 0 && (
                  <p className="text-[10px] text-amber-400 pt-1 italic">
                    No active topics discovered. Create a topic in Topics & Research first!
                  </p>
                )}
              </div>

              {activeTopic && (
                <div className="space-y-3 pt-3 animate-fade-in text-xs">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <p className="font-bold text-white uppercase text-[9px] tracking-wider text-primary">Topic details:</p>
                    <p className="text-slate-300"><span className="font-semibold text-slate-400">Topic focus:</span> {activeTopic.topic}</p>
                    <p className="text-slate-300"><span className="font-semibold text-slate-400">Target goal:</span> {activeTopic.goal || 'General Brand growth'}</p>
                    <p className="text-slate-300"><span className="font-semibold text-slate-400">SEO Keywords:</span> {activeTopic.keywords?.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Persona preview */}
            {activeTopic && (
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                  <User size={16} className="text-accent" />
                  <span>Target Audience Persona</span>
                </h3>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
                  <p className="font-bold text-white text-sm">{activeTopic.personaId?.personaName || 'Unknown Persona'}</p>
                  <p className="text-slate-300"><span className="font-semibold text-slate-400">Writing Tone:</span> {activeTopic.personaId?.tone || 'Analytical'}</p>
                  <p className="text-slate-300"><span className="font-semibold text-slate-400">Style:</span> {activeTopic.personaId?.writingStyle || 'Technical'}</p>
                  <p className="text-slate-300"><span className="font-semibold text-slate-400">Audience:</span> {activeTopic.personaId?.audienceType || 'Cloud engineers'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Grounding Context variables details */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
              <h3 className="text-sm font-bold border-b border-white/5 pb-3">
                Grounding Parameters
              </h3>

              {/* Company config */}
              <div className="flex gap-3 text-xs items-start">
                <div className="p-2 rounded bg-primary/10 border border-primary/20 text-primary">
                  <Building size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Company profile (active)</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">{company?.companyName || 'Configured in Settings'}</p>
                </div>
              </div>

              {/* Grounding docs */}
              <div className="flex gap-3 text-xs items-start">
                <div className="p-2 rounded bg-accent/10 border border-accent/20 text-accent">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Grounding files ({knowledgeFiles.length} loaded)</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">Reference documents uploaded in Knowledge Base.</p>
                </div>
              </div>

              {/* Generate Trigger */}
              <button
                onClick={handleGenerate}
                disabled={!selectedTopicId}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-extrabold rounded-xl shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>Generate Grounded SEO Blog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
