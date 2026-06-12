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

interface WeekCalendarViewProps {
  blogs: BlogItem[];
  currentDate?: Date;
  onDrop?: (date: Date) => void;
  onSelectBlog?: (blog: BlogItem) => void;
  onStatusChange?: (blog: BlogItem, status: string) => void;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getStartOfWeek = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
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

export const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({ blogs, currentDate = new Date(), onDrop, onSelectBlog, onStatusChange }) => {
  const weekStart = getStartOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
  const groupedBlogs = groupBlogsByDate(blogs);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
      {weekDates.map((day) => {
        const key = day.toDateString();
        const dayBlogs = groupedBlogs[key] || [];
        const isToday = day.toDateString() === currentDate.toDateString();

        return (
          <CalendarDaySlot
            key={key}
            day={day}
            isToday={isToday}
          >
            <button
              type="button"
              onClick={() => onDrop?.(day)}
              className="mb-3 flex w-full items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300 text-left"
            >
              <span>{weekDays[day.getDay()]}</span>
              <span className="text-slate-400">{day.getDate()}</span>
            </button>

            <div className="space-y-3">
              {dayBlogs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-4 text-xs text-slate-400">Drop a post here</p>
              ) : (
                dayBlogs.map((blog) => (
                  <DraggableCompactBlogCard
                    key={blog._id}
                    blog={blog}
                    onSelect={onSelectBlog}
                  />
                ))
              )}
            </div>
          </CalendarDaySlot>
        );
      })}
    </div>
  );
};

export default WeekCalendarView;
