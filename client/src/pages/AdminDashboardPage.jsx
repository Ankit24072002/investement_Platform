import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';
import PaginationControls from '../components/common/PaginationControls';

const PAGE_SIZE = 20;
const currency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceStatus, setServiceStatus] = useState('unknown');
  const [runLoading, setRunLoading] = useState(false);
  const [runMessage, setRunMessage] = useState('');
  const [runError, setRunError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [investmentStatus, setInvestmentStatus] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [investmentTotal, setInvestmentTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [investmentPage, setInvestmentPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ total: 0, totalPages: 1 });
  const [investmentPagination, setInvestmentPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [usersResult, investmentsResult, healthResult] = await Promise.allSettled([
          api.get('/admin/users', {
            params: { page: userPage, limit: PAGE_SIZE, search: userSearch.trim() || undefined, accountStatus: userStatus || undefined },
          }),
          api.get('/admin/investments', {
            params: { page: investmentPage, limit: PAGE_SIZE, status: investmentStatus || undefined },
          }),
          api.get('/health'),
        ]);
        if (usersResult.status === 'rejected') throw usersResult.reason;
        if (investmentsResult.status === 'rejected') throw investmentsResult.reason;
        if (!active) return;

        const usersData = usersResult.value.data?.data;
        const investmentsData = investmentsResult.value.data?.data;
        setUsers(usersData?.items || []);
        setInvestments(investmentsData?.items || []);
        setUserPagination(usersData?.pagination || { total: 0, totalPages: 1 });
        setInvestmentPagination(investmentsData?.pagination || { total: 0, totalPages: 1 });
        setUserTotal(Number(usersData?.pagination?.total ?? 0));
        setInvestmentTotal(Number(investmentsData?.pagination?.total ?? 0));
        setServiceStatus(
          healthResult.status === 'fulfilled' && healthResult.value.data?.data?.databaseConnected
            ? 'online'
            : 'degraded'
        );
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load admin data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [userPage, investmentPage, userSearch, userStatus, investmentStatus]);

  const runROI = async () => {
    try {
      setRunLoading(true);
      setRunError('');
      setRunMessage('');
      const { data } = await api.post('/admin/roi/run');
      setRunMessage(`ROI processing completed. ${Number(data?.data?.processed || 0)} investment(s) processed.`);
    } catch (err) {
      setRunError(err.response?.data?.message || 'Unable to run ROI processing.');
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="Control network operations and financial activity." />
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <MetricCard title="Matching users" value={String(userTotal)} />
        <MetricCard title="Matching investments" value={String(investmentTotal)} />
        <MetricCard title="API / database" value={loading ? 'Checking…' : serviceStatus === 'online' ? 'Online' : serviceStatus === 'degraded' ? 'Degraded' : 'Unknown'} />
      </div>

      <SectionCard title="Daily ROI processing" subtitle="Admin-only manual run; duplicate credits are prevented by idempotency checks.">
        <button type="button" onClick={runROI} disabled={runLoading} className="premium-button primary disabled:cursor-not-allowed">
          {runLoading ? 'Processing…' : 'Run ROI now'}
        </button>
        {runMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{runMessage}</p>}
        {runError && <p role="alert" className="mt-3 text-sm text-red-300">{runError}</p>}
      </SectionCard>

      <SectionCard title="Recent users" subtitle="Search and filter member accounts">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1); }} className="input-shell pl-9" placeholder="Search name or email" aria-label="Search users" />
          </label>
          <select value={userStatus} onChange={(event) => { setUserStatus(event.target.value); setUserPage(1); }} className="input-shell" aria-label="Filter users by account status">
            <option value="">All account statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <LoadingRows />
        ) : users.length === 0 ? (
          <div className="empty-panel">No users match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-white">{user.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{user.email || 'N/A'}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{user.accountStatus || 'active'}</span></td>
                    <td className="px-4 py-3 text-slate-400">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <PaginationControls page={userPage} totalPages={userPagination.totalPages} total={userPagination.total} pageSize={PAGE_SIZE} onChange={setUserPage} />}
      </SectionCard>

      <SectionCard title="Investment activity" subtitle="Latest investment records">
        <div className="mb-4">
          <select value={investmentStatus} onChange={(event) => { setInvestmentStatus(event.target.value); setInvestmentPage(1); }} className="input-shell max-w-xs" aria-label="Filter investments by status">
            <option value="">All investment statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <LoadingRows />
        ) : investments.length === 0 ? (
          <div className="empty-panel">No investments match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Daily ROI</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {investments.map((investment) => (
                  <tr key={investment._id} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-white">{investment.planName || 'Investment'}</td>
                    <td className="px-4 py-3 text-slate-300">{investment.userId?.fullName || investment.user?.fullName || investment.userId?.email || 'Member'}</td>
                    <td className="px-4 py-3">{currency(investment.amount)}</td>
                    <td className="px-4 py-3">{Number(investment.dailyROIPercentage || 0)}%</td>
                    <td className="px-4 py-3">{investment.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <PaginationControls page={investmentPage} totalPages={investmentPagination.totalPages} total={investmentPagination.total} pageSize={PAGE_SIZE} onChange={setInvestmentPage} />}
      </SectionCard>
    </div>
  );
}

function LoadingRows() {
  return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/80" />)}</div>;
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}
