import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Repeat2, Send, Share2, Heart } from 'lucide-react';
import { renderMarkdownToHTML } from '../../utils/markdown';

export const LinkedInPreview = ({ title, copy, hashtags = [], imageUrl }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(148);
  const [showAllText, setShowAllText] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const paragraphs = copy ? copy.split('\n').filter(Boolean) : [];
  const previewParagraphs = showAllText ? paragraphs : paragraphs.slice(0, 3);
  const hasMore = paragraphs.length > 3;

  return (
    <div className="glass-card rounded-2xl border border-white/5 max-w-xl mx-auto shadow-2xl overflow-hidden bg-[#0a0f1d]/90 relative text-left">
      {/* Profile Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-sm text-background shadow-glow-sm">
            VE
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="text-sm font-bold text-white hover:text-primary cursor-pointer transition-colors">Veloce Enterprise</h4>
              <span className="text-[10px] text-slate-500">• 1st</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">SaaS Content automations & cluster scaler console</p>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Just now • Edited • 🌐</p>
          </div>
        </div>
        
        <button className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors">
          <Share2 size={16} />
        </button>
      </div>

      {/* LinkedIn Post Copy */}
      <div className="p-4 space-y-3 text-xs text-slate-200 leading-relaxed">
        {title && <p className="font-bold text-sm text-white">{title}</p>}
        
        <div 
          className="space-y-3 font-sans text-[13px]"
          dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML((showAllText ? paragraphs : paragraphs.slice(0, 3)).join('\n')) }}
        />

        {hasMore && !showAllText && (
          <button
            onClick={() => setShowAllText(true)}
            className="text-[11px] font-bold text-primary hover:underline mt-1 block font-mono"
          >
            ...see more
          </button>
        )}

        {showAllText && hasMore && (
          <button
            onClick={() => setShowAllText(false)}
            className="text-[11px] font-bold text-primary hover:underline mt-1 block font-mono"
          >
            show less
          </button>
        )}

        {/* Hashtag Pills */}
        {hashtags && hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3">
            {hashtags.map((tag, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-bold font-mono text-primary hover:underline cursor-pointer bg-primary/5 px-2 py-0.5 rounded border border-primary/10 transition-all"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="border-t border-b border-white/5 bg-slate-950 select-none flex items-center justify-center">
          <img src={imageUrl} alt="LinkedIn post media" className="w-full h-auto object-contain block" />
        </div>
      )}

      {/* Mock Social Telemetries Bar */}
      <div className="px-4 py-2.5 border-t border-b border-white/5 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center -space-x-1">
            <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-background text-[8px] border border-[#0a0f1d]"><ThumbsUp size={8} /></span>
            <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px] border border-[#0a0f1d]"><Heart size={8} /></span>
          </span>
          <span className="font-mono">{likesCount} reactions</span>
        </div>
        <span className="font-mono">24 comments • 12 reposts</span>
      </div>

      {/* Interactive Action Triggers */}
      <div className="p-1.5 grid grid-cols-4 gap-1 text-[11px] text-slate-400 font-semibold uppercase">
        <button 
          onClick={handleLike}
          className={`py-2 hover:bg-white/5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            liked ? 'text-primary scale-105' : 'hover:text-white'
          }`}
        >
          <ThumbsUp size={13} className={liked ? 'fill-primary text-primary' : ''} />
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button className="py-2 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5">
          <MessageSquare size={13} />
          <span>Comment</span>
        </button>
        
        <button className="py-2 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5">
          <Repeat2 size={13} />
          <span>Repost</span>
        </button>
        
        <button className="py-2 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5">
          <Send size={13} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

export default LinkedInPreview;
