import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function RoiHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/roi/history');
        setItems(data?.data?.items || data.history || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load ROI history.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <PageHeader title="ROI History" subtitle="Daily earnings and credited returns." />
      <SectionCard title="Earnings ledger" subtitle="Generated from active investments">
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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Investment</th>
                  <th className="px-4 py-3">ROI Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={row._id || index} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3">{row.date ? new Date(row.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">#{String(row.investmentId || '').slice(-6) || 'N/A'}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{formatCurrency(row.roiAmount || row.amount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                        {row.status || 'credited'}
                      </span>
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
