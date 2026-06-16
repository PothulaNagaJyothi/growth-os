import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Topics } from './Topics';
import { Research } from './Research';
import { Compass, Search, Sparkles } from 'lucide-react';

export const TopicsHub = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return 'topics';
  });
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const handleNavigateToResearch = (topicId) => {
    setSelectedTopicId(topicId);
    setActiveTab('research');
  };

  const tabs = [
    { 
      id: 'topics', 
      label: 'Blog Topics', 
      icon: <Compass size={16} />, 
      component: <Topics onNavigateToResearch={handleNavigateToResearch} /> 
    },
    { 
      id: 'research', 
      label: 'Market Research', 
      icon: <Search size={16} />, 
      component: <Research selectedTopicId={selectedTopicId} setSelectedTopicId={setSelectedTopicId} /> 
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1 text-left mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Topics & Research
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-3xl">
          Create blog topics and conduct real-time agentic SEO research to audit competitor gaps and news.
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

export default TopicsHub;
