import React, { useState } from 'react';
import { Heart, Bookmark, MessageSquare, Share2, Award, Zap } from 'lucide-react';
import { renderMarkdownToHTML } from '../../utils/markdown';

export const DevToPreview = ({ title, copy, hashtags, imageUrl }) => {
  const [likes, setLikes] = useState(128);
  const [liked, setLiked] = useState(false);
  const [unicorns, setUnicorns] = useState(42);
  const [unicorned, setUnicorned] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes(prev => prev - 1);
    } else {
      setLiked(true);
      setLikes(prev => prev + 1);
    }
  };

  const handleUnicorn = () => {
    if (unicorned) {
      setUnicorned(false);
      setUnicorns(prev => prev - 1);
    } else {
      setUnicorned(true);
      setUnicorns(prev => prev + 1);
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-white/5 max-w-2xl mx-auto overflow-hidden bg-[#0F141C]/95 text-left shadow-2xl">
      {/* Top Banner Cover Image */}
      {imageUrl ? (
        <div className="bg-slate-900 border-b border-white/5 select-none flex items-center justify-center">
          <img src={imageUrl} alt="Dev.to cover" className="w-full h-auto object-contain block" />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-primary/20 border-b border-white/5 flex items-center justify-center select-none">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
            <Zap size={14} className="text-primary animate-pulse" />
            <span>Dev.to Developer Community Publication Simulator</span>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        {/* Author Metadata Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
            VO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200 hover:text-primary hover:underline cursor-pointer">Veloce Operations</span>
              <span className="text-[10px] text-slate-500">•</span>
              <span className="text-[10px] text-slate-500">June 11 (2026)</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 font-mono">Sourced via Growth OS Content Pipeline</p>
          </div>
        </div>

        {/* Title & Tags */}
        <div className="space-y-3">
          {title && (
            <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight hover:text-primary transition-colors cursor-pointer">
              {title}
            </h3>
          )}

          {/* Hashtag List */}
          <div className="flex flex-wrap gap-2 pt-1">
            {hashtags && hashtags.length > 0 ? (
              hashtags.map((tag) => (
                <span key={tag} className="text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                  #{tag}
                </span>
              ))
            ) : (
              <>
                <span className="text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 bg-white/5 rounded-md border border-white/5">#devops</span>
                <span className="text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 bg-white/5 rounded-md border border-white/5">#kubernetes</span>
                <span className="text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 bg-white/5 rounded-md border border-white/5">#tutorial</span>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto pr-2 scrollbar-glass">
          {copy ? (
            <div 
              className="text-slate-300 leading-loose prose prose-invert max-w-none text-xs md:text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(copy) }}
            />
          ) : (
            <p className="text-xs text-slate-500 font-mono">No dev.to adaptations generated.</p>
          )}
        </div>

        {/* Footer Reactions & Metrics Toolbar */}
        <div className="pt-5 border-t border-white/5 mt-6 flex items-center justify-between text-xs text-slate-400 font-mono select-none">
          <div className="flex items-center gap-4">
            {/* Heart Reaction */}
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-all text-xs font-semibold ${
                liked ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart size={14} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
              <span>{likes} reactions</span>
            </button>

            {/* Unicorn Reaction */}
            <button 
              onClick={handleUnicorn}
              className={`flex items-center gap-1.5 transition-all text-xs font-semibold ${
                unicorned ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award size={14} className={unicorned ? 'fill-amber-400 text-amber-400' : ''} />
              <span>{unicorns} unicorns</span>
            </button>

            {/* Comments Counter */}
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold">
              <MessageSquare size={14} />
              <span>8 comments</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Bookmark */}
            <button 
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-1.5 rounded-lg transition-colors hover:bg-white/5 ${
                bookmarked ? 'text-primary' : 'text-slate-400 hover:text-white'
              }`}
              title="Save Post"
            >
              <Bookmark size={15} className={bookmarked ? 'fill-primary text-primary' : ''} />
            </button>

            {/* Share */}
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevToPreview;
