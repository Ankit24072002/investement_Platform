import { useEffect, useMemo, useState } from 'react';
import { Users, ArrowUpRight, Search } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';
import PaginationControls from '../components/common/PaginationControls';

const PAGE_SIZE = 20;
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function ReferralDashboardPage() {
  const [direct, setDirect] = useState([]);
  const [income, setIncome] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [directPage, setDirectPage] = useState(1);
  const [directPagination, setDirectPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [directSearch, setDirectSearch] = useState('');
  const [directStatus, setDirectStatus] = useState('');
  const [directSort, setDirectSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [{ data: directData }, { data: incomeData }, { data: summaryData }] = await Promise.all([
          api.get(`/referrals/direct?page=${directPage}&limit=${PAGE_SIZE}`),
          api.get(`/referrals/income?page=${page}&limit=${PAGE_SIZE}`),
          api.get('/referrals/summary'),
        ]);
        setDirect(directData?.data?.referrals || []);
        setDirectPagination(directData?.data?.pagination || { total: 0, totalPages: 1 });
        setIncome(incomeData?.data?.items || []);
        setPagination(incomeData?.data?.pagination || { total: 0, totalPages: 1 });
        setSummary(summaryData?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load referral data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, directPage]);

  const visibleDirect = useMemo(() => {
    const query = directSearch.trim().toLowerCase();
    return direct
      .filter((member) => {
        const searchable = `${member.fullName || ''} ${member.referralCode || ''} ${member.accountStatus || ''}`.toLowerCase();
        return (!query || searchable.includes(query)) && (!directStatus || member.accountStatus === directStatus);
      })
      .sort((left, right) => {
        if (directSort === 'name') return String(left.fullName || '').localeCompare(String(right.fullName || ''));
        const dateOrder = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        return directSort === 'oldest' ? dateOrder : -dateOrder;
      });
  }, [direct, directSearch, directStatus, directSort]);

  const visibleIncome = useMemo(() => {
    const query = search.trim().toLowerCase();
    return income
      .filter((row) => {
        const member = row.generatedBy || row.referredUserId;
        const searchable = `${member?.fullName || ''} ${member?.email || ''} ${row.level || ''} ${row.amount || ''} ${row.status || ''}`.toLowerCase();
        return (!query || searchable.includes(query)) && (!statusFilter || row.status === statusFilter);
      })
      .sort((left, right) => {
        if (sortOrder === 'amount-high') return Number(right.amount) - Number(left.amount);
        if (sortOrder === 'amount-low') return Number(left.amount) - Number(right.amount);
        if (sortOrder === 'level-low') return Number(left.level) - Number(right.level);
        const dateOrder = new Date(left.date).getTime() - new Date(right.date).getTime();
        return sortOrder === 'oldest' ? dateOrder : -dateOrder;
      });
  }, [income, search, statusFilter, sortOrder]);

  return (
    <div>
      <PageHeader title="Referral dashboard" subtitle="Track your network growth and earnings." />

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <MetricCard title="Direct referrals" value={summary ? String(summary.directReferrals ?? direct.length) : '—'} icon={<Users size={18} />} />
        <MetricCard title="Level income" value={summary ? formatCurrency(summary.totalLevelIncomeEarned) : '—'} icon={<ArrowUpRight size={18} />} />
        <MetricCard title="Configured levels" value={summary ? String(summary.configuredLevels) : '—'} icon={<Users size={18} />} />
      </div>

      <SectionCard title="Direct referrals" subtitle="Members registered with your referral code">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={directSearch} onChange={(event) => setDirectSearch(event.target.value)} className="input-shell pl-9" placeholder="Search this page" aria-label="Search current direct referrals page" />
          </label>
          <select value={directStatus} onChange={(event) => setDirectStatus(event.target.value)} className="input-shell" aria-label="Filter referrals by account status">
            <option value="">All account statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={directSort} onChange={(event) => setDirectSort(event.target.value)} className="input-shell" aria-label="Sort direct referrals">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/80" />)}</div>
        ) : visibleDirect.length === 0 ? (
          <div className="empty-panel">{direct.length ? 'No direct referrals on this page match your filters.' : 'Direct referrals will appear here after users register with your referral code.'}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Referral code</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {visibleDirect.map((member) => (
                  <tr key={member._id} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-white">{member.fullName || 'Member'}</td>
                    <td className="px-4 py-3 text-slate-300">{member.referralCode || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-400">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{member.accountStatus || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <PaginationControls page={directPage} totalPages={directPagination.totalPages} total={directPagination.total} pageSize={PAGE_SIZE} onChange={setDirectPage} />}
      </SectionCard>

      <SectionCard title="Referral income history" subtitle="Commission earned across the network">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-shell pl-9" placeholder="Search this page" aria-label="Search current referral income page" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-shell" aria-label="Filter referral income by status">
            <option value="">All statuses</option>
            <option value="credited">Credited</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="input-shell" aria-label="Sort referral income">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-high">Income: high to low</option>
            <option value="amount-low">Income: low to high</option>
            <option value="level-low">Referral level: low to high</option>
          </select>
        </div>
        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/80" />)}
          </div>
        ) : visibleIncome.length === 0 ? (
          <div className="empty-panel">{income.length ? 'No referral income matches the selected filters.' : 'Referral income will appear here after eligible commissions are credited.'}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Income</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleIncome.map((row, index) => (
                  <tr key={row._id || index} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-slate-300">{row.generatedBy?.fullName || row.generatedBy?.email || 'Referral'}</td>
                    <td className="px-4 py-3">{row.level || 1}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{formatCurrency(row.amount || 0)}</td>
                    <td className="px-4 py-3 text-slate-400">{row.date ? new Date(row.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{row.status || 'credited'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <PaginationControls page={page} totalPages={pagination.totalPages} total={pagination.total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </SectionCard>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">{title}</div>
          <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">{icon}</div>
      </div>
    </div>
  );
}
