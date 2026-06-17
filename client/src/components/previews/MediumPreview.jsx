import React, { useState } from 'react';
import { Bookmark, Share2, MessageSquare } from 'lucide-react';
import { renderMarkdownToHTML } from '../../utils/markdown';

export const MediumPreview = ({ title, subtitle, copy, imageUrl }) => {
  const [claps, setClaps] = useState(438);
  const [clapped, setClapped] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleClap = () => {
    setClaps(prev => prev + 1);
    setClapped(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 500);
  };

  const paragraphs = copy ? copy.split('\n').filter(Boolean) : [];

  return (
    <div className="glass-card rounded-3xl border border-white/5 max-w-2xl mx-auto p-6 md:p-8 bg-[#0B0F1C]/90 text-left shadow-2xl relative">
      
      {/* Sourced Author bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs shadow-glow-sm">
            VO
          </div>
          <div>
            <h4 className="text-xs font-bold text-white hover:underline cursor-pointer">Veloce Operations</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Sourced from DevOps Scalers • 6 min read • 🗓️ June 2026</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400">
          <button className="p-1.5 hover:bg-white/5 hover:text-white rounded-lg transition-colors"><Bookmark size={15} /></button>
          <button className="p-1.5 hover:bg-white/5 hover:text-white rounded-lg transition-colors"><Share2 size={15} /></button>
        </div>
      </div>

      {/* Main story content */}
      <div className="space-y-5 leading-relaxed font-sans max-h-[380px] overflow-y-auto pr-2 scrollbar-glass">
        {title && (
          <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight font-serif tracking-tight">
            {title}
          </h3>
        )}
        
        {subtitle && (
          <h4 className="text-xs md:text-sm font-normal text-slate-400 leading-normal font-serif mt-1">
            {subtitle}
          </h4>
        )}
        
        {imageUrl && (
          <div className="my-4 rounded-xl overflow-hidden border border-white/5 bg-slate-950 select-none">
            <img src={imageUrl} alt="Cover" className="w-full h-auto object-contain block" />
          </div>
        )}
        
        <div className="text-[13px] md:text-[14px] text-slate-300 space-y-4 leading-relaxed font-serif">
          {copy ? (
            <div 
              className="text-slate-300 font-serif leading-loose"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(copy) }}
            />
          ) : (
            <p className="text-xs text-slate-500 font-mono">No copy adaptations generated.</p>
          )}
        </div>
      </div>

      {/* Claps and Actions */}
      <div className="pt-5 border-t border-white/5 mt-6 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClap}
            className={`flex items-center gap-1.5 hover:text-white transition-all duration-200 relative ${
              animating ? 'scale-125' : ''
            }`}
          >
            <span className={`text-base select-none transition-transform duration-300 ${
              clapped ? 'rotate-12 scale-110' : ''
            }`}>
              👏
            </span>
            <span className="font-semibold text-slate-300">{claps} Claps</span>
            {animating && (
              <span className="absolute -top-6 left-1 text-[10px] font-bold text-primary animate-ping">
                +1
              </span>
            )}
          </button>
          
          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
            <MessageSquare size={13} />
            <span>18 responses</span>
          </button>
        </div>
        
        <button className="px-3.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary hover:text-white text-[10px] font-bold rounded-full font-mono uppercase tracking-wide transition-all">
          Follow Sourced Author
        </button>
      </div>
    </div>
  );
};

export default MediumPreview;
