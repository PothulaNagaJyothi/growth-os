import React from 'react';

export const CalendarViewToggle = ({ viewMode, onChange }) => {
  const options = [
    { key: 'week', label: 'Week View' },
    { key: 'month', label: 'Month View' },
  ];

  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 shadow-inner shadow-black/20">
      {options.map((option) => {
        const active = viewMode === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition ${
              active
                ? 'bg-gradient-to-r from-primary to-accent text-background shadow-glow'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default CalendarViewToggle;
