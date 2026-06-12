import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  FileText,
  Loader2,
  AlertCircle,
  Search,
  BookOpen,
  Calendar,
  User,
  Globe,
  Archive,
  CalendarDays,
  X,
  Check,
  Zap
} from 'lucide-react';

const statusColors = {
  Draft: 'border-l-slate-400/80 bg-slate-500/[0.02]',
  Scheduled: 'border-l-amber-400/80 bg-amber-500/[0.02]',
  Published: 'border-l-emerald-400/80 bg-emerald-500/[0.02]',
  Archived: 'border-l-rose-400/80 bg-rose-500/[0.02]',
};

const badgeColors = {
  Draft: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
  Scheduled: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  Published: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  Archived: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
};

const normalizeStatus = (value) => {
  const next = `${value || 'Draft'}`.trim().toLowerCase();

  if (next === 'scheduled' || next === 'pending') return 'Scheduled';
  if (next === 'published' || next === 'live') return 'Published';
  if (next === 'archived' || next === 'closed') return 'Archived';

  return 'Draft';
};

export const Blogs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search and status tab filters
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Draft', 'Scheduled', 'Published', 'Archived'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [archiveConfirmBlog, setArchiveConfirmBlog] = useState(null);
  const [scheduleBlog, setScheduleBlog] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [publishPlatform, setPublishPlatform] = useState('html');
  
  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 1. Fetch all blogs
  const { data: blogs = [], isLoading, isError, error } = useQuery({
    queryKey: ['blogs-directory'],
    queryFn: async () => {
      const response = await api.get('/blogs');
      return response.data.data || [];
    }
  });

  // 2. Mutation to update status/dates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/blogs/${id}`, payload);
      return response.data.data;
    },
    onSuccess: (updatedBlog) => {
      // Invalidate both directory and calendar queries to sync dates
      queryClient.invalidateQueries({ queryKey: ['blogs-directory'] });
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
      triggerToast(`Blog status successfully updated to "${normalizeStatus(updatedBlog.status)}".`);
      
      // Close any active modals
      setArchiveConfirmBlog(null);
      setScheduleBlog(null);
      setScheduleDate('');
      setPublishPlatform('html');
    },
    onError: (err) => {
      console.error(err);
      triggerToast(err.response?.data?.error || 'Failed to update status.', 'error');
    }
  });

  // Handle Dropdown Change Status Trigger
  const handleStatusChange = (blog, newStatus) => {
    const currentNorm = normalizeStatus(blog.status).toLowerCase();
    const targetNorm = newStatus.toLowerCase();

    if (currentNorm === targetNorm) return;

    if (targetNorm === 'archived') {
      setArchiveConfirmBlog(blog);
    } else if (targetNorm === 'scheduled') {
      // Set schedule date to current blog publish date if exists, or local ISO string
      let defaultDate = '';
      if (blog.publishDate) {
        defaultDate = new Date(blog.publishDate).toISOString().slice(0, 16);
      } else {
        const localDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // default to tomorrow
        const offset = localDate.getTimezoneOffset() * 60000;
        defaultDate = new Date(localDate - offset).toISOString().slice(0, 16);
      }
      setScheduleDate(defaultDate);
      setPublishPlatform(blog.publishInfo?.platform || 'html');
      setScheduleBlog(blog);
    } else if (targetNorm === 'published') {
      // Direct update to published setting publishDate to current date
      updateStatusMutation.mutate({
        id: blog._id,
        payload: {
          status: 'published',
          publishDate: new Date().toISOString()
        }
      });
    } else {
      // Direct update to draft, clearing publishDate
      updateStatusMutation.mutate({
        id: blog._id,
        payload: {
          status: 'draft',
          publishDate: null
        }
      });
    }
  };

  // Submit Archive Transition
  const confirmArchive = () => {
    if (!archiveConfirmBlog) return;
    updateStatusMutation.mutate({
      id: archiveConfirmBlog._id,
      payload: {
        status: 'archived',
        publishDate: null
      }
    });
  };

  // Submit Schedule Transition
  const confirmSchedule = (e) => {
    if (e) e.preventDefault();
    if (!scheduleBlog || !scheduleDate) return;

    const targetDate = new Date(scheduleDate);
    if (isNaN(targetDate.getTime())) {
      triggerToast('Please provide a valid date format.', 'error');
      return;
    }

    if (targetDate <= new Date()) {
      triggerToast('Schedule date must be in the future.', 'error');
      return;
    }

    updateStatusMutation.mutate({
      id: scheduleBlog._id,
      payload: {
        status: 'scheduled',
        publishDate: targetDate.toISOString(),
        publishPlatform: publishPlatform
      }
    });
  };

  // Compute counts for tabs
  const tabCounts = useMemo(() => {
    const counts = { All: blogs.length, Draft: 0, Scheduled: 0, Published: 0, Archived: 0 };
    blogs.forEach((blog) => {
      const statusLabel = normalizeStatus(blog.status);
      if (counts[statusLabel] !== undefined) {
        counts[statusLabel]++;
      }
    });
    return counts;
  }, [blogs]);

  // Filtered and searched blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      // Casing and Normalization Checks
      const statusLabel = normalizeStatus(blog.status);
      const matchesTab = activeTab === 'All' || statusLabel === activeTab;

      const titleLower = (blog.title || '').toLowerCase();
      const keywordLower = (blog.keyword || '').toLowerCase();
      const categoryLower = (blog.keywordCategory || '').toLowerCase();
      const authorLower = (blog.author || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        titleLower.includes(searchLower) ||
        keywordLower.includes(searchLower) ||
        categoryLower.includes(searchLower) ||
        authorLower.includes(searchLower);

      return matchesTab && matchesSearch;
    });
  }, [blogs, activeTab, searchQuery]);

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-20 right-6 z-50 glass-card border px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
          toastType === 'error'
            ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            toastType === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {toastType === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          </div>
          <span className="font-semibold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Blogs Directory</h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage all your generated articles, monitor editorial statuses, and schedule or archive publication setups across channels.
        </p>
      </div>

      {/* Filter Toolbar Section */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
        {/* Tab filters */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Draft', 'Scheduled', 'Published', 'Archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 text-primary'
                  : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab}</span>
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                activeTab === tab ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-500'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, keyword, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white/[0.08] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      {/* Content Grid */}
      {isLoading ? (
        <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm font-semibold tracking-wider text-slate-400">Loading blogs database...</p>
        </div>
      ) : isError ? (
        <div className="glass-card rounded-3xl p-12 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto min-h-[300px] flex flex-col justify-center">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <h3 className="text-xl font-bold text-red-200">Failed to Query Articles</h3>
          <p className="text-xs text-slate-400">{error.message || 'Unknown network query error.'}</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 border border-white/5 text-center py-20 flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <FileText size={32} className="text-slate-500 animate-pulse" />
          <div>
            <p className="text-sm text-slate-400 font-semibold">No matching blog posts found</p>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1">
              Try adjusting your tab filter or search query. To generate new content, navigate to Quick Blog.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredBlogs.map((blog) => {
            const statusLabel = normalizeStatus(blog.status);
            const campaignName = blog.campaignId?.campaignName || 'Standalone Post';
            
            return (
              <div
                key={blog._id}
                onClick={() => navigate(`/blog-studio/${blog._id}`)}
                className={`relative group p-5 bg-gradient-to-b from-[#0B0F1C]/95 to-[#0B0F1C]/90 border-t border-b border-r border-white/5 border-l-4 ${statusColors[statusLabel] || statusColors.Draft} hover:border-primary/30 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow cursor-pointer animate-fade-in`}
              >
                <div className="space-y-3">
                  {/* Status badge and Date */}
                  <div className="flex justify-between items-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${badgeColors[statusLabel] || badgeColors.Draft}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar size={11} className="text-slate-600" />
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Campaign context & Title */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-accent font-bold uppercase tracking-wider font-mono">
                      {campaignName}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]" title={blog.title}>
                      {blog.title || 'Untitled Blog Post'}
                    </h3>
                  </div>
                </div>

                {/* Metadata block */}
                <div className="border-t border-white/5 pt-4 space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Author:</span>
                    <span className="text-slate-200 truncate max-w-[120px]">{blog.author || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Keyword:</span>
                    <span className="text-slate-200 truncate max-w-[120px] font-mono">"{blog.keyword || 'None'}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Category:</span>
                    <span className="text-slate-200 truncate max-w-[120px]">{blog.keywordCategory || 'General'}</span>
                  </div>
                  
                  {blog.publishDate && statusLabel === 'Scheduled' && (
                    <div className="flex justify-between items-center bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg text-amber-300 font-mono text-[9px] mt-2">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={10} />
                        Pub Date:
                      </span>
                      <span>{new Date(blog.publishDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {/* Interactive dropdown control */}
                <div 
                  className="border-t border-white/5 pt-3 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Change status:</span>
                    <select
                      value={blog.status || 'draft'}
                      onChange={(e) => handleStatusChange(blog, e.target.value)}
                      disabled={updateStatusMutation.isPending}
                      className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-300 focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="draft" className="bg-background text-white">Draft</option>
                      <option value="scheduled" className="bg-background text-white">Scheduled</option>
                      <option value="published" className="bg-background text-white">Published</option>
                      <option value="archived" className="bg-background text-white">Archived</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/blog-studio/${blog._id}`)}
                    className="p-1 text-slate-400 hover:text-primary transition-all"
                    title="Open in Blog Studio editor"
                  >
                    <BookOpen size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. ARCHIVE CONFIRMATION MODAL */}
      {archiveConfirmBlog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full border border-rose-500/20 bg-[#0B0F1C] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setArchiveConfirmBlog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Archive size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Archive Article</h3>
                <p className="text-[10px] text-rose-400 tracking-wider uppercase font-semibold">Destructive Action</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to archive **"{archiveConfirmBlog.title}"**? 
                Archived articles will be removed from your active scheduling pipelines and calendar dashboards.
              </p>
              
              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setArchiveConfirmBlog(null)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmArchive}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <Archive size={13} />
                  )}
                  <span>Archive Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SCHEDULE DATE SELECTION MODAL */}
      {scheduleBlog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full border border-white/5 bg-[#0B0F1C] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => {
                setScheduleBlog(null);
                setScheduleDate('');
                setPublishPlatform('html');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
 
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Schedule Publication</h3>
                <p className="text-[10px] text-primary tracking-wider uppercase font-semibold">Editorial Pipeline</p>
              </div>
            </div>
 
            <form onSubmit={confirmSchedule} className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Select a publication date, time, and target platform for **"{scheduleBlog.title}"** to sync it with our automation schedules.
                </p>
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-slate-400">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors text-center cursor-pointer"
                  />
                </div>
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-slate-400">Target Publishing Platform *</label>
                  <select
                    value={publishPlatform}
                    onChange={(e) => setPublishPlatform(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="html" className="bg-background text-white">HTML (Web Platform)</option>
                    <option value="wordpress" className="bg-background text-white">WordPress (Blog Engine)</option>
                    <option value="markdown" className="bg-background text-white">Markdown (Static Export)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleBlog(null);
                    setScheduleDate('');
                    setPublishPlatform('html');
                  }}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending || !scheduleDate}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background text-xs font-bold rounded-xl shadow-glow transition-all flex items-center gap-1.5"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="animate-spin text-background" size={13} />
                  ) : (
                    <Zap size={13} className="text-background" />
                  )}
                  <span>Schedule Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
