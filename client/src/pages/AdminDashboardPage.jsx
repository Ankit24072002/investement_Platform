import { useEffect, useState } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: usersData }, { data: investData }] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/investments'),
        ]);
        setUsers(usersData?.data?.items || []);
        setInvestments(investData?.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="Control network operations and financial activity." />
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <MetricCard title="Users" value={String(users.length)} />
        <MetricCard title="Investments" value={String(investments.length)} />
        <MetricCard title="Status" value="Healthy" />
      </div>

      <SectionCard title="Recent users" subtitle="Member overview">
        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/80" />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id || index} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-white">{user.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{user.email || 'N/A'}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{user.accountStatus || 'active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}
