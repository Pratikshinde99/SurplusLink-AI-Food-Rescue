import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Heart, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

const Navbar = () => {
  const navigate = useNavigate();
  const user = api.getUserData();
  const isLoggedIn = Boolean(api.getAuthToken());

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 60px', height: '80px',
      background: 'rgba(5, 7, 10, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'white', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
        <div style={{ background: 'var(--primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
          <Utensils size={20} color="#000" strokeWidth={3} />
        </div>
        EcoFeed
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', transition: '0.2s' }}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Home</Link>
        <Link to="/restaurant" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
          <Utensils size={16} /> Suppliers
        </Link>
        <Link to="/ngo" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
          onMouseEnter={(e) => e.target.style.color = 'white'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
          <Heart size={16} /> NGO Portal
        </Link>
        <div style={{ width: '1px', height: '30px', background: 'var(--border)', margin: '0 10px' }} />
        <button onClick={() => navigate(isLoggedIn ? '/ngo' : '/login?next=/ngo')} style={{
          background: 'var(--primary)', color: '#000', padding: '12px 24px', borderRadius: '14px',
          fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 10px 20px rgba(16,185,129,0.15)'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(16,185,129,0.15)';
          }}
        >
          {isLoggedIn ? <ShieldCheck size={18} /> : <LayoutDashboard size={18} />}
          {isLoggedIn ? 'Mission Desk' : 'Command Center'}
        </button>

        {isLoggedIn && (
          <button
            onClick={() => {
              api.logout();
              navigate('/login');
            }}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              padding: '10px 12px',
              borderRadius: '10px',
              fontWeight: 700,
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            title={user.email || 'Logout'}
          >
            <LogOut size={14} /> Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
