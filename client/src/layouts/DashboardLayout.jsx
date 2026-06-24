import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  CalendarRange,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Bell,
  Sparkles,
  TrendingUp,
  Compass,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';

const SidebarItem = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-primary text-white border-l-4 border-primary font-bold shadow-glow-sm hover:scale-[1.01]'
          : 'text-slate-600 hover:text-primary hover:bg-slate-100/50'
      }`}
      style={active ? { color: '#ffffff' } : undefined}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [credits, setCredits] = useState(null);

  const fetchCredits = async () => {
    try {
      const response = await api.get('/credits/balance');
      if (response.data && response.data.success) {
        setCredits(response.data.data.creditsBalance);
      }
    } catch (err) {
      console.error('Failed to fetch credit balance:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
      
      const interval = setInterval(fetchCredits, 8000);
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]);

  // Auto open guide on very first dashboard visit for newly signed-up users only
  useEffect(() => {
    if (!user) return;

    const isNewSignup = localStorage.getItem('is-new-signup');
    const shownKey = `growth-os-tutorial-shown-${user._id}`;
    const shown = localStorage.getItem(shownKey);

    if (isNewSignup === 'true' && !shown) {
      const timer = setTimeout(() => {
        setGuideOpen(true);
        localStorage.setItem(shownKey, 'true');
        localStorage.removeItem('is-new-signup');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const tutorialSteps = [
    {
      step: 1,
      title: 'Brand Engine Setup',
      desc: 'Define your Company Profile, Audience Personas, and Knowledge Base context to ground all AI copywriting.',
      path: '/brand',
      btnText: 'Setup Brand Context',
      tabState: { activeTab: 'profile' }
    },
    {
      step: 2,
      title: 'Define Topic Context',
      desc: 'Create or select a campaign topic, target audience, and publication channels in the blog generator.',
      path: '/blogs?view=generate',
      btnText: 'Open Blog Generator'
    },
    {
      step: 3,
      title: 'Agentic SEO Research',
      desc: 'Trigger AI Market Research during generator configuration to extract SEO keywords and suggested hook angles.',
      path: '/blogs?view=generate',
      btnText: 'Start Research'
    },
    {
      step: 4,
      title: 'SEO Editor Tuning',
      desc: 'Review automated keyword checks and scorecard recommendations in the editor to optimize the copy draft.',
      path: '/blogs',
      btnText: 'Go to Blogs Studio'
    },
    {
      step: 5,
      title: 'Schedule & Publish',
      desc: 'Organize your publication queue and schedule posts across platforms using the Content Planner calendar.',
      path: '/calendar',
      btnText: 'Open Content Planner'
    }
  ];

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
    brand: 'Brand Setup',
    blogs: 'Blogs Studio',
    calendar: 'Content Planner',
    'blog-studio': 'Blog Studio',
    preview: 'Preview Center',
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
    { label: 'Brand Setup', icon: <Settings size={20} />, path: '/brand' },
    { label: 'Blogs Studio', icon: <BookOpen size={20} />, path: '/blogs' },
    { label: 'Content Planner', icon: <CalendarRange size={20} />, path: '/calendar' },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({
      label: 'Admin Control',
      icon: <Sparkles size={20} className="text-primary" />,
      path: '/admin'
    });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-card border-r border-white/5 h-screen sticky top-0">
        {/* Brand Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-glow">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-foreground">
              Growth OS
            </h1>
            <p className="text-[10px] text-primary tracking-widest uppercase font-semibold">Blog Engine</p>
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
              <TrendingUp size={18} className="text-white" />
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
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white mr-1">
              <Menu size={22} />
            </button>
            
            {/* Active page title/breadcrumbs in primary orange color, visible on all screen sizes */}
            <div className="flex items-center gap-2 text-sm font-semibold">
              {segments.length === 0 ? (
                <span className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Dashboard</span>
              ) : (
                segments.map((segment, index) => {
                  const label = getSegmentLabel(segment);
                  const path = '/' + segments.slice(0, index + 1).join('/');
                  const isLast = index === segments.length - 1;
                  const isId = /^[0-9a-fA-F]{24}$/.test(segment);
                  
                  return (
                    <React.Fragment key={path}>
                      {index > 0 && <span className="text-slate-400 text-sm px-0.5">/</span>}
                      {isLast ? (
                        <span className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight truncate max-w-[160px] sm:max-w-[320px]" title={isId ? label : undefined}>
                          {label}
                        </span>
                      ) : (
                        <span 
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-semibold" 
                          onClick={() => navigate(path)}
                        >
                          {label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Credit Balance Badge */}
            {credits !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-glow-sm">
                <Sparkles size={13} className="text-primary animate-pulse" />
                <span>{credits} Credits</span>
              </div>
            )}

            {/* Quick Start Tour Button */}
            <button
              onClick={() => {
                setCurrentSlide(0);
                setGuideOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/45 hover:bg-white/10 text-xs font-semibold text-slate-350 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <HelpCircle size={13} className="text-primary animate-pulse" />
              <span className="hidden sm:inline">Quick Start Tour</span>
            </button>

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

      {/* Onboarding Slides Modal */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0 cursor-default" onClick={() => setGuideOpen(false)} />
          
          {/* Modal Container */}
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl relative p-6 md:p-8 animate-scale-up z-10 flex flex-col text-left space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <TrendingUp size={18} />
                </div>
                 <div>
                  <h3 className="font-bold text-slate-800 text-sm">Growth OS Tour</h3>
                  <p className="text-[10px] text-slate-400">Step-by-step onboarding walkthrough</p>
                </div>
              </div>
              <button 
                onClick={() => setGuideOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slide Progress Indicator Bar */}
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden flex">
              {tutorialSteps.map((s, idx) => (
                <div 
                  key={s.step} 
                  className={`h-full flex-1 transition-all duration-300 border-r border-white last:border-0 ${
                    idx <= currentSlide ? 'bg-primary' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Slide Body Content */}
            <div className="flex-1 space-y-4 py-2 min-h-[140px] flex flex-col justify-center">
              <div className="flex items-start gap-4">
                {/* Step Number Badge */}
                <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                  {tutorialSteps[currentSlide].step}
                </span>

                <div className="space-y-1 flex-1">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest font-mono">
                    Step {tutorialSteps[currentSlide].step} of 5
                  </span>
                  <h4 className="font-extrabold text-slate-800 text-base leading-tight">
                    {tutorialSteps[currentSlide].title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {tutorialSteps[currentSlide].desc}
                  </p>
                </div>
              </div>

              {/* Action Link inside Slide */}
              <div className="pt-2 pl-14">
                <button
                  onClick={() => {
                    setGuideOpen(false);
                    navigate(tutorialSteps[currentSlide].path, { state: tutorialSteps[currentSlide].tabState });
                  }}
                  className="px-4 py-2 bg-primary text-white hover:bg-primary-dark transition-all rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] duration-150"
                >
                  <span>{tutorialSteps[currentSlide].btnText}</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-semibold hover:underline cursor-pointer"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-3">
                {/* Previous Button */}
                <button
                  type="button"
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 active:scale-[0.98] duration-150"
                >
                  Previous
                </button>

                 {/* Next / Finish Button */}
                {currentSlide < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentSlide(prev => prev + 1)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700 active:scale-[0.98] duration-150"
                    style={{ color: '#ffffff' }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGuideOpen(false);
                      setCurrentSlide(0);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background font-bold rounded-xl shadow-glow text-xs cursor-pointer"
                  >
                    Finish Tour
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardLayout;
