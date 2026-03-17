
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import userService from '../services/userService';
import requestService from '../services/requestService';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = userService.getCurrentUser();
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Pages où on ne montre pas les liens de navigation
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    if (user?.role === 'merchant') {
      loadPendingCount();
    }
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const loadPendingCount = async () => {
    const requests = await requestService.getMerchantRequests(user.id);
    const pending = requests.filter(r => r.status === 'pending').length;
    setPendingCount(pending);
  };

  const handleLogout = () => {
    userService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --nav-bg: #0f1117;
          --nav-border: rgba(255,255,255,0.07);
          --accent: #4ade80;
          --accent-dim: rgba(74, 222, 128, 0.12);
          --text-primary: #f0f0f0;
          --text-muted: rgba(240,240,240,0.45);
          --pill-bg: rgba(255,255,255,0.05);
          --pill-hover: rgba(255,255,255,0.09);
          --danger: #f87171;
        }

        .fs-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--nav-bg);
          border-bottom: 1px solid var(--nav-border);
          font-family: 'DM Sans', sans-serif;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .fs-navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 62px;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        /* BRAND */
        .fs-brand {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--text-primary) !important;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }

        .fs-brand-icon {
          width: 30px;
          height: 30px;
          background: var(--accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .fs-brand span {
          color: var(--accent);
        }

        /* NAV LINKS - cachés sur les pages d'auth */
        .fs-nav-links {
          display: ${isAuthPage ? 'none' : 'flex'};
          align-items: center;
          gap: 0.25rem;
          flex: 1;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .fs-nav-link {
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .fs-nav-link:hover {
          color: var(--text-primary);
          background: var(--pill-hover);
          text-decoration: none;
        }

        .fs-nav-link.active {
          color: var(--accent);
          background: var(--accent-dim);
        }

        /* BADGE */
        .fs-badge {
          background: var(--danger);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          min-width: 18px;
          text-align: center;
          animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* DIVIDER - caché sur les pages d'auth */
        .fs-divider {
          width: 1px;
          height: 20px;
          background: var(--nav-border);
          flex-shrink: 0;
          display: ${isAuthPage ? 'none' : 'block'};
        }

        /* USER SECTION */
        .fs-user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
          margin-left: auto;
        }

        .fs-user-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--pill-bg);
          border: 1px solid var(--nav-border);
          border-radius: 999px;
          padding: 0.3rem 0.75rem 0.3rem 0.4rem;
        }

        .fs-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--accent-dim);
          border: 1px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .fs-user-name {
          color: var(--text-primary);
          font-size: 0.8rem;
          font-weight: 500;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-role-tag {
          font-size: 0.65rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* BUTTONS */
        .fs-btn-logout {
          background: transparent;
          border: 1px solid var(--nav-border);
          color: var(--text-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0.35rem 0.85rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .fs-btn-logout:hover {
          border-color: var(--danger);
          color: var(--danger);
          background: rgba(248, 113, 113, 0.08);
        }

        .fs-btn-auth {
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 0.4rem 1rem;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .fs-btn-login {
          color: var(--text-muted);
          border: 1px solid var(--nav-border);
        }

        .fs-btn-login:hover {
          color: var(--text-primary);
          border-color: rgba(255,255,255,0.2);
          text-decoration: none;
        }

        .fs-btn-register {
          background: var(--accent);
          color: #0f1117;
          font-weight: 600;
          border: 1px solid var(--accent);
        }

        .fs-btn-register:hover {
          background: #6ee7a0;
          color: #0f1117;
          text-decoration: none;
        }

        /* MOBILE TOGGLE - caché sur les pages d'auth */
        .fs-menu-toggle {
          display: ${isAuthPage ? 'none' : 'flex'};
          background: none;
          border: 1px solid var(--nav-border);
          border-radius: 8px;
          padding: 0.35rem 0.5rem;
          cursor: pointer;
          color: var(--text-muted);
          margin-left: auto;
        }

        .fs-menu-toggle:hover {
          color: var(--text-primary);
        }

        /* MOBILE MENU */
        .fs-mobile-menu {
          display: none;
          border-top: 1px solid var(--nav-border);
          padding: 0.75rem 1.5rem 1rem;
          flex-direction: column;
          gap: 0.25rem;
        }

        .fs-mobile-menu.open {
          display: ${isAuthPage ? 'none' : 'flex'};
        }

        .fs-mobile-link {
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.15s;
        }

        .fs-mobile-link:hover,
        .fs-mobile-link.active {
          color: var(--text-primary);
          background: var(--pill-hover);
          text-decoration: none;
        }

        .fs-mobile-link.active {
          color: var(--accent);
          background: var(--accent-dim);
        }

        .fs-mobile-divider {
          height: 1px;
          background: var(--nav-border);
          margin: 0.5rem 0;
        }

        .fs-mobile-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem 0;
        }

        .fs-mobile-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .fs-nav-links { display: none; }
          .fs-divider { display: none; }
          .fs-user-section { display: none; }
          .fs-menu-toggle { display: flex; align-items: center; }
        }
      `}</style>

      <nav className="fs-navbar">
        <div className="fs-navbar-inner">
          {/* Brand - toujours visible */}
          <Link className="fs-brand" to={user ? "/dashboard" : "/"}>
            <div className="fs-brand-icon">🌱</div>
            Food<span>Save</span>
          </Link>

          {/* Desktop Nav Links - cachés sur login/register */}
          {!isAuthPage && (
            <ul className="fs-nav-links">
              <li>
                <Link className={`fs-nav-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
                  Dashboard
                </Link>
              </li>

              <li>
                <Link className={`fs-nav-link ${isActive('/stats') ? 'active' : ''}`} to="/stats">
                  📊 Statistiques
                </Link>
              </li>

              {user?.role === 'merchant' && (
                <>
                  <li>
                    <Link className={`fs-nav-link ${isActive('/create-donation') ? 'active' : ''}`} to="/create-donation">
                      + Publier un don
                    </Link>
                  </li>
                  <li>
                    <Link className={`fs-nav-link ${isActive('/my-donations') ? 'active' : ''}`} to="/my-donations">
                      Mes dons
                    </Link>
                  </li>
                  <li>
                    <Link className={`fs-nav-link ${isActive('/merchant-requests') ? 'active' : ''}`} to="/merchant-requests">
                      Demandes reçues
                      {pendingCount > 0 && (
                        <span className="fs-badge">{pendingCount}</span>
                      )}
                    </Link>
                  </li>
                </>
              )}

              {user?.role === 'association' && (
                <>
                  <li>
                    <Link className={`fs-nav-link ${isActive('/available-donations') ? 'active' : ''}`} to="/available-donations">
                      Dons disponibles
                    </Link>
                  </li>
                  <li>
                    <Link className={`fs-nav-link ${isActive('/association-requests') ? 'active' : ''}`} to="/association-requests">
                      Mes demandes
                    </Link>
                  </li>
                </>
              )}
            </ul>
          )}

          {/* Desktop User Section */}
          <div className="fs-user-section">
            {user ? (
              <>
                {!isAuthPage && <NotificationBell />}
                
                <div className="fs-user-chip">
                  <div className="fs-avatar">
                    {user.role === 'merchant' ? '🧑‍🍳' : '🤝'}
                  </div>
                  <div>
                    <div className="fs-user-name">{user.name}</div>
                    <div className="fs-role-tag">
                      {user.role === 'merchant' ? 'Commerçant' : 'Association'}
                    </div>
                  </div>
                </div>
                <button className="fs-btn-logout" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link className="fs-btn-auth fs-btn-login" to="/login">Connexion</Link>
                <Link className="fs-btn-auth fs-btn-register" to="/register">Inscription</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle - caché sur login/register */}
          {!isAuthPage && (
            <button className="fs-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>

        {/* Mobile Menu - caché sur login/register */}
        {!isAuthPage && (
          <div className={`fs-mobile-menu ${menuOpen ? 'open' : ''}`}>
            <Link className={`fs-mobile-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
              Dashboard
            </Link>

            <Link className={`fs-mobile-link ${isActive('/stats') ? 'active' : ''}`} to="/stats">
              📊 Statistiques
            </Link>

            {user?.role === 'merchant' && (
              <>
                <Link className={`fs-mobile-link ${isActive('/create-donation') ? 'active' : ''}`} to="/create-donation">
                  + Publier un don
                </Link>
                <Link className={`fs-mobile-link ${isActive('/my-donations') ? 'active' : ''}`} to="/my-donations">
                  Mes dons
                </Link>
                <Link className={`fs-mobile-link ${isActive('/merchant-requests') ? 'active' : ''}`} to="/merchant-requests">
                  Demandes reçues
                  {pendingCount > 0 && <span className="fs-badge">{pendingCount}</span>}
                </Link>
              </>
            )}

            {user?.role === 'association' && (
              <>
                <Link className={`fs-mobile-link ${isActive('/available-donations') ? 'active' : ''}`} to="/available-donations">
                  Dons disponibles
                </Link>
                <Link className={`fs-mobile-link ${isActive('/association-requests') ? 'active' : ''}`} to="/association-requests">
                  Mes demandes
                </Link>
              </>
            )}

            <div className="fs-mobile-divider" />

            <div className="fs-mobile-actions">
              {user ? (
                <>
                  <div className="fs-mobile-user">
                    <span>🔔</span>
                    <span>{user.role === 'merchant' ? '🧑‍🍳' : '🤝'}</span>
                    <span>{user.name}</span>
                  </div>
                  <button className="fs-btn-logout" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link className="fs-btn-auth fs-btn-login" to="/login">Connexion</Link>
                  <Link className="fs-btn-auth fs-btn-register" to="/register">Inscription</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
