import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Leaf, Users, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImpactDashboard from '../components/ImpactDashboard';

const Home = () => {
  const navigate = useNavigate();

  return (
    <main style={{ background: 'radial-gradient(circle at 50% -20%, rgba(16,185,129,0.15) 0%, transparent 50%)' }}>
      {/* Hero */}
      <section style={{ paddingTop: '160px', paddingBottom: '100px', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center' }}>
            {/* Left: Text */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '10px 20px', borderRadius: '100px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '32px',
                letterSpacing: '1px', textTransform: 'uppercase'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
                Network Intelligence Active
              </div>

              <h1 style={{ fontSize: '4.8rem', fontWeight: 800, lineHeight: 1, marginBottom: '24px', letterSpacing: '-0.04em' }}>
                Bridging Surplus<br />
                <span style={{ 
                  background: 'linear-gradient(135deg, var(--primary) 0%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>to Sufficiency.</span>
              </h1>

              <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '48px', maxWidth: '520px', lineHeight: 1.6, fontWeight: 400 }}>
                EcoFeed uses advanced AI to synchronize food surplus with community need, eliminating waste and feeding thousands every day.
              </p>

              <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => navigate('/restaurant')} style={{
                  background: 'var(--primary)', color: '#000', padding: '18px 40px', borderRadius: '16px',
                  fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  boxShadow: '0 15px 35px rgba(16,185,129,0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 45px rgba(16,185,129,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(16,185,129,0.3)';
                  }}
                >
                  Start Donation <ArrowRight size={22} strokeWidth={3} />
                </button>
                <button style={{
                  background: 'rgba(255,255,255,0.03)', color: 'white', padding: '18px 40px', borderRadius: '16px',
                  fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <PlayCircle size={22} /> Watch Demo
                </button>
              </div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }} 
              animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ perspective: '1000px' }}
            >
              <div style={{
                borderRadius: '32px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                position: 'relative',
                background: '#0d1117'
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, transparent 100%)',
                  zIndex: 1, pointerEvents: 'none'
                }} />
                <img
                  src="/assets/hero.png"
                  alt="EcoFeed Platform Visualization"
                  style={{ width: '100%', display: 'block', position: 'relative', zIndex: 0, transition: 'transform 0.5s' }}
                />
                
                {/* Floating Stats Card Overlay */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', bottom: '30px', left: '-40px',
                    background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                    padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    zIndex: 2, display: 'flex', alignItems: 'center', gap: '16px'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Leaf color="var(--primary)" size={24} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Real-time Savings</p>
                    <p style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>14,208 KG</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <ImpactDashboard />

      {/* Features */}
      <section style={{ padding: '120px 0', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em' }}>
              Designed for Scale.
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
              Our platform combines logistic intelligence with community trust to build a sustainable food future.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            <FeatureCard 
              icon={<Leaf color="var(--primary)" size={28} />} 
              color="var(--primary)" 
              title="Planet-Scale Impact"
              desc="Every rescued meal directly contributes to a significant reduction in methane emissions and landfill waste." />
            <FeatureCard 
              icon={<Users color="var(--secondary)" size={28} />} 
              color="var(--secondary)" 
              title="AI-Optimized Logistics"
              desc="Our proprietary algorithms match surplus with proximity, ensuring the fastest possible delivery to those in need." />
            <FeatureCard 
              icon={<ShieldCheck color="var(--accent)" size={28} />} 
              color="var(--accent)" 
              title="Enterprise Security"
              desc="Full chain-of-custody tracking with encrypted QR verification for maximum transparency and safety." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 48px', borderTop: '1px solid var(--border)', background: 'var(--bg-dark)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={18} color="#000" strokeWidth={3} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>EcoFeed</span>
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            © 2026 EcoFeed Intelligence · Built for the Google Solution Challenge
          </div>
        </div>
      </footer>
    </main>
  );
};

const FeatureCard = ({ icon, title, desc, color }) => (
  <motion.div
    whileHover={{ y: -10, borderColor: `${color}40` }}
    style={{
      background: 'rgba(13, 17, 23, 0.4)', border: '1px solid var(--border)',
      borderRadius: '24px', padding: '48px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default', backdropFilter: 'blur(8px)'
    }}
  >
    <div style={{
      width: '64px', height: '64px', borderRadius: '18px',
      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px', color: 'white', letterSpacing: '-0.01em' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>{desc}</p>
  </motion.div>
);

export default Home;
