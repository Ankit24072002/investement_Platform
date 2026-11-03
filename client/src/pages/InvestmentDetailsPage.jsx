import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, BadgeDollarSign, CalendarDays, Percent } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));

export default function InvestmentDetailsPage() {
  const { id } = useParams();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/investments');
        const item = (data?.data?.items || data?.investments || []).find((row) => row._id === id) || null;
        setInvestment(item);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load investment details.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-3xl bg-slate-900/60" />;
  }

  if (error || !investment) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        {error || 'Investment not found.'}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Investment details"
        subtitle={`#{${String(investment._id || '').slice(-6) || 'INV'}}`}
        action={
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <SectionCard title="Investment summary" subtitle="Portfolio metrics">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoTile icon={<BadgeDollarSign size={18} />} label="Amount" value={formatCurrency(investment.amount)} />
            <InfoTile icon={<Percent size={18} />} label="Daily ROI" value={`${investment.dailyROI || investment.dailyROIPercentage || 0}%`} />
            <InfoTile icon={<CalendarDays size={18} />} label="Start date" value={new Date(investment.startDate).toLocaleDateString()} />
            <InfoTile icon={<CalendarDays size={18} />} label="End date" value={new Date(investment.endDate).toLocaleDateString()} />
          </div>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
            <div className="font-medium text-white">Plan details</div>
            <p className="mt-2">{investment.planDetails || investment.planName || '—'}</p>
          </div>
        </SectionCard>

        <SectionCard title="Status" subtitle="Current state">
          <div className="space-y-4 text-sm text-slate-200">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              <span className="text-slate-400">Status</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                {investment.status || 'active'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              <span className="text-slate-400">Total ROI generated</span>
              <span>{formatCurrency(investment.totalROIGenerated || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              <span className="text-slate-400">Created</span>
              <span>{new Date(investment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">{icon}</div>
      <div className="text-xs uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
