import React, { useState } from 'react';
import { Settings } from './Settings';
import { Personas } from './Personas';
import { KnowledgeBase } from './KnowledgeBase';
import { Building2, Users2, FileArchive, Sparkles } from 'lucide-react';

export const BrandSetup = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: <Building2 size={16} />, component: <Settings /> },
    { id: 'personas', label: 'Audience Personas', icon: <Users2 size={16} />, component: <Personas /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FileArchive size={16} />, component: <KnowledgeBase /> }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest font-mono">
            <Sparkles size={14} />
            <span>Brand Engine Setup</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Brand Setup</h2>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Consolidate your company details, target reader personas, and reference knowledge base files. 
            The blog generation models automatically ground themselves in these settings.
          </p>
        </div>
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

export default BrandSetup;
