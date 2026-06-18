import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings } from './Settings';
import { Personas } from './Personas';
import { KnowledgeBase } from './KnowledgeBase';
import { TelemetryDashboard } from './TelemetryDashboard';
import { Building2, Users2, FileArchive, Sparkles } from 'lucide-react';

export const BrandSetup = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'profile';
  });

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: <Building2 size={16} />, component: <Settings onNext={() => setActiveTab('personas')} /> },
    { id: 'personas', label: 'Audience Personas', icon: <Users2 size={16} />, component: <Personas onNext={() => setActiveTab('knowledge')} /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FileArchive size={16} />, component: <KnowledgeBase /> },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1 text-left mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Brand Setup
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-3xl">
          Configure company details, audience personas, and upload reference grounding files.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-2 pb-px overflow-x-auto scrollbar-none">
        {tabs.map((tab, idx) => {
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
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-colors ${
                  isActive 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'bg-slate-200/50 text-slate-500 border border-slate-300/30'
                }`}>
                  Step {idx + 1}
                </span>
                <span>{tab.label}</span>
                {tab.id === 'knowledge' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider">Required</span>
                )}
              </div>
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

export default BrandSetup;
