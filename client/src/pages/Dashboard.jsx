import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  Megaphone,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Sparkles,
  Zap,
  Globe,
  Loader2
} from 'lucide-react';

const MetricCard = ({ title, value, change, isPositive, icon, colorClass }) => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={`font-semibold flex items-center gap-0.5 ${isPositive ? 'text-primary' : 'text-red-400'}`}>
          <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} />
          {change}
        </span>
        <span className="text-slate-500">vs last month</span>
      </div>
    </div>
  );
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

const getActivityIcon = (type) => {
  switch (type) {
    case 'Render':
      return <Zap size={14} className="text-primary" />;
    case 'Generation':
      return <Sparkles size={14} className="text-accent" />;
    case 'Schedule':
      return <Calendar size={14} className="text-secondary" />;
    case 'Campaign':
      return <Globe size={14} className="text-slate-400" />;
    default:
      return <Zap size={14} className="text-primary" />;
  }
};

export const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Dashboard Context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 bg-red-950/10 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="text-red-400 text-3xl font-bold">⚠️ Connection Issue</div>
        <p className="text-sm text-slate-400 max-w-md">
          {typeof error === 'string' ? error : (error.message || 'Unable to sync dashboard telemetry with database.')}
        </p>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Campaigns Active',
      value: dashboardData?.metrics?.activeCampaigns ?? 0,
      change: '+0.0%',
      isPositive: true,
      icon: <Megaphone className="text-primary" size={22} />,
      colorClass: 'group-hover:shadow-glow transition-all duration-300'
    },
    {
      title: 'Blogs Generated',
      value: dashboardData?.metrics?.blogsGenerated ?? 0,
      change: '+0.0%',
      isPositive: true,
      icon: <BookOpen className="text-accent" size={22} />,
      colorClass: 'group-hover:shadow-glow transition-all duration-300'
    },
    {
      title: 'Scheduled Posts',
      value: dashboardData?.metrics?.scheduledPosts ?? 0,
      change: '+0.0%',
      isPositive: true,
      icon: <Calendar className="text-secondary" size={22} />,
      colorClass: 'group-hover:shadow-glow-purple transition-all duration-300'
    },
    {
      title: 'Published Posts',
      value: dashboardData?.metrics?.publishedPosts ?? 0,
      change: '+0.0%',
      isPositive: true,
      icon: <CheckCircle2 className="text-green-400" size={22} />,
      colorClass: 'group-hover:shadow-glow transition-all duration-300'
    }
  ];

  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative glass-card rounded-3xl p-8 border border-white/5 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Growth Console Active <span className="animate-pulse text-primary">●</span>
          </h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Welcome to the Growth OS Project Foundation. Your environments are operational, databases are synced, and the Azure OpenAI service integration is mapped.
          </p>
        </div>

        <a 
          href="/campaigns"
          className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-bold text-background rounded-xl shadow-glow self-start md:self-center cursor-pointer"
        >
          <span>View Campaigns</span>
          <ArrowUpRight size={18} />
        </a>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Recent Telemetry Activity</h3>
            <a 
              href="/campaigns"
              className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1"
            >
              View Campaigns <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-glass">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs">
                No telemetry logs found in workspace.
              </div>
            ) : (
              recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-background/80 border border-white/5 flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-white">{activity.action}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{activity.target}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-primary border border-primary/20 tracking-wide uppercase">
                      {activity.type}
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-1">
                      <Clock size={10} />
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Platform Configuration Telemetry */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold mb-6">System Health Status</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-glass">
            {/* Database Atlas Connection Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">MongoDB Connection</p>
                <p className="text-xs text-slate-400 mt-0.5">Atlas Cluster Connected</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Operational
              </span>
            </div>

            {/* Azure OpenAI Integration Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">Azure OpenAI Engine</p>
                <p className="text-xs text-slate-400 mt-0.5">Model gpt-5.4</p>
              </div>
              <span className="text-xs font-bold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Connected
              </span>
            </div>

            {/* Platform rules configs */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">API Environment Port</p>
                <p className="text-xs text-slate-400 mt-0.5">Port 4000 active</p>
              </div>
              <span className="text-xs font-bold text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
