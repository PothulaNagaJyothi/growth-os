import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { CalendarRange, Loader2, Sparkles, FileText } from 'lucide-react';
import api from '../services/api';
import { CalendarViewToggle } from '../components/calendar/CalendarViewToggle';
import { DraggableBlogCard } from '../components/calendar/DraggableBlogCard';
import { CalendarFilters } from '../components/calendar/CalendarFilters';
import { WeekCalendarView } from '../components/calendar/WeekCalendarView';
import { MonthCalendarView } from '../components/calendar/MonthCalendarView';
import { getCalendarPosts, getFilters, reschedulePost, updateStatus } from '../services/calendarService';

const statusStyles = {
  Draft: 'border-slate-400/20 bg-slate-500/10 text-slate-100',
  Scheduled: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  Published: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  Archived: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
};

const getStartOfWeek = (date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const ContentCalendar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeCard, setActiveCard] = useState(null);
  const [filters, setFilters] = useState({ status: [], author: [], keywordCategory: [] });

  const sensors = useMemo(() => [
    PointerSensor.configure({
      activationConstraints: [
        new PointerActivationConstraints.Distance({ value: 8 })
      ]
    })
  ], []);

  const { data: filterOptions = {} } = useQuery({
    queryKey: ['calendar-filters'],
    queryFn: getFilters,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['content-calendar', filters],
    queryFn: () => getCalendarPosts(filters),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, publishDate }) => reschedulePost(id, publishDate),
    onMutate: async ({ id, publishDate }) => {
      await queryClient.cancelQueries({ queryKey: ['content-calendar'] });
      const previous = queryClient.getQueryData(['content-calendar']);

      queryClient.setQueryData(['content-calendar'], (old = []) =>
        old.map((entry) => (entry._id === id ? { ...entry, publishDate, status: 'Scheduled' } : entry))
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['content-calendar'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
    },
  });

  const statusOptions = ['Draft', 'Scheduled', 'Published', 'Archived'];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['content-calendar'] });
      const previous = queryClient.getQueryData(['content-calendar']);

      queryClient.setQueryData(['content-calendar'], (old = []) =>
        old.map((entry) => (entry._id === id ? { ...entry, status } : entry))
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['content-calendar'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-filters'] });
    },
  });

  const entries = data || [];

  const scheduledEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.publishDate || entry.status?.toLowerCase() === 'published')
      .map((entry) => {
        if (!entry.publishDate && entry.status?.toLowerCase() === 'published') {
          return { ...entry, publishDate: entry.createdAt || new Date().toISOString() };
        }
        return entry;
      });
  }, [entries]);

  const unscheduledEntries = useMemo(() => {
    return entries.filter(
      (entry) =>
        !entry.publishDate &&
        entry.status?.toLowerCase() !== 'published' &&
        entry.status?.toLowerCase() !== 'archived'
    );
  }, [entries]);

  const monthLabel = currentDate.toLocaleString('en', { month: 'long', year: 'numeric' });

  const moveWeek = (direction) => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(next);
  };

  const moveMonth = (direction) => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(next);
  };

  const handleDragStart = ({ operation }) => {
    const active = operation.source;
    if (!active) return;
    const entry = entries.find((item) => item._id === active.id);
    setActiveCard(entry || null);
  };

  const handleDragEnd = ({ canceled, operation }) => {
    setActiveCard(null);

    if (canceled) return;

    const { source, target } = operation;
    if (!target || target.data?.type !== 'day') return;

    const day = target.data.day;
    if (!day) return;

    const publishDate = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 12)).toISOString();

    rescheduleMutation.mutate({ id: source.id, publishDate });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-background/70 p-6 shadow-2xl shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Content Calendar</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">Plan, reschedule, and monitor your content pipeline.</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Review upcoming publish dates, switch between week and month planning views, and surface the latest editorial status at a glance.
          </p>
        </div>
        <CalendarViewToggle viewMode={viewMode} onChange={setViewMode} />
      </header>

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center gap-3 text-slate-300">
          <Loader2 className="animate-spin" size={18} />
          Loading the calendar feed...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">Unable to load calendar entries right now.</div>
      ) : (
        <DragDropProvider sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <section className="grid gap-6 xl:grid-cols-[3fr_1fr]">
            <div className="space-y-6">
              <CalendarFilters
                filters={filters}
                options={{
                  statuses: filterOptions.statuses || [],
                  authors: filterOptions.authors || [],
                  keywordCategories: filterOptions.keywordCategories || [],
                }}
                onChange={setFilters}
                onClear={() => setFilters({ status: [], author: [], keywordCategory: [] })}
              />

              <article className="rounded-3xl border border-white/8 bg-background/70 p-6 shadow-2xl shadow-black/20">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{viewMode === 'week' ? 'Week overview' : 'Month overview'}</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">{viewMode === 'week' ? 'This week' : monthLabel}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => (viewMode === 'week' ? moveWeek(-1) : moveMonth(-1))}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => (viewMode === 'week' ? moveWeek(1) : moveMonth(1))}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {viewMode === 'week' ? (
                  <div className="mt-6">
                    <WeekCalendarView
                      currentDate={currentDate}
                      blogs={scheduledEntries}
                      onSelectBlog={(blog) => blog?._id && navigate(`/blog-studio/${blog._id}`)}
                      onStatusChange={(blog, status) => statusMutation.mutate({ id: blog._id, status })}
                    />
                  </div>
                ) : (
                  <div className="mt-6">
                    <MonthCalendarView
                      currentDate={currentDate}
                      blogs={scheduledEntries}
                      onSelectBlog={(blog) => blog?._id && navigate(`/blog-studio/${blog._id}`)}
                    />
                  </div>
                )}
              </article>
            </div>

            <aside className="space-y-6">
              {/* Unscheduled drafts panel */}
              <article className="rounded-3xl border border-white/8 bg-background/70 p-6 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <div className="flex items-center gap-2 text-accent">
                    <FileText size={18} />
                    <h3 className="text-sm uppercase tracking-[0.25em] text-white">Unscheduled Drafts</h3>
                  </div>
                  <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                    {unscheduledEntries.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-glass">
                  {unscheduledEntries.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No unscheduled drafts. All posts are placed on the calendar.</p>
                  ) : (
                    unscheduledEntries.map((blog) => (
                      <DraggableBlogCard
                        key={blog._id}
                        entry={blog}
                        onStatusChange={(status) => statusMutation.mutate({ id: blog._id, status })}
                      />
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-white/8 bg-background/70 p-6 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-2 text-primary">
                  <CalendarRange size={18} />
                  <h3 className="text-sm uppercase tracking-[0.25em] text-white">Planning snapshot</h3>
                </div>
                <div className="mt-4 space-y-4 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scheduled posts</p>
                    <p className="mt-2 text-3xl font-bold text-white">{scheduledEntries.filter((entry) => entry.status === 'Scheduled').length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Published</p>
                    <p className="mt-2 text-3xl font-bold text-white">{scheduledEntries.filter((entry) => entry.status === 'Published').length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Drafts</p>
                    <p className="mt-2 text-3xl font-bold text-white">{scheduledEntries.filter((entry) => entry.status === 'Draft').length + unscheduledEntries.length}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/8 bg-background/70 p-6 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-2 text-secondary">
                  <Sparkles size={18} />
                  <h3 className="text-sm uppercase tracking-[0.25em] text-white">Editor notes</h3>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li className="rounded-2xl border border-white/8 bg-white/5 p-4 text-xs">Drag any unscheduled draft card from above directly onto a date cell to schedule publication.</li>
                  <li className="rounded-2xl border border-white/8 bg-white/5 p-4 text-xs">Switch to month view to spot clusters and seasonal editorial themes.</li>
                  <li className="rounded-2xl border border-white/8 bg-white/5 p-4 text-xs">Filter by status or author to narrow down your dashboard views.</li>
                </ul>
              </article>
            </aside>
          </section>

          <DragOverlay>
            {activeCard ? (
              <div className="w-72 opacity-90">
                <DraggableBlogCard
                  entry={activeCard}
                  onStatusChange={(status) => statusMutation.mutate({ id: activeCard._id, status })}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DragDropProvider>
      )}
    </div>
  );
};

export default ContentCalendar;
