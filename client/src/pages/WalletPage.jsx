import { useEffect, useState } from 'react';
import { CreditCard, Wallet, TrendingUp } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: walletData }, { data: txData }] = await Promise.all([
          api.get('/wallet'),
          api.get('/wallet/transactions'),
        ]);
        setWallet(walletData?.data || {});
        setTransactions(txData?.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load wallet data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-slate-900/60" />;

  return (
    <div>
      <PageHeader title="Wallet" subtitle="Monitor available funds and transaction movement." />

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <MetricCard label="Wallet balance" value={formatCurrency(wallet?.walletBalance || 0)} icon={<Wallet size={18} />} accent="blue" />
        <MetricCard label="ROI earned" value={formatCurrency(wallet?.totalROIEarned || 0)} icon={<TrendingUp size={18} />} accent="emerald" />
        <MetricCard label="Referral income" value={formatCurrency(wallet?.totalLevelIncomeEarned || 0)} icon={<CreditCard size={18} />} accent="violet" />
      </div>

      <SectionCard title="Wallet transactions" subtitle="Recent account activity">
        {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {transactions.length === 0 ? (
          <div className="empty-panel">No wallet transactions yet.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/30">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Balance before</th>
                  <th className="px-4 py-3">Balance after</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row, index) => (
                  <tr key={row._id || index} className="border-t border-white/5 hover:bg-slate-900/60">
                    <td className="px-4 py-3 text-slate-300">{row.transactionType || 'ROI'}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{formatCurrency(row.amount || 0)}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(row.balanceBefore || 0)}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(row.balanceAfter || 0)}</td>
                    <td className="px-4 py-3 text-slate-400">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}</td>
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

function MetricCard({ label, value, icon, accent }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-300',
    emerald: 'bg-emerald-500/10 text-emerald-300',
    violet: 'bg-violet-500/10 text-violet-300',
  };

  return (
    <div className="premium-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">{label}</div>
          <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorMap[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}
