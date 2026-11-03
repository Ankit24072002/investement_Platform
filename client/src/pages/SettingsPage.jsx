import { useState } from 'react';
import { Bell, Lock, MoonStar, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account preferences and security configuration." />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Security" subtitle="Account protection settings">
          <SwitchRow icon={<ShieldCheck size={18} />} title="Two-factor authentication" desc="Require an additional verification step." enabled={twoFactor} onToggle={setTwoFactor} />
          <SwitchRow icon={<Lock size={18} />} title="Session protection" desc="Sign out inactive sessions after a period." enabled={true} onToggle={() => {}} />
        </SectionCard>

        <SectionCard title="Preferences" subtitle="Experience settings">
          <SwitchRow icon={<Bell size={18} />} title="Email notifications" desc="Get updates on ROI and referral payouts." enabled={notifications} onToggle={setNotifications} />
          <SwitchRow icon={<MoonStar size={18} />} title="Dark mode" desc="Use the premium fintech dark interface." enabled={true} onToggle={() => {}} />
        </SectionCard>
      </div>
    </div>
  );
}

function SwitchRow({ icon, title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">{icon}</div>
        <div>
          <div className="font-medium text-white">{title}</div>
          <div className="text-sm text-slate-400">{desc}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
