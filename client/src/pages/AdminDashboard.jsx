import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldAlert, 
  Coins, 
  Settings2, 
  BarChart3, 
  Plus, 
  Minus, 
  Users, 
  ArrowUpRight, 
  Cpu, 
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is not admin, redirect them
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('companies');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // States for stats and data
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState({
    defaultSignupCredits: 25,
    textGenerationCost: 1,
    imageGenerationCost: 3,
    websiteAnalysisCost: 5,
    researchAnalysisCost: 1
  });
  const [telemetry, setTelemetry] = useState({
    summary: { totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, count: 0 },
    breakdown: [],
    logs: []
  });

  // Manual allocation states
  const [selectedCompany, setSelectedCompany] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('10');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  // Settings form editing
  const [editingSettings, setEditingSettings] = useState({ ...settings });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch companies
      const companiesRes = await api.get('/credits/admin/companies');
      if (companiesRes.data && companiesRes.data.success) {
        setCompanies(companiesRes.data.data);
      }

      // Fetch settings
      const settingsRes = await api.get('/credits/admin/settings');
      if (settingsRes.data && settingsRes.data.success) {
        setSettings(settingsRes.data.data);
        setEditingSettings(settingsRes.data.data);
      }

      // Fetch telemetry
      const telemetryRes = await api.get('/telemetry/global-stats');
      if (telemetryRes.data && telemetryRes.data.success) {
        setTelemetry(telemetryRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry data:', err);
      setError(err.response?.data?.error || 'Failed to fetch admin control dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  // Handle manual credit allocation
  const handleManualAllocation = async (e) => {
    e.preventDefault();
    if (!selectedCompany) {
      setError('Please select a company to adjust credits.');
      return;
    }

    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    setSubmittingAdjustment(true);
    setError(null);
    setSuccessMsg(null);

    const actualAmount = adjustType === 'add' ? amount : -amount;

    try {
      const response = await api.post('/credits/admin/allocate', {
        companyId: selectedCompany,
        amount: actualAmount,
        note: adjustNote || `Admin manual adjustment of ${actualAmount} credits`
      });

      if (response.data && response.data.success) {
        setSuccessMsg(`Successfully adjusted credits for company. ${actualAmount > 0 ? '+' : ''}${actualAmount} credits.`);
        setAdjustAmount('10');
        setAdjustNote('');
        
        // Refresh company lists
        const companiesRes = await api.get('/credits/admin/companies');
        if (companiesRes.data && companiesRes.data.success) {
          setCompanies(companiesRes.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust company credits manually.');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Handle saving configurations
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await api.patch('/credits/admin/settings', editingSettings);
      if (response.data && response.data.success) {
        setSettings(response.data.data);
        setSuccessMsg('Global credit cost parameters updated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update credit configuration settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400">You must be logged in as an administrator to view this page.</p>
      </div>
    );
  }

  // Calculate totals
  const totalAllocated = companies.reduce((acc, c) => acc + (c.creditsTotalAllocated || 0), 0);
  const totalUsed = companies.reduce((acc, c) => acc + (c.creditsTotalUsed || 0), 0);
  const currentTotalBalance = companies.reduce((acc, c) => acc + (c.creditsBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Admin Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider font-mono">
              Admin Controller
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
            Credits &amp; AI Telemetry Center
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Monitor tenant quotas, manage credit settings, and audit global LLM token consumption metrics.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-primary/45 rounded-xl text-xs font-semibold text-slate-350 hover:text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-emerald-400 font-medium">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Stats Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="glass-card p-5 border border-white/5 hover:border-white/10 transition-all rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              Total Tenants
            </span>
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {loading ? '...' : companies.length}
            </h3>
            <p className="text-[10px] text-slate-500">Registered Companies</p>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Users size={20} />
          </div>
        </div>

        {/* Global Current Credits */}
        <div className="glass-card p-5 border border-white/5 hover:border-white/10 transition-all rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              Active Credit Pool
            </span>
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {loading ? '...' : currentTotalBalance}
            </h3>
            <p className="text-[10px] text-slate-500">Unused Company Credits</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Coins size={20} />
          </div>
        </div>

        {/* Total Allocated */}
        <div className="glass-card p-5 border border-white/5 hover:border-white/10 transition-all rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              Total Allocated
            </span>
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {loading ? '...' : totalAllocated}
            </h3>
            <p className="text-[10px] text-slate-500">Signup &amp; Manual Grants</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Plus size={20} />
          </div>
        </div>

        {/* Global Consumed Tokens */}
        <div className="glass-card p-5 border border-white/5 hover:border-white/10 transition-all rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              Global Token Burn
            </span>
            <h3 className="text-2xl font-black text-slate-100 tracking-tight truncate max-w-[150px]">
              {loading ? '...' : telemetry.summary?.totalTokens?.toLocaleString() || 0}
            </h3>
            <p className="text-[10px] text-slate-500">Prompt + Completion Tokens</p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
            <Cpu size={20} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'companies'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={14} />
          Tenant Management
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'telemetry'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 size={14} />
          Token Telemetry Logs
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 size={14} />
          Cost Configurations
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw size={24} className="animate-spin text-primary" />
          <span>Synchronizing telemetry databases...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. Tenant Management Tab */}
          {activeTab === 'companies' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Companies Table list */}
              <div className="lg:col-span-2 glass-card border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-200">Company Credit Ledgers</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                    {companies.length} Tenants Listed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 uppercase font-mono text-[9px] tracking-wider bg-white/10">
                        <th className="p-4 font-bold">Company / Website</th>
                        <th className="p-4 font-bold text-center">Credit Balance</th>
                        <th className="p-4 font-bold text-center">Allocated</th>
                        <th className="p-4 font-bold text-center">Used</th>
                        <th className="p-4 font-bold text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-500">
                            No company tenants found.
                          </td>
                        </tr>
                      ) : (
                        companies.map((c) => (
                          <tr key={c._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-slate-200">{c.name}</p>
                              {c.website ? (
                                <a 
                                  href={c.website.startsWith('http') ? c.website : `https://${c.website}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-slate-400 hover:text-primary flex items-center gap-0.5 mt-0.5 font-medium underline"
                                >
                                  {c.website}
                                  <ArrowUpRight size={10} />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500">No website registered</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded-md font-bold ${
                                (c.creditsBalance || 0) < 5 
                                  ? 'bg-red-500/10 text-red-400' 
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {c.creditsBalance || 0}
                              </span>
                            </td>
                            <td className="p-4 text-center text-slate-300 font-semibold">{c.creditsTotalAllocated || 0}</td>
                            <td className="p-4 text-center text-slate-400 font-medium">{c.creditsTotalUsed || 0}</td>
                            <td className="p-4 text-right text-slate-400 font-mono text-[10px]">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjust Credits Form */}
              <div className="glass-card p-6 border border-white/5 rounded-3xl h-fit space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-200">Adjust Credit Allocation</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Manually add or deduct credits for a tenant company document.
                  </p>
                </div>

                <form onSubmit={handleManualAllocation} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Select Tenant
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                      required
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-500">Select a company...</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id} className="bg-slate-900 text-slate-200">
                          {c.name} (Bal: {c.creditsBalance || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Adjustment Action
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustType('add')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          adjustType === 'add'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Plus size={14} />
                        Add Credits
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType('subtract')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          adjustType === 'subtract'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Minus size={14} />
                        Deduct Credits
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      min="1"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Internal Audit Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Enterprise upgrade allocation"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAdjustment}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-background font-black text-xs rounded-xl shadow-glow transition-all cursor-pointer text-center"
                  >
                    {submittingAdjustment ? 'Executing adjustment...' : 'Submit Adjust Transaction'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* 2. Token Telemetry Logs Tab */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              
              {/* Telemetry stats summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Prompt vs Completion breakdown */}
                <div className="glass-card p-5 border border-white/5 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Database size={14} className="text-teal-400" />
                    Token Split Ratio
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Prompt Tokens</span>
                        <span className="text-slate-200">
                          {((telemetry.summary.totalPromptTokens / (telemetry.summary.totalTokens || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${(telemetry.summary.totalPromptTokens / (telemetry.summary.totalTokens || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {telemetry.summary.totalPromptTokens.toLocaleString()} tokens
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Completion Tokens</span>
                        <span className="text-slate-200">
                          {((telemetry.summary.totalCompletionTokens / (telemetry.summary.totalTokens || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(telemetry.summary.totalCompletionTokens / (telemetry.summary.totalTokens || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {telemetry.summary.totalCompletionTokens.toLocaleString()} tokens
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tokens by process type */}
                <div className="md:col-span-2 glass-card p-5 border border-white/5 rounded-3xl space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-primary" />
                    Process Consumption Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {telemetry.breakdown.length === 0 ? (
                      <div className="col-span-2 text-center text-slate-500 py-6 text-xs">
                        No telemetry logs analyzed yet.
                      </div>
                    ) : (
                      telemetry.breakdown.map((b) => (
                        <div key={b._id} className="p-3 bg-white/5 rounded-2xl flex flex-col justify-between">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-250 truncate max-w-[130px] uppercase font-mono text-[10px]">
                              {b._id?.replace(/_/g, ' ') || 'General AI'}
                            </span>
                            <span className="text-slate-400 text-[10px] font-medium">{b.count} calls</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm font-black text-slate-100 font-mono">
                              {b.totalTokens?.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 block">Total Tokens</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Raw Telemetry Logs Feed */}
              <div className="glass-card border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h4 className="font-extrabold text-sm text-slate-200">Audit Stream: Recent LLM Calls</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 uppercase font-mono text-[9px] tracking-wider bg-white/10">
                        <th className="p-4 font-bold">Company</th>
                        <th className="p-4 font-bold">Process / Task</th>
                        <th className="p-4 font-bold text-center">Prompt Tokens</th>
                        <th className="p-4 font-bold text-center">Completion Tokens</th>
                        <th className="p-4 font-bold text-center">Total Tokens</th>
                        <th className="p-4 font-bold text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetry.logs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-slate-500">
                            No LLM telemetry events logged yet.
                          </td>
                        </tr>
                      ) : (
                        telemetry.logs.map((log) => (
                          <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-medium">
                            <td className="p-4">
                              <p className="font-bold text-slate-250">{log.companyId?.companyName || 'Unknown'}</p>
                            </td>
                            <td className="p-4 font-mono text-[10px] uppercase text-primary">
                              {log.processType?.replace(/_/g, ' ')}
                            </td>
                            <td className="p-4 text-center text-slate-400 font-mono">{log.promptTokens || 0}</td>
                            <td className="p-4 text-center text-slate-400 font-mono">{log.completionTokens || 0}</td>
                            <td className="p-4 text-center text-slate-200 font-bold font-mono">{log.totalTokens || 0}</td>
                            <td className="p-4 text-right text-slate-400 font-mono text-[10px]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. Cost Configurations Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto glass-card p-6 border border-white/5 rounded-3xl">
              <div>
                <h4 className="font-extrabold text-sm text-slate-200">Global Credit Cost Parameters</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Configure credit rates and starting allocations for the application's AI models.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 mt-6 text-left">
                
                {/* Default Starting Credits */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    New Registration Welcome Bonus Credits
                  </label>
                  <input
                    type="number"
                    value={editingSettings.defaultSignupCredits}
                    onChange={(e) => setEditingSettings({ ...editingSettings, defaultSignupCredits: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                    required
                  />
                  <p className="text-[10px] text-slate-500">Credits automatically granted to a newly created company profile.</p>
                </div>

                <hr className="border-white/5 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Text generation cost */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Text Generation (canonical/rendering)
                    </label>
                    <input
                      type="number"
                      value={editingSettings.textGenerationCost}
                      onChange={(e) => setEditingSettings({ ...editingSettings, textGenerationCost: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                      required
                    />
                    <p className="text-[10px] text-slate-500">Credits per canonical blog/platform render.</p>
                  </div>

                  {/* Image generation cost */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Image Generation (DALL-E)
                    </label>
                    <input
                      type="number"
                      value={editingSettings.imageGenerationCost}
                      onChange={(e) => setEditingSettings({ ...editingSettings, imageGenerationCost: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                      required
                    />
                    <p className="text-[10px] text-slate-500">Credits per AI generated image request.</p>
                  </div>

                  {/* Crawling analysis cost */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Knowledge Base URL Crawl &amp; Audit
                    </label>
                    <input
                      type="number"
                      value={editingSettings.websiteAnalysisCost}
                      onChange={(e) => setEditingSettings({ ...editingSettings, websiteAnalysisCost: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                      required
                    />
                    <p className="text-[10px] text-slate-500">Credits charged per crawl/summarize request.</p>
                  </div>

                  {/* Research analysis cost */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Topic Research Synthesis
                    </label>
                    <input
                      type="number"
                      value={editingSettings.researchAnalysisCost}
                      onChange={(e) => setEditingSettings({ ...editingSettings, researchAnalysisCost: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                      required
                    />
                    <p className="text-[10px] text-slate-500">Credits charged per topic synthesize event.</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-background font-black text-xs rounded-xl shadow-glow transition-all cursor-pointer text-center"
                  >
                    {savingSettings ? 'Saving configurations...' : 'Save Configuration Parameters'}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
