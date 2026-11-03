import { ArrowUpRight, CircleDollarSign, Coins, TrendingUp, Wallet } from 'lucide-react';

const icons = {
  blue: TrendingUp,
  green: Coins,
  purple: CircleDollarSign,
  slate: Wallet,
};

export default function StatCard({ title, value, helper, accent = 'blue', trend }) {
  const tone = {
    blue: {
      shell: 'from-blue-500/12 via-blue-500/6 to-sky-500/4 text-blue-200 border-blue-500/20',
      icon: 'bg-blue-500/12 text-blue-300',
      badge: 'text-blue-200 bg-blue-500/10',
    },
    green: {
      shell: 'from-emerald-500/12 via-emerald-500/8 to-teal-500/4 text-emerald-200 border-emerald-500/20',
      icon: 'bg-emerald-500/12 text-emerald-300',
      badge: 'text-emerald-200 bg-emerald-500/10',
    },
    purple: {
      shell: 'from-violet-500/12 via-violet-500/8 to-indigo-500/4 text-violet-200 border-violet-500/20',
      icon: 'bg-violet-500/12 text-violet-300',
      badge: 'text-violet-200 bg-violet-500/10',
    },
    slate: {
      shell: 'from-slate-500/12 via-slate-500/6 to-slate-500/4 text-slate-200 border-slate-500/20',
      icon: 'bg-slate-500/12 text-slate-200',
      badge: 'text-slate-200 bg-slate-500/10',
    },
  };

  const Icon = icons[accent] || TrendingUp;
  const styles = tone[accent] || tone.blue;

  return (
    <div className={`premium-card relative overflow-hidden border bg-gradient-to-br ${styles.shell}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 ${styles.icon}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {helper && <p className="text-sm text-slate-300">{helper}</p>}
        {trend ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${styles.badge}`}>
            <ArrowUpRight size={12} /> {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}
