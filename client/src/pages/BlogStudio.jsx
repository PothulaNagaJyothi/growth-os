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
      {/* Page Header */}
      {view === 'list' && (
        <div className="space-y-1 text-left mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Blogs Studio
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-3xl">
            Synthesize, outline, and draft articles. Review automated SEO scorecard recommendations.
          </p>
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
            initialTopicId={searchParams.get('topicId')}
            initialCustomAngle={searchParams.get('customAngle')}
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
