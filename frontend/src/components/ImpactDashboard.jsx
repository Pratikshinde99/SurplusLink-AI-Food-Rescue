import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Footprints, Soup } from 'lucide-react';
import { api } from '../lib/api';

const ImpactDashboard = () => {
  const [stats, setStats] = useState({
    food_saved_kg: 0,
    people_fed: 0,
    co2_offset_kg: 0,
    total_listings: 0,
    available: 0,
    claimed: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch { /* keep defaults */ }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: 'FOOD SAVED',
      value: `${stats.food_saved_kg.toLocaleString()} kg`,
      sub: `${stats.total_listings} Donations Rescued`,
      icon: <TrendingUp size={28} />,
      color: 'var(--primary)',
    },
    {
      label: 'PEOPLE FED',
      value: `${stats.people_fed.toLocaleString()}+`,
      sub: `${stats.claimed} NGO Pickups Completed`,
      icon: <Soup size={28} />,
      color: 'var(--secondary)',
    },
    {
      label: 'CARBON OFFSET',
      value: `${(stats.co2_offset_kg / 1000).toFixed(2)} Tons`,
      sub: `${stats.co2_offset_kg} kg Emissions Prevented`,
      icon: <Footprints size={28} />,
      color: 'var(--accent)',
    },
  ];

  return (
    <section style={{ padding: '100px 0', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '64px' }}>
          <div style={{ 
            color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', 
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' 
          }}>
            Real-Time Network Activity
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Our Community Impact
          </h2>
          <div style={{ width: '80px', height: '4px', background: 'var(--primary)', borderRadius: '100px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '28px',
                padding: '48px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${card.color}60`;
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: `${card.color}15`, color: card.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {card.icon}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '12px' }}>
                {card.label}
              </p>
              <h3 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '8px', color: 'white', letterSpacing: '-0.02em' }}>
                {card.value}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>{card.sub}</p>
              
              <div style={{ 
                marginTop: '32px', height: '6px', background: 'rgba(255,255,255,0.03)', 
                borderRadius: '100px', overflow: 'hidden' 
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, (stats.claimed / Math.max(stats.total_listings, 1)) * 100 + 30)}%` }}
                  transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
                  style={{ height: '100%', background: card.color, borderRadius: '100px', boxShadow: `0 0 15px ${card.color}60` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactDashboard;
