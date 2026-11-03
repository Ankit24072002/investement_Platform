import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, Plus, Search } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));

const statusClassMap = {
  active: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  completed: 'border-blue-500/25 bg-blue-500/10 text-blue-300',
  cancelled: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
};

export default function InvestmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/investments');
        setItems(Array.isArray(data?.data?.items) ? data.data.items : data.investments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load investments.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const text = `${item.planName || item.planDetails || ''} ${item.status || ''} ${item.amount || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [items, search]);

  return (
    <div>
      <PageHeader
        title="Investments"
        subtitle="Track active, completed, and historical investments."
        action={
          <button className="premium-button primary">
            <Plus size={16} /> New investment
          </button>
        }
      />

      <SectionCard title="Portfolio" subtitle="Live investment activity">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-shell pl-10"
              placeholder="Search investments"
            />
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-800/70" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-panel">No investments found for your current filters.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/30">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">ROI</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id || item.id} className="border-t border-white/5 hover:bg-slate-900/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{item.planName || item.planDetails || 'Investment'}</div>
                      <div className="mt-1 text-[11px] text-slate-400">#{String(item._id || '').slice(-6) || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-300">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 text-slate-200">{item.dailyROI || item.dailyROIPercentage || 0}%</td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
                      <div className="mt-1 text-[11px] text-slate-500">to {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClassMap[item.status] || statusClassMap.active}`}>
                        {item.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/investments/${item._id}`} className="font-medium text-blue-300 transition hover:text-blue-200">
                        View
                      </Link>
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
