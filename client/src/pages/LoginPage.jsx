import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AuthLayout from '../components/common/AuthLayout';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
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
      const { data: response } = await api.post('/auth/login', form);
      const payload = response?.data || response;
      if (!payload?.token || !payload?.user) {
        throw new Error('The server returned an incomplete sign-in response.');
      }
      setToken(payload.token);
      setUser(payload.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="auth-label" htmlFor="login-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input
              id="login-email"
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
          <label className="auth-label" htmlFor="login-password">Password</label>
          <div className="auth-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="input-shell has-action"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
              className="auth-icon-button"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{error}</div>}

        <button type="submit" disabled={loading} className="premium-button primary mt-1 w-full">
          {loading ? 'Signing in…' : 'Sign in securely'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        New to NexaChain?{' '}
        <Link to="/register" className="font-semibold text-blue-300 transition hover:text-blue-200">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
