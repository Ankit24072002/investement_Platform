import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, BriefcaseBusiness, Coins, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import api from '../services/api';

const demo = {
  user: {
    fullName: 'Demo Investor',
    email: 'demo@example.com',
    referralCode: 'DEV-ONLY',
    walletBalance: 0,
    totalROIEarned: 0,
    totalLevelIncomeEarned: 0,
  },
  summary: {
    totalInvestments: 0,
    totalROIEarned: 0,
    totalLevelIncomeEarned: 0,
    walletBalance: 0,
  },
  investments: [],
  roiHistory: [],
  referralHistory: [],
};

const createEmptyDashboardState = () => ({
  user: {
    fullName: '',
    email: '',
    referralCode: '',
    walletBalance: 0,
    totalROIEarned: 0,
    totalLevelIncomeEarned: 0,
  },
  summary: {
    totalInvestments: 0,
    totalROIEarned: 0,
    totalLevelIncomeEarned: 0,
    walletBalance: 0,
  },
  investments: [],
  roiHistory: [],
  referralHistory: [],
});

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function DashboardPage() {
  const [data, setData] = useState(createEmptyDashboardState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const { data: response } = await api.get('/dashboard/summary');
        const payload = response?.data || response || {};
        setData({
          user: payload.user || demo.user,
          summary: payload.summary || demo.summary,
          investments: payload.investments || demo.investments,
          roiHistory: payload.roiHistory || demo.roiHistory,
          referralHistory: payload.referralHistory || demo.referralHistory,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard data.');
        if (import.meta.env.DEV) {
          setData(demo);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(
    () => (data.roiHistory || []).map((entry) => ({
      name: entry.date ? new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A',
      roi: Number(entry.roiAmount || 0),
    })),
    [data.roiHistory]
  );

  const totalInvestments = Number(data.summary?.totalInvestments || data.user?.totalInvestments || 0);
  const totalROIEarned = Number(data.summary?.totalROIEarned || data.user?.totalROIEarned || 0);
  const totalLevelIncomeEarned = Number(data.summary?.totalLevelIncomeEarned || data.user?.totalLevelIncomeEarned || 0);
  const walletBalance = Number(data.summary?.walletBalance || data.user?.walletBalance || 0);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-300">Portfolio overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Financial dashboard</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 shadow-[0_14px_28px_rgba(15,23,42,0.3)]">
          <Sparkles size={14} className="text-blue-300" />
          Welcome back, <span className="font-semibold text-white">{data.user?.fullName || 'Investor'}</span>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">{error}</div>}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Investments" value={formatCurrency(totalInvestments)} helper="Portfolio value" accent="blue" trend="+12.4%" />
        <StatCard title="Daily ROI" value={formatCurrency(totalROIEarned)} helper="Current yield" accent="green" trend="+8.2%" />
        <StatCard title="Level Income" value={formatCurrency(totalLevelIncomeEarned)} helper="Referral rewards" accent="purple" trend="+5.6%" />
        <StatCard title="Wallet Balance" value={formatCurrency(walletBalance)} helper="Available funds" accent="slate" trend="+2.3%" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="premium-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">ROI performance</h2>
                <p className="text-sm text-slate-400">Yield over recent activity</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              <ArrowUpRight size={12} /> Positive trend
            </span>
          </div>

          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -16, right: 8, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roiFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid rgba(148,163,184,0.18)',
                      borderRadius: 14,
                      color: '#f8fafc',
                    }}
                    formatter={(value) => [formatCurrency(value), 'ROI']}
                  />
                  <Area type="monotone" dataKey="roi" stroke="#60a5fa" fill="url(#roiFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-panel">No ROI data available yet.</div>
            )}
          </div>
        </div>

        <div className="premium-card">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Quick summary</h2>
              <p className="text-sm text-slate-400">Key portfolio metrics</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/55 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Referral code</div>
              <div className="mt-2 text-2xl font-semibold text-white">{data.user?.referralCode || 'N/A'}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/55 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Wallet</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(walletBalance)}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/55 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Total ROI</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totalROIEarned)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="premium-card">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Investment history</h2>
              <p className="text-sm text-slate-400">Latest portfolio entries</p>
            </div>
          </div>

          <div className="space-y-3">
            {(data.investments || []).length ? (
              (data.investments || []).map((investment, index) => (
                <div key={index} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                  <div>
                    <div className="font-medium text-white">{investment.planDetails || 'Investment'}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{investment.status || 'active'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{formatCurrency(investment.amount)}</div>
                    <div className="text-xs text-slate-400">ROI: {investment.dailyROIPercentage || investment.dailyROI || 0}%</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-panel">No investments yet.</div>
            )}
          </div>
        </div>

        <div className="premium-card">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Referral income</h2>
              <p className="text-sm text-slate-400">Latest commission activity</p>
            </div>
          </div>

          <div className="space-y-3">
            {(data.referralHistory || []).length ? (
              (data.referralHistory || []).map((entry, index) => (
                <div key={index} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                  <div>
                    <div className="font-medium text-white">Level {entry.level || 1}</div>
                    <div className="mt-1 text-xs text-slate-400">{entry.date ? new Date(entry.date).toLocaleDateString() : 'Recent activity'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-300">{formatCurrency(entry.amount)}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">{entry.status || 'credited'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-panel">No referral income yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
