
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'merchant',
    phone: '',
    address: '',
    // Champs matching pour les associations
    capacity: 100,
    preferred_food_types: []
  });
  
  const [selectedFoodTypes, setSelectedFoodTypes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const navigate = useNavigate();

  // Options de types d'aliments
  const foodTypeOptions = [
    { value: 'bakery', label: '🥖 Boulangerie', description: 'Pain, viennoiseries' },
    { value: 'prepared', label: '🍲 Repas préparés', description: 'Plats cuisinés' },
    { value: 'fresh', label: '🥗 Produits frais', description: 'Fruits, légumes' },
    { value: 'packaged', label: '📦 Produits emballés', description: 'Conserves, secs' }
  ];

  // Fonction de géocodage (convertit une adresse en coordonnées GPS)
  const geocodeAddress = async (address) => {
    if (!address) return null;
    
    setGeocoding(true);
    try {
      // Utilisation de l'API Nominatim d'OpenStreetMap (gratuite, sans clé)
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        console.log('📍 Coordonnées trouvées:', { lat, lon });
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
    } finally {
      setGeocoding(false);
    }
    return null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFoodTypeToggle = (type) => {
    const newSelection = selectedFoodTypes.includes(type)
      ? selectedFoodTypes.filter(t => t !== type)
      : [...selectedFoodTypes, type];
    
    setSelectedFoodTypes(newSelection);
    setFormData({
      ...formData,
      preferred_food_types: newSelection
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let dataToSend;
      
      if (formData.role === 'association') {
        // Pour les associations : géocodage automatique de l'adresse
        const coords = await geocodeAddress(formData.address);
        
        dataToSend = { 
          ...formData, 
          preferred_food_types: selectedFoodTypes,
          // Si le géocodage a réussi, on utilise les coordonnées, sinon valeurs par défaut (Paris)
          lat: coords?.lat || 48.8566,
          lon: coords?.lon || 2.3522
        };
        
        if (!coords) {
          console.warn('⚠️ Géocodage non disponible, utilisation des coordonnées par défaut (Paris)');
        }
      } else {
        // Pour les commerçants : pas de champs matching
        dataToSend = { 
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          address: formData.address
        };
      }
      
      await userService.register(dataToSend);
      navigate('/login');
    } catch (err) {
      setError(err.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .reg-root {
          min-height: 100vh;
          background: #0b0e14;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .reg-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .reg-root::after {
          content: '';
          position: fixed;
          bottom: -150px; right: -150px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .reg-card {
          width: 100%;
          max-width: 560px;
          position: relative;
          z-index: 1;
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .reg-brand {
          text-align: center;
          margin-bottom: 2rem;
        }

        .reg-brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          margin-bottom: 1.25rem;
        }

        .reg-brand-icon {
          width: 38px; height: 38px;
          background: #4ade80;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
        }

        .reg-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.4rem;
          color: #f0f0f0;
          letter-spacing: -0.02em;
        }

        .reg-brand-name span { color: #4ade80; }

        .reg-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #f0f0f0;
          letter-spacing: -0.03em;
          margin: 0 0 0.35rem;
        }

        .reg-subtitle {
          color: rgba(240,240,240,0.4);
          font-size: 0.875rem;
          font-weight: 300;
          margin: 0;
        }

        .reg-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 2rem;
          backdrop-filter: blur(12px);
        }

        .reg-error {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.85rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .reg-role-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .reg-role-option {
          position: relative;
          cursor: pointer;
        }

        .reg-role-option input {
          position: absolute;
          opacity: 0;
          width: 0; height: 0;
        }

        .reg-role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0.75rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: all 0.2s;
          text-align: center;
          cursor: pointer;
        }

        .reg-role-option input:checked + .reg-role-card {
          border-color: rgba(74,222,128,0.5);
          background: rgba(74,222,128,0.07);
        }

        .reg-role-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
        }

        .reg-role-emoji { font-size: 1.6rem; }

        .reg-role-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: #f0f0f0;
        }

        .reg-role-desc {
          font-size: 0.75rem;
          color: rgba(240,240,240,0.35);
          line-height: 1.3;
        }

        .reg-role-check {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem;
          color: transparent;
          transition: all 0.2s;
          margin-top: 0.25rem;
        }

        .reg-role-option input:checked + .reg-role-card .reg-role-check {
          background: #4ade80;
          border-color: #4ade80;
          color: #0b0e14;
        }

        .reg-section-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(240,240,240,0.3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
          margin-top: 0.25rem;
        }

        .reg-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .reg-field { margin-bottom: 0.75rem; }

        .reg-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(240,240,240,0.5);
          margin-bottom: 0.35rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .reg-input-wrap { position: relative; }

        .reg-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.65rem 0.9rem;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .reg-input::placeholder { color: rgba(240,240,240,0.18); }

        .reg-input:focus {
          border-color: rgba(74,222,128,0.45);
          background: rgba(74,222,128,0.04);
        }

        .reg-input.has-toggle { padding-right: 2.75rem; }

        .reg-toggle-pw {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(240,240,240,0.3);
          font-size: 0.85rem;
          padding: 0;
          transition: color 0.15s;
          line-height: 1;
        }

        .reg-toggle-pw:hover { color: rgba(240,240,240,0.7); }

        .reg-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 1.25rem 0;
        }

        .reg-matching-section {
          background: rgba(74,222,128,0.05);
          border: 1px solid rgba(74,222,128,0.15);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 1rem 0;
        }

        .reg-matching-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: #4ade80;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .reg-food-types {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .reg-food-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          color: rgba(240,240,240,0.7);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .reg-food-btn:hover {
          background: rgba(74,222,128,0.1);
          border-color: rgba(74,222,128,0.3);
        }

        .reg-food-btn.selected {
          background: rgba(74,222,128,0.2);
          border-color: #4ade80;
          color: #4ade80;
        }

        .reg-geo-status {
          font-size: 0.8rem;
          color: rgba(240,240,240,0.5);
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .reg-geo-loading {
          color: #4ade80;
        }

        .reg-info-badge {
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #4ade80;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .reg-submit {
          width: 100%;
          background: #4ade80;
          border: none;
          border-radius: 10px;
          padding: 0.8rem 1rem;
          color: #0b0e14;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .reg-submit:hover:not(:disabled) {
          background: #6ee7a0;
          transform: translateY(-1px);
        }

        .reg-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reg-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(11,14,20,0.3);
          border-top-color: #0b0e14;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .reg-footer {
          text-align: center;
          margin-top: 1.25rem;
          color: rgba(240,240,240,0.35);
          font-size: 0.85rem;
        }

        .reg-footer a {
          color: #4ade80;
          text-decoration: none;
          font-weight: 500;
        }

        .reg-footer a:hover { opacity: 0.8; }

        @media (max-width: 480px) {
          .reg-grid-2 { grid-template-columns: 1fr; }
          .reg-role-group { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-card">

          <div className="reg-brand">
            <Link to="/" className="reg-brand-logo">
              <div className="reg-brand-icon">🌱</div>
              <span className="reg-brand-name">Food<span>Save</span></span>
            </Link>
            <h1 className="reg-title">Créer un compte</h1>
            <p className="reg-subtitle">Rejoignez la communauté FoodSave</p>
          </div>

          <div className="reg-box">
            {error && (
              <div className="reg-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="reg-section-label">Je suis…</div>
              <div className="reg-role-group">
                <label className="reg-role-option">
                  <input
                    type="radio"
                    name="role"
                    value="merchant"
                    checked={formData.role === 'merchant'}
                    onChange={handleChange}
                  />
                  <div className="reg-role-card">
                    <span className="reg-role-emoji">🧑‍🍳</span>
                    <span className="reg-role-title">Commerçant</span>
                    <span className="reg-role-desc">Je veux donner mes invendus</span>
                    <div className="reg-role-check">✓</div>
                  </div>
                </label>

                <label className="reg-role-option">
                  <input
                    type="radio"
                    name="role"
                    value="association"
                    checked={formData.role === 'association'}
                    onChange={handleChange}
                  />
                  <div className="reg-role-card">
                    <span className="reg-role-emoji">🤝</span>
                    <span className="reg-role-title">Association</span>
                    <span className="reg-role-desc">Je veux recevoir des dons</span>
                    <div className="reg-role-check">✓</div>
                  </div>
                </label>
              </div>

              <div className="reg-divider" />

              <div className="reg-section-label">Informations</div>
              <div className="reg-grid-2">
                <div className="reg-field">
                  <label className="reg-label">Nom / Organisation</label>
                  <input
                    type="text"
                    className="reg-input"
                    name="name"
                    placeholder="Ex : Association Les Restos"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">Email</label>
                  <input
                    type="email"
                    className="reg-input"
                    name="email"
                    placeholder="contact@association.fr"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="reg-grid-2">
                <div className="reg-field">
                  <label className="reg-label">Mot de passe</label>
                  <div className="reg-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="reg-input has-toggle"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="reg-toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="reg-field">
                  <label className="reg-label">Téléphone</label>
                  <input
                    type="tel"
                    className="reg-input"
                    name="phone"
                    placeholder="01 23 45 67 89"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="reg-field">
                <label className="reg-label">Adresse</label>
                <input
                  type="text"
                  className="reg-input"
                  name="address"
                  placeholder="12 rue de la Paix, 75001 Paris"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                {geocoding && (
                  <div className="reg-geo-status reg-geo-loading">
                    <div className="reg-spinner" style={{ width: '12px', height: '12px' }} />
                    Recherche des coordonnées GPS…
                  </div>
                )}
              </div>

              {/* SECTION MATCHING POUR LES ASSOCIATIONS */}
              {formData.role === 'association' && (
                <div className="reg-matching-section">
                  <div className="reg-matching-title">
                    <span>🎯</span> Optimisez vos recommandations
                  </div>

                  <div className="reg-info-badge">
                    <span>ℹ️</span> Ces informations aideront à mieux matcher avec les dons
                  </div>

                  <div className="reg-field">
                    <label className="reg-label">Capacité de stockage (kg)</label>
                    <input
                      type="number"
                      className="reg-input"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      min="10"
                      max="1000"
                      step="10"
                    />
                    <small style={{ color: 'rgba(240,240,240,0.4)', display: 'block', marginTop: '0.25rem' }}>
                      Capacité maximale en kilogrammes
                    </small>
                  </div>

                  <div className="reg-field">
                    <label className="reg-label">Types d'aliments préférés</label>
                    <div className="reg-food-types">
                      {foodTypeOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`reg-food-btn ${selectedFoodTypes.includes(option.value) ? 'selected' : ''}`}
                          onClick={() => handleFoodTypeToggle(option.value)}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                    <small style={{ color: 'rgba(240,240,240,0.4)' }}>
                      Sélectionnez les types d'aliments que vous acceptez préférentiellement
                    </small>
                  </div>

                  <div className="reg-geo-status">
                    <span>📍</span> Les coordonnées GPS seront automatiquement déterminées à partir de votre adresse
                  </div>
                </div>
              )}

              <button type="submit" className="reg-submit" disabled={loading || geocoding}>
                {loading || geocoding ? (
                  <><div className="reg-spinner" /> {geocoding ? 'Géolocalisation…' : 'Inscription…'}</>
                ) : (
                  "Créer mon compte →"
                )}
              </button>
            </form>

            <div className="reg-footer">
              Déjà inscrit ? <Link to="/login">Se connecter</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
