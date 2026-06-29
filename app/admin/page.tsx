'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getTrafficLogs, 
  getAffiliateClicks, 
  seedDemoData, 
  clearLogs 
} from '@/src/lib/firestoreService';
import AventurLogo from '@/src/components/AventurLogo';
import { 
  Compass, 
  Lock, 
  Database, 
  Trash2, 
  RotateCw, 
  Users, 
  MousePointer, 
  DollarSign, 
  TrendingUp, 
  Globe, 
  Laptop, 
  ArrowUpRight, 
  Check, 
  AlertCircle,
  LogOut,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Smartphone,
  TabletIcon,
  RefreshCw,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Country flag utility
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === 'UN' || countryCode === 'Unknown') return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Data states
  const [trafficLogs, setTrafficLogs] = useState<any[]>([]);
  const [clickLogs, setClickLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'clicks' | 'traffic'>('clicks');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-refresh timer state
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Authenticate checks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthed = sessionStorage.getItem('aventur_admin_authed');
      if (isAuthed === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aventur_admin_authed', 'true');
      }
    } else {
      setAuthError('Access Denied. Invalid Admin Security Key.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aventur_admin_authed');
    }
  };

  // Fetch data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const traffic = await getTrafficLogs(100);
      const clicks = await getAffiliateClicks(150);
      setTrafficLogs(traffic);
      setClickLogs(clicks);
    } catch (err) {
      console.error('Error fetching admin logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Poll for updates if auto-refresh is active
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();

    let intervalId: NodeJS.Timeout;
    if (isAutoRefresh) {
      intervalId = setInterval(() => {
        fetchData(true); // silent update
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, isAutoRefresh, fetchData]);

  // Seed handler
  const handleSeed = async () => {
    setActionLoading(true);
    setSuccessMsg('');
    try {
      await seedDemoData();
      setSuccessMsg('Demo data successfully seeded. Recalculating charts...');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Seeding failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Clear handler
  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all traffic and click history logs? This cannot be undone.')) return;
    setActionLoading(true);
    setSuccessMsg('');
    try {
      await clearLogs();
      setSuccessMsg('All logs purged successfully.');
      setTrafficLogs([]);
      setClickLogs([]);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Purging failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Data timeframe filter state
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('all');

  // Filter logs by timeframe helper
  const getFilteredLogs = useCallback(<T extends { timestamp: string }>(logs: T[]): T[] => {
    if (timeframe === 'all') return logs;
    const now = new Date().getTime();
    let limitMs = 0;
    if (timeframe === '24h') limitMs = 24 * 60 * 60 * 1000;
    else if (timeframe === '7d') limitMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeframe === '30d') limitMs = 30 * 24 * 60 * 60 * 1000;
    
    return logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return now - logTime <= limitMs;
    });
  }, [timeframe]);

  const filteredTraffic = getFilteredLogs(trafficLogs);
  const filteredClicks = getFilteredLogs(clickLogs);

  // CSV download helper
  const downloadCSV = (data: any[], filename: string, headers: string[], rowMapper: (item: any) => string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(item => rowMapper(item).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export traffic logs to CSV
  const exportTrafficCSV = () => {
    downloadCSV(
      filteredTraffic,
      `aventur_traffic_report_${timeframe}_${Date.now()}.csv`,
      ['Timestamp', 'User ID', 'Referrer', 'Source', 'Device', 'Country', 'Country Code', 'City', 'Path'],
      (log) => [log.timestamp, log.userId, log.referrer, log.source, log.device, log.country, log.countryCode, log.city, log.path]
    );
    setSuccessMsg('Traffic CSV report downloaded.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Export click logs to CSV
  const exportClicksCSV = () => {
    downloadCSV(
      filteredClicks,
      `aventur_revenue_report_${timeframe}_${Date.now()}.csv`,
      ['Timestamp', 'Brand', 'Category/Type', 'Destination City', 'Simulated Payout', 'Sub ID', 'Destination Link'],
      (click) => [click.timestamp, click.brand, click.travelType, click.destinationCity, click.payout, click.subId, click.dest]
    );
    setSuccessMsg('Revenue Click CSV report downloaded.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Calculate metrics based on filtered logs
  const totalRevenue = filteredClicks.reduce((acc, curr) => acc + (curr.payout || 0), 0);
  const totalLeads = filteredClicks.length;
  const totalTraffic = filteredTraffic.length;
  const epc = totalLeads > 0 ? totalRevenue / totalLeads : 0;

  // Grouping helpers
  // 1. Referrer / Source distribution
  const sourceStats = filteredTraffic.reduce((acc: Record<string, number>, log) => {
    const src = log.source || 'Direct';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sortedSources = (Object.entries(sourceStats) as [string, number][])
    .map(([source, count]) => ({ source, count, percentage: totalTraffic > 0 ? (count / totalTraffic) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);

  // 2. Devices distribution
  const deviceStats = filteredTraffic.reduce((acc: Record<string, number>, log) => {
    const dev = log.device || 'Desktop';
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {});
  const deviceList = (Object.entries(deviceStats) as [string, number][]).map(([device, count]) => ({
    device,
    count,
    percentage: totalTraffic > 0 ? (count / totalTraffic) * 100 : 0
  }));

  // 3. Top Countries
  const countryStats = filteredTraffic.reduce((acc: Record<string, { count: number; code: string }>, log) => {
    const countryName = log.country || 'Unknown';
    const code = log.countryCode || 'UN';
    if (!acc[countryName]) {
      acc[countryName] = { count: 0, code };
    }
    acc[countryName].count += 1;
    return acc;
  }, {});
  const sortedCountries = (Object.entries(countryStats) as [string, { count: number; code: string }][])
    .map(([name, data]) => ({ name, code: data.code, count: data.count, percentage: totalTraffic > 0 ? (data.count / totalTraffic) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Top Cities
  const cityStats = filteredTraffic.reduce((acc: Record<string, { count: number; code: string }>, log) => {
    const city = log.city || 'Unknown';
    const code = log.countryCode || 'UN';
    const key = `${city}, ${code}`;
    if (!acc[key]) {
      acc[key] = { count: 0, code };
    }
    acc[key].count += 1;
    return acc;
  }, {});
  const sortedCities = (Object.entries(cityStats) as [string, { count: number; code: string }][])
    .map(([key, data]) => {
      const [cityName] = key.split(', ');
      return { city: cityName, countryCode: data.code, count: data.count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Affiliate program grid
  const brandStats = filteredClicks.reduce((acc: Record<string, { clicks: number; revenue: number }>, click) => {
    const b = click.brand || 'Others';
    if (!acc[b]) {
      acc[b] = { clicks: 0, revenue: 0 };
    }
    acc[b].clicks += 1;
    acc[b].revenue += (click.payout || 0);
    return acc;
  }, {});
  
  const initialBrands = ['Skyscanner', 'Booking.com', 'Viator', 'Yelp'];
  const brandStatsTyped = brandStats as Record<string, { clicks: number; revenue: number }>;
  const programPerformanceList = [
    ...initialBrands.map(b => ({
      brand: b,
      clicks: brandStatsTyped[b]?.clicks || 0,
      revenue: brandStatsTyped[b]?.revenue || 0,
      epc: (brandStatsTyped[b]?.clicks || 0) > 0 ? (brandStatsTyped[b]?.revenue || 0) / (brandStatsTyped[b]?.clicks || 0) : 0
    })),
    // Group remaining brands into Others
    (() => {
      const otherClicks = (Object.entries(brandStatsTyped) as [string, { clicks: number; revenue: number }][])
        .filter(([b]) => !initialBrands.includes(b))
        .reduce((sum, [, data]) => sum + data.clicks, 0);
      const otherRevenue = (Object.entries(brandStatsTyped) as [string, { clicks: number; revenue: number }][])
        .filter(([b]) => !initialBrands.includes(b))
        .reduce((sum, [, data]) => sum + data.revenue, 0);
      return {
        brand: 'Others',
        clicks: otherClicks,
        revenue: otherRevenue,
        epc: otherClicks > 0 ? otherRevenue / otherClicks : 0
      };
    })()
  ].sort((a, b) => b.revenue - a.revenue);

  // Copy analytics summary report to clipboard
  const copySummaryToClipboard = () => {
    const timeLabel = timeframe === '24h' ? 'Last 24 Hours' : timeframe === '7d' ? 'Last 7 Days' : timeframe === '30d' ? 'Last 30 Days' : 'All Time';
    const topCountry = sortedCountries[0] ? `${sortedCountries[0].name} (${sortedCountries[0].count} visits)` : 'N/A';
    const topSource = sortedSources[0] ? `${sortedSources[0].source} (${sortedSources[0].count} views)` : 'N/A';
    
    const summaryText = `📊 Aventur Analytics Report (${timeLabel})
----------------------------------------
Gross Revenue: $${totalRevenue.toFixed(2)}
Lead Referrals: ${totalLeads} clicks
Total Site Traffic: ${totalTraffic} views
Earnings Per Click (EPC): $${epc.toFixed(2)}

Top Country: ${topCountry}
Top Entry Channel: ${topSource}

Report Generated on: ${new Date().toLocaleString()}
----------------------------------------
Generated via Aventur Admin Portal`;

    navigator.clipboard.writeText(summaryText);
    setSuccessMsg('Analytics summary copied to clipboard! You can now paste and share it.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (!isAuthenticated) {

    return (
      <div 
        className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans"
        id="admin-login-viewport"
      >
        <title>Admin Access Desk — Aventur</title>
        
        {/* Glow circles in background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[128px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <AventurLogo onlyIcon={true} size="lg" />
            <div className="space-y-1">
              <h1 className="text-2xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Aventur Admin Portal
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">
                Decoupled Analytics Control
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" id="form-admin-login">
            <div className="space-y-2">
              <label 
                htmlFor="admin-password-input" 
                className="block text-xs font-bold text-slate-350 tracking-wide uppercase"
              >
                Security Key
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type="password"
                  placeholder="Enter administrator passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-xl text-xs"
                id="admin-auth-error"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{authError}</span>
              </motion.div>
            )}

            <button
              id="btn-admin-login-submit"
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-550 hover:to-blue-450 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-550/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              Access Command Desk
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-[10px] text-slate-500 font-medium">
              Authorized personnel only. Sessions are audited and logged.
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="admin-dashboard-viewport">
      <title>Admin Control Desk — Aventur</title>

      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-950/20 to-transparent pointer-events-none" />

      {/* Outer wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <AventurLogo onlyIcon={true} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-extrabold tracking-tight">Admin Control Desk</h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Affiliate & Traffic Hub</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Auto refresh toggle */}
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isAutoRefresh 
                  ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle automatic pulling of logs every 5 seconds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefresh ? 'animate-spin-slow' : ''}`} />
              <span>{isAutoRefresh ? 'Auto Live: ON' : 'Auto Live: OFF'}</span>
            </button>

            {/* Refresh button */}
            <button
              id="btn-admin-refresh"
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg border border-slate-700 cursor-pointer disabled:opacity-50 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Logout button */}
            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              className="px-3.5 py-2 bg-red-950/40 hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded-lg border border-red-900/50 cursor-pointer transition flex items-center gap-1.5 text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Controls Toolbar: Time Filter & Exports */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Timeframe:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-850">
              <button
                onClick={() => setTimeframe('24h')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeframe === '24h' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setTimeframe('7d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeframe === '7d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeframe('30d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeframe === '30d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeframe === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Copy report summary */}
            <button
              onClick={copySummaryToClipboard}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Copy formatted text report of active insights to clipboard"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Report Summary</span>
            </button>

            {/* Export Traffic CSV */}
            <button
              onClick={exportTrafficCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Download CSV report of page traffic entries"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Traffic CSV</span>
            </button>

            {/* Export Clicks CSV */}
            <button
              onClick={exportClicksCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Download CSV report of affiliate outbound clicks"
            >
              <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Revenue CSV</span>
            </button>
          </div>
        </div>

        {/* Global notification message banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 p-4 rounded-xl flex items-center gap-3 text-xs"
              id="admin-alert-banner"
            >
              <Check className="w-4 h-4 shrink-0 text-emerald-450" />
              <span className="font-medium">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Scorecard Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-grid">
          {/* Card 1: Gross Revenue */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-slate-450 uppercase tracking-wider">Gross Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-450 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight block">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">Simulated affiliate commission</span>
            </div>
          </div>

          {/* Card 2: Lead Referrals */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-slate-455 uppercase tracking-wider">Lead Referrals</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-450 flex items-center justify-center">
                <MousePointer className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight block">
                {totalLeads}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">Outgoing booking click events</span>
            </div>
          </div>

          {/* Card 3: Total Visitors */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-slate-450 uppercase tracking-wider">Total Traffic</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-450 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight block">
                {totalTraffic}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">Site visitor session views</span>
            </div>
          </div>

          {/* Card 4: Average EPC */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-slate-450 uppercase tracking-wider">Earnings Per Lead</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-450 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight block">
                ${epc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">Average revenue generated per click</span>
            </div>
          </div>
        </section>

        {/* Traffic Sources & Device Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Referrers Panel */}
          <section className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-blue-500" />
                <h3 className="text-sm font-display font-extrabold">Referrer Entry Channels</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Distribution Share</span>
            </div>

            {sortedSources.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                No visitor traffic logged yet. Try seeding.
              </div>
            ) : (
              <div className="space-y-3.5">
                {sortedSources.slice(0, 5).map((item, idx) => {
                  // Progress color based on referrer rank or source type
                  let colorClass = 'bg-blue-600';
                  if (item.source.toLowerCase().includes('google')) colorClass = 'bg-emerald-500';
                  else if (item.source.toLowerCase().includes('twitter') || item.source.toLowerCase().includes('x.com')) colorClass = 'bg-sky-400';
                  else if (item.source.toLowerCase().includes('product')) colorClass = 'bg-orange-500';
                  else if (idx === 0) colorClass = 'bg-indigo-600';
                  
                  return (
                    <div key={item.source} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-300">{item.source}</span>
                        <span className="text-slate-400 font-mono">
                          {item.count} views ({item.percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-850 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Device Distribution Panel */}
          <section className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4.5 h-4.5 text-emerald-500" />
                <h3 className="text-sm font-display font-extrabold">Device & Platform Split</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Browser User-Agents</span>
            </div>

            {deviceList.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                No device log details. Try seeding.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horizontal split segment bar */}
                <div className="w-full h-4 bg-slate-850 rounded-full overflow-hidden flex">
                  {deviceList.map((item, idx) => {
                    const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500'];
                    return (
                      <div 
                        key={item.device}
                        className={`${colors[idx % colors.length]} h-full first:rounded-l-full last:rounded-r-full`}
                        style={{ width: `${item.percentage}%` }}
                        title={`${item.device}: ${item.percentage.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {deviceList.map((item, idx) => {
                    const textColors = ['text-indigo-400', 'text-emerald-400', 'text-amber-400'];
                    const dotColors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500'];
                    const icons = [
                      <Laptop key="lap" className="w-3.5 h-3.5 shrink-0" />,
                      <Smartphone key="phn" className="w-3.5 h-3.5 shrink-0" />,
                      <TabletIcon key="tab" className="w-3.5 h-3.5 shrink-0" />
                    ];

                    return (
                      <div key={item.device} className="bg-slate-900/50 border border-slate-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{item.device}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-sm font-bold text-slate-200 mt-1">
                          {icons[item.device === 'Desktop' ? 0 : (item.device === 'Mobile' ? 1 : 2)]}
                          <span>{item.percentage.toFixed(0)}%</span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-500 font-mono">{item.count} sessions</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Geographic Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Countries List */}
          <section className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-purple-500" />
                <h3 className="text-sm font-display font-extrabold">Top Visitor Countries</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Geography</span>
            </div>

            {sortedCountries.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                No location history recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-850">
                {sortedCountries.map((country, idx) => (
                  <div key={country.name} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none select-none shrink-0">
                        {getFlagEmoji(country.code)}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-350">{country.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-wider">{country.code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-200 font-mono block">{country.count} visits</span>
                      <span className="text-[9px] text-slate-400 font-medium font-mono">{country.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Cities List */}
          <section className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="text-sm font-display font-extrabold">Top Cities</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Metro Areas</span>
            </div>

            {sortedCities.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                No city coordinates logged.
              </div>
            ) : (
              <div className="divide-y divide-slate-850">
                {sortedCities.map((city, idx) => (
                  <div key={`${city.city}-${idx}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-450 flex items-center justify-center font-bold text-[10px] font-mono select-none">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-300">{city.city}</span>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-wider">Region code: {city.countryCode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200 font-mono">{city.count} leads</span>
                      <span className="text-xl leading-none select-none">{getFlagEmoji(city.countryCode)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Affiliate Programs Performance Grid Table */}
        <section className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-blue-500" />
              <h3 className="text-sm font-display font-extrabold">Affiliate Programs Performance</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-850 px-2 py-1 rounded-md">Simulated Network</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider font-mono">
                  <th className="py-3 px-5">Partner Program</th>
                  <th className="py-3 px-5 text-right">Referral Click Leads</th>
                  <th className="py-3 px-5 text-right">Conversion Leads (Sim)</th>
                  <th className="py-3 px-5 text-right">Simulated Payout</th>
                  <th className="py-3 px-5 text-right">Program EPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {programPerformanceList.map((prog) => {
                  const conversions = Math.round(prog.clicks * 0.12); // Simulated conversion rate (approx 12%)
                  return (
                    <tr key={prog.brand} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-5 font-bold text-slate-200">{prog.brand}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-350">{prog.clicks}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-400">{conversions}</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-emerald-400">
                        ${prog.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-slate-400">
                        ${prog.epc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Logs Stream Tabs */}
        <section className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col min-h-[350px]">
          {/* Tabs header */}
          <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                id="btn-admin-tab-clicks"
                onClick={() => setActiveTab('clicks')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'clicks' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Affiliate Clicks Stream ({filteredClicks.length})</span>
              </button>

              <button
                id="btn-admin-tab-traffic"
                onClick={() => setActiveTab('traffic')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'traffic' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Visitor Traffic Stream ({filteredTraffic.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              <span>Real-time feeds auto updating</span>
            </div>
          </div>

          {/* Logs feed list */}
          <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {activeTab === 'clicks' ? (
                filteredClicks.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                    No clicks logged yet. Click outbound links in traveler view or click "Seed Demo Data".
                  </div>
                ) : (
                  filteredClicks.map((click) => {
                    const displayTime = new Date(click.timestamp).toLocaleTimeString();
                    return (
                      <motion.div
                        key={click.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-slate-900/60 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                              {click.brand}
                            </span>
                            <span className="text-slate-450 font-medium">
                              → Destination: <span className="font-semibold text-slate-200">{click.destinationCity}</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              Type: {click.travelType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 truncate max-w-lg">
                            <span className="font-mono text-[10px]">SubID: {click.subId}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-emerald-400 font-bold block font-mono text-sm">
                              +${(click.payout || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">{displayTime}</span>
                          </div>
                          
                          <a
                            href={click.dest}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
                            title="Open target referral redirect link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </motion.div>
                    );
                  })
                )
              ) : (
                filteredTraffic.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                    No traffic logged yet.
                  </div>
                ) : (
                  filteredTraffic.map((log) => {
                    const displayTime = new Date(log.timestamp).toLocaleTimeString();
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-slate-900/60 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-lg select-none leading-none">
                              {getFlagEmoji(log.countryCode)}
                            </span>
                            <span className="font-bold text-slate-200">
                              {log.city || 'Unknown'}, {log.country || 'Unknown'}
                            </span>
                            <span className="text-slate-500">
                              via <span className="font-medium text-slate-400">{log.source}</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[10px] bg-slate-850 px-1.5 py-0.5 rounded">
                              {log.device}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[10px] truncate max-w-lg">
                            <span>Referrer: {log.referrer}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-slate-400 font-medium block">
                            Visited: <span className="font-mono">{log.path}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">{displayTime}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Demo Operations & Maintenance Panel */}
        <section className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4.5 h-4.5 text-blue-500" />
            <h3 className="text-sm font-display font-extrabold">Demo Seeder & Sandboxed Database Controls</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            To prepare or run high-fidelity simulations during live presentations, use the seed controls to simulate full traffic loops, geographic distributions, and affiliate click actions across the system. 
          </p>

          <div className="flex items-center flex-wrap gap-3 pt-2">
            {/* Seed Demo Data Button */}
            <button
              id="btn-admin-seed"
              onClick={handleSeed}
              disabled={actionLoading || loading}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-550 hover:to-indigo-550 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{actionLoading ? 'Writing Sandboxes...' : 'Seed Demo Data'}</span>
            </button>

            {/* Clear Logs Button */}
            <button
              id="btn-admin-clear"
              onClick={handleClear}
              disabled={actionLoading || loading}
              className="px-4 py-2.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded-xl border border-red-900/50 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer font-bold text-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>{actionLoading ? 'Purging collections...' : 'Wipe Database Logs'}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
