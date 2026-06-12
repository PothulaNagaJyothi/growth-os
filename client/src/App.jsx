import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Personas } from './pages/Personas';
import { Campaigns } from './pages/Campaigns';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Research } from './pages/Research';
import { BlogStudio } from './pages/BlogStudio';
import { Blogs } from './pages/Blogs';
import { QuickBlogGenerator } from './pages/QuickBlogGenerator';
import { Preview } from './pages/Preview';
import { ImageStudio } from './pages/ImageStudio';
import { Scheduler } from './pages/Scheduler';
import { ContentCalendar } from './pages/ContentCalendar';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Sparkles, Construction } from 'lucide-react';

// Protected Route Wrapper: Redirects to /login if unauthenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center animate-spin">
            <Sparkles size={24} className="text-white" />
          </div>
          <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Growth Console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Wrapper: Redirects to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center animate-spin">
            <Sparkles size={24} className="text-white" />
          </div>
          <p className="text-sm font-semibold tracking-wider text-slate-400">Loading Growth Console...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Placeholder view for future business features
const BusinessFeaturePlaceholder = ({ name }) => {
  return (
    <div className="glass-card rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
      <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
        <Construction size={40} />
      </div>
      <h3 className="text-2xl font-bold text-gradient">{name} Foundation</h3>
      <p className="text-slate-400 max-w-md text-sm">
        The database schemas, API routers, global controllers, and authentication layers for the {name} feature set are successfully configured. Real-world business integrations will attach to this interface block next.
      </p>
      <div className="pt-4 flex gap-3 text-xs">
        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300">
          API Router Configured
        </span>
        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300">
          Mongoose Schemas Mapped
        </span>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <TaskProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes wrapped in Public Route Guardians */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Secure Routes Wrapped in Auth Guardian & Dashboard Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Campaigns />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/personas"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Personas />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <KnowledgeBase />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/research"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Research />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/blog-studio/:blogId?"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BlogStudio />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/blogs"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Blogs />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quick-blog"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <QuickBlogGenerator />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/image-studio"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ImageStudio />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/preview"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Preview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/scheduler"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Scheduler />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/content-calendar"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ContentCalendar />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </TaskProvider>
    </AuthProvider>
  );
};

export default App;
