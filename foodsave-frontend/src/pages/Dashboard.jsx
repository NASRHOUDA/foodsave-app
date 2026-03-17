import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';
import donationService from '../services/donationService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonations: 0,
    kgSaved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = userService.getCurrentUser();
      setUser(currentUser);
      try {
        const donations = await donationService.getAllDonations();
        const activeDonations = donations.filter(d => d.status === 'available').length;
        const kgSaved = donations
          .filter(d => d.status === 'completed')
          .reduce((acc, d) => acc + d.quantity, 0);
        setStats({
          totalDonations: donations.length,
          activeDonations,
          kgSaved: Math.round(kgSaved * 10) / 10
        });
      } catch (error) {
        console.error('Erreur stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!user || loading) return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0b0e14',
      fontFamily: "'DM Sans', sans-serif", color: 'rgba(240,240,240,0.4)',
      fontSize: '0.9rem'
    }}>
      Chargement…
    </div>
  );

  const isMerchant = user.role === 'merchant';

  const statCards = [
    {
      label: 'Dons totaux',
      value: stats.totalDonations,
      suffix: '',
      icon: '📦',
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.08)',
      border: 'rgba(74,222,128,0.18)',
    },
    {
      label: 'Disponibles',
      value: stats.activeDonations,
      suffix: '',
      icon: '✅',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.18)',
    },
    {
      label: 'Kg sauvés',
      value: stats.kgSaved,
      suffix: ' kg',
      icon: '🌍',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.18)',
    },
  ];

  const merchantActions = [
    { to: '/create-donation', icon: '➕', label: 'Publier un don', primary: true },
    { to: '/my-donations',    icon: '📋', label: 'Mes dons',       primary: false },
    { to: '/merchant-requests', icon: '📬', label: 'Demandes reçues', primary: false },
  ];

  const assocActions = [
    { to: '/available-donations',   icon: '🔍', label: 'Dons disponibles', primary: true },
    { to: '/association-requests',  icon: '📋', label: 'Mes demandes',     primary: false },
  ];

  const actions = isMerchant ? merchantActions : assocActions;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .db-root {
          min-height: 100vh;
          background: #0b0e14;
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem 1.5rem 4rem;
          position: relative;
          overflow: hidden;
        }

        .db-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .db-inner {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .db-header {
          margin-bottom: 2.5rem;
          animation: fadeUp 0.45s ease both;
        }

        .db-greeting {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2rem;
          color: #f0f0f0;
          letter-spacing: -0.04em;
          margin: 0 0 0.4rem;
        }

        .db-greeting span { color: #4ade80; }

        .db-sub {
          color: rgba(240,240,240,0.38);
          font-size: 0.9rem;
          font-weight: 300;
          margin: 0;
        }

        .db-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          color: #4ade80;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Stat cards */
        .db-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
          animation: fadeUp 0.5s 0.05s ease both;
        }

        .db-stat-card {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 1.5rem 1.25rem;
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform 0.2s, border-color 0.2s;
          position: relative;
          overflow: hidden;
        }

        .db-stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--card-bg);
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: inherit;
        }

        .db-stat-card:hover {
          transform: translateY(-3px);
          border-color: var(--card-border);
        }

        .db-stat-card:hover::before { opacity: 1; }

        .db-stat-icon {
          font-size: 1.4rem;
          margin-bottom: 0.75rem;
          display: block;
          position: relative;
          z-index: 1;
        }

        .db-stat-value {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2.2rem;
          letter-spacing: -0.04em;
          color: var(--card-color);
          line-height: 1;
          margin-bottom: 0.35rem;
          position: relative;
          z-index: 1;
        }

        .db-stat-label {
          font-size: 0.8rem;
          color: rgba(240,240,240,0.4);
          font-weight: 400;
          position: relative;
          z-index: 1;
        }

        /* Section title */
        .db-section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          color: rgba(240,240,240,0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.9rem;
        }

        /* Actions */
        .db-actions {
          animation: fadeUp 0.5s 0.1s ease both;
          margin-bottom: 2rem;
        }

        .db-action-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .db-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          border-radius: 12px;
          padding: 0.7rem 1.25rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.18s;
          border: 1px solid transparent;
        }

        .db-action-btn.primary {
          background: #4ade80;
          color: #0b0e14;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
        }

        .db-action-btn.primary:hover {
          background: #6ee7a0;
          transform: translateY(-2px);
          text-decoration: none;
          color: #0b0e14;
        }

        .db-action-btn.secondary {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          color: rgba(240,240,240,0.7);
        }

        .db-action-btn.secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.14);
          color: #f0f0f0;
          text-decoration: none;
          transform: translateY(-2px);
        }

        /* Info box */
        .db-info-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          animation: fadeUp 0.5s 0.15s ease both;
        }

        .db-info-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .db-info-avatar {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .db-info-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #f0f0f0;
          margin: 0 0 0.2rem;
        }

        .db-info-meta {
          font-size: 0.8rem;
          color: rgba(240,240,240,0.35);
          margin: 0;
        }

        @media (max-width: 640px) {
          .db-stats { grid-template-columns: 1fr; }
          .db-greeting { font-size: 1.5rem; }
        }
      `}</style>

      <div className="db-root">
        <div className="db-inner">

          {/* Header */}
          <div className="db-header">
            <div className="db-role-pill">
              {isMerchant ? '🧑‍🍳 Commerçant' : '🤝 Association'}
            </div>
            <h1 className="db-greeting">
              Bonjour, <span>{user.name.split(' ')[0]}</span> 👋
            </h1>
            <p className="db-sub">Voici un aperçu de l'activité FoodSave aujourd'hui.</p>
          </div>

          {/* Stats */}
          <div className="db-stats">
            {statCards.map((s, i) => (
              <div
                key={i}
                className="db-stat-card"
                style={{
                  '--card-color': s.color,
                  '--card-bg': s.bg,
                  '--card-border': s.border,
                }}
              >
                <span className="db-stat-icon">{s.icon}</span>
                <div className="db-stat-value">{s.value}{s.suffix}</div>
                <div className="db-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="db-actions">
            <div className="db-section-title">Actions rapides</div>
            <div className="db-action-grid">
              {actions.map((a, i) => (
                <Link
                  key={i}
                  to={a.to}
                  className={`db-action-btn ${a.primary ? 'primary' : 'secondary'}`}
                >
                  <span>{a.icon}</span> {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User info */}
          <div className="db-info-box">
            <div className="db-section-title" style={{ marginBottom: '0.75rem' }}>Mon compte</div>
            <div className="db-info-row">
              <div className="db-info-avatar">
                {isMerchant ? '🧑‍🍳' : '🤝'}
              </div>
              <div>
                <p className="db-info-name">{user.name}</p>
                <p className="db-info-meta">{user.email} · {isMerchant ? 'Commerçant' : 'Association'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;