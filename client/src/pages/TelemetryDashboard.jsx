import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
  Cpu, 
  Activity, 
  Layers, 
  Database,
  Loader2, 
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

const PROCESS_NAMES = {
  canonical_generation: 'Canonical Blog Generation',
  visual_outline_generation: 'Visual Outline Generation',
  blog_expansion: 'Platform Blog Expansion',
  platform_rendering: 'Platform Preview Rendering',
  image_prompt_generation: 'Image Prompt Generation',
  image_generation: 'DALL-E 3 Image Generation',
  seo_optimization: 'Blog SEO Optimization',
  platform_seo_optimization: 'Platform SEO Customization',
  logo_analysis: 'Logo Palette Vision Analysis',
  content_healing: 'Content Quality Auto-Healing',
  keyword_suggestion: 'Topic/Keyword Suggestion'
};

const PROCESS_COLORS = {
  canonical_generation: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  visual_outline_generation: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  blog_expansion: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  platform_rendering: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  image_prompt_generation: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  image_generation: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  seo_optimization: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  platform_seo_optimization: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  logo_analysis: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  content_healing: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  keyword_suggestion: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
};

const formatTokens = (val) => {
  if (val === undefined || val === null) return '0';
  return val.toLocaleString();
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

export const TelemetryDashboard = () => {
  const { data: telemetryData, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['telemetryStats'],
    queryFn: async () => {
      const response = await api.get('/telemetry/stats');
      return response.data.data;
    },
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Telemetry Logs...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 bg-red-950/10 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="text-red-400 text-3xl font-bold">⚠️ Connection Issue</div>
        <p className="text-sm text-slate-400 max-w-md">
          {typeof error === 'string' ? error : (error.message || 'Unable to sync telemetry logs with database.')}
        </p>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const { summary, breakdown, logs } = telemetryData || { summary: {}, breakdown: [], logs: [] };

  return (
    <div className="space-y-6">
      {/* Tab Panel Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">API Usage & Telemetry Tracking</h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time breakdown of LLM tokens and operations associated with your brand's AI generations.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Aggregate summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tokens */}
        <div className="glass-card rounded-2xl p-5 border border-blue-500/10 bg-blue-950/5 relative overflow-hidden group hover:border-blue-500/25 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total Tokens</p>
              <h3 className="text-2xl font-extrabold text-blue-300 tracking-tight">
                {formatTokens(summary.totalTokens)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">Sum of input and output tokens</p>
        </div>

        {/* Prompt Tokens */}
        <div className="glass-card rounded-2xl p-5 border border-purple-500/10 bg-purple-950/5 relative overflow-hidden group hover:border-purple-500/25 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Prompt (Input) Tokens</p>
              <h3 className="text-2xl font-extrabold text-purple-300 tracking-tight">
                {formatTokens(summary.totalPromptTokens)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">Context templates and inputs</p>
        </div>

        {/* Completion Tokens */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/10 bg-amber-950/5 relative overflow-hidden group hover:border-amber-500/25 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Completion (Output) Tokens</p>
              <h3 className="text-2xl font-extrabold text-amber-300 tracking-tight">
                {formatTokens(summary.totalCompletionTokens)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">AI generated response text</p>
        </div>

        {/* Total Operations */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/15 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Operations</p>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {summary.count || 0}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400">
              <Database size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">Total traced network API calls</p>
        </div>
      </div>

      {/* Grid containing Breakdown and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Process Breakdown Column */}
        <div className="lg:col-span-1 glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={14} className="text-primary animate-pulse" />
              <span>Process Token Breakdown</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Aggregated tokens by feature area</p>
          </div>

          <div className="p-4 flex-1 space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
            {breakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-xs">
                <span>No telemetry logs recorded yet.</span>
              </div>
            ) : (
              breakdown.map((item) => {
                const processName = PROCESS_NAMES[item._id] || item._id;
                const totalTokensVal = item.totalTokens || 0;
                
                // Estimate a percentage based on total tokens for a small visualization bar
                const tokensPercent = summary.totalTokens > 0 ? (totalTokensVal / summary.totalTokens) * 100 : 0;
                
                return (
                  <div key={item._id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${PROCESS_COLORS[item._id] || 'text-slate-400 bg-slate-500/10 border-white/5'}`}>
                        {processName}
                      </span>
                      <span className="text-xs font-bold text-white">{formatTokens(totalTokensVal)} Tokens</span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{item.count} Call{item.count > 1 ? 's' : ''}</span>
                      <span>{Math.round(tokensPercent)}% share</span>
                    </div>

                    {/* Token representation bar */}
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(2, tokensPercent))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Raw Logs Column */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={14} className="text-secondary" />
                <span>Recent Traces & Model Logs</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Audit log of the last 20 API transactions</p>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-400 font-medium">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
                <span>No telemetry logs recorded yet. Run a generation step to populate.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-slate-400 text-[9px] font-bold tracking-wider uppercase">
                    <th className="px-4 py-2.5">Process</th>
                    <th className="px-4 py-2.5">Model</th>
                    <th className="px-4 py-2.5 text-center">Tokens (P/C)</th>
                    <th className="px-4 py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {logs.map((log) => {
                    const processName = PROCESS_NAMES[log.processType] || log.processType;
                    return (
                      <tr key={log._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold inline-block ${PROCESS_COLORS[log.processType] || 'text-slate-400 bg-slate-500/10 border-white/5'}`}>
                            {processName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                          {log.modelName}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 font-mono whitespace-nowrap">
                          {log.totalTokens > 0 ? (
                            <span>
                              <span className="text-slate-300 font-semibold">{formatTokens(log.totalTokens)}</span>{' '}
                              <span className="text-[10px] text-slate-500">
                                ({formatTokens(log.promptTokens)}/{formatTokens(log.completionTokens)})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 text-[10px] whitespace-nowrap">
                          {formatRelativeTime(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TelemetryDashboard;
