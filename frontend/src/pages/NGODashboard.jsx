import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Info,
  MapPinned,
  Package,
  Printer,
  QrCode,
  Search,
  Truck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { dashboardTheme } from '../lib/dashboardTheme';
import { NotificationService } from '../lib/NotificationService';

const STATUS = {
  idle: 'idle',
  claiming: 'claiming',
  claimed: 'claimed',
  delivered: 'delivered',
};

const getFallbackScore = (listing) => {
  const hour = Number.parseInt((listing.expiry_time || '12:00').split(':')[0], 10);
  const now = new Date().getHours();
  const hoursLeft = Math.max(0, hour - now);
  const urgency = Math.max(0, (1 - hoursLeft / 12) * 45);
  return Math.min(98, Math.round(52 + urgency));
};

const NGODashboard = () => {
  const [listings, setListings] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [lockedMission, setLockedMission] = useState(null);
  const [status, setStatus] = useState(STATUS.idle);
  const [query, setQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClaimPopup, setShowClaimPopup] = useState(false);
  const [aiDetails, setAiDetails] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const fetchListings = useCallback(async () => {
    try {
      const data = await api.getListings('available');
      
      // Notification Logic
      if (data.length > prevCount && prevCount > 0) {
        const newItem = data[0];
        NotificationService.send(
          '🚨 New Food Rescue Available!',
          `${newItem.food_type} in ${newItem.address}`
        );
      }
      
      setListings(data);
      setPrevCount(data.length);
      setError('');
    } catch {
      setError('Unable to load donations right now. Please refresh in a few seconds.');
    } finally {
      setLoading(false);
    }
  }, [prevCount]);

  useEffect(() => {
    NotificationService.requestPermission();
    fetchListings();
    const interval = setInterval(fetchListings, 5000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  useEffect(() => {
    if (!selectedId && listings.length > 0) {
      setSelectedId(listings[0].id);
    }
  }, [listings, selectedId]);

  useEffect(() => {
    const fetchAiDetails = async () => {
      if (!selectedId || status !== STATUS.idle) return;
      setAiLoading(true);
      try {
        const details = await api.getScore(selectedId);
        setAiDetails(details);
      } catch (err) {
        console.error("AI scoring failed, using fallback:", err);
        setAiDetails(null);
      } finally {
        setAiLoading(false);
      }
    };
    fetchAiDetails();
  }, [selectedId, status]);

  const enrichedListings = useMemo(() => {
    return listings
      .map((item) => ({
        ...item,
        score: getFallbackScore(item),
        distance: '2-4 km',
        eta: '10-18 min',
        recommendation: `Priority pickup recommended for ${item.food_type}. Confirm QR at source before dispatch.`,
      }))
      .sort((a, b) => b.score - a.score);
  }, [listings]);

  const filteredListings = useMemo(() => {
    return enrichedListings.filter((item) => {
      const q = query.trim().toLowerCase();
      const searchable = `${item.food_type} ${item.address} ${item.quantity}`.toLowerCase();
      return (q ? searchable.includes(q) : true) && item.score >= minScore;
    });
  }, [enrichedListings, minScore, query]);

  const selected = useMemo(() => {
    const selectedFromList = filteredListings.find((item) => item.id === selectedId);
    const base = selectedFromList || lockedMission || null;
    if (!base) return null;

    // Merge with AI details if available
    return {
      ...base,
      score: aiDetails?.score || base.score,
      recommendation: aiDetails?.recommendation || base.recommendation,
      distance: aiDetails?.distance || base.distance,
      eta: aiDetails?.eta || base.eta,
    };
  }, [filteredListings, lockedMission, selectedId, aiDetails]);

  const pickupToken = selected ? `ECO-${selected.id.slice(0, 6).toUpperCase()}` : '';
  const mapsUrl = selected
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.address)}`
    : '#';
  const embedMapUrl = selected
    ? `https://www.google.com/maps?q=${encodeURIComponent(selected.address)}&output=embed`
    : '';

  const printPickupSlip = () => {
    if (!selected) return;
    const qrValue = `ecofeed-pickup:${selected.id}:${pickupToken}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}`;
    const html = `
      <html>
        <head>
          <title>EcoFeed Pickup Slip</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #111; background: #fff; }
            .card { border: 2px solid #000; border-radius: 16px; padding: 32px; max-width: 600px; margin: 0 auto; position: relative; }
            .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 24px; }
            .brand { color: #10b981; font-weight: 800; font-size: 24px; }
            .slip-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 700; }
            h2 { margin: 0 0 12px; font-size: 22px; color: #000; }
            .row { margin: 12px 0; font-size: 15px; line-height: 1.5; }
            .label { color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-weight: 600; color: #111; }
            .token-box { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 8px; margin-top: 20px; text-align: center; }
            .token { font-family: monospace; font-weight: 800; font-size: 24px; letter-spacing: 2px; color: #0f172a; }
            .qr-container { text-align: center; margin-top: 24px; }
            .qr-container img { width: 150px; height: 150px; border: 1px solid #eee; padding: 8px; border-radius: 8px; }
            .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">EcoFeed</div>
              <div class="slip-title">Official Pickup Authorization</div>
            </div>
            
            <h2>${selected.food_type}</h2>
            
            <div class="row">
              <div class="label">Quantity / Amount</div>
              <div class="value">${selected.quantity}</div>
            </div>
            
            <div class="row">
              <div class="label">Pickup Location</div>
              <div class="value">${selected.address}</div>
            </div>
            
            <div class="row" style="display: flex; gap: 40px;">
              <div>
                <div class="label">Estimated ETA</div>
                <div class="value">${selected.eta}</div>
              </div>
              <div>
                <div class="label">Distance</div>
                <div class="value">${selected.distance}</div>
              </div>
            </div>

            <div class="token-box">
              <div class="label">Verification Code</div>
              <div class="token">${pickupToken}</div>
            </div>

            <div class="qr-container">
              <img src="${qrUrl}" alt="QR Code" />
              <div style="font-size: 10px; color: #666; margin-top: 8px;">SCAN AT SOURCE TO VERIFY</div>
            </div>
            
            <div class="footer">
              This slip authorizes the bearer to collect the specified food donation.<br/>
              Generated by EcoFeed Intelligence • ${new Date().toLocaleString()}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // Optional: window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    const w = window.open('', '_blank', 'width=860,height=700');
    if (!w) {
      setError('Popup blocked. Allow popups to print the pickup slip.');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  const handleClaim = async () => {
    if (!selected) return;

    if (!api.getAuthToken()) {
      window.location.href = '/login?next=/ngo';
      return;
    }

    setStatus(STATUS.claiming);
    setError('');

    try {
      await api.claimListing(selected.id);
      setLockedMission(selected);
      setStatus(STATUS.claimed);
      setShowClaimPopup(true);
      await fetchListings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Claim failed. Please try again.');
      setStatus(STATUS.idle);
    }
  };

  const markDelivered = async () => {
    if (!selected) return;
    setStatus(STATUS.claiming); // reusing state for loading
    try {
      await api.verifyPickup(selected.id, pickupToken);
      setStatus(STATUS.delivered);
      NotificationService.send('✅ Mission Accomplished!', 'The delivery has been verified and logged.');
      setLockedMission(null); // Clear locked mission after delivery
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Please try again.');
      setStatus(STATUS.claimed);
    }
  };

  const statusText = {
    [STATUS.idle]: 'Select and claim a donation to start mission.',
    [STATUS.claiming]: 'Securing pickup with supplier...',
    [STATUS.claimed]: 'Pickup confirmed. Use QR at supplier desk.',
    [STATUS.delivered]: 'Delivery confirmed. Mission closed.',
  }[status];

  return (
    <div style={dashboardTheme.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ ...dashboardTheme.badge, color: 'var(--secondary)', marginBottom: '8px' }}>NGO Rescue Portal</p>
          <h1 style={dashboardTheme.title}>Available Donations</h1>
          <p style={dashboardTheme.subtitle}>
            Browse available food, pick a rescue mission, and help feed those in need.
          </p>
        </div>

        <div className="glass" style={{ borderRadius: '16px', padding: '12px 16px', minWidth: '260px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700 }}>Current Activity</p>
          <p style={{ color: status === STATUS.delivered ? 'var(--primary)' : 'white', fontWeight: 800 }}>{statusText}</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: '#fecaca', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: '420px 1fr' }}>
        <section className="glass" style={{ borderRadius: '24px', padding: '18px', minHeight: '700px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ color: 'white', fontSize: '1.05rem' }}>Available Donations</h2>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{filteredListings.length} items</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search food or address"
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 10px 9px 30px', color: 'white' }}
              />
            </div>
            <select
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
              style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 8px' }}
            >
              <option value={0}>All Scores</option>
              <option value={60}>60+</option>
              <option value={75}>75+</option>
              <option value={85}>85+</option>
            </select>
          </div>

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {loading ? (
              <p style={{ color: 'var(--text-dim)', padding: '16px 6px' }}>Loading donation feed...</p>
            ) : filteredListings.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 10px' }}>
                <Package size={34} style={{ marginBottom: '8px' }} />
                <p>No matching donations found.</p>
              </div>
            ) : (
              filteredListings.map((item) => {
                const active = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      textAlign: 'left',
                      borderRadius: '14px',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                      padding: '12px',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{item.food_type}</strong>
                      <span style={{ color: item.score >= 85 ? '#f59e0b' : 'var(--primary)', fontSize: '0.78rem', fontWeight: 800 }}>{item.score}%</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '6px' }}>{item.quantity}</p>
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {item.expiry_time}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPinned size={12} /> {item.distance}</span>
                    </div>
                    <p style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.77rem' }}>{item.address}</p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gap: '18px', gridTemplateRows: 'auto 1fr auto' }}>
          <div className="glass" style={{ borderRadius: '24px', padding: '18px' }}>
            <h2 style={{ fontSize: '1.03rem', color: 'white', marginBottom: '12px' }}>How to Rescue Food</h2>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))' }}>
              {['1. Select food', '2. See the route', '3. Claim & get QR', '4. Confirm delivery'].map((step) => (
                <div key={step} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', padding: '10px 11px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '18px' }}>
            <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden', minHeight: '470px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ color: 'white', fontSize: '0.95rem' }}>Google Maps Route</h3>
                {selected && (
                  <button
                    onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                    style={{ border: 'none', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Open in Maps <ExternalLink size={13} />
                  </button>
                )}
              </div>

              {selected ? (
                <>
                  <iframe
                    title="Donation Route Map"
                    src={embedMapUrl}
                    style={{ border: 0, width: '100%', height: '280px', background: '#000' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div style={{ padding: '14px 16px 10px' }}>
                    <h4 style={{ color: 'white', marginBottom: '8px' }}>{selected.food_type}</h4>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>{selected.address}</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', border: '1px solid var(--border)', borderRadius: '999px', padding: '5px 10px' }}>ETA {selected.eta}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', border: '1px solid var(--border)', borderRadius: '999px', padding: '5px 10px' }}>{selected.distance}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', border: '1px solid var(--border)', borderRadius: '999px', padding: '5px 10px' }}>Score {selected.score}/100</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.88rem', minHeight: '1.4em' }}>
                      <Info size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      {aiLoading ? (
                        <span className="shimmer" style={{ display: 'inline-block', width: '80%', height: '1em', borderRadius: '4px' }}></span>
                      ) : (
                        selected.recommendation
                      )}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={14} /> Pickup Instructions
                    </h4>
                    <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                      <li>Follow the map and call the supplier before arrival.</li>
                      <li>Show the QR code at the pickup point.</li>
                      <li>Check food quality and amount before loading.</li>
                      <li>Mark as delivered once you drop it off.</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 20px', color: 'var(--text-dim)' }}>Select a donation to load map and pickup instructions.</div>
              )}
            </div>

            <div className="glass" style={{ borderRadius: '24px', padding: '16px' }}>
              <h3 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '12px' }}>Pickup Verification</h3>

              {selected ? (
                <>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '12px', display: 'inline-block', marginBottom: '12px' }}>
                    <QRCodeSVG value={`ecofeed-pickup:${selected.id}:${pickupToken}`} size={165} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '8px' }}>
                    Show this QR code to the supplier when you arrive.
                  </p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '14px' }}>
                    Pickup Code: <strong style={{ color: 'white' }}>{pickupToken}</strong>
                  </p>

                  <button
                    disabled={status === STATUS.claiming || status === STATUS.claimed || status === STATUS.delivered}
                    onClick={handleClaim}
                    style={{ width: '100%', border: 'none', borderRadius: '11px', padding: '11px 12px', fontWeight: 800, cursor: status === STATUS.idle ? 'pointer' : 'not-allowed', background: status === STATUS.idle ? 'var(--primary)' : 'rgba(255,255,255,0.12)', color: status === STATUS.idle ? '#04130d' : 'var(--text-dim)', marginBottom: '9px' }}
                  >
                    {status === STATUS.claiming ? 'Claiming...' : 'Claim Donation'}
                  </button>

                  <button
                    disabled={status !== STATUS.claimed}
                    onClick={markDelivered}
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 12px', fontWeight: 700, cursor: status === STATUS.claimed ? 'pointer' : 'not-allowed', background: status === STATUS.claimed ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.02)', color: status === STATUS.claimed ? '#bfdbfe' : 'var(--text-dim)', marginBottom: '9px' }}
                  >
                    Mark as Delivered
                  </button>

                  <button
                    onClick={printPickupSlip}
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 12px', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Printer size={14} /> Print / Download Pickup Slip
                  </button>
                </>
              ) : (
                <p style={{ color: 'var(--text-dim)' }}>Select a donation first.</p>
              )}
            </div>
          </div>

          <div className="glass" style={{ borderRadius: '20px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: status === STATUS.delivered ? 'var(--primary)' : 'var(--text-muted)' }}>
              {status === STATUS.delivered ? <ClipboardCheck size={16} /> : <CheckCircle2 size={16} />}
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {status === STATUS.delivered ? 'Delivery confirmation completed.' : 'Delivery confirmation pending.'}
              </span>
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
              Deliver to: <strong style={{ color: 'white' }}>{selected ? selected.address : 'Select a donation to see address'}</strong>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showClaimPopup && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,8,0.7)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              style={{ width: 'min(520px, 90vw)', borderRadius: '20px', border: '1px solid var(--border)', background: '#0b1118', padding: '20px' }}
            >
              <h3 style={{ color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="var(--primary)" /> Donation Claimed Successfully
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                Pickup is confirmed. Navigate to supplier, show QR code, and use pickup code at desk.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', marginBottom: '14px' }}>
                <p style={{ color: 'white', fontWeight: 700 }}>{selected.food_type}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>{selected.address}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Pickup Code: {pickupToken}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')} style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'white', borderRadius: '9px', padding: '9px 12px', cursor: 'pointer' }}>Open Maps</button>
                <button onClick={() => setShowClaimPopup(false)} style={{ border: 'none', background: 'var(--primary)', color: '#082a1f', borderRadius: '9px', padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>Continue</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NGODashboard;
