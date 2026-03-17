import React, { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import donationService from '../services/donationService';
import userService from '../services/userService';

const Stats = () => {
  const [notifStats,    setNotifStats]    = useState({ total: 0, unread: 0, connected: 0 });
  const [donations,     setDonations]     = useState([]);

  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [lastUpdate,    setLastUpdate]    = useState(new Date());

  const currentUser = userService.getCurrentUser();

  // ── Charger toutes les stats ──────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      // 1. Notifications — lire depuis le service (déjà connecté en WebSocket)
      //    On fetch les notifs de l'utilisateur courant via l'API REST
      let notifData = { total: 0, unread: 0, connected: 0 };
      if (currentUser) {
        try {
          const notifs = await notificationService.fetchNotifications(currentUser.id);
          notifData = {
            total:     notifs.length,
            unread:    notifs.filter(n => !n.read).length,
            connected: notificationService.socket?.connected ? 1 : 0,
          };
        } catch (e) {
          console.log('Notifications non disponibles');
        }
      }

      // 2. Dons
      let donationsData = [];
      try {
        donationsData = await donationService.getAllDonations();
      } catch (e) {
        console.log('Dons non disponibles');
      }

      setNotifStats(notifData);
      setDonations(donationsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Chargement initial + rafraîchissement toutes les 10s
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // ✅ Mettre à jour les stats de notifs en temps réel via WebSocket
  useEffect(() => {
    const handleUpdate = (updatedNotifs) => {
      setNotifStats({
        total:     updatedNotifs.length,
        unread:    updatedNotifs.filter(n => !n.read).length,
        connected: notificationService.socket?.connected ? 1 : 0,
      });
    };

    notificationService.on('update', handleUpdate);
    return () => notificationService.off('update', handleUpdate);
  }, []);

  // ── Calculs ───────────────────────────────────────────────────────────
  const statusCounts = {
    available: donations.filter(d => d?.status === 'available').length,
    requested: donations.filter(d => d?.status === 'requested').length,
    accepted:  donations.filter(d => d?.status === 'accepted').length,
    completed: donations.filter(d => d?.status === 'completed').length,
  };

  const kgTotal = donations
    .filter(d => d?.status === 'accepted' || d?.status === 'completed')
    .reduce((acc, d) => acc + (d.quantity || 0), 0);

  if (loading) return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0b0e14',
      fontFamily: "'DM Sans', sans-serif", color: 'rgba(240,240,240,0.4)',
      fontSize: '0.9rem'
    }}>Chargement…</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .stats-root {
          min-height: 100vh;
          background: #0b0e14;
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem 1.5rem 4rem;
          position: relative;
        }

        .stats-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .stats-inner {
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .stats-header {
          margin-bottom: 2rem;
          animation: fadeUp 0.4s ease both;
        }

        .stats-page-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          color: #f0f0f0;
          letter-spacing: -0.04em;
          margin: 0 0 0.3rem;
        }

        .stats-page-sub {
          color: rgba(240,240,240,0.35);
          font-size: 0.875rem;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          animation: fadeUp 0.4s 0.05s ease both;
        }

        .stats-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.5rem;
          transition: transform 0.18s, border-color 0.18s;
        }

        .stats-card:hover {
          transform: translateY(-3px);
          border-color: rgba(74,222,128,0.2);
        }

        .stats-card-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          color: rgba(240,240,240,0.35);
          margin: 0 0 1rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .stats-big {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2.4rem;
          color: var(--accent, #4ade80);
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 0.25rem;
        }

        .stats-big-label {
          font-size: 0.78rem;
          color: rgba(240,240,240,0.35);
          margin-bottom: 1rem;
        }

        .stats-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0.75rem 0;
        }

        .stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.45rem;
          font-size: 0.82rem;
        }

        .stats-row:last-child { margin-bottom: 0; }

        .stats-row-label { color: rgba(240,240,240,0.4); }

        .stats-row-val {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: #f0f0f0;
        }

        /* Live dot */
        .stats-live {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          color: #4ade80;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .stats-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: blink 1.4s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .stats-error {
          text-align: center;
          padding: 1rem 1.5rem;
          color: #fca5a5;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.18);
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
        }

        .stats-footer {
          text-align: center;
          color: rgba(240,240,240,0.2);
          font-size: 0.73rem;
          margin-top: 1.5rem;
          animation: fadeUp 0.4s 0.15s ease both;
        }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="stats-root">
        <div className="stats-inner">

          {/* Header */}
          <div className="stats-header">
            <h1 className="stats-page-title">Statistiques</h1>
            <p className="stats-page-sub">Vue d'ensemble de l'activité FoodSave en temps réel.</p>
          </div>

          {error && <div className="stats-error">⚠️ {error}</div>}

          <div className="stats-grid">

            {/* ── Notifications ── */}
            <div className="stats-card">
              <div className="stats-live">
                <div className="stats-live-dot" />
                Temps réel
              </div>
              <p className="stats-card-title">📨 Notifications</p>
              <div className="stats-big" style={{ '--accent': '#4ade80' }}>
                {notifStats.total}
              </div>
              <div className="stats-big-label">reçues</div>
              <div className="stats-divider" />
              <div className="stats-row">
                <span className="stats-row-label">Non lues</span>
                <span className="stats-row-val" style={{ color: notifStats.unread > 0 ? '#f59e0b' : '#f0f0f0' }}>
                  {notifStats.unread}
                </span>
              </div>
              <div className="stats-row">
                <span className="stats-row-label">WebSocket</span>
                <span className="stats-row-val" style={{ color: notifStats.connected ? '#4ade80' : '#f87171' }}>
                  {notifStats.connected ? '● Connecté' : '○ Déconnecté'}
                </span>
              </div>
            </div>

            {/* ── Dons ── */}
            <div className="stats-card">
              <p className="stats-card-title">📦 Dons</p>
              <div className="stats-big" style={{ '--accent': '#60a5fa' }}>
                {donations.length}
              </div>
              <div className="stats-big-label">total</div>
              <div className="stats-divider" />
              <div className="stats-row">
                <span className="stats-row-label">Disponibles</span>
                <span className="stats-row-val" style={{ color: '#4ade80' }}>{statusCounts.available}</span>
              </div>
              <div className="stats-row">
                <span className="stats-row-label">Demandés</span>
                <span className="stats-row-val" style={{ color: '#f59e0b' }}>{statusCounts.requested}</span>
              </div>
              <div className="stats-row">
                <span className="stats-row-label">Acceptés</span>
                <span className="stats-row-val" style={{ color: '#60a5fa' }}>{statusCounts.accepted}</span>
              </div>
              <div className="stats-row">
                <span className="stats-row-label">Terminés</span>
                <span className="stats-row-val">{statusCounts.completed}</span>
              </div>
            </div>

            {/* ── Impact ── */}
            <div className="stats-card">
              <p className="stats-card-title">🌍 Impact</p>
              <div className="stats-big" style={{ '--accent': '#f59e0b' }}>
                {Math.round(kgTotal * 10) / 10}
              </div>
              <div className="stats-big-label">kg distribués</div>
              <div className="stats-divider" />
              <div className="stats-row">
                <span className="stats-row-label">Repas estimés</span>
                <span className="stats-row-val">{Math.round(kgTotal / 0.3)}</span>
              </div>
              <div className="stats-row">
                <span className="stats-row-label">CO₂ évité</span>
                <span className="stats-row-val">{Math.round(kgTotal * 2.5)} kg</span>
              </div>
            </div>



          </div>

          <div className="stats-footer">
            🔄 Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR')} · rafraîchissement auto toutes les 10s
          </div>

        </div>
      </div>
    </>
  );
};

export default Stats;