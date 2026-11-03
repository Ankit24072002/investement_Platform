import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  CreditCard,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/investments', label: 'Investments', icon: BriefcaseBusiness },
  { to: '/roi-history', label: 'ROI History', icon: ArrowLeftRight },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/referrals/tree', label: 'Referral Tree', icon: ShieldCheck },
  { to: '/wallet', label: 'Wallet', icon: CircleDollarSign },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Admin', icon: BarChart3 },
];

export default function AppLayout({ children }) {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                N
              </div>
              <div>
                <div className="text-lg font-semibold text-white">NexaChain AI</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Investor Portal</div>
              </div>
            </div>
            <button className="rounded-xl border border-white/10 bg-slate-900/70 p-2 text-slate-300 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/18 to-violet-500/10 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.2)]'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? 'bg-blue-500/15 text-blue-200' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                  <Icon size={16} />
                </span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/5 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Signed in</div>
            <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{user?.fullName || 'Investor'}</div>
                  <div className="truncate text-[11px] text-slate-400">{user?.email || 'investor@nexachain.ai'}</div>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-700"
                  onClick={logout}
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="content-shell">
        <div className="content-inner">
          <header className="mb-7 flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/5 bg-slate-900/50 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.38)] backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-slate-200 lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-300">Overview</p>
                </div>
                <h2 className="text-xl font-semibold text-white md:text-2xl">NexaChain Investment Suite</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 md:flex">
                <BarChart3 size={14} className="text-blue-300" />
                <span>Live market</span>
              </div>
              <button className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-slate-200 transition hover:bg-slate-700/80">🔔</button>
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-800/80 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-blue-500/30">
                  {user?.fullName?.charAt(0) || 'N'}
                </div>
                <div className="hidden text-left md:block">
                  <div className="text-sm font-medium text-white">{user?.fullName || 'Investor'}</div>
                  <div className="text-[10px] text-slate-400">Premium Access</div>
                </div>
              </div>
            </div>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
