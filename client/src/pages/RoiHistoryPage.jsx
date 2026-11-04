import { useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';
import PaginationControls from '../components/common/PaginationControls';

const PAGE_SIZE = 20;
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function RoiHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/roi/history?page=${page}&limit=${PAGE_SIZE}`);
        const result = data?.data || {};
        setItems(result.items || data.history || []);
        setPagination(result.pagination || { total: 0, totalPages: 1 });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load ROI history.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((row) => {
        const investment = row.investmentId;
        const searchable = `${investment?.planName || ''} ${investment?.planDetails || ''} ${row.status || ''} ${row.amount || row.roiAmount || ''}`.toLowerCase();
        return (!query || searchable.includes(query)) && (!statusFilter || row.status === statusFilter);
      })
      .sort((left, right) => {
        if (sortOrder === 'amount-high') return Number(right.roiAmount ?? right.amount) - Number(left.roiAmount ?? left.amount);
        if (sortOrder === 'amount-low') return Number(left.roiAmount ?? left.amount) - Number(right.roiAmount ?? right.amount);
        const dateOrder = new Date(left.date).getTime() - new Date(right.date).getTime();
        return sortOrder === 'oldest' ? dateOrder : -dateOrder;
      });
  }, [items, search, statusFilter, sortOrder]);

  return (
    <div>
      <PageHeader title="ROI History" subtitle="Daily earnings and credited returns." />
      <SectionCard title="Earnings ledger" subtitle="Generated from active investments">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label className="relative sm:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-shell pl-9" placeholder="Search this page" aria-label="Search current ROI history page" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-shell" aria-label="Filter ROI history by status">
            <option value="">All statuses</option>
            <option value="credited">Credited</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="input-shell" aria-label="Sort ROI history">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-high">Amount: high to low</option>
            <option value="amount-low">Amount: low to high</option>
          </select>
        </div>
        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/80" />)}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="empty-panel">{items.length ? 'No ROI entries match the selected filters.' : 'No ROI history is available yet.'}</div>
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
                {visibleItems.map((row, index) => (
                  <tr key={row._id || index} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3">{row.date ? new Date(row.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.investmentId?.planName || row.investmentId?.planDetails || `#${String(row.investmentId?._id || row.investmentId || '').slice(-6) || 'N/A'}`}
                    </td>
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
        {!loading && !error && (
          <PaginationControls page={page} totalPages={pagination.totalPages} total={pagination.total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </SectionCard>
    </div>
  );
}
