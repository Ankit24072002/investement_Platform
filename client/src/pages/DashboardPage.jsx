import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Coins,
  GitBranch,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import DashboardHistoryTable from '../components/dashboard/DashboardHistoryTable';
import DashboardReferralTree from '../components/dashboard/DashboardReferralTree';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const initialData = {
  user: null,
  summary: null,
  investments: [],
  roiHistory: [],
  referralHistory: [],
  referralTree: null,
  earningsTrend: [],
};

const initialErrors = {
  summary: '',
  investments: '',
  roiHistory: '',
  referralHistory: '',
  referralTree: '',
  earningsTrend: '',
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currency.format(Number(value) || 0);
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : '—';
const unwrap = (response) => response?.data?.data ?? response?.data ?? {};
const getRows = (payload, fallbackKey) =>
  Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.[fallbackKey]) ? payload[fallbackKey] : [];

function StatusBadge({ status }) {
  const normalized = String(status || 'active').toLowerCase();
  const styles = {
    active: 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300',
    credited: 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300',
    completed: 'border-blue-300/15 bg-blue-300/[0.07] text-blue-200',
    pending: 'border-amber-300/15 bg-amber-300/[0.07] text-amber-200',
    cancelled: 'border-slate-400/15 bg-slate-400/[0.06] text-slate-400',
    failed: 'border-rose-400/15 bg-rose-400/[0.06] text-rose-300',
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold capitalize ${styles[normalized] || styles.active}`}>
      {normalized}
    </span>
  );
}

function SectionHeading({ icon: Icon, title, description, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-blue-300/10 bg-blue-300/[0.06] text-blue-200">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rangeDays, setRangeDays] = useState(30);
  const loadRequestId = useRef(0);

  const loadDashboard = useCallback(async ({ background = false, days = rangeDays } = {}) => {
    const requestId = ++loadRequestId.current;
    if (background) setRefreshing(true);
    else setLoading(true);

    const requests = [
      ['summary', api.get('/dashboard/summary')],
      ['investments', api.get('/investments?page=1&limit=6')],
      ['roiHistory', api.get('/roi/history?page=1&limit=6')],
      ['referralHistory', api.get('/referrals/income?page=1&limit=6')],
      ['referralTree', api.get('/referrals/tree')],
      ['earningsTrend', api.get(`/dashboard/earnings-trend?days=${days}`)],
    ];
    const results = await Promise.allSettled(requests.map(([, request]) => request));
    const nextData = {};
    const nextErrors = {};

    results.forEach((result, index) => {
      const key = requests[index][0];
      if (result.status === 'rejected') {
        const label = {
          roiHistory: 'ROI history',
          referralHistory: 'referral income',
          referralTree: 'referral network',
          earningsTrend: 'earnings chart',
        }[key] || key;
        nextErrors[key] = result.reason?.response?.data?.message || `Unable to load ${label}.`;
        return;
      }

      const payload = unwrap(result.value);
      nextErrors[key] = '';
      if (key === 'summary') {
        nextData.user = payload.user ?? null;
        nextData.summary = payload.summary ?? null;
      } else if (key === 'investments') {
        nextData.investments = getRows(payload, 'investments');
      } else if (key === 'roiHistory') {
        nextData.roiHistory = getRows(payload, 'history');
      } else if (key === 'referralHistory') {
        nextData.referralHistory = getRows(payload, 'referralHistory');
      } else if (key === 'referralTree') {
        nextData.referralTree = payload.tree || null;
      } else if (key === 'earningsTrend') {
        nextData.earningsTrend = Array.isArray(payload.trend) ? payload.trend : [];
      }
    });

    if (requestId !== loadRequestId.current) return;
    setData((current) => ({ ...current, ...nextData }));
    setErrors((current) => ({ ...current, ...nextErrors }));
    setLoading(false);
    setRefreshing(false);
  }, [rangeDays]);

  useEffect(() => {
    loadDashboard({ days: rangeDays });
    return () => {
      loadRequestId.current += 1;
    };
  }, [loadDashboard, rangeDays]);

  const chartData = useMemo(
    () =>
      data.earningsTrend.map((entry) => ({
          date: entry.date
            ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${entry.date}T00:00:00Z`))
            : '—',
          roi: Number(entry.roiIncome || 0),
          referralIncome: Number(entry.referralIncome || 0),
          investmentVolume: Number(entry.investmentVolume || 0),
        })),
    [data.earningsTrend]
  );
  const earningsTrend = useMemo(
    () =>
      data.earningsTrend.map((entry) => ({
        ...entry,
        label: entry.date
          ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${entry.date}T00:00:00Z`))
          : '—',
      })),
    [data.earningsTrend]
  );

  const summary = data.summary;
  const metric = (value) => (summary && value != null ? formatCurrency(value) : '—');
  const investmentPerformance = useMemo(
    () =>
      data.investments.map((investment) => {
        const principal = Number(investment.amount || 0);
        const roiEarned = Number(investment.totalROIGenerated || 0);
        return {
          name: investment.planName || investment.planDetails || `Investment ${String(investment._id || '').slice(-5)}`,
          principal,
          roiYieldPercent: principal > 0 ? (roiEarned / principal) * 100 : 0,
        };
      }),
    [data.investments]
  );
  const investmentById = useMemo(
    () => new Map(data.investments.map((item) => [String(item._id || item.id), item])),
    [data.investments]
  );

  const investmentColumns = [
    {
      key: 'planName',
      label: 'Investment',
      render: (_, row) => (
        <span className="block min-w-28">
          <span className="block truncate font-medium text-slate-200">{row.planName || row.planDetails || 'Investment'}</span>
          <span className="mt-1 block text-[10px] text-slate-600">ID · {String(row._id || row.id || '').slice(-7) || '—'}</span>
        </span>
      ),
    },
    { key: 'amount', label: 'Amount', render: (amount) => <span className="font-medium text-slate-200">{formatCurrency(amount)}</span> },
    { key: 'dailyROI', label: 'Daily ROI', render: (_, row) => `${Number(row.dailyROIPercentage ?? row.dailyROI ?? 0)}%` },
    {
      key: 'startDate',
      label: 'Period',
      render: (_, row) => <span className="whitespace-nowrap text-slate-400">{formatDate(row.startDate)} – {formatDate(row.endDate)}</span>,
    },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
  ];

  const roiColumns = [
    { key: 'date', label: 'Date', render: (date) => <span className="whitespace-nowrap text-slate-400">{formatDate(date)}</span> },
    {
      key: 'investmentId',
      label: 'Investment',
      render: (id) => {
        const investment = id && typeof id === 'object' ? id : investmentById.get(String(id));
        return (
          <span className="block min-w-24">
            <span className="block truncate text-slate-200">{investment?.planName || investment?.planDetails || 'Investment'}</span>
            <span className="mt-1 block text-[10px] text-slate-600">ID · {String(investment?._id || id?._id || id || '').slice(-7) || '—'}</span>
          </span>
        );
      },
    },
    { key: 'roiAmount', label: 'ROI earned', render: (value, row) => <span className="font-medium text-emerald-300">{formatCurrency(value ?? row.amount)}</span> },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
  ];

  const referralColumns = [
    {
      key: 'generatedBy',
      label: 'Member',
      render: (_, row) => {
        const member = row.generatedBy || row.referredUserId;
        return (
          <span className="block min-w-24">
            <span className="block truncate text-slate-200">{typeof member === 'object' ? member.fullName || member.email || 'Member' : 'Referral member'}</span>
            <span className="mt-1 block text-[10px] text-slate-600">Level {row.level || 1}</span>
          </span>
        );
      },
    },
    { key: 'level', label: 'Level', render: (level) => `Level ${level || 1}` },
    { key: 'amount', label: 'Income', render: (amount) => <span className="font-medium text-emerald-300">{formatCurrency(amount)}</span> },
    { key: 'date', label: 'Date', render: (date) => <span className="whitespace-nowrap text-slate-400">{formatDate(date)}</span> },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status || 'credited'} /> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/85">Portfolio overview</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">Financial dashboard</h2>
          <p className="mt-1.5 text-[13px] text-slate-500">A current view of your investments, earnings, and network.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[11px] text-slate-400 sm:flex">
            <Sparkles size={13} className="text-blue-300" />
            Welcome, {data.user?.fullName || authUser?.fullName || 'Investor'}
          </div>
          <button type="button" className="premium-button secondary !px-3 !py-2 text-xs" onClick={() => loadDashboard({ background: !loading })} disabled={loading || refreshing}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {errors.summary && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <span>{errors.summary}</span>
          <button type="button" onClick={() => loadDashboard({ background: true })} className="font-medium text-amber-200 underline decoration-amber-200/30 underline-offset-4">
            Try again
          </button>
        </div>
      )}

      <section aria-label="Account summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-slate-900/50" />)
        ) : (
          <>
            <StatCard title="Total Investments" value={metric(summary?.totalInvestments)} helper="Portfolio principal" accent="blue" />
            <StatCard title="Daily ROI" value={metric(summary?.dailyROI)} helper="Estimated from active investments" accent="green" />
            <StatCard title="Total Level Income" value={metric(summary?.totalLevelIncomeEarned)} helper="Referral commissions earned" accent="purple" />
            <StatCard title="Wallet Balance" value={metric(summary?.walletBalance)} helper="Current available balance" accent="slate" />
          </>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]" aria-label="Earnings charts">
        <div className="premium-card">
          <SectionHeading
            icon={TrendingUp}
            title="ROI earnings"
            description="Daily credited returns over recent activity"
            action={<span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[9px] font-medium text-slate-500">Last {rangeDays} days</span>}
          />
          {errors.earningsTrend ? (
            <div role="alert" className="empty-panel !min-h-52 text-sm">{errors.earningsTrend}</div>
          ) : loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-white/[0.025]" />
          ) : chartData.some((entry) => entry.roi > 0) ? (
            <div className="h-64 w-full" aria-label="ROI earnings chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRoiFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#70a5ff" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#70a5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.09)" strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#78869c', fontSize: 10 }} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} width={54} tick={{ fill: '#78869c', fontSize: 10 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{ background: '#101827', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, color: '#e7edf7', fontSize: 12 }}
                    formatter={(value) => [formatCurrency(value), 'ROI earned']}
                    labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="roi" stroke="#70a5ff" strokeWidth={2.2} fill="url(#dashboardRoiFill)" activeDot={{ r: 4, fill: '#a9c8ff', stroke: '#17243a' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-panel !min-h-52 flex-col">
              <TrendingUp size={20} className="mb-2 text-slate-500" />
              <span className="text-sm">No ROI earnings yet</span>
              <span className="mt-1 text-xs text-slate-600">Your credited returns will appear here.</span>
            </div>
          )}
        </div>

        <div className="premium-card">
          <SectionHeading icon={BriefcaseBusiness} title="Investment performance" description="Principal deployed and realized ROI return (%)" />
          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-white/[0.025]" />
          ) : errors.investments ? (
            <div role="alert" className="empty-panel !min-h-52 text-sm">{errors.investments}</div>
          ) : investmentPerformance.length ? (
            <div className="h-64 w-full" aria-label="Investment principal and realized ROI chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={investmentPerformance} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.09)" strokeDasharray="3 5" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#78869c', fontSize: 9 }}
                    tickFormatter={(value) => String(value).length > 12 ? `${String(value).slice(0, 11)}…` : value}
                    interval={0}
                  />
                  <YAxis yAxisId="principal" tickLine={false} axisLine={false} width={60} tick={{ fill: '#78869c', fontSize: 10 }} tickFormatter={(value) => `₹${value}`} />
                  <YAxis yAxisId="roi" orientation="right" tickLine={false} axisLine={false} width={48} tick={{ fill: '#78869c', fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{ background: '#101827', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, color: '#e7edf7', fontSize: 12 }}
                    formatter={(value, name) => [
                      name === 'Realized ROI return' ? `${Number(value).toFixed(2)}%` : formatCurrency(value),
                      name === 'principal' ? 'Investment amount' : 'Realized ROI return',
                    ]}
                  />
                  <Bar yAxisId="principal" dataKey="principal" name="Investment amount" fill="#70a5ff" radius={[5, 5, 0, 0]} maxBarSize={32} />
                  <Line yAxisId="roi" dataKey="roiYieldPercent" name="Realized ROI return" stroke="#48d6a0" strokeWidth={2} dot={{ r: 3, fill: '#48d6a0' }} activeDot={{ r: 5 }} />
                  <Legend verticalAlign="bottom" height={26} iconType="circle" wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-panel !min-h-52 flex-col">
              <BriefcaseBusiness size={20} className="mb-2 text-slate-500" />
              <span className="text-sm">No investment performance yet</span>
              <span className="mt-1 text-xs text-slate-600">Investment returns appear after ROI is credited.</span>
            </div>
          )}
        </div>
      </section>

      <section className="premium-card" aria-label="Income performance trend">
        <SectionHeading
          icon={TrendingUp}
          title="Activity and income trends"
          description="Investment activity and credited income"
          action={
            <label className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="hidden sm:inline">Date range</span>
              <select
                className="input-shell !min-h-0 !w-auto !rounded-lg !py-1.5 !pl-2 !pr-7 text-xs"
                value={rangeDays}
                onChange={(event) => setRangeDays(Number(event.target.value))}
                aria-label="Select chart date range"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </label>
          }
        />
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/[0.025]" />
        ) : errors.earningsTrend ? (
          <div role="alert" className="empty-panel !min-h-52 text-sm">{errors.earningsTrend}</div>
        ) : earningsTrend.some((entry) => Number(entry.roiIncome) > 0 || Number(entry.referralIncome) > 0 || Number(entry.investmentVolume) > 0) ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsTrend} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.09)" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#78869c', fontSize: 10 }} minTickGap={22} />
                <YAxis tickLine={false} axisLine={false} width={54} tick={{ fill: '#78869c', fontSize: 10 }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ background: '#101827', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, color: '#e7edf7', fontSize: 12 }}
                  formatter={(value, name) => [formatCurrency(value), name === 'roiIncome' ? 'ROI income' : name === 'referralIncome' ? 'Referral income' : 'Investment volume']}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                />
                <Line type="monotone" dataKey="roiIncome" name="ROI income" stroke="#70a5ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="referralIncome" name="Referral income" stroke="#a99aff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="investmentVolume" name="Investment volume" stroke="#48d6a0" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-panel !min-h-52 flex-col">
            <TrendingUp size={20} className="mb-2 text-slate-500" />
            <span className="text-sm">No recent income activity</span>
            <span className="mt-1 text-xs text-slate-600">ROI and referral credits will appear here when recorded.</span>
          </div>
        )}
      </section>

      <section className="premium-card" aria-label="Investment history">
        <SectionHeading
          icon={BriefcaseBusiness}
          title="Investment history"
          description="Your latest investment positions"
          action={<Link to="/investments" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200">All investments <ArrowUpRight size={13} /></Link>}
        />
        <DashboardHistoryTable
          columns={investmentColumns}
          rows={data.investments}
          loading={loading}
          error={errors.investments}
          emptyTitle="No investments yet"
          emptyDescription="Once you create an investment, its amount, plan, and status will be listed here."
          viewAllTo="/investments"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="premium-card">
          <SectionHeading
            icon={TrendingUp}
            title="ROI history"
            description="Recent returns credited to your wallet"
            action={<Link to="/roi-history" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200">Full history <ArrowUpRight size={13} /></Link>}
          />
          <DashboardHistoryTable
            columns={roiColumns}
            rows={data.roiHistory}
            loading={loading}
            error={errors.roiHistory}
            emptyTitle="No ROI history yet"
            emptyDescription="Credited daily returns from eligible investments will appear here."
            viewAllTo="/roi-history"
          />
        </div>

        <div className="premium-card">
          <SectionHeading
            icon={Coins}
            title="Referral income history"
            description="Recent rewards generated by your network"
            action={<Link to="/referrals" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200">Referrals <ArrowUpRight size={13} /></Link>}
          />
          <DashboardHistoryTable
            columns={referralColumns}
            rows={data.referralHistory}
            loading={loading}
            error={errors.referralHistory}
            emptyTitle="No referral income yet"
            emptyDescription="Referral rewards are listed here once they are credited."
            viewAllTo="/referrals"
          />
        </div>
      </section>

      <section className="premium-card" aria-label="Referral tree">
        <SectionHeading
          icon={GitBranch}
          title="Referral tree"
          description="Your referral hierarchy, organized by level"
          action={<Link to="/referrals/tree" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200">Open full tree <ArrowUpRight size={13} /></Link>}
        />
        <DashboardReferralTree tree={data.referralTree} loading={loading} error={errors.referralTree} />
      </section>
    </div>
  );
}
