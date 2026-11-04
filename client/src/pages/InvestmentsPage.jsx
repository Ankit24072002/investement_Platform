import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const formatUtcDate = (value) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(value);

const statusClassMap = {
  active: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  completed: 'border-blue-500/25 bg-blue-500/10 text-blue-300',
  cancelled: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
};

const PAGE_SIZE = 20;

export default function InvestmentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (statusFilter) params.set('status', statusFilter);
        const [sortField, sortOrder] = sortBy.split(':');
        params.set('sortBy', sortField);
        params.set('sortOrder', sortOrder);
        const [investmentResponse, planResponse] = await Promise.all([
          api.get(`/investments?${params.toString()}`),
          api.get('/investments/plans'),
        ]);
        if (!active) return;
        const investmentData = investmentResponse.data?.data;
        setItems(Array.isArray(investmentData?.items) ? investmentData.items : []);
        setTotalPages(Math.max(1, Number(investmentData?.pagination?.totalPages) || 1));
        setPlans(Array.isArray(planResponse.data?.data?.plans) ? planResponse.data.data.plans : []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load investment data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [page, statusFilter, sortBy]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0] || null;
  const parsedAmount = Number(amount);
  const amountValid =
    selectedPlan &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= selectedPlan.minAmount &&
    parsedAmount <= selectedPlan.maxAmount;
  const investmentDatePreview = useMemo(() => {
    if (!selectedPlan?.durationDays) return null;
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + selectedPlan.durationDays - 1);
    return { startDate, endDate };
  }, [selectedPlan?.durationDays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const text = `${item.planName || item.planDetails || ''} ${item.status || ''} ${item.amount || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [items, search]);

  const createInvestment = async (event) => {
    event.preventDefault();
    if (!selectedPlan || !amountValid) return;

    try {
      setSubmitting(true);
      setError('');
      const { data } = await api.post('/investments', { planId: selectedPlan.id, amount: parsedAmount });
      const created = data?.data?.investment;
      if (!created) throw new Error('The server did not return the created investment.');

      setItems((current) => [created, ...current].slice(0, PAGE_SIZE));
      setNotice('Investment created successfully.');
      setStatusFilter('active');
      setAmount('');
      setModalOpen(false);
      if (page !== 1) setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to create investment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Investments"
        subtitle="Review your portfolio and create an investment using a configured plan."
        action={
          <button type="button" className="premium-button primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New investment
          </button>
        }
      />

      {notice && <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      <SectionCard title="Portfolio" subtitle="Investment activity">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-shell pl-10"
              placeholder="Search this page"
              aria-label="Search current investment page"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="input-shell md:max-w-48"
            aria-label="Filter by investment status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setPage(1);
              setSortBy(event.target.value);
            }}
            className="input-shell md:max-w-52"
            aria-label="Sort investments"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="amount:desc">Amount: high to low</option>
            <option value="amount:asc">Amount: low to high</option>
            <option value="startDate:asc">Start date: earliest</option>
            <option value="endDate:asc">End date: earliest</option>
          </select>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-800/70" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-panel">{search ? 'No investments match your search on this page.' : 'No investments found for this status.'}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/30">
            <table className="min-w-[760px] w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Daily ROI</th>
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

        {!loading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" className="premium-button secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
              <button type="button" className="premium-button secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        )}
      </SectionCard>

      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setModalOpen(false);
          }}
        >
          <div className="my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:max-h-[calc(100vh-2.5rem)] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="investment-dialog-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="investment-dialog-title" className="text-xl font-semibold text-white">New investment</h2>
                <p className="mt-1 text-sm text-slate-400">Terms are configured by the platform and cannot be changed here.</p>
              </div>
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => setModalOpen(false)} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            {!plans.length ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                No investment plans are configured. Ask the platform administrator to configure reviewed plan terms before enabling investments.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={createInvestment}>
                <label className="block text-sm text-slate-300">
                  Investment plan
                  <select
                    className="input-shell mt-2"
                    value={selectedPlan?.id || ''}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                    required
                  >
                    {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                  </select>
                </label>
                {selectedPlan && (
                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <p>{selectedPlan.description}</p>
                    <p className="mt-2 text-slate-400">Range: {formatCurrency(selectedPlan.minAmount)}–{formatCurrency(selectedPlan.maxAmount)} · Duration: {selectedPlan.durationDays} days</p>
                    <p className="mt-1 text-slate-400">Configured daily ROI: {selectedPlan.dailyROIPercentage}%</p>
                  </div>
                )}
                <label className="block text-sm text-slate-300">
                  Amount
                  <input
                    className="input-shell mt-2"
                    type="number"
                    min={selectedPlan?.minAmount}
                    max={selectedPlan?.maxAmount}
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </label>
                <section className="rounded-2xl border border-white/[0.07] bg-black/10 p-4" aria-label="Investment record preview">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Saved investment details</h3>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active on creation
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-slate-500">User reference</dt>
                      <dd className="mt-1 truncate font-medium text-slate-200" title={user?.id || user?._id || user?.email || user?.fullName}>
                        {user?.id || user?._id || user?.email || user?.fullName || 'Signed-in account'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-500">Amount</dt>
                      <dd className="mt-1 truncate font-medium text-slate-200">{amountValid ? formatCurrency(parsedAmount) : 'Enter a valid amount'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-500">Plan details</dt>
                      <dd className="mt-1 truncate font-medium text-slate-200" title={selectedPlan?.description}>{selectedPlan?.name || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-500">Daily ROI</dt>
                      <dd className="mt-1 font-medium text-slate-200">{selectedPlan ? `${selectedPlan.dailyROIPercentage}%` : '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-500">Start date · UTC</dt>
                      <dd className="mt-1 font-medium text-slate-200">{investmentDatePreview ? formatUtcDate(investmentDatePreview.startDate) : '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-500">End date · UTC</dt>
                      <dd className="mt-1 font-medium text-slate-200">{investmentDatePreview ? formatUtcDate(investmentDatePreview.endDate) : '—'}</dd>
                    </div>
                  </dl>
                </section>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="premium-button secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="premium-button primary" disabled={!amountValid || submitting}>
                    {submitting ? 'Creating…' : 'Confirm investment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
