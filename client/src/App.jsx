import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BrandSetup } from './pages/BrandSetup';
import { TopicsHub } from './pages/TopicsHub';
import { PlannerHub } from './pages/PlannerHub';
import { BlogStudio } from './pages/BlogStudio';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Sparkles } from 'lucide-react';

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

export const App = () => {
  return (
    <AuthProvider>
      <TaskProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
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

            {/* Secure Consolidated Hub Routes */}
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
              path="/brand"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BrandSetup />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/topics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TopicsHub />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/blogs"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BlogStudio />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PlannerHub />
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
