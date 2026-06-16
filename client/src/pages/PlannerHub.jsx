import React, { useState } from 'react';
import { ContentCalendar } from './ContentCalendar';
import { Scheduler } from './Scheduler';
import { Calendar, Clock, Sparkles } from 'lucide-react';

export const PlannerHub = () => {
  const [activeTab, setActiveTab] = useState('calendar');

  const tabs = [
    { id: 'calendar', label: 'Content Calendar', icon: <Calendar size={16} />, component: <ContentCalendar /> },
    { id: 'scheduler', label: 'Publishing Queue', icon: <Clock size={16} />, component: <Scheduler /> }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1 text-left mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Content Planner
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-3xl">
          Plan, schedule, and automate your blog posts across LinkedIn, Medium, Dev.to, Substack, and your website.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-2 pb-px overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="animate-fade-in">
        {currentTab.component}
      </div>
    </div>
  );
};

export default PlannerHub;
