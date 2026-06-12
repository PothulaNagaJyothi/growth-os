import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Megaphone,
  Search,
  BookOpen,
  Image as ImageIcon,
  Eye,
  Calendar,
  CalendarRange,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Bell,
  Sparkles,
  FileText
} from 'lucide-react';

const SidebarItem = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-primary/15 to-accent/5 text-primary border-l-4 border-primary font-medium'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-slate-400'}>{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
};

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blogTitles, setBlogTitles] = useState({});

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const idSegment = segments.find((seg) => /^[0-9a-fA-F]{24}$/.test(seg));

    if (idSegment && !blogTitles[idSegment]) {
      const fetchBlogTitle = async () => {
        try {
          const response = await api.get(`/blogs/${idSegment}`);
          const title = response?.data?.data?.title || response?.data?.title;
          if (title) {
            setBlogTitles((prev) => ({ ...prev, [idSegment]: title }));
          }
        } catch (error) {
          console.error('Failed to fetch blog title for breadcrumbs:', error);
          setBlogTitles((prev) => ({ ...prev, [idSegment]: 'Untitled Article' }));
        }
      };
      fetchBlogTitle();
    }
  }, [location.pathname, blogTitles]);

  const pathLabelMap = {
    dashboard: 'Dashboard',
    campaigns: 'Campaigns',
    personas: 'Personas',
    knowledge: 'Knowledge Base',
    research: 'Research',
    'blog-studio': 'Blog Studio',
    blogs: 'Blogs Directory',
    'quick-blog': 'Quick Blog',
    'image-studio': 'Image Studio',
    preview: 'Preview Center',
    scheduler: 'Scheduler',
    'content-calendar': 'Content Calendar',
    settings: 'Settings',
  };

  const getSegmentLabel = (segment) => {
    if (/^[0-9a-fA-F]{24}$/.test(segment)) {
      return blogTitles[segment] || 'Loading...';
    }
    return (
      pathLabelMap[segment.toLowerCase()] ||
      segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const segments = location.pathname.split('/').filter(Boolean);

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Campaigns', icon: <Megaphone size={20} />, path: '/campaigns' },
    { label: 'Personas', icon: <User size={20} />, path: '/personas' },
    { label: 'Knowledge Base', icon: <FileText size={20} />, path: '/knowledge' },
    { label: 'Research', icon: <Search size={20} />, path: '/research' },
    { label: 'Blog Studio', icon: <BookOpen size={20} />, path: '/blog-studio' },
    { label: 'Blogs Directory', icon: <FileText size={20} />, path: '/blogs' },
    { label: 'Quick Blog', icon: <Sparkles size={20} />, path: '/quick-blog' },
    { label: 'Image Studio', icon: <ImageIcon size={20} />, path: '/image-studio' },
    { label: 'Preview Center', icon: <Eye size={20} />, path: '/preview' },
    { label: 'Scheduler', icon: <Calendar size={20} />, path: '/scheduler' },
    { label: 'Content Calendar', icon: <CalendarRange size={20} />, path: '/content-calendar' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-white overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-card border-r border-white/5 h-screen sticky top-0">
        {/* Brand Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-glow">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              Growth OS
            </h1>
            <p className="text-[10px] text-primary tracking-widest uppercase font-semibold">Content Engine</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <User size={18} className="text-accent" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar for Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar for Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 glass-card border-r border-white/5 z-50 transform lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col h-full`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-glow">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg">Growth OS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <User size={18} className="text-accent" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu size={24} />
          </button>

          {/* Left space for title/breadcrumbs */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400 hover:text-white transition-colors cursor-pointer font-medium" onClick={() => navigate('/dashboard')}>
              Growth OS
            </span>
            {segments.map((segment, index) => {
              const label = getSegmentLabel(segment);
              const path = '/' + segments.slice(0, index + 1).join('/');
              const isLast = index === segments.length - 1;
              const isId = /^[0-9a-fA-F]{24}$/.test(segment);
              
              return (
                <React.Fragment key={path}>
                  <span className="text-slate-600">/</span>
                  {isLast ? (
                    <span className="text-primary font-medium truncate max-w-[240px]" title={isId ? label : undefined}>
                      {label}
                    </span>
                  ) : (
                    <span 
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer font-medium" 
                      onClick={() => navigate(path)}
                    >
                      {label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-sm shadow-glow text-background">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-sm font-medium truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
