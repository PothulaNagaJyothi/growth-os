import React from 'react';
import { CalendarDaySlot } from './CalendarDaySlot';
import { DraggableCompactBlogCard } from './DraggableCompactBlogCard';

interface BlogItem {
  _id: string;
  title?: string;
  status?: string;
  publishDate?: string;
  author?: string;
  keywordCategory?: string;
}

interface MonthCalendarViewProps {
  blogs: BlogItem[];
  currentDate?: Date;
  onDrop?: (date: Date) => void;
  onSelectBlog?: (blog: BlogItem) => void;
  onStatusChange?: (blog: BlogItem, status: string) => void;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Array<Date | null> = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i += 1) days.push(new Date(year, month, i));
  return days;
};

const groupBlogsByDate = (blogs: BlogItem[]) => {
  return blogs.reduce<Record<string, BlogItem[]>>((acc, blog) => {
    if (!blog.publishDate) return acc;
    const key = new Date(blog.publishDate).toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(blog);
    return acc;
  }, {});
};

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({ blogs, currentDate = new Date(), onDrop, onSelectBlog, onStatusChange }) => {
  const monthDays = getMonthDays(currentDate);
  const groupedBlogs = groupBlogsByDate(blogs);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest pb-2 border-b border-white/5">
        {weekDays.map((day) => <div key={day}>{day}</div>)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {monthDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-[140px] rounded-2xl border border-transparent" />;
          }

          const key = day.toDateString();
          const dayBlogs = groupedBlogs[key] || [];
          const isToday = day.toDateString() === currentDate.toDateString();

          return (
            <CalendarDaySlot key={key} day={day} isToday={isToday} className="min-h-[140px]">
              <button
                type="button"
                onClick={() => onDrop?.(day)}
                className="mb-2 flex w-full items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300 text-left"
              >
                <span>{weekDays[day.getDay()]}</span>
                <span>{day.getDate()}</span>
              </button>

              <div className="space-y-2">
                {dayBlogs.slice(0, 2).map((blog) => (
                  <DraggableCompactBlogCard
                    key={blog._id}
                    blog={blog}
                    onSelect={onSelectBlog}
                  />
                ))}
                {dayBlogs.length > 2 && <p className="text-[10px] text-slate-400">+{dayBlogs.length - 2} more posts</p>}
              </div>
            </CalendarDaySlot>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendarView;
