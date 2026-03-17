import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await userService.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .login-root {
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

        /* Ambient background orbs */
        .login-root::before {
          content: '';
          position: fixed;
          top: -200px;
          left: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-root::after {
          content: '';
          position: fixed;
          bottom: -150px;
          right: -150px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Brand header */
        .login-brand {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          margin-bottom: 1.5rem;
        }

        .login-brand-icon {
          width: 38px;
          height: 38px;
          background: #4ade80;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .login-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.4rem;
          color: #f0f0f0;
          letter-spacing: -0.02em;
        }

        .login-brand-name span { color: #4ade80; }

        .login-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.6rem;
          color: #f0f0f0;
          letter-spacing: -0.03em;
          margin: 0 0 0.4rem;
        }

        .login-subtitle {
          color: rgba(240,240,240,0.4);
          font-size: 0.875rem;
          font-weight: 300;
          margin: 0;
        }

        /* Form box */
        .login-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 2rem;
          backdrop-filter: blur(12px);
        }

        /* Error */
        .login-error {
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

        /* Field */
        .login-field {
          margin-bottom: 1.1rem;
        }

        .login-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(240,240,240,0.55);
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.7rem 1rem;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .login-input::placeholder { color: rgba(240,240,240,0.2); }

        .login-input:focus {
          border-color: rgba(74,222,128,0.45);
          background: rgba(74,222,128,0.04);
        }

        .login-input.has-toggle { padding-right: 3rem; }

        .login-toggle-pw {
          position: absolute;
          right: 0.85rem;
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

        .login-toggle-pw:hover { color: rgba(240,240,240,0.7); }

        /* Submit */
        .login-submit {
          width: 100%;
          background: #4ade80;
          border: none;
          border-radius: 10px;
          padding: 0.8rem 1rem;
          color: #0b0e14;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-submit:hover:not(:disabled) {
          background: #6ee7a0;
          transform: translateY(-1px);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(11,14,20,0.3);
          border-top-color: #0b0e14;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: rgba(240,240,240,0.35);
          font-size: 0.85rem;
        }

        .login-footer a {
          color: #4ade80;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.15s;
        }

        .login-footer a:hover { opacity: 0.8; }

        /* Divider */
        .login-sep {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.25rem 0;
        }

        .login-sep-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        .login-sep-text {
          color: rgba(240,240,240,0.2);
          font-size: 0.75rem;
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">

          {/* Brand */}
          <div className="login-brand">
            <Link to="/" className="login-brand-logo">
              <div className="login-brand-icon">🌱</div>
              <span className="login-brand-name">Food<span>Save</span></span>
            </Link>
            <h1 className="login-title">Bon retour 👋</h1>
            <p className="login-subtitle">Connectez-vous pour accéder à votre espace</p>
          </div>

          {/* Form box */}
          <div className="login-box">
            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label">Email</label>
                <div className="login-input-wrap">
                  <input
                    type="email"
                    className="login-input"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Mot de passe</label>
                <div className="login-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input has-toggle"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <><div className="login-spinner" /> Connexion…</>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className="login-sep">
              <div className="login-sep-line" />
              <span className="login-sep-text">nouveau sur FoodSave ?</span>
              <div className="login-sep-line" />
            </div>

            <div className="login-footer">
              <Link to="/register">Créer un compte →</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;