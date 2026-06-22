import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  FileText,
  Loader2,
  AlertCircle,
  Search,
  Pencil,
  Calendar,
  User,
  Globe,
  Archive,
  Check,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2
} from 'lucide-react';

const statusColors = {
  Draft: 'border-l-slate-400 bg-slate-500/[0.01]',
  Scheduled: 'border-l-amber-500 bg-amber-500/[0.01]',
  Published: 'border-l-emerald-500 bg-emerald-500/[0.01]',
  Archived: 'border-l-rose-500 bg-rose-500/[0.01]',
};

const badgeColors = {
  Draft: 'border-slate-300 bg-slate-100 text-slate-600',
  Scheduled: 'border-amber-200 bg-amber-50 text-amber-700',
  Published: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Archived: 'border-rose-200 bg-rose-50 text-rose-700',
};

const normalizeStatus = (value) => {
  const next = `${value || 'Draft'}`.trim().toLowerCase();
  if (next === 'scheduled' || next === 'pending') return 'Scheduled';
  if (next === 'published' || next === 'live') return 'Published';
  if (next === 'archived' || next === 'closed') return 'Archived';
  return 'Draft';
};

export const BlogList = ({ onOpenEditor, onOpenPreview, onOpenGenerate }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch blogs
  const { data: blogs = [], isLoading, isError, error } = useQuery({
    queryKey: ['blogs-list'],
    queryFn: async () => {
      const response = await api.get('/blogs');
      return response.data.data || [];
    }
  });

  // Archive / Delete Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/blogs/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs-list'] });
    }
  });

  const handleArchive = (blogId) => {
    if (window.confirm('Are you sure you want to archive this blog post?')) {
      updateStatusMutation.mutate({
        id: blogId,
        payload: { status: 'archived' }
      });
    }
  };

  // Filter logic
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const statusLabel = normalizeStatus(blog.status);
      const matchesTab = activeTab === 'All' || statusLabel === activeTab;
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        blog.title?.toLowerCase().includes(query) ||
        blog.author?.toLowerCase().includes(query) ||
        blog.keywordCategory?.toLowerCase().includes(query) ||
        blog.topicId?.topicName?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [blogs, activeTab, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset pagination when activeTab or searchQuery changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBlogs, currentPage, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading blogs directory...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card rounded-3xl p-12 border border-red-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-red-200">Failed to Load Blogs</h3>
        <p className="text-xs text-slate-400">{error.message || 'Unknown network error.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by title, category, author, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-white/5 hover:border-white/10 focus:border-primary rounded-xl text-white placeholder:text-slate-500 focus:outline-none text-xs transition-colors"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={onOpenGenerate}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-bold text-background rounded-xl shadow-glow text-xs"
        >
          <Plus size={16} />
          <span>Generate New Blog</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-white/5 gap-1 pb-px overflow-x-auto scrollbar-none">
        {['All', 'Draft', 'Scheduled', 'Published', 'Archived'].map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'All' 
            ? blogs.length 
            : blogs.filter(b => normalizeStatus(b.status) === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? 'border-primary text-primary bg-primary/5 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid List */}
      {filteredBlogs.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 border border-white/5 text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-600">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-300">No blog posts discovered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or click "Generate Aligned Blog" to synthesize your first content draft.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {paginatedBlogs.map((blog) => {
              const statusLabel = normalizeStatus(blog.status);
              const topicName = blog.topicId?.topicName;
              
              return (
                <div
                  key={blog._id}
                  className={`relative group p-5 bg-surface border-t border-b border-r border-border/40 border-l-4 ${statusColors[statusLabel] || statusColors.Draft} hover:border-border/80 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 shadow-sm`}
                >
                  <div className="space-y-3">
                    {/* Status & Date */}
                    <div className="flex justify-between items-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${badgeColors[statusLabel] || badgeColors.Draft}`}>
                        {statusLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Topic Label & Title */}
                    <div className="space-y-1.5">
                      {topicName && (
                        <span className="text-[9px] text-accent font-bold uppercase tracking-wider font-mono">
                          {topicName}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-foreground line-clamp-2 min-h-[2.5rem]" title={blog.title}>
                        {blog.title || 'Untitled Blog Post'}
                      </h3>
                    </div>

                    {/* Author / Category details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1 border-t border-border/40">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Author</span>
                        <span className="text-slate-600 truncate block">{blog.author || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Category</span>
                        <span className="text-slate-600 truncate block">{blog.keywordCategory || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid Footer Actions */}
                  <div className="border-t border-border/40 pt-4 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold">SEO Score:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        blog.seoScore >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                        blog.seoScore >= 50 ? 'bg-amber-500/10 text-amber-600' :
                        'bg-rose-500/10 text-rose-600'
                      }`}>
                        {blog.seoScore || 0}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Open Editor Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditor(blog._id);
                        }}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-background border border-primary/20 hover:border-primary rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Edit blog post"
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>

                      {/* Open Preview Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPreview(blog._id);
                        }}
                        className="px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Open Adaptations & Simulator Previews"
                      >
                        <Eye size={12} />
                        <span>Preview</span>
                      </button>

                      {/* Archive / Delete Button */}
                      {statusLabel !== 'Archived' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(blog._id);
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-200 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all cursor-pointer"
                          title="Archive post"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages >= 1 && (
            <div className="flex flex-col items-center justify-center border-t border-white/5 pt-6 gap-3">
              <div className="flex items-center gap-1.5 justify-center">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft size={14} />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  const active = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-primary to-accent text-background border-transparent shadow-glow-sm font-bold"
                          : "border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>

              <span className="text-xs text-slate-400">
                Showing <strong className="text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong className="text-white">
                  {Math.min(currentPage * itemsPerPage, filteredBlogs.length)}
                </strong>{" "}
                of <strong className="text-white">{filteredBlogs.length}</strong> posts
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
