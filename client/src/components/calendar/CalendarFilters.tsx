import React from 'react';
import { ChevronDown } from 'lucide-react';

const statusOptions = ['Draft', 'Scheduled', 'Published', 'Archived'];

export const CalendarFilters = ({ filters, options, onChange, onClear }) => {
  const toggleValue = (key, value) => {
    const next = new Set(filters[key] || []);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }

    onChange({
      ...filters,
      [key]: Array.from(next),
    });
  };

  return (
    <section className="rounded-3xl border border-white/8 bg-background/70 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Filters</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Refine the calendar view</h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
        >
          Clear
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <fieldset>
          <legend className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Status</legend>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const active = (filters.status || []).includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleValue('status', status)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="author-select" className="block mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Author</label>
            <div className="relative">
              <select
                id="author-select"
                value={filters.author?.[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...filters,
                    author: val ? [val] : [],
                  });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-secondary/50 transition appearance-none cursor-pointer"
              >
                <option value="" className="bg-background text-slate-200">All Authors</option>
                {(options.authors || []).map((author) => (
                  <option key={author} value={author} className="bg-background text-slate-200">
                    {author}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="category-select" className="block mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Category</label>
            <div className="relative">
              <select
                id="category-select"
                value={filters.keywordCategory?.[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...filters,
                    keywordCategory: val ? [val] : [],
                  });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-accent/50 transition appearance-none cursor-pointer"
              >
                <option value="" className="bg-background text-slate-200">All Categories</option>
                {(options.keywordCategories || []).map((category) => (
                  <option key={category} value={category} className="bg-background text-slate-200">
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarFilters;
