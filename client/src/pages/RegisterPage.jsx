import { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', form);
      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(15,23,42,0.7)] lg:grid-cols-[1.02fr_1.2fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.26),_transparent_36%)]" />
          <div className="relative z-10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white">
              N
            </div>
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-200">Launch portfolio</div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">Open your next investment account.</h1>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Check size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Investor onboarding</div>
                  <div className="text-xs text-slate-300">Fast account setup with referral support</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-sm">
              <div className="mb-3 font-medium text-white">Everything included</div>
              <ul className="space-y-2 text-slate-300">
                <li>• Secure account creation</li>
                <li>• Referral code configuration</li>
                <li>• Portfolio dashboard access</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                N
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">Create account</h2>
              <p className="mt-2 text-sm text-slate-400">Start investing with NexaChain AI.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Full name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-shell" placeholder="Jane Doe" required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-shell" placeholder="jane@example.com" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Mobile</label>
                  <input type="tel" value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} className="input-shell" placeholder="9876543210" required />
                </div>
              </div>

              <div className="relative">
                <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-shell pr-12"
                  placeholder="Create a secure password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Referral code (optional)</label>
                <input type="text" value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value })} className="input-shell" placeholder="INVEST22" />
              </div>

              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

              <button type="submit" disabled={loading} className="premium-button primary w-full">
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-300 hover:text-blue-200">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
