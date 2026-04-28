import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { dashboardTheme } from '../lib/dashboardTheme';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const nextRoute = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/ngo';
  }, [location.search]);

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    organization: '',
    role: 'ngo',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'register') {
        await api.register(form.email, form.password, form.organization, form.role);
      } else {
        await api.login(form.email, form.password);
      }
      navigate(nextRoute);
    } catch (err) {
      console.error('Auth Error Full Object:', err);
      if (!err.response) {
        setError('Network Error: Unable to reach the server at ' + api.getBaseUrl() + '. Please ensure the backend is running.');
      } else {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', '));
        } else {
          setError(detail || 'Authentication failed. Please verify your details.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={dashboardTheme.container}>
      <div style={{ maxWidth: '520px', margin: '0 auto', ...dashboardTheme.panel, padding: '28px' }}>
        <p style={{ ...dashboardTheme.badge, color: 'var(--secondary)', marginBottom: '10px' }}>Join the Network</p>
        <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '8px' }}>
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Sign in to manage donations and coordinate pickups.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === 'login' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.02)',
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <LogIn size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Login
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === 'register' ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.02)',
              color: mode === 'register' ? '#93c5fd' : 'var(--text-muted)',
            }}
          >
            <UserPlus size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Register
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: '#fecaca', borderRadius: '10px', padding: '10px 12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '12px' }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
          />

          {mode === 'register' && (
            <>
              <input
                placeholder="Organization Name"
                value={form.organization}
                onChange={(event) => setForm((prev) => ({ ...prev, organization: event.target.value }))}
                required
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
              />
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
              >
                <option value="supplier">I am a Food Supplier (Restaurant, Bakery, etc.)</option>
                <option value="ngo">I am an NGO (Food Rescue Team)</option>
              </select>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '4px',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 800,
              background: 'var(--primary)',
              color: '#042219',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <KeyRound size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
