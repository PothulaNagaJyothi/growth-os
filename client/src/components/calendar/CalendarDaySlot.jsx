import React from 'react';
import { useDroppable } from '@dnd-kit/react';

export const CalendarDaySlot = ({ day, isToday, children, className = '' }) => {
  const { ref, isDropTarget } = useDroppable({
    id: day?.toDateString?.() || 'empty-slot',
    data: { type: 'day', day },
  });

  return (
    <article
      ref={ref}
      className={`min-h-[140px] rounded-2xl border p-3 transition ${
        isToday ? 'border-primary/40 bg-primary/5' : 'border-white/8 bg-white/5'
      } ${isDropTarget ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30' : ''} ${className}`}
    >
      {children}
    </article>
  );
};

export default CalendarDaySlot;
