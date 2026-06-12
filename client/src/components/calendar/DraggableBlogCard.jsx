import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/react';
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

export const DraggableBlogCard = ({ entry, onStatusChange, onSelect }) => {
  const navigate = useNavigate();
  const statusLabel = normalizeStatus(entry?.status);
  const { ref, isDragging } = useDraggable({
    id: entry._id,
    data: { type: 'card', entry },
  });

  const handleClick = (e) => {
    if (isDragging) return;
    if (onSelect) {
      onSelect(entry);
    } else {
      entry?._id && navigate(`/blog-studio/${entry._id}`);
    }
  };

  return (
    <button
      type="button"
      ref={ref}
      onClick={handleClick}
      className={`w-full cursor-grab rounded-2xl border border-white/8 bg-white/5 p-4 text-left shadow-lg shadow-black/10 transition ${
        isDragging ? 'opacity-60 ring-2 ring-primary/40' : 'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/8'
      }`}
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
        <div className="flex items-center gap-2"><CalendarDays size={14} className="text-primary" /><dd>{entry.publishDate ? new Date(entry.publishDate).toLocaleDateString() : 'No publish date set'}</dd></div>
        <div className="flex items-center gap-2"><UserRound size={14} className="text-secondary" /><dd>{entry.author || 'Unassigned author'}</dd></div>
        <div className="flex items-center gap-2"><CircleDashed size={14} className="text-accent" /><dd>{entry.keywordCategory || 'General content'}</dd></div>
      </dl>

      {onStatusChange ? (
        <div className="mt-4 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
          {['Draft', 'Scheduled', 'Published', 'Archived'].map((status) => (
            <button
              key={`${entry._id}-${status}`}
              type="button"
              onClick={() => onStatusChange(status)}
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-white/10 ${status === statusLabel ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-black/10 text-slate-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      ) : null}
    </button>
  );
};

export default DraggableBlogCard;
