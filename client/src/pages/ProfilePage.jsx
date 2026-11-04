import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Profile" subtitle="Review your account details and referral information." />

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <SectionCard title="Account" subtitle="Summary">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-xl font-bold text-white">
              {user?.fullName?.charAt(0) || 'N'}
            </div>
            <div>
              <div className="text-xl font-semibold text-white">{user?.fullName || 'Investor'}</div>
              <div className="text-sm text-slate-400">{user?.email || '—'}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Personal information" subtitle="Overview">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Full name" value={user?.fullName || '—'} />
            <InfoRow label="Email" value={user?.email || '—'} />
            <InfoRow label="Mobile" value={user?.mobileNumber || user?.mobile || '—'} />
            <InfoRow label="Referral code" value={user?.referralCode || '—'} />
            <InfoRow label="Account status" value={user?.accountStatus || 'active'} />
            <InfoRow label="Role" value={user?.role || 'user'} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}
