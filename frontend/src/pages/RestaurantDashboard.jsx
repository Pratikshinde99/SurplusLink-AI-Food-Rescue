import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, MapPin, Package, Plus, Send, Trash2, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { dashboardTheme } from '../lib/dashboardTheme';
import { NotificationService } from '../lib/NotificationService';

const initialForm = {
  food_type: '',
  quantity: '',
  expiry_time: '',
  address: '',
};

const RestaurantDashboard = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [predictedImpact, setPredictedImpact] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkConnectivity = async () => {
      const online = await api.healthCheck();
      if (mounted) {
        setIsOnline(online);
      }
    };

    const loadListings = async () => {
      try {
        const user = api.getUserData();
        const data = await api.getListings(null, user.user_id);
        if (mounted) {
          // Notify if status changed from available to claimed
          if (listings.length > 0) {
            data.forEach(newItem => {
              const oldItem = listings.find(l => l.id === newItem.id);
              if (oldItem && oldItem.status === 'available' && newItem.status === 'claimed') {
                NotificationService.send(
                  '🤝 Donation Claimed!',
                  `An NGO has claimed your ${newItem.food_type}. Get ready for pickup!`
                );
              }
            });
          }
          setListings(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        if (mounted) {
          setIsOnline(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkConnectivity();
    loadListings();

    const connectivityInterval = setInterval(checkConnectivity, 10000);
    const refreshInterval = setInterval(loadListings, 5000);

    return () => {
      mounted = false;
      clearInterval(connectivityInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!formData.food_type.trim()) errors.food_type = 'Food type is required';
    if (!formData.quantity.trim()) errors.quantity = 'Quantity is required';
    if (!formData.expiry_time) errors.expiry_time = 'Expiry time is required';
    if (!formData.address.trim()) errors.address = 'Address is required';

    if (formData.food_type.length > 500) errors.food_type = 'Food type is too long';
    if (formData.address.length > 200) errors.address = 'Address is too long';

    return errors;
  };

  const fetchListings = async () => {
    try {
      const user = api.getUserData();
      const data = await api.getListings(null, user.user_id);
      setListings(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setIsOnline(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setErrorMessage('Please fix the errors below');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createListing(formData);
      // Optimistic update: Prepend to list immediately
      setListings(current => [response, ...current]);
      
      setFormData(initialForm);
      setPredictedImpact(null);
      setFormErrors({});
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to share - check your connection';
      setErrorMessage(message);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.food_type && formData.quantity) {
        try {
          const impact = await api.predictImpact(formData);
          setPredictedImpact(impact);
        } catch (e) {
          console.warn('Impact prediction failed');
        }
      } else {
        setPredictedImpact(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.food_type, formData.quantity]);

  const deleteListing = async (id) => {
    try {
      await api.deleteListing(id);
      setListings((current) => current.filter((listing) => listing.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage('Failed to delete listing');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '16px',
    borderRadius: '14px',
    fontFamily: 'inherit',
    fontSize: '1rem',
    marginTop: '10px',
    outline: 'none',
    transition: 'all 0.2s',
  };

  const labelStyle = {
    color: 'var(--text-dim)',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  return (
    <div style={dashboardTheme.container}>
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '100px',
              left: '50%',
              zIndex: 9999,
              background: '#ef4444',
              color: '#fff',
              padding: '16px 32px',
              borderRadius: '18px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '1rem',
              boxShadow: '0 20px 40px rgba(239,68,68,0.3)',
            }}
          >
            <AlertCircle size={22} strokeWidth={3} /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '100px',
              left: '50%',
              zIndex: 9999,
              background: 'var(--primary)',
              color: '#000',
              padding: '16px 32px',
              borderRadius: '18px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '1rem',
              boxShadow: '0 20px 40px rgba(16,185,129,0.3)',
            }}
          >
            <CheckCircle size={22} strokeWidth={3} /> Rescue Mission Broadcasted Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                padding: '6px 14px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '8px',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '1px',
              }}
            >
              SUPPLIER NODE 01
            </div>
          </div>
          <h1 style={dashboardTheme.title}>
            Manage Donations
          </h1>
          <p style={dashboardTheme.subtitle}>Share your surplus food with local NGOs in seconds.</p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '14px 24px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {isOnline ? (
            <>
              <Wifi size={16} color="var(--primary)" />
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px' }}>NETWORK ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff size={16} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px' }}>OFFLINE MODE</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '40px', alignItems: 'start' }}>
        <div className="glass" style={{ borderRadius: '32px', padding: '40px', position: 'sticky', top: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>New Donation</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Inventory Item</label>
              <input
                style={{ ...inputStyle, borderColor: formErrors.food_type ? '#ef4444' : 'var(--border)' }}
                placeholder="e.g. Fresh Garden Salad, Artisan Bread"
                value={formData.food_type}
                maxLength={500}
                onFocus={(event) => {
                  event.target.style.borderColor = formErrors.food_type ? '#ef4444' : 'var(--primary)';
                  event.target.style.background = 'rgba(16,185,129,0.03)';
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = formErrors.food_type ? '#ef4444' : 'var(--border)';
                  event.target.style.background = 'rgba(255,255,255,0.02)';
                }}
                onChange={(event) => {
                  setFormData({ ...formData, food_type: event.target.value });
                  if (formErrors.food_type) {
                    setFormErrors((current) => ({ ...current, food_type: undefined }));
                  }
                }}
                required
              />
              {formErrors.food_type && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{formErrors.food_type}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Amount / Quantity</label>
                <input
                  style={{ ...inputStyle, borderColor: formErrors.quantity ? '#ef4444' : 'var(--border)' }}
                  placeholder="e.g. 10 kg, 20 meals"
                  value={formData.quantity}
                  onFocus={(event) => (event.target.style.borderColor = formErrors.quantity ? '#ef4444' : 'var(--primary)')}
                  onBlur={(event) => (event.target.style.borderColor = formErrors.quantity ? '#ef4444' : 'var(--border)')}
                  onChange={(event) => {
                    setFormData({ ...formData, quantity: event.target.value });
                    if (formErrors.quantity) {
                      setFormErrors((current) => ({ ...current, quantity: undefined }));
                    }
                  }}
                  required
                />
                {formErrors.quantity && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{formErrors.quantity}</p>}
              </div>

              <div>
                <label style={labelStyle}>Safety Expiry</label>
                <input
                  type="time"
                  style={{ ...inputStyle, borderColor: formErrors.expiry_time ? '#ef4444' : 'var(--border)' }}
                  value={formData.expiry_time}
                  onFocus={(event) => (event.target.style.borderColor = formErrors.expiry_time ? '#ef4444' : 'var(--primary)')}
                  onBlur={(event) => (event.target.style.borderColor = formErrors.expiry_time ? '#ef4444' : 'var(--border)')}
                  onChange={(event) => {
                    setFormData({ ...formData, expiry_time: event.target.value });
                    if (formErrors.expiry_time) {
                      setFormErrors((current) => ({ ...current, expiry_time: undefined }));
                    }
                  }}
                  required
                />
                {formErrors.expiry_time && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{formErrors.expiry_time}</p>}
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={labelStyle}>Pickup Address</label>
              <input
                style={{ ...inputStyle, borderColor: formErrors.address ? '#ef4444' : 'var(--border)' }}
                placeholder="Where should the NGO collect the food?"
                value={formData.address}
                maxLength={200}
                onFocus={(event) => (event.target.style.borderColor = formErrors.address ? '#ef4444' : 'var(--primary)')}
                onBlur={(event) => (event.target.style.borderColor = formErrors.address ? '#ef4444' : 'var(--border)')}
                onChange={(event) => {
                  setFormData({ ...formData, address: event.target.value });
                  if (formErrors.address) {
                    setFormErrors((current) => ({ ...current, address: undefined }));
                  }
                }}
                required
              />
              {formErrors.address && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{formErrors.address}</p>}
            </div>

            <AnimatePresence>
              {predictedImpact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ 
                    background: 'rgba(16,185,129,0.05)', 
                    border: '1px solid rgba(16,185,129,0.2)', 
                    borderRadius: '16px', 
                    padding: '16px', 
                    marginBottom: '24px',
                    overflow: 'hidden'
                  }}
                >
                  <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                    Predicted Community Impact
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>{predictedImpact.people_fed}</p>
                      <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>People Fed</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>{predictedImpact.co2_saved_kg} kg</p>
                      <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>CO2 Offset</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              style={{
                width: '100%',
                background: isOnline ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: isOnline ? '#000' : 'var(--text-dim)',
                padding: '20px',
                borderRadius: '18px',
                fontWeight: 800,
                border: 'none',
                cursor: isOnline && !isSubmitting ? 'pointer' : 'not-allowed',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isOnline ? '0 15px 30px rgba(16,185,129,0.2)' : 'none',
              }}
              onMouseEnter={(event) => {
                if (!isSubmitting && isOnline) {
                  event.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {!isOnline ? (
                <>
                  <WifiOff size={20} /> Offline - Check Connection
                </>
              ) : isSubmitting ? (
                'Sharing...'
              ) : (
                <>
                  <Send size={20} strokeWidth={2.5} /> Share Donation
                </>
              )}
            </button>
          </form>
        </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>Your Active Donations</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700, padding: '6px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '100px', border: '1px solid var(--border)' }}>
              {listings.length} ACTIVE
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                Loading your donations...
              </motion.div>
            </div>
          ) : listings.length === 0 ? (
            <div className="glass" style={{ borderRadius: '24px', padding: '100px 40px', textAlign: 'center' }}>
              <Package size={64} color="var(--text-dim)" style={{ marginBottom: '24px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>No active donations yet.</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '8px' }}>Use the form on the left to share your first donation.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {listings.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '24px',
                      padding: '24px 32px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      event.currentTarget.style.transform = 'translateX(8px)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = 'var(--border)';
                      event.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: item.status === 'available' ? 'var(--primary)' : 'var(--secondary)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        <Package size={24} color={item.status === 'available' ? 'var(--primary)' : 'var(--secondary)'} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: '6px' }}>{item.food_type}</h4>
                        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {item.expiry_time}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {item.address}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            padding: '4px 14px',
                            borderRadius: '100px',
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            background: item.status === 'available' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                            color: item.status === 'available' ? 'var(--primary)' : 'var(--secondary)',
                            border: `1px solid ${item.status === 'available' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
                            marginBottom: '8px',
                            display: 'inline-block',
                          }}
                        >
                          {item.status === 'available' ? 'LIVE' : 'CLAIMED'}
                        </div>
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 800 }}>{item.quantity}</p>
                      </div>

                      <button
                        onClick={() => deleteListing(item.id)}
                        style={{
                          width: '44px',
                          height: '44px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          color: 'var(--text-dim)',
                          borderRadius: '14px',
                          transition: '0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.color = '#ef4444';
                          event.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                          event.currentTarget.style.background = 'rgba(239,68,68,0.05)';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.color = 'var(--text-dim)';
                          event.currentTarget.style.borderColor = 'var(--border)';
                          event.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
