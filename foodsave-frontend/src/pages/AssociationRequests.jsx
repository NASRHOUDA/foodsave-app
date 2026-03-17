import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import requestService from '../services/requestService';
import userService from '../services/userService';

const STATUS_CONFIG = {
  pending:  { label: 'En attente', icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.22)' },
  accepted: { label: 'Acceptée',   icon: '✅', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.22)' },
  rejected: { label: 'Refusée',    icon: '❌', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.22)' },
};

const AssociationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const user = userService.getCurrentUser();
      const data = await requestService.getAssociationRequests(user.id);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['all', 'pending', 'accepted', 'rejected'];
  const filterLabels = { all: 'Toutes', pending: 'En attente', accepted: 'Acceptées', rejected: 'Refusées' };

  const counts = filters.reduce((acc, f) => {
    acc[f] = f === 'all' ? requests.length : requests.filter(r => r.status === f).length;
    return acc;
  }, {});

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

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

        .ar-root {
          min-height: 100vh;
          background: #0b0e14;
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem 1.5rem 4rem;
          position: relative;
        }

        .ar-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .ar-inner {
          max-width: 760px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .ar-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          animation: fadeUp 0.4s ease both;
        }

        .ar-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          color: #f0f0f0;
          letter-spacing: -0.04em;
          margin: 0 0 0.3rem;
        }

        .ar-subtitle {
          color: rgba(240,240,240,0.35);
          font-size: 0.875rem;
          margin: 0;
        }

        .ar-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.22);
          border-radius: 10px;
          padding: 0.5rem 1rem;
          color: #4ade80;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          text-decoration: none;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .ar-cta:hover {
          background: #4ade80;
          color: #0b0e14;
          text-decoration: none;
        }

        /* Filters */
        .ar-filters {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.4s 0.05s ease both;
        }

        .ar-filter-btn {
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

        .ar-filter-btn:hover {
          color: rgba(240,240,240,0.8);
          border-color: rgba(255,255,255,0.15);
        }

        .ar-filter-btn.active {
          background: rgba(74,222,128,0.1);
          border-color: rgba(74,222,128,0.3);
          color: #4ade80;
        }

        .ar-filter-count {
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 0 0.4rem;
          font-size: 0.72rem;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          line-height: 1.6;
        }

        .ar-filter-btn.active .ar-filter-count { background: rgba(74,222,128,0.2); }

        /* Empty */
        .ar-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(240,240,240,0.25);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        .ar-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

        .ar-empty p { font-size: 0.9rem; margin: 0 0 1rem; }

        .ar-empty-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.22);
          border-radius: 10px;
          padding: 0.5rem 1.1rem;
          color: #4ade80;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.15s;
        }

        .ar-empty-link:hover {
          background: #4ade80;
          color: #0b0e14;
          text-decoration: none;
        }

        /* List */
        .ar-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        /* Card */
        .ar-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.18s;
        }

        .ar-card:hover { border-color: rgba(255,255,255,0.11); }

        .ar-card-body { padding: 1.4rem; }

        .ar-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.9rem;
        }

        .ar-card-id {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          color: rgba(240,240,240,0.35);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }

        .ar-card-date {
          font-size: 0.75rem;
          color: rgba(240,240,240,0.25);
        }

        .ar-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.73rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
          background: var(--pill-bg);
          color: var(--pill-color);
          border: 1px solid var(--pill-border);
        }

        .ar-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* Message bubble */
        .ar-message {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          color: rgba(240,240,240,0.55);
          line-height: 1.5;
          font-style: italic;
          margin-bottom: 0;
        }

        /* Response strip */
        .ar-response {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 1rem 1.4rem;
          background: var(--resp-bg);
        }

        .ar-response-label {
          font-size: 0.72rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--resp-color);
          margin-bottom: 0.35rem;
          opacity: 0.8;
        }

        .ar-response-text {
          font-size: 0.875rem;
          color: rgba(240,240,240,0.6);
          margin: 0 0 0.3rem;
          line-height: 1.5;
        }

        .ar-response-date {
          font-size: 0.73rem;
          color: rgba(240,240,240,0.25);
        }

        /* Pending indicator */
        .ar-pending-row {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 0.75rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: rgba(245,158,11,0.6);
        }

        .ar-pending-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          animation: blink 1.4s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div className="ar-root">
        <div className="ar-inner">

          {/* Header */}
          <div className="ar-header">
            <div>
              <h1 className="ar-title">Mes demandes</h1>
              <p className="ar-subtitle">
                {requests.length} demande{requests.length !== 1 ? 's' : ''} envoyée{requests.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link to="/available-donations" className="ar-cta">
              🔍 Voir les dons →
            </Link>
          </div>

          {/* Filters */}
          <div className="ar-filters">
            {filters.map(f => (
              <button
                key={f}
                className={`ar-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {filterLabels[f]}
                <span className="ar-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* Empty */}
          {requests.length === 0 ? (
            <div className="ar-empty">
              <div className="ar-empty-icon">📭</div>
              <p>Vous n'avez encore fait aucune demande.</p>
              <Link to="/available-donations" className="ar-empty-link">
                🔍 Parcourir les dons disponibles
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ar-empty">
              <div className="ar-empty-icon">🗂️</div>
              <p>Aucune demande dans cette catégorie.</p>
            </div>
          ) : (
            <div className="ar-list">
              {filtered.map(request => {
                const sc = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                return (
                  <div className="ar-card" key={request.id}>
                    <div className="ar-card-body">
                      <div className="ar-card-top">
                        <div>
                          <div className="ar-card-id">Demande #{request.id.slice(0, 8)}</div>
                          <div className="ar-card-date">
                            Envoyée le {new Date(request.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <span
                          className="ar-status-pill"
                          style={{
                            '--pill-bg': sc.bg,
                            '--pill-color': sc.color,
                            '--pill-border': sc.border,
                          }}
                        >
                          <span className="ar-status-dot" />
                          {sc.label}
                        </span>
                      </div>

                      <div className="ar-message">"{request.message}"</div>
                    </div>

                    {/* Pending indicator */}
                    {request.status === 'pending' && (
                      <div className="ar-pending-row">
                        <div className="ar-pending-dot" />
                        En attente de réponse du commerçant…
                      </div>
                    )}

                    {/* Response */}
                    {request.status !== 'pending' && (
                      <div
                        className="ar-response"
                        style={{
                          '--resp-bg': sc.bg,
                          '--resp-color': sc.color,
                        }}
                      >
                        <div className="ar-response-label">
                          {sc.icon} Réponse du commerçant
                        </div>
                        <p className="ar-response-text">
                          {request.response_message || 'Pas de message'}
                        </p>
                        {request.responded_at && (
                          <div className="ar-response-date">
                            Réponse reçue le {new Date(request.responded_at).toLocaleString('fr-FR')}
                          </div>
                        )}
                      </div>
                    )}
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

export default AssociationRequests;