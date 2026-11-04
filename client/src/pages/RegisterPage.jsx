import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Smartphone, UserRound, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/common/AuthLayout';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registration } = form;
      const { data: response } = await api.post('/auth/register', registration);
      const payload = response?.data || response;
      if (!payload?.token || !payload?.user) {
        throw new Error('The server returned an incomplete registration response.');
      }
      setToken(payload.token);
      setUser(payload.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="auth-label" htmlFor="register-name">Full name</label>
          <div className="auth-input-wrap">
            <UserRound size={17} aria-hidden="true" />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              className="input-shell"
              placeholder="Your full name"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="auth-label" htmlFor="register-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="input-shell"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="auth-label" htmlFor="register-mobile">Mobile number</label>
            <div className="auth-input-wrap">
              <Smartphone size={17} aria-hidden="true" />
              <input
                id="register-mobile"
                type="tel"
                autoComplete="tel"
                value={form.mobileNumber}
                onChange={(event) => setForm({ ...form, mobileNumber: event.target.value })}
                className="input-shell"
                placeholder="Your mobile number"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="auth-label" htmlFor="register-confirm-password">Confirm password</label>
          <div className="auth-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              className="input-shell has-action"
              placeholder="Re-enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="auth-icon-button"
              aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div>
          <label className="auth-label" htmlFor="register-password">Password</label>
          <div className="auth-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="input-shell has-action"
              placeholder="At least 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="auth-icon-button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div>
          <label className="auth-label" htmlFor="register-referral">Referral code <span className="font-normal text-slate-500">(optional)</span></label>
          <div className="auth-input-wrap">
            <UsersRound size={17} aria-hidden="true" />
            <input
              id="register-referral"
              type="text"
              autoComplete="off"
              value={form.referralCode}
              onChange={(event) => setForm({ ...form, referralCode: event.target.value.toUpperCase() })}
              className="input-shell"
              placeholder="Enter an invite code"
            />
          </div>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{error}</div>}

        <button type="submit" disabled={loading} className="premium-button primary mt-1 w-full">
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <ArrowRight size={16} />}
        </button>
        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          By creating an account, you agree to use the portal in accordance with its account and investment terms.
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-blue-300 transition hover:text-blue-200">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
