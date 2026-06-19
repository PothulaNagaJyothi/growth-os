import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  FileText,
  Image,
  Brain,
  History,
  TrendingUp,
  Loader2
} from 'lucide-react';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Never';
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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatFriendlyDate = (timestamp) => {
  if (!timestamp) return 'No documents uploaded yet';
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
};

export const Dashboard = () => {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Founder';

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="animate-spin text-[#f25b18]" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-500">Syncing dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-red-200 bg-red-50/50 flex flex-col items-center justify-center min-h-[450px] text-center space-y-4">
        <div className="text-red-600 text-3xl font-bold">⚠️ Connection Issue</div>
        <p className="text-sm text-slate-600 max-w-md">
          {typeof error === 'string' ? error : (error.message || 'Unable to sync dashboard telemetry with database.')}
        </p>
      </div>
    );
  }

  // Define counts
  const draftsAwaitingReviewCount = dashboardData?.actionRequired?.draftsAwaitingReview?.length || 0;
  const lowSeoCount = dashboardData?.actionRequired?.lowSeoBlogs?.length || 0;
  const upcomingCount = dashboardData?.upcomingContent?.length || 0;

  // Pipeline workflow stages list
  const stages = [
    { label: 'Ideas', count: dashboardData?.contentPipeline?.ideas || 0 },
    { label: 'Research', count: dashboardData?.contentPipeline?.research || 0 },
    { label: 'Draft', count: dashboardData?.contentPipeline?.draft || 0 },
    { label: 'Ready', count: dashboardData?.contentPipeline?.ready || 0 },
    { label: 'Published', count: dashboardData?.contentPipeline?.published || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 text-left">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            {getGreeting()}, {firstName} <span className="animate-pulse text-[#f25b18]">●</span>
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed font-normal">
            Your content pipeline is healthy. You have <span className="font-bold text-[#f25b18]">{draftsAwaitingReviewCount} drafts</span> awaiting review, <span className="font-bold text-slate-700">{lowSeoCount} posts</span> requiring SEO enhancements, and <span className="font-bold text-slate-700">{upcomingCount} posts</span> scheduled to publish.
          </p>
        </div>

        <Link
          to="/blogs?view=generate"
          className="shrink-0 flex items-center gap-2 px-5 py-3 bg-[#f25b18] hover:bg-[#d84a0c] text-white font-bold rounded-lg transition-all shadow-sm text-sm self-start md:self-center cursor-pointer"
        >
          <Sparkles size={16} />
          <span>Generate New Blog</span>
        </Link>
      </div>

      {/* 2. Content Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Draft Blogs Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft Blogs</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{dashboardData?.metrics?.draftBlogs ?? 0}</h3>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
            <FileText size={20} />
          </div>
        </div>

        {/* Published Blogs Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Published Blogs</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{dashboardData?.metrics?.publishedBlogs ?? 0}</h3>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Scheduled Blogs Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Blogs</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{dashboardData?.metrics?.scheduledBlogs ?? 0}</h3>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
            <Calendar size={20} />
          </div>
        </div>

        {/* Average SEO Score Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average SEO Score</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{dashboardData?.metrics?.averageSeoScore ?? 0}</h3>
              <span className="text-xs font-semibold text-slate-450">/100</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* 3. Action Required / Needs Attention */}
      <div className="space-y-3 text-left">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Needs Attention</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Low SEO score */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[220px]">
            <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Low SEO Score (&lt; 80)</span>
              <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200 font-semibold">{dashboardData?.actionRequired?.lowSeoBlogs?.length || 0}</span>
            </div>
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
              {dashboardData?.actionRequired?.lowSeoBlogs && dashboardData.actionRequired.lowSeoBlogs.length > 0 ? (
                dashboardData.actionRequired.lowSeoBlogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs?view=edit&id=${blog._id}`}
                    className="flex justify-between items-center p-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-[#f25b18] truncate pr-2 max-w-[190px]">{blog.title}</span>
                    <span className="text-xs font-bold text-red-600 bg-red-50/10 border border-red-200/30 px-2 py-0.5 rounded shrink-0">Score: {blog.seoScore}</span>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs my-auto">All blogs are well optimized.</div>
              )}
            </div>
          </div>

          {/* Card 2: Missing Cover Images */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[220px]">
            <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Missing Cover Images</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">{dashboardData?.actionRequired?.blogsMissingImages?.length || 0}</span>
            </div>
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
              {dashboardData?.actionRequired?.blogsMissingImages && dashboardData.actionRequired.blogsMissingImages.length > 0 ? (
                dashboardData.actionRequired.blogsMissingImages.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs?view=preview&id=${blog._id}`}
                    className="flex justify-between items-center p-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-[#f25b18] truncate pr-2 max-w-[190px]">{blog.title}</span>
                    <span className="text-xs text-[#f25b18] flex items-center gap-1 font-bold shrink-0">
                      <Image size={12} /> Add Image
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs my-auto">All blogs have cover images.</div>
              )}
            </div>
          </div>

          {/* Card 3: Drafts Awaiting Review */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[220px]">
            <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Drafts Awaiting Review</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">{dashboardData?.actionRequired?.draftsAwaitingReview?.length || 0}</span>
            </div>
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
              {dashboardData?.actionRequired?.draftsAwaitingReview && dashboardData.actionRequired.draftsAwaitingReview.length > 0 ? (
                dashboardData.actionRequired.draftsAwaitingReview.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs?view=edit&id=${blog._id}`}
                    className="flex justify-between items-center p-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-[#f25b18] truncate pr-2 max-w-[190px]">{blog.title}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium shrink-0">
                      <Clock size={10} /> {formatRelativeTime(blog.updatedAt)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs my-auto">No drafts awaiting review.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Content Pipeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Content Pipeline</h3>
          <span className="text-xs text-slate-400 font-medium">Horizontal production stages</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {stages.map((stage, idx) => (
            <React.Fragment key={idx}>
              <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl relative overflow-hidden group hover:border-slate-200 transition-all min-w-[120px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stage.label}</span>
                  <div className="text-3xl font-extrabold text-slate-900">{stage.count}</div>
                </div>
                <div className="w-full h-1 bg-slate-200 absolute bottom-0 left-0 rounded-b-xl group-hover:bg-[#f25b18] transition-colors" />
              </div>
              {idx < stages.length - 1 && (
                <div className="hidden md:flex items-center justify-center text-slate-300">
                  <ChevronRight size={20} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Split Grid for lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Left Column: Upcoming Content & Knowledge Base */}
        <div className="space-y-6">
          {/* 5. Upcoming Content */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#f25b18]" />
                <h3 className="text-lg font-bold text-slate-900">Upcoming Scheduled Blogs</h3>
              </div>
              <Link
                to="/calendar"
                className="text-xs text-[#f25b18] hover:underline font-bold flex items-center gap-0.5"
              >
                Go to Calendar <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[170px] pr-1">
              {dashboardData?.upcomingContent && dashboardData.upcomingContent.length > 0 ? (
                dashboardData.upcomingContent.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Platform: <span className="font-semibold uppercase">{item.platform}</span></p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded shrink-0">
                      {new Date(item.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-6 text-slate-400 text-xs my-auto">
                  No upcoming scheduled content.
                </div>
              )}
            </div>
          </div>

          {/* 6. Knowledge Base Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[220px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-[#f25b18]" />
                  <h3 className="text-lg font-bold text-slate-900">Knowledge Base Summary</h3>
                </div>
                <Link
                  to="/brand?tab=knowledge"
                  className="text-xs text-[#f25b18] hover:underline font-bold flex items-center gap-0.5"
                >
                  Manage files <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 py-2">
                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-2xl font-black text-slate-900">{dashboardData?.knowledgeBase?.totalDocuments || 0}</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Total Docs</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-2xl font-black text-slate-900">{dashboardData?.knowledgeBase?.sourcesCount || 0}</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Sources</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-2xl font-black text-slate-900">{dashboardData?.knowledgeBase?.coveragePercentage || 0}%</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1 font-mono">Coverage</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Last updated:</span>
              <span className="font-semibold text-slate-600">{formatFriendlyDate(dashboardData?.knowledgeBase?.lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Keyword Opportunities & Recent Activity */}
        <div className="space-y-6">
          {/* 7. Keyword Opportunities */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-h-[220px]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-[#f25b18]" />
              <h3 className="text-lg font-bold text-slate-900">Keyword Opportunities</h3>
            </div>
            <div className="space-y-2">
              {dashboardData?.keywordOpportunities?.map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 truncate capitalize">{kw}</span>
                  </div>
                  <Link
                    to={`/blogs?view=generate&customAngle=${encodeURIComponent(`Write an optimized blog post focused on the keyword "${kw}"`)}`}
                    className="text-xs text-[#f25b18] opacity-0 group-hover:opacity-100 transition-opacity font-bold flex items-center gap-0.5 shrink-0 cursor-pointer"
                  >
                    <span>Generate Blog</span>
                    <Sparkles size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Recent Activity (Telemetry logs) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-h-[220px]">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-[#f25b18]" />
              <h3 className="text-lg font-bold text-slate-900">Recent Activity Feed</h3>
            </div>
            <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[170px] pr-1">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5 text-slate-500">
                      {activity.type === 'AI' ? <Sparkles size={13} className="text-[#f25b18]" /> : <FileText size={13} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{activity.action}</p>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{activity.target}</p>
                      <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                        <Clock size={9} /> {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-10 my-auto">
                  No telemetry logs found in workspace.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
