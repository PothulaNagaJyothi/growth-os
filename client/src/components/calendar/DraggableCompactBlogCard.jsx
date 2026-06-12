import React from 'react';
import { useDraggable } from '@dnd-kit/react';

const statusColors = {
  Draft: 'border-l-slate-400/80 bg-slate-500/5',
  Scheduled: 'border-l-amber-400/80 bg-amber-500/5',
  Published: 'border-l-emerald-400/80 bg-emerald-500/5',
  Archived: 'border-l-rose-400/80 bg-rose-500/5',
};

const normalizeStatus = (value) => {
  const next = `${value || 'Draft'}`.trim().toLowerCase();

  if (next === 'scheduled' || next === 'pending') return 'Scheduled';
  if (next === 'published' || next === 'live') return 'Published';
  if (next === 'archived' || next === 'closed') return 'Archived';

  return 'Draft';
};

export const DraggableCompactBlogCard = ({ blog, onSelect }) => {
  const { ref, isDragging } = useDraggable({
    id: blog._id,
    data: { type: 'card', entry: blog },
  });

  const handleClick = (e) => {
    // Avoid executing onClick if we are dragging
    if (isDragging) return;
    onSelect?.(blog);
  };

  const statusLabel = normalizeStatus(blog?.status);
  const statusClass = statusColors[statusLabel] || statusColors.Draft;

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`w-full cursor-grab rounded-xl border-t border-b border-r border-white/8 border-l-2 ${statusClass} px-2.5 py-2 text-[10px] text-slate-100 shadow-sm shadow-black/10 transition ${
        isDragging ? 'opacity-60 ring-2 ring-primary/40' : 'hover:border-primary/30 hover:bg-white/8'
      }`}
    >
      <p className="font-semibold text-white truncate" title={blog.title}>{blog.title}</p>
      <p className="mt-1 text-[10px] text-slate-300 truncate">{blog.author || 'Unassigned author'}</p>
    </div>
  );
};

export default DraggableCompactBlogCard;
