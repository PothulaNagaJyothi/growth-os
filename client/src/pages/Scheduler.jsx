import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Megaphone,
  BookOpen
} from 'lucide-react';

export const Scheduler = () => {
  const queryClient = useQueryClient();

  // Calendar Date State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 4)); // Default to June 2026 matching local system context (2026-06-04)
  
  // Selection and Form States
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedPlatformBlogId, setSelectedPlatformBlogId] = useState('');
  const [scheduleDateStr, setScheduleDateStr] = useState('2026-06-04');
  const [scheduleTimeStr, setScheduleTimeStr] = useState('12:00');
  const [timezone, setTimezone] = useState('UTC');

  // Status Alerts
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  // 1. Fetch topics
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data.data;
    }
  });

  // Pre-select first topic
  useEffect(() => {
    if (topics && topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0]._id);
    }
  }, [topics, selectedTopicId]);

  // 2. Fetch canonical blog for selected topic
  const { data: blogRecord, isLoading: blogLoading } = useQuery({
    queryKey: ['blog', selectedTopicId],
    queryFn: async () => {
      if (!selectedTopicId) return null;
      try {
        const response = await api.get(`/blogs/topic/${selectedTopicId}`);
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
    enabled: !!selectedTopicId,
    retry: false
  });

  // 3. Fetch available platform adaptations for the canonical blog
  const { data: platformBlogs, isLoading: platformBlogsLoading } = useQuery({
    queryKey: ['platformBlogs', blogRecord?._id],
    queryFn: async () => {
      if (!blogRecord?._id) return [];
      const platforms = ['LinkedIn', 'Medium', 'Company Blog'];
      const results = await Promise.all(
        platforms.map(async (platform) => {
          try {
            const res = await api.get(`/render/blog/${blogRecord._id}/platform/${platform}`);
            return res.data.data;
          } catch (err) {
            return null; // platform post not adapted yet
          }
        })
      );
      return results.filter(Boolean); // filter out nulls
    },
    enabled: !!blogRecord?._id
  });

  // Auto-select first available platform blog
  useEffect(() => {
    if (platformBlogs && platformBlogs.length > 0) {
      setSelectedPlatformBlogId(platformBlogs[0]._id);
    } else {
      setSelectedPlatformBlogId('');
    }
  }, [platformBlogs]);

  // 4. Fetch scheduled publications
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await api.get('/schedule');
      return response.data.data;
    }
  });

  // 5. Mutation: Schedule a blog
  const scheduleMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/schedule', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      triggerAlert('Publication scheduled successfully!');
    },
    onError: (err) => {
      triggerAlert(err.response?.data?.error || 'Failed to schedule publication', 'error');
    }
  });

  // 6. Mutation: Cancel a schedule
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/schedule/${id}`);
      return response.data.message;
    },
    onSuccess: (msg) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      triggerAlert(msg || 'Schedule cancelled successfully.');
    },
    onError: (err) => {
      triggerAlert(err.response?.data?.error || 'Failed to cancel schedule', 'error');
    }
  });

  // Actions
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlatformBlogId || !scheduleDateStr || !scheduleTimeStr) return;

    const scheduledDate = new Date(`${scheduleDateStr}T${scheduleTimeStr}:00`);

    scheduleMutation.mutate({
      platformBlogId: selectedPlatformBlogId,
      scheduledDate: scheduledDate.toISOString(),
      timezone
    });
  };

  const handleCancelSchedule = (id) => {
    if (window.confirm('Are you sure you want to cancel this scheduled publication?')) {
      cancelMutation.mutate(id);
    }
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build Calendar Matrix
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarCells = [];
  // Fill preceding empty days
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  // Fill actual month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(year, month, i));
  }

  // Find schedules for a given date
  const getSchedulesForDate = (date) => {
    if (!date || !schedules) return [];
    return schedules.filter((s) => {
      const sDate = new Date(s.scheduledDate);
      return (
        sDate.getFullYear() === date.getFullYear() &&
        sDate.getMonth() === date.getMonth() &&
        sDate.getDate() === date.getDate()
      );
    });
  };

  const handleDayClick = (date) => {
    if (!date) return;
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    const dateStr = localDate.toISOString().split('T')[0];
    setScheduleDateStr(dateStr);
  };

  const activeTopic = topics?.find((c) => c._id === selectedTopicId);

  return (
    <div className="space-y-6 relative">
      {/* Alert Banner */}
      {alert.show && (
        <div className={`fixed top-20 right-6 z-50 glass-card border px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in bg-white/95 ${
          alert.type === 'success' 
            ? 'border-primary/20 text-foreground' 
            : 'border-red-500/25 text-foreground'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            alert.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
          }`}>
            {alert.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          </div>
          <span className="font-semibold text-slate-800 text-xs font-mono">{alert.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calendar Scheduler</h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate, view, and schedule adapted social platform blog publications on a calendar board.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left and Middle Columns: Calendar Grid */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl border border-white/5 p-6 bg-background/50 flex flex-col h-full min-h-[500px]">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {monthNames[month]} {year}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest pb-2 border-b border-white/5">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-2 flex-1 mt-3">
              {schedulesLoading ? (
                <div className="col-span-7 flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="animate-spin text-primary" size={28} />
                  <p className="text-xs text-slate-500 font-mono">Loading calendar queues...</p>
                </div>
              ) : (
                calendarCells.map((date, idx) => {
                  const isSelected = date && date.toISOString().split('T')[0] === scheduleDateStr;
                  const daySchedules = getSchedulesForDate(date);
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(date)}
                      className={`min-h-[70px] p-1.5 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                        !date
                          ? 'border-transparent opacity-20 pointer-events-none'
                          : isSelected
                          ? 'bg-primary/10 border-primary shadow-glow-sm cursor-pointer'
                          : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10 cursor-pointer'
                      }`}
                    >
                      {/* Day Number */}
                      <span className={`text-[10px] font-bold font-mono ${
                        isSelected ? 'text-primary' : 'text-slate-400'
                      }`}>
                        {date ? date.getDate() : ''}
                      </span>

                      {/* Scheduled Post Indicators */}
                      <div className="space-y-1">
                        {daySchedules.slice(0, 2).map((s) => (
                          <div
                            key={s._id}
                            className={`text-[8px] px-1.5 py-0.5 rounded font-mono truncate max-w-full uppercase font-bold border ${
                              s.status === 'published'
                                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                                : s.status === 'failed'
                                ? 'bg-rose-950/40 border-rose-500/20 text-rose-400'
                                : 'bg-primary/20 border-primary/20 text-primary'
                            }`}
                            title={`${s.platformBlogId?.platformName}: ${s.platformBlogId?.title}`}
                          >
                            {s.platformBlogId?.platformName || 'Blog'}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-[7px] text-slate-500 text-center font-bold font-mono">
                            +{daySchedules.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Schedule Form & Upcoming Queue */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Scheduling Panel */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-background/50 space-y-4 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Plus size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Schedule publication</h3>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              
              {/* Topic Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Megaphone size={12} />
                  <span>Topic Context</span>
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {topicsLoading ? (
                    <option>Loading topics...</option>
                  ) : topics && topics.length > 0 ? (
                    topics.map((c) => (
                      <option key={c._id} value={c._id} className="bg-background text-white">
                        {c.topicName}
                      </option>
                    ))
                  ) : (
                    <option value="">No topics available</option>
                  )}
                </select>
              </div>

              {/* Platform Adaptation Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={12} />
                  <span>Platform Adapted Post</span>
                </label>
                
                {blogLoading || platformBlogsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-slate-500 text-xs">
                    <Loader2 size={12} className="animate-spin text-primary" />
                    <span>Loading platform drafts...</span>
                  </div>
                ) : !blogRecord ? (
                  <p className="text-[10px] text-rose-400 font-mono italic">
                    Requires a canonical blog inside this topic.
                  </p>
                ) : platformBlogs && platformBlogs.length > 0 ? (
                  <select
                    value={selectedPlatformBlogId}
                    onChange={(e) => setSelectedPlatformBlogId(e.target.value)}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    {platformBlogs.map((pb) => (
                      <option key={pb._id} value={pb._id} className="bg-background text-white">
                        {pb.platformName} - {pb.title ? pb.title.slice(0, 30) : 'Untitled'}...
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-rose-400 font-mono italic">
                    No platform adaptations rendered yet. Please generate them in the Preview Center.
                  </p>
                )}
              </div>

              {/* Date Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <CalendarIcon size={12} />
                  <span>Publication Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={scheduleDateStr}
                  onChange={(e) => setScheduleDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors text-center"
                />
              </div>

              {/* Time Selector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Time (24h)</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleTimeStr}
                    onChange={(e) => setScheduleTimeStr(e.target.value)}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors text-center"
                  />
                </div>

                {/* Timezone Configuration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Globe size={12} />
                    <span>Timezone</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST (UTC-5)</option>
                    <option value="PST">PST (UTC-8)</option>
                    <option value="IST">IST (UTC+5:30)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedPlatformBlogId || scheduleMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-40 text-background font-bold rounded-xl shadow-glow transition-all flex items-center justify-center gap-2 mt-2"
              >
                {scheduleMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin text-background" size={14} />
                    <span>Scheduling Post...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Schedule Publication</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Upcoming Queued Posts */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-background/50 space-y-4 text-left flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Clock size={16} className="text-secondary" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Upcoming Queue</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {schedules?.filter(s => s.status === 'scheduled').length || 0} Scheduled
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-glass">
              {schedulesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="animate-spin text-primary" size={16} />
                </div>
              ) : !schedules || schedules.filter(s => s.status === 'scheduled').length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-6 font-mono">
                  No upcoming publications scheduled.
                </p>
              ) : (
                schedules
                  .filter((s) => s.status === 'scheduled')
                  .map((s) => (
                    <div
                      key={s._id}
                      className="p-3 glass-card rounded-xl border border-white/5 bg-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/20 text-[8px] font-bold uppercase font-mono">
                            {s.platformBlogId?.platformName}
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono">
                            {new Date(s.scheduledDate).toLocaleDateString()} at {new Date(s.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.timezone})
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-white truncate max-w-[160px]">
                          {s.platformBlogId?.title || 'Untitled Adaptation'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancelSchedule(s._id)}
                        disabled={cancelMutation.isPending}
                        className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors shrink-0"
                        title="Cancel Schedule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Scheduler;
