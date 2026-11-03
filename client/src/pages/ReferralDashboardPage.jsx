import { useEffect, useState } from 'react';
import { Users, ArrowUpRight } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function ReferralDashboardPage() {
  const [direct, setDirect] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: directData }, { data: incomeData }] = await Promise.all([
          api.get('/referrals/direct'),
          api.get('/referrals/income'),
        ]);
        setDirect(directData?.data?.referrals || []);
        setIncome(incomeData?.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load referral data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <PageHeader title="Referral dashboard" subtitle="Track your network growth and earnings." />

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <MetricCard title="Direct referrals" value={String(direct.length)} icon={<Users size={18} />} />
        <MetricCard title="Level income" value={formatCurrency(income.reduce((sum, item) => sum + Number(item.amount || 0), 0))} icon={<ArrowUpRight size={18} />} />
        <MetricCard title="Active tiers" value="4" icon={<Users size={18} />} />
      </div>

      <SectionCard title="Referral income history" subtitle="Commission earned across the network">
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
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Income</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {income.map((row, index) => (
                  <tr key={row._id || index} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-slate-300">{row.generatedBy || row.receiver || 'Referral'}</td>
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
