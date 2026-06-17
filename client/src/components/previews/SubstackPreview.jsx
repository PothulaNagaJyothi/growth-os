import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Mail, Check, ArrowUpRight } from 'lucide-react';
import { renderMarkdownToHTML } from '../../utils/markdown';

export const SubstackPreview = ({ title, subtitle, copy, imageUrl }) => {
  const [likes, setLikes] = useState(89);
  const [liked, setLiked] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes(prev => prev - 1);
    } else {
      setLiked(true);
      setLikes(prev => prev + 1);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-white/5 max-w-2xl mx-auto p-6 md:p-8 bg-[#0D0F14]/95 text-left shadow-2xl space-y-6">
      
      {/* Substack Newsletter Header */}
      <div className="text-center border-b border-white/5 pb-4 mb-4">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary font-mono">
          The Veloce Newsletter
        </h4>
        <p className="text-[9px] text-slate-400 mt-1">Written by tech founders, for growth engineers. Substack Edition.</p>
      </div>

      {/* Story Metadata */}
      <div className="space-y-3">
        {title && (
          <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight font-serif tracking-tight text-center">
            {title}
          </h3>
        )}

        {subtitle && (
          <h4 className="text-xs md:text-sm font-normal text-slate-400 italic text-center mt-1">
            {subtitle}
          </h4>
        )}

        <div className="flex flex-col items-center gap-1.5 text-[10px] text-slate-500 font-mono text-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Veloce Team</span>
            <span>•</span>
            <span>June 11, 2026</span>
          </div>
          <span className="text-slate-400">Grounded SaaS Insights and Scaling Metrics</span>
        </div>
      </div>

      {imageUrl && (
        <div className="my-4 rounded-xl overflow-hidden border border-white/5 bg-slate-950 select-none">
          <img src={imageUrl} alt="Substack cover" className="w-full h-auto object-contain block" />
        </div>
      )}

      {/* Action Toolbar Top */}
      <div className="border-t border-b border-white/5 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1 text-[11px] font-bold ${
              liked ? 'text-primary' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart size={13} className={liked ? 'fill-primary text-primary' : ''} />
            <span>{likes} Likes</span>
          </button>
          
          <button className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white">
            <MessageSquare size={13} />
            <span>15 Comments</span>
          </button>
        </div>

        <button className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors">
          <Share2 size={14} />
        </button>
      </div>

      {/* Main Copy Area */}
      <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto pr-2 scrollbar-glass">
        {copy ? (
          <div 
            className="text-slate-300 leading-relaxed font-serif text-xs md:text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(copy) }}
          />
        ) : (
          <p className="text-xs text-slate-500 font-mono">No substack newsletter outline generated.</p>
        )}
      </div>

      {/* Newsletter Signup widget inside post */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4 text-center max-w-md mx-auto">
        <Mail size={24} className="text-primary mx-auto animate-pulse" />
        <div>
          <p className="text-xs font-bold text-white">Subscribe to Veloce Newsletter</p>
          <p className="text-[10px] text-slate-400 mt-1">Receive technical playbooks and scaling deep dives twice weekly.</p>
        </div>

        {subscribed ? (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 animate-pulse">
            <Check size={12} />
            <span>Subscription Confirmed!</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow px-3 py-1.5 bg-background/60 border border-white/10 rounded-xl text-white text-[10px] focus:outline-none focus:border-primary transition-colors text-center"
            />
            
            <button 
              type="submit"
              className="flex items-center justify-center gap-1 px-4 py-1.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-bold text-background rounded-xl text-[10px] shadow-glow whitespace-nowrap"
            >
              <span>Subscribe</span>
              <ArrowUpRight size={12} />
            </button>
          </form>
        )}
      </div>

      {/* Action Toolbar Bottom */}
      <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>© 2026 Veloce Operations</span>
        <span className="text-slate-400 hover:text-white cursor-pointer hover:underline">Unsubscribe</span>
      </div>

    </div>
  );
};

export default SubstackPreview;
