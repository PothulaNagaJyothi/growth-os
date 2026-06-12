import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Building, AlertCircle } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Validation / Loading States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Name Validation
    if (!name.trim()) {
      errors.name = 'Full name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Email Validation
    if (!email) {
      errors.email = 'Email address is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    // Password Validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Company Validation
    if (!companyName.trim()) {
      errors.companyName = 'Company name is required';
      isValid = false;
    } else if (companyName.trim().length < 2) {
      errors.companyName = 'Company name must be at least 2 characters';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(name, email, password, companyName);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background visual flares */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Register panel */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-4 shadow-glow">
            <Sparkles size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center tracking-tight text-white">
            Create your Account
          </h2>
          <p className="text-sm text-slate-400 mt-1 text-center">
            Set up your multi-platform growth engine
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
            <AlertCircle size={20} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={18} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`w-full pl-10 pr-4 py-2.5 bg-background/60 border rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 ${
                  fieldErrors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'
                }`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle size={10} />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Company Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Building size={18} />
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme SaaS"
                className={`w-full pl-10 pr-4 py-2.5 bg-background/60 border rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 ${
                  fieldErrors.companyName ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'
                }`}
              />
            </div>
            {fieldErrors.companyName && (
              <p className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle size={10} />
                {fieldErrors.companyName}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-background/60 border rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 ${
                  fieldErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle size={10} />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className={`w-full pl-10 pr-4 py-2.5 bg-background/60 border rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 ${
                  fieldErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle size={10} />
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-background font-bold rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 mt-4 text-sm"
          >
            {loading ? 'Setting up Profile...' : 'Create Account'}
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="text-primary hover:underline font-semibold"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
