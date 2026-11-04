import { Activity, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, mode = 'login' }) {
  const isRegister = mode === 'register';

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link className="auth-brand" to="/login" aria-label="NexaChain AI sign in">
          <span className="auth-brand-mark" aria-hidden="true">N</span>
          <span>
            <span className="block text-sm font-semibold">NexaChain AI</span>
            <span className="block text-[10px] tracking-wide text-slate-400">INVESTOR PORTAL</span>
          </span>
        </Link>
        <span className="auth-topbar-note text-xs text-slate-400">A clearer view of your financial journey</span>
      </header>

      <div className="auth-layout">
        <section className="auth-visual">
          <div>
            <span className="auth-visual-mark">{isRegister ? 'Start with confidence' : 'Your portfolio, in focus'}</span>
            <h1>{isRegister ? 'Build your financial future with clarity.' : 'Welcome to a more thoughtful way to invest.'}</h1>
            <p className="auth-visual-copy">
              One secure place to follow your investments, understand returns, and stay connected to your referral network.
            </p>
          </div>

          <div>
            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon"><ShieldCheck size={17} /></span>
                <span>Private, protected account access</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon"><Activity size={17} /></span>
                <span>Portfolio and activity in one view</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon"><LockKeyhole size={17} /></span>
                <span>Clear records for every account movement</span>
              </div>
            </div>

            <div className="auth-preview" aria-hidden="true">
              <div className="auth-preview-top">
                <div className="auth-preview-dots"><span /><span /><span /></div>
                <span>Portfolio activity</span>
                <span className="text-slate-400">Overview</span>
              </div>
              <div className="auth-preview-chart">
                {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
              </div>
              <div className="auth-preview-note">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                A simple view of your account activity
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-form-heading">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                {isRegister ? 'Create your account' : 'Investor sign in'}
              </div>
              <h2>{isRegister ? 'Get started' : 'Welcome back'}</h2>
              <p>{isRegister ? 'Set up your NexaChain account in just a few steps.' : 'Sign in to continue to your secure investor portal.'}</p>
            </div>
            {children}
          </div>
        </section>
      </div>

      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} NexaChain AI</span>
        <span>Secure access · Account data stays private</span>
      </footer>
    </main>
  );
}
