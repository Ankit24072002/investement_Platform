import { Bell, Lock, MoonStar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function SettingsPage() {
  const { theme, toggleTheme } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Review the account capabilities currently available in this workspace." />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Security" subtitle="Current account protection">
          <FeatureRow
            icon={<ShieldCheck size={18} />}
            title="Authentication"
            description="Protected API requests require a signed bearer token."
            status="Enabled"
            positive
          />
          <FeatureRow
            icon={<Lock size={18} />}
            title="Two-factor authentication"
            description="Second-factor enrollment and verification are not implemented; no toggle is shown as active."
            status="Unavailable"
          />
        </SectionCard>

        <SectionCard title="Preferences" subtitle="Current product capabilities">
          <FeatureRow
            icon={<Bell size={18} />}
            title="Email notifications"
            description="Email delivery is not configured, so payout notifications are not sent."
            status="Unavailable"
          />
          <FeatureRow
            icon={<MoonStar size={18} />}
            title="Appearance"
            description="Choose the appearance used across your investor portal."
            status={`${theme === 'dark' ? 'Dark' : 'Light'} theme`}
            positive
          />
          <button type="button" className="premium-button secondary mt-3 w-full" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </button>
        </SectionCard>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, description, status, positive = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">{icon}</div>
        <div>
          <div className="font-medium text-white">{title}</div>
          <div className="mt-1 text-sm text-slate-400">{description}</div>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${positive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700/60 text-slate-300'}`}>
        {status}
      </span>
    </div>
  );
}
