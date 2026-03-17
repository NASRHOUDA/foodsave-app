import React, { useState, useEffect } from 'react';
import donationService from '../services/donationService';
import requestService from '../services/requestService';
import userService from '../services/userService';

const TYPE_CONFIG = {
  prepared: { icon: '🍲', label: 'Cuisiné' },
  fresh:    { icon: '🥗', label: 'Frais' },
  packaged: { icon: '📦', label: 'Emballé' },
  bakery:   { icon: '🥖', label: 'Boulangerie' },
};

const AvailableDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { loadDonations(); }, []);

  const loadDonations = async () => {
    try {
      const all = await donationService.getAllDonations();
    console.log("Tous les dons reçus:", all);
      setDonations(all.filter(d => d.status === 'available'));
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (donation) => {
    setSelectedDonation(donation);
    setRequestMessage(`Bonjour, je suis intéressé par votre don de ${donation.quantity}kg. Pouvez-vous me confirmer une date de retrait ?`);
    setShowModal(true);
  };

  const handleSendRequest = async () => {
    const user = userService.getCurrentUser();
    if (!user) { setError('Vous devez être connecté'); return; }
    if (!requestMessage.trim()) { setError('Veuillez écrire un message'); return; }
    setSending(true);
    try {
      await requestService.createRequest({
        donation_id: selectedDonation.id,
        association_id: String(user.id),
        association_name: user.name,
        merchant_id: String(selectedDonation.merchant_id),
        message: requestMessage
      });
      setSuccess('Demande envoyée avec succès !');
      setError('');
      setShowModal(false);
      setRequestMessage('');
      loadDonations();
    } catch (err) {
      setError(err.error || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const extractCity = (address) => {
    const match = address.match(/(\d{5})\s+(\w+)/);
    return match ? match[2] : address.split(',')[0];
  };

  const types = ['all', ...Object.keys(TYPE_CONFIG)];
  const filtered = filterType === 'all'
    ? donations
    : donations.filter(d => d.food_type === filterType);

  const counts = types.reduce((acc, t) => {
    acc[t] = t === 'all' ? donations.length : donations.filter(d => d.food_type === t).length;
    return acc;
  }, {});

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

        .ad-root {
          min-height: 100vh;
          background: #0b0e14;
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem 1.5rem 4rem;
          position: relative;
        }

        .ad-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .ad-inner {
          max-width: 960px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ad-header {
          margin-bottom: 2rem;
          animation: fadeUp 0.4s ease both;
        }

        .ad-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          color: #f0f0f0;
          letter-spacing: -0.04em;
          margin: 0 0 0.3rem;
        }

        .ad-subtitle {
          color: rgba(240,240,240,0.35);
          font-size: 0.875rem;
          margin: 0;
        }

        .ad-alert {
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ad-alert-success {
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          color: #86efac;
        }

        .ad-alert-error {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          color: #fca5a5;
        }

        /* Filters */
        .ad-filters {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1.75rem;
          animation: fadeUp 0.4s 0.05s ease both;
        }

        .ad-filter-btn {
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

        .ad-filter-btn:hover {
          color: rgba(240,240,240,0.8);
          border-color: rgba(255,255,255,0.15);
        }

        .ad-filter-btn.active {
          background: rgba(74,222,128,0.1);
          border-color: rgba(74,222,128,0.3);
          color: #4ade80;
        }

        .ad-filter-count {
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 0 0.4rem;
          font-size: 0.72rem;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          line-height: 1.6;
        }

        .ad-filter-btn.active .ad-filter-count { background: rgba(74,222,128,0.2); }

        /* Empty */
        .ad-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(240,240,240,0.25);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        .ad-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .ad-empty p { font-size: 0.9rem; margin: 0; }

        /* Grid */
        .ad-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        /* Card */
        .ad-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          transition: transform 0.18s, border-color 0.18s;
        }

        .ad-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.12);
        }

        .ad-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .ad-card-icon-wrap {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.35rem;
        }

        .ad-card-qty-num {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.6rem;
          color: #4ade80;
          line-height: 1;
          letter-spacing: -0.04em;
          text-align: right;
        }

        .ad-card-qty-unit {
          font-size: 0.72rem;
          color: rgba(240,240,240,0.3);
          text-align: right;
        }

        .ad-card-type {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.78rem;
          color: rgba(240,240,240,0.4);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.25rem;
        }

        .ad-card-desc {
          font-size: 0.85rem;
          color: rgba(240,240,240,0.55);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ad-card-address {
          font-size: 0.78rem;
          color: rgba(240,240,240,0.3);
        }

        .ad-card-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
        }

        .ad-card-btn {
          width: 100%;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.22);
          border-radius: 10px;
          padding: 0.65rem;
          color: #4ade80;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.18s;
        }

        .ad-card-btn:hover {
          background: #4ade80;
          color: #0b0e14;
          transform: translateY(-1px);
        }

        /* Modal */
        .ad-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .ad-modal {
          background: #151820;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px;
          width: 100%;
          max-width: 480px;
          padding: 2rem;
          animation: scaleIn 0.2s ease;
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        .ad-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .ad-modal-header-left {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .ad-modal-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .ad-modal-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.05rem;
          color: #f0f0f0;
          letter-spacing: -0.02em;
          margin: 0 0 0.2rem;
        }

        .ad-modal-sub {
          font-size: 0.78rem;
          color: rgba(240,240,240,0.35);
          margin: 0;
        }

        .ad-modal-close {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: rgba(240,240,240,0.4);
          font-size: 0.9rem;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .ad-modal-close:hover { color: #f0f0f0; background: rgba(255,255,255,0.1); }

        .ad-modal-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(240,240,240,0.45);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }

        .ad-modal-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          resize: vertical;
          min-height: 110px;
          transition: border-color 0.2s;
          box-sizing: border-box;
          margin-bottom: 1.25rem;
        }

        .ad-modal-textarea::placeholder { color: rgba(240,240,240,0.2); }
        .ad-modal-textarea:focus { border-color: rgba(74,222,128,0.4); }

        .ad-modal-footer {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
        }

        .ad-modal-cancel {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.6rem 1.2rem;
          color: rgba(240,240,240,0.45);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ad-modal-cancel:hover { color: #f0f0f0; border-color: rgba(255,255,255,0.2); }

        .ad-modal-submit {
          flex: 1;
          background: #4ade80;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1.2rem;
          color: #0b0e14;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .ad-modal-submit:hover:not(:disabled) { background: #6ee7a0; }
        .ad-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .ad-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0b0e14;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ad-root">
        <div className="ad-inner">

          <div className="ad-header">
            <h1 className="ad-title">Dons disponibles</h1>
            <p className="ad-subtitle">
              {donations.length} don{donations.length !== 1 ? 's' : ''} disponible{donations.length !== 1 ? 's' : ''} près de vous
            </p>
          </div>

          {error   && <div className="ad-alert ad-alert-error">⚠️ {error}</div>}
          {success && <div className="ad-alert ad-alert-success">✅ {success}</div>}

          {/* Filters */}
          <div className="ad-filters">
            {types.map(t => (
              <button
                key={t}
                className={`ad-filter-btn ${filterType === t ? 'active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {t === 'all' ? '🌿 Tous' : `${TYPE_CONFIG[t].icon} ${TYPE_CONFIG[t].label}`}
                <span className="ad-filter-count">{counts[t]}</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="ad-empty">
              <div className="ad-empty-icon">📭</div>
              <p>Aucun don disponible dans cette catégorie.</p>
            </div>
          ) : (
            <div className="ad-grid">
              {filtered.map(donation => {
                const tc = TYPE_CONFIG[donation.food_type] || { icon: '📦', label: 'Autre' };
                return (
                  <div className="ad-card" key={donation.id}>
                    <div className="ad-card-top">
                      <div className="ad-card-icon-wrap">{tc.icon}</div>
                      <div>
                        <div className="ad-card-qty-num">{donation.quantity}</div>
                        <div className="ad-card-qty-unit">kg</div>
                      </div>
                    </div>

                    <div>
                      <div className="ad-card-type">{tc.label}</div>
                      <div className="ad-card-desc">{donation.description}</div>
                    </div>

                    <div className="ad-card-address">📍 {extractCity(donation.pickup_address)}</div>

                    <div className="ad-card-divider" />

                    <button
                      className="ad-card-btn"
                      onClick={() => handleRequestClick(donation)}
                    >
                      Faire une demande →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDonation && (
        <div
          className="ad-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="ad-modal">
            <div className="ad-modal-header">
              <div className="ad-modal-header-left">
                <div className="ad-modal-icon">
                  {TYPE_CONFIG[selectedDonation.food_type]?.icon || '📦'}
                </div>
                <div>
                  <p className="ad-modal-title">Demande pour {selectedDonation.quantity} kg</p>
                  <p className="ad-modal-sub">
                    {TYPE_CONFIG[selectedDonation.food_type]?.label} · {extractCity(selectedDonation.pickup_address)}
                  </p>
                </div>
              </div>
              <button className="ad-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <label className="ad-modal-label">Votre message au commerçant</label>
            <textarea
              className="ad-modal-textarea"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Présentez-vous et indiquez vos disponibilités…"
            />

            <div className="ad-modal-footer">
              <button className="ad-modal-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button
                className="ad-modal-submit"
                onClick={handleSendRequest}
                disabled={sending}
              >
                {sending ? <><div className="ad-spinner" /> Envoi…</> : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailableDonations;