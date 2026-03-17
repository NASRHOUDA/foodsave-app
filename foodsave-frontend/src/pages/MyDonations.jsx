import React, { useState, useEffect } from 'react';
import donationService from '../services/donationService';
import userService from '../services/userService';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const user = userService.getCurrentUser();

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      let data;
      if (user.role === 'merchant') {
        data = await donationService.getMerchantDonations(user.id);
      } else {
        data = await donationService.getAssociationDonations(user.id);
      }
      setDonations(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    available:  { label: 'Disponible', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dot: '#4ade80' },
    requested:  { label: 'Demandé',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
    accepted:   { label: 'Accepté',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dot: '#60a5fa' },
    completed:  { label: 'Terminé',    color: 'rgba(240,240,240,0.35)', bg: 'rgba(255,255,255,0.05)', dot: 'rgba(240,240,240,0.3)' },
  };

  const typeConfig = {
    prepared: { icon: '🍲', label: 'Cuisiné' },
    fresh:    { icon: '🥗', label: 'Frais' },
    packaged: { icon: '📦', label: 'Emballé' },
    bakery:   { icon: '🥖', label: 'Boulangerie' },
  };

  const filters = ['all', 'available', 'requested', 'accepted', 'completed'];

  const filtered = filter === 'all'
    ? donations
    : donations.filter(d => d.status === filter);

  const counts = filters.reduce((acc, f) => {
    acc[f] = f === 'all' ? donations.length : donations.filter(d => d.status === f).length;
    return acc;
  }, {});

  if (loading) return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0b0e14',
      fontFamily: "'DM Sans', sans-serif", color: 'rgba(240,240,240,0.4)',
      fontSize: '0.9rem'
    }}>
      Chargement…
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .md-root {
          min-height: 100vh;
          background: #0b0e14;
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem 1.5rem 4rem;
          position: relative;
        }

        .md-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .md-inner {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .md-header {
          margin-bottom: 2rem;
          animation: fadeUp 0.4s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .md-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          color: #f0f0f0;
          letter-spacing: -0.04em;
          margin: 0 0 0.3rem;
        }

        .md-subtitle {
          color: rgba(240,240,240,0.35);
          font-size: 0.875rem;
          font-weight: 300;
          margin: 0;
        }

        /* Filter tabs */
        .md-filters {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.4s 0.05s ease both;
        }

        .md-filter-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(240,240,240,0.4);
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .md-filter-btn:hover {
          color: rgba(240,240,240,0.8);
          border-color: rgba(255,255,255,0.15);
        }

        .md-filter-btn.active {
          background: rgba(74,222,128,0.1);
          border-color: rgba(74,222,128,0.3);
          color: #4ade80;
        }

        .md-filter-count {
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 0 0.4rem;
          font-size: 0.72rem;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          line-height: 1.6;
        }

        .md-filter-btn.active .md-filter-count {
          background: rgba(74,222,128,0.2);
        }

        /* Empty state */
        .md-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(240,240,240,0.25);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        .md-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

        .md-empty p {
          font-size: 0.9rem;
          margin: 0;
        }

        /* Cards */
        .md-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        .md-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: transform 0.18s, border-color 0.18s;
        }

        .md-card:hover {
          transform: translateX(4px);
          border-color: rgba(255,255,255,0.12);
        }

        .md-card-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .md-card-body {
          flex: 1;
          min-width: 0;
        }

        .md-card-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.3rem;
          flex-wrap: wrap;
        }

        .md-card-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #f0f0f0;
          margin: 0;
          white-space: nowrap;
        }

        .md-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          font-size: 0.72rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.02em;
          background: var(--pill-bg);
          color: var(--pill-color);
        }

        .md-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--pill-color);
          flex-shrink: 0;
        }

        .md-card-desc {
          font-size: 0.83rem;
          color: rgba(240,240,240,0.4);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .md-card-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
          text-align: right;
        }

        .md-card-qty {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.3rem;
          color: #4ade80;
          line-height: 1;
        }

        .md-card-qty-unit {
          font-size: 0.72rem;
          color: rgba(240,240,240,0.3);
          font-weight: 400;
          font-family: 'DM Sans', sans-serif;
        }

        .md-card-date {
          font-size: 0.75rem;
          color: rgba(240,240,240,0.25);
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .md-card { flex-direction: column; align-items: flex-start; }
          .md-card-meta { align-self: flex-end; }
        }
      `}</style>

      <div className="md-root">
        <div className="md-inner">

          {/* Header */}
          <div className="md-header">
            <h1 className="md-title">Mes dons</h1>
            <p className="md-subtitle">
              {donations.length} don{donations.length !== 1 ? 's' : ''} au total
            </p>
          </div>

          {/* Filters */}
          <div className="md-filters">
            {filters.map(f => (
              <button
                key={f}
                className={`md-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Tous' : statusConfig[f]?.label ?? f}
                <span className="md-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="md-empty">
              <div className="md-empty-icon">📭</div>
              <p>Aucun don dans cette catégorie.</p>
            </div>
          ) : (
            <div className="md-list">
              {filtered.map(donation => {
                const sc = statusConfig[donation.status] || statusConfig.completed;
                const tc = typeConfig[donation.food_type] || { icon: '📦', label: 'Autre' };
                return (
                  <div className="md-card" key={donation.id}>
                    <div className="md-card-icon">{tc.icon}</div>

                    <div className="md-card-body">
                      <div className="md-card-top">
                        <span className="md-card-title">
                          {tc.label} · {donation.pickup_address.split(',')[0]}
                        </span>
                        <span
                          className="md-status-pill"
                          style={{ '--pill-bg': sc.bg, '--pill-color': sc.color }}
                        >
                          <span className="md-status-dot" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="md-card-desc">{donation.description}</p>
                    </div>

                    <div className="md-card-meta">
                      <div>
                        <div className="md-card-qty">{donation.quantity}</div>
                        <div className="md-card-qty-unit">kg</div>
                      </div>
                      <div className="md-card-date">
                        {new Date(donation.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyDonations;