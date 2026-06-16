import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BlogList } from '../components/studio/BlogList';
import { BlogGenerator } from '../components/studio/BlogGenerator';
import { BlogEditor } from '../components/studio/BlogEditor';
import { BlogPreview } from '../components/studio/BlogPreview';
import { Sparkles } from 'lucide-react';

export const BlogStudio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'list';
  const id = searchParams.get('id');

  const setView = (newView, blogId = null) => {
    const params = new URLSearchParams();
    params.set('view', newView);
    if (blogId) {
      params.set('id', blogId);
    }
    setSearchParams(params);
  };

  const handleBack = () => {
    setView('list');
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      {view === 'list' && (
        <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest font-mono">
              <Sparkles size={14} />
              <span>Creative Hub</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Blogs Studio</h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Synthesize, outline, draft, and modify grounded canonical articles. Review automated SEO scorecard recommendations and simulate adaptive rendering for publishing.
            </p>
          </div>
        </div>
      )}

      {/* Switch Render Views */}
      <div className="animate-fade-in">
        {view === 'list' && (
          <BlogList
            onOpenEditor={(blogId) => setView('edit', blogId)}
            onOpenPreview={(blogId) => setView('preview', blogId)}
            onOpenGenerate={() => setView('generate')}
          />
        )}

        {view === 'generate' && (
          <BlogGenerator
            onBack={handleBack}
            onGenerationComplete={(blogId) => setView('preview', blogId)}
          />
        )}

        {view === 'edit' && id && (
          <BlogEditor
            blogId={id}
            onBack={handleBack}
          />
        )}

        {view === 'preview' && id && (
          <BlogPreview
            blogId={id}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default BlogStudio;
