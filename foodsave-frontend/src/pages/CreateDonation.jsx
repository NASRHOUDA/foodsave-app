import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import donationService from '../services/donationService';
import userService from '../services/userService';

const FOOD_TYPES = [
  { value: 'bakery',   icon: '🥖', label: 'Boulangerie',      desc: 'Pain, viennoiseries, pâtisseries' },
  { value: 'prepared', icon: '🍲', label: 'Repas préparés',   desc: 'Plats cuisinés, soupes, sandwichs' },
  { value: 'fresh',    icon: '🥗', label: 'Produits frais',   desc: 'Fruits, légumes, produits laitiers' },
  { value: 'packaged', icon: '📦', label: 'Produits emballés', desc: 'Conserves, épicerie, boissons' },
];

const CreateDonation = () => {
  const [formData, setFormData] = useState({
    food_type: 'bakery',
    quantity: '',
    description: '',
    pickup_address: '',
    pickup_lat: 48.8566,
    pickup_lon: 2.3522,
    pickup_time_start: '',
    pickup_time_end: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = type, 2 = details, 3 = horaires
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            pickup_lat: position.coords.latitude,
            pickup_lon: position.coords.longitude
          }));
        },
        () => console.log('Géolocalisation non disponible')
      );
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const user = userService.getCurrentUser();
    if (!user) { setError('Utilisateur non connecté'); setLoading(false); return; }

    try {
      const donationData = {
        merchant_id: String(user.id),
        food_type: formData.food_type,
        quantity: parseFloat(formData.quantity),
        description: formData.description,
        pickup_address: formData.pickup_address,
        pickup_lat: parseFloat(formData.pickup_lat),
        pickup_lon: parseFloat(formData.pickup_lon),
        pickup_time_start: new Date(formData.pickup_time_start).toISOString(),
        pickup_time_end: new Date(formData.pickup_time_end).toISOString()
      };
      await donationService.createDonation(donationData);
      setSuccess('Don publié avec succès !');
      setTimeout(() => navigate('/my-donations'), 2000);
    } catch (err) {
      setError(err.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = FOOD_TYPES.find(t => t.value === formData.food_type);

  const canGoStep2 = formData.food_type;
  const canGoStep3 = canGoStep2 && formData.quantity && formData.description && formData.pickup_address;
  const canSubmit  = canGoStep3 && formData.pickup_time_start && formData.pickup_time_end;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .cd-root {
          min-height: 100vh;
          background: #0b0e14;
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem 1.5rem 4rem;
          position: relative;
        }

        .cd-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .cd-inner {
          max-width: 640px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .cd-header {
          margin-bottom: 2rem;
          animation: fadeUp 0.4s ease both;
        }

        .cd-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          color: #f0f0f0;
          letter-spacing: -0.04em;
          margin: 0 0 0.3rem;
        }

        .cd-subtitle {
          color: rgba(240,240,240,0.35);
          font-size: 0.875rem;
          margin: 0;
        }

        /* Stepper */
        .cd-stepper {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 2rem;
          animation: fadeUp 0.4s 0.05s ease both;
        }

        .cd-step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .cd-step-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          color: rgba(240,240,240,0.3);
          transition: all 0.25s;
          flex-shrink: 0;
        }

        .cd-step.active .cd-step-dot {
          border-color: #4ade80;
          background: rgba(74,222,128,0.12);
          color: #4ade80;
        }

        .cd-step.done .cd-step-dot {
          border-color: #4ade80;
          background: #4ade80;
          color: #0b0e14;
        }

        .cd-step-label {
          font-size: 0.78rem;
          color: rgba(240,240,240,0.25);
          font-weight: 500;
          transition: color 0.25s;
        }

        .cd-step.active .cd-step-label { color: #4ade80; }
        .cd-step.done .cd-step-label   { color: rgba(240,240,240,0.5); }

        .cd-step-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0 0.5rem;
          transition: background 0.25s;
        }

        .cd-step-line.done { background: rgba(74,222,128,0.3); }

        /* Box */
        .cd-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 2rem;
          animation: fadeUp 0.4s 0.1s ease both;
        }

        .cd-section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #f0f0f0;
          margin: 0 0 1.25rem;
          letter-spacing: -0.02em;
        }

        /* Food type grid */
        .cd-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .cd-type-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.18s;
          background: rgba(255,255,255,0.02);
          text-align: left;
        }

        .cd-type-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
        }

        .cd-type-card.selected {
          border-color: rgba(74,222,128,0.45);
          background: rgba(74,222,128,0.07);
        }

        .cd-type-icon { font-size: 1.6rem; margin-bottom: 0.5rem; display: block; }

        .cd-type-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: #f0f0f0;
          margin-bottom: 0.2rem;
        }

        .cd-type-desc {
          font-size: 0.75rem;
          color: rgba(240,240,240,0.35);
          line-height: 1.3;
        }

        /* Fields */
        .cd-field { margin-bottom: 1rem; }

        .cd-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(240,240,240,0.45);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }

        .cd-input,
        .cd-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .cd-input::placeholder,
        .cd-textarea::placeholder { color: rgba(240,240,240,0.18); }

        .cd-input:focus,
        .cd-textarea:focus {
          border-color: rgba(74,222,128,0.4);
          background: rgba(74,222,128,0.03);
        }

        .cd-textarea { resize: vertical; min-height: 90px; }

        .cd-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        /* Alerts */
        .cd-alert {
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cd-alert-success {
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          color: #86efac;
        }

        .cd-alert-error {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          color: #fca5a5;
        }

        /* Nav buttons */
        .cd-nav {
          display: flex;
          gap: 0.6rem;
          justify-content: space-between;
          margin-top: 1.5rem;
        }

        .cd-btn-back {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.65rem 1.2rem;
          color: rgba(240,240,240,0.45);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .cd-btn-back:hover { color: #f0f0f0; border-color: rgba(255,255,255,0.2); }

        .cd-btn-next {
          flex: 1;
          background: #4ade80;
          border: none;
          border-radius: 10px;
          padding: 0.7rem 1.2rem;
          color: #0b0e14;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .cd-btn-next:hover:not(:disabled) {
          background: #6ee7a0;
          transform: translateY(-1px);
        }

        .cd-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }

        .cd-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0b0e14;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Summary chip */
        .cd-summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.18);
          border-radius: 999px;
          padding: 0.3rem 0.85rem;
          font-size: 0.78rem;
          color: #4ade80;
          margin-bottom: 1.25rem;
          font-weight: 500;
        }

        @media (max-width: 500px) {
          .cd-type-grid  { grid-template-columns: 1fr; }
          .cd-grid-2     { grid-template-columns: 1fr; }
          .cd-step-label { display: none; }
        }
      `}</style>

      <div className="cd-root">
        <div className="cd-inner">

          {/* Header */}
          <div className="cd-header">
            <h1 className="cd-title">Publier un don</h1>
            <p className="cd-subtitle">Renseignez les informations de votre don en 3 étapes.</p>
          </div>

          {/* Stepper */}
          <div className="cd-stepper">
            {[
              { n: 1, label: 'Type' },
              { n: 2, label: 'Détails' },
              { n: 3, label: 'Horaires' },
            ].map(({ n, label }, i) => (
              <React.Fragment key={n}>
                {i > 0 && <div className={`cd-step-line ${step > n - 1 ? 'done' : ''}`} />}
                <div className={`cd-step ${step === n ? 'active' : step > n ? 'done' : ''}`}>
                  <div className="cd-step-dot">{step > n ? '✓' : n}</div>
                  <span className="cd-step-label">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="cd-box">
            {error   && <div className="cd-alert cd-alert-error">⚠️ {error}</div>}
            {success && <div className="cd-alert cd-alert-success">✅ {success}</div>}

            {/* ── STEP 1 : Type ── */}
            {step === 1 && (
              <>
                <div className="cd-section-title">Quel type d'aliment donnez-vous ?</div>
                <div className="cd-type-grid">
                  {FOOD_TYPES.map(t => (
                    <div
                      key={t.value}
                      className={`cd-type-card ${formData.food_type === t.value ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, food_type: t.value })}
                    >
                      <span className="cd-type-icon">{t.icon}</span>
                      <div className="cd-type-name">{t.label}</div>
                      <div className="cd-type-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="cd-nav">
                  <button
                    className="cd-btn-next"
                    onClick={() => setStep(2)}
                    disabled={!canGoStep2}
                  >
                    Suivant →
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2 : Détails ── */}
            {step === 2 && (
              <>
                {selectedType && (
                  <div className="cd-summary-chip">
                    {selectedType.icon} {selectedType.label}
                  </div>
                )}
                <div className="cd-section-title">Décrivez votre don</div>

                <div className="cd-field">
                  <label className="cd-label">Quantité (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="cd-input"
                    name="quantity"
                    placeholder="Ex : 5.5"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="cd-field">
                  <label className="cd-label">Description</label>
                  <textarea
                    className="cd-textarea"
                    name="description"
                    placeholder="Décrivez le contenu du don, l'état des produits…"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="cd-field">
                  <label className="cd-label">Adresse de retrait</label>
                  <input
                    type="text"
                    className="cd-input"
                    name="pickup_address"
                    placeholder="12 rue de la Paix, 75001 Paris"
                    value={formData.pickup_address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="cd-nav">
                  <button className="cd-btn-back" onClick={() => setStep(1)}>← Retour</button>
                  <button
                    className="cd-btn-next"
                    onClick={() => setStep(3)}
                    disabled={!canGoStep3}
                  >
                    Suivant →
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3 : Horaires ── */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                {selectedType && (
                  <div className="cd-summary-chip">
                    {selectedType.icon} {selectedType.label} · {formData.quantity} kg
                  </div>
                )}
                <div className="cd-section-title">Créneaux de retrait</div>

                <div className="cd-grid-2">
                  <div className="cd-field">
                    <label className="cd-label">Disponible à partir de</label>
                    <input
                      type="datetime-local"
                      className="cd-input"
                      name="pickup_time_start"
                      value={formData.pickup_time_start}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Disponible jusqu'à</label>
                    <input
                      type="datetime-local"
                      className="cd-input"
                      name="pickup_time_end"
                      value={formData.pickup_time_end}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="cd-nav">
                  <button type="button" className="cd-btn-back" onClick={() => setStep(2)}>← Retour</button>
                  <button
                    type="submit"
                    className="cd-btn-next"
                    disabled={loading || !canSubmit}
                  >
                    {loading
                      ? <><div className="cd-spinner" /> Publication…</>
                      : '🌱 Publier le don'
                    }
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default CreateDonation;