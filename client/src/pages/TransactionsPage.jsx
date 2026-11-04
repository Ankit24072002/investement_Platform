import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';
import api from '../services/api';
import PaginationControls from '../components/common/PaginationControls';

const PAGE_SIZE = 20;
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function TransactionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/wallet/transactions', {
          params: {
            page,
            limit: PAGE_SIZE,
            type: type || undefined,
            status: status || undefined,
            sortBy,
            sortOrder,
          },
        });
        if (!active) return;
        setItems(data?.data?.items || []);
        setPagination(data?.data?.pagination || { total: 0, totalPages: 1 });
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load transactions.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [page, type, status, sortBy, sortOrder]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((row) =>
      !query || `${row.transactionType || ''} ${row.description || ''} ${row.amount || ''} ${row.status || ''}`.toLowerCase().includes(query)
    );
  }, [items, search]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Account ledger and recent financial movements." />
      <SectionCard title="Transaction history" subtitle="Filter, search, sort, and page through wallet entries">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-shell pl-9" placeholder="Search this page" aria-label="Search current transaction page" />
          </label>
          <select value={type} onChange={updateFilter(setType)} className="input-shell" aria-label="Filter by transaction type">
            <option value="">All transaction types</option>
            <option value="ROI">ROI</option>
            <option value="REFERRAL">Referral</option>
            <option value="INVESTMENT">Investment</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <select value={status} onChange={updateFilter(setStatus)} className="input-shell" aria-label="Filter by transaction status">
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={(event) => {
            const [nextSortBy, nextSortOrder] = event.target.value.split(':');
            setSortBy(nextSortBy);
            setSortOrder(nextSortOrder);
            setPage(1);
          }} className="input-shell" aria-label="Sort transactions">
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="amount:desc">Amount: high to low</option>
            <option value="amount:asc">Amount: low to high</option>
          </select>
        </div>
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/80" />)}</div>
        ) : visibleItems.length === 0 ? (
          <div className="empty-panel">{items.length ? 'No transactions on this page match your search.' : 'No wallet transactions match the selected filters.'}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {visibleItems.map((row) => (
                  <tr key={row._id} className="border-t border-slate-800/80 hover:bg-slate-950/40">
                    <td className="px-4 py-3 text-slate-300">{row.transactionType || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{row.description || 'N/A'}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{formatCurrency(row.amount || 0)}</td>
                    <td className="px-4 py-3 text-slate-400">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{row.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <PaginationControls page={page} totalPages={pagination.totalPages} total={pagination.total} pageSize={PAGE_SIZE} onChange={setPage} />}
      </SectionCard>
    </div>
  );
}
