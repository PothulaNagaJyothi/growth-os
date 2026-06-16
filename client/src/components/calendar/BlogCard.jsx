import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, UserRound, CircleDashed } from 'lucide-react';

const statusColors = {
  Draft: 'bg-slate-500/15 text-slate-200 border-slate-400/20',
  Scheduled: 'bg-amber-400/12 text-amber-100 border-amber-400/20',
  Published: 'bg-emerald-400/12 text-emerald-100 border-emerald-400/20',
  Archived: 'bg-rose-400/12 text-rose-100 border-rose-400/20',
};

const normalizeStatus = (value) => {
  const next = `${value || 'Draft'}`.trim().toLowerCase();

  if (next === 'scheduled' || next === 'pending') return 'Scheduled';
  if (next === 'published' || next === 'live') return 'Published';
  if (next === 'archived' || next === 'closed') return 'Archived';

  return 'Draft';
};

export const BlogCard = ({ entry }) => {
  const navigate = useNavigate();
  const statusLabel = normalizeStatus(entry?.status);

  return (
    <button
      type="button"
      onClick={() => entry?._id && navigate(`/blogs?view=edit&id=${entry._id}`)}
      className="w-full rounded-2xl border border-white/8 bg-white/5 p-4 text-left shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary/80">Canonical Blog</p>
          <h3 className="text-base font-semibold text-white">{entry.title || 'Untitled blog'}</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusColors[statusLabel] || statusColors.Draft}`}>
          {statusLabel}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-primary" />
          <dt className="sr-only">Publish date</dt>
          <dd>{entry.publishDate ? new Date(entry.publishDate).toLocaleDateString() : 'No publish date set'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-secondary" />
          <dt className="sr-only">Author</dt>
          <dd>{entry.author || 'Unassigned author'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CircleDashed size={14} className="text-accent" />
          <dt className="sr-only">Category</dt>
          <dd>{entry.keywordCategory || 'General content'}</dd>
        </div>
      </dl>
    </button>
  );
};

export default BlogCard;
