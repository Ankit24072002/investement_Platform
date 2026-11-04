import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  BriefcaseBusiness,
  Bell,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
  const { logout, user, theme, toggleTheme } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };
  const visibleNavItems = navItems.filter(({ to }) => to !== '/admin' || user?.role === 'admin');
  const activePage = visibleNavItems.find(({ to }) => to === pathname || (to !== '/' && pathname.startsWith(to))) || navItems[0];
  const searchResults = useMemo(
    () => visibleNavItems.filter(({ label }) => label.toLowerCase().includes(searchText.trim().toLowerCase())).slice(0, 5),
    [visibleNavItems, searchText]
  );

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    let active = true;
    setActivityLoading(true);
    setActivityError('');
    api.get('/wallet/transactions?page=1&limit=5')
      .then(({ data }) => {
        if (active) setRecentActivity(data?.data?.items || []);
      })
      .catch((error) => {
        if (active) setActivityError(error.response?.data?.message || 'Unable to load recent account activity.');
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [notificationsOpen]);

  return (
    <div className="page-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/15 bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-lg shadow-blue-950/40">
                N
              </div>
              <div>
                <div className="text-[15px] font-semibold tracking-tight text-white">NexaChain AI</div>
                <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">Investor portal</div>
              </div>
            </div>
            <button className="rounded-lg border border-white/10 bg-slate-900/70 p-2 text-slate-300 transition hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
            {visibleNavItems.map(({ to, label, icon: Icon }, index) => (
              <div key={to}>
                {index === 2 && <p className="mb-2 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">Activity & network</p>}
                {index === 7 && <p className="mb-2 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">Account</p>}
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                    isActive
                      ? 'bg-blue-400/[0.09] text-blue-100 ring-1 ring-inset ring-blue-300/15'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        isActive ? 'bg-blue-400/10 text-blue-200' : 'bg-white/[0.035] text-slate-500 group-hover:text-slate-200'
                      }`}>
                        <Icon size={16} strokeWidth={1.8} />
                      </span>
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/5 p-4">
            <div className="mb-2.5 px-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">Signed in as</div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/20 to-violet-400/20 text-xs font-semibold text-blue-100 ring-1 ring-inset ring-white/10">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'N'}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-100">{user?.fullName || 'Investor'}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">{user?.email || ''}</div>
                </div>
              </div>
              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-black/10 px-2.5 py-2 text-[11px] font-medium text-slate-400 transition hover:border-red-300/20 hover:bg-red-400/[0.06] hover:text-red-200"
                onClick={handleLogout}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <main className="content-shell">
        <div className="content-inner">
          <header className="relative !z-30 mb-7 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-slate-950/55 px-4 py-3.5 shadow-[0_12px_34px_rgba(0,0,0,0.16)] backdrop-blur-xl md:px-5">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-200 transition hover:bg-white/[0.08] lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <Menu size={18} />
              </button>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <span>Workspace</span>
                  <span aria-hidden="true">/</span>
                  <span className="text-slate-300">{activePage.label}</span>
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">{activePage.label}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative hidden xl:block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setSearchOpen(false);
                    if (event.key === 'Enter' && searchResults[0]) {
                      navigate(searchResults[0].to);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search pages..."
                  aria-label="Search dashboard pages"
                  className="input-shell !min-h-0 !w-44 !rounded-lg !py-2 !pl-9 !pr-3 text-xs focus:!w-56"
                />
                {searchOpen && searchText && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl">
                    {searchResults.length ? searchResults.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchText('');
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        <Icon size={14} /> {label}
                      </Link>
                    )) : <p className="px-3 py-2 text-xs text-slate-500">No matching pages.</p>}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 text-slate-400 transition hover:text-white"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 text-slate-400 transition hover:text-white"
                  aria-label="Recent account activity"
                  aria-expanded={notificationsOpen}
                >
                  <Bell size={15} />
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-slate-950 p-4 shadow-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-200">Recent account activity</p>
                      <Link to="/transactions" onClick={() => setNotificationsOpen(false)} className="text-[10px] text-blue-300 hover:text-blue-200">View all</Link>
                    </div>
                    {activityLoading ? (
                      <div className="mt-3 space-y-2" aria-label="Loading recent activity">
                        {[0, 1, 2].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />)}
                      </div>
                    ) : activityError ? (
                      <p role="alert" className="mt-3 text-xs leading-5 text-rose-300">{activityError}</p>
                    ) : recentActivity.length ? (
                      <ul className="mt-2 divide-y divide-white/[0.06]">
                        {recentActivity.map((item) => (
                          <li key={item._id} className="flex items-center justify-between gap-3 py-2.5">
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium text-slate-200">{item.description || item.transactionType || 'Account activity'}</span>
                              <span className="mt-0.5 block text-[10px] text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
                            </span>
                            <span className="flex-none text-xs font-semibold text-emerald-300">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(item.amount || 0))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">No recent account activity.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 sm:flex">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-slate-400">Secure session</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((open) => !open);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] py-1.5 pl-1.5 pr-2.5"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/80 to-indigo-500/80 text-xs font-bold text-white ring-1 ring-inset ring-white/15">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'N'}
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block max-w-36 truncate text-xs font-medium text-slate-100">{user?.fullName || 'Investor'}</span>
                    <span className="block text-[10px] capitalize text-slate-500">{user?.role || 'member'} account</span>
                  </span>
                  <ChevronDown size={13} className="text-slate-500" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl">
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
                      <UserRound size={14} /> Profile
                    </Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
                      <Settings size={14} /> Settings
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-300 hover:bg-rose-400/10">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
