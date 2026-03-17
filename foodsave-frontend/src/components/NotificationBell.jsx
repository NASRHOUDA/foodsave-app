import React, { useState, useEffect, useRef, useCallback } from 'react';
import notificationService from '../services/notificationService';
import userService from '../services/userService';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isOpen,        setIsOpen]        = useState(false);
  const dropdownRef = useRef(null);
  const user = userService.getCurrentUser();

  // ✅ Callbacks stables pour éviter les re-registrations infinies
  const handleUpdate = useCallback((updated) => {
    setNotifications([...updated]);
    setUnreadCount(updated.filter(n => !n.read).length);
  }, []);

  const handleNew = useCallback((notification) => {
    // Déjà géré par 'update', mais on peut ajouter un toast ici si besoin
    console.log('🔔 Nouvelle notif:', notification.title);
  }, []);

  useEffect(() => {
    if (!user) return;

    // ✅ Connecter le WebSocket (singleton — pas de déconnexion au cleanup)
    notificationService.connect(user.id);

    // ✅ Charger les notifications existantes
    notificationService.fetchNotifications(user.id).then(data => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });

    // ✅ S'abonner aux events
    notificationService.on('update', handleUpdate);
    notificationService.on('notification', handleNew);

    // ✅ Cleanup : retirer les listeners SANS déconnecter le socket
    return () => {
      notificationService.off('update', handleUpdate);
      notificationService.off('notification', handleNew);
    };
  }, [user?.id]); // Re-run seulement si l'utilisateur change

  // Fermer en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      request:          '📥',
      response:         '📤',
      system:           '🔔',
      test:             '🧪',
      request_accepted: '✅',
      request_rejected: '❌',
    };
    return icons[type] || '📨';
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1)  return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffMin < 1440) return `il y a ${Math.floor(diffMin/60)}h`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <>
      <style>{`
        .notif-container {
          position: relative;
          display: inline-block;
        }

        .notif-bell {
          position: relative;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          transition: background 0.15s;
          color: rgba(240,240,240,0.6);
          font-size: 1.1rem;
          line-height: 1;
          user-select: none;
        }

        .notif-bell:hover {
          background: rgba(255,255,255,0.06);
          color: #f0f0f0;
        }

        .notif-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #f87171;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          min-width: 17px;
          height: 17px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          animation: notif-pulse 2s infinite;
          border: 1.5px solid #0b0e14;
        }

        @keyframes notif-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.1); }
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 340px;
          max-width: 90vw;
          background: #151820;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.55);
          z-index: 2000;
          overflow: hidden;
          animation: notif-drop 0.18s ease;
        }

        @keyframes notif-drop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .notif-header-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          color: #f0f0f0;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .notif-header-count {
          background: rgba(74,222,128,0.15);
          color: #4ade80;
          font-size: 0.68rem;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 999px;
        }

        .notif-mark-all {
          background: none;
          border: none;
          color: rgba(74,222,128,0.7);
          font-size: 0.73rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }

        .notif-mark-all:hover {
          background: rgba(74,222,128,0.1);
          color: #4ade80;
        }

        .notif-list {
          max-height: 380px;
          overflow-y: auto;
        }

        .notif-list::-webkit-scrollbar       { width: 4px; }
        .notif-list::-webkit-scrollbar-track  { background: transparent; }
        .notif-list::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.08); border-radius: 999px; }

        .notif-item {
          padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          transition: background 0.12s;
          cursor: default;
        }

        .notif-item:last-child { border-bottom: none; }

        .notif-item:hover { background: rgba(255,255,255,0.025); }

        .notif-item.unread { background: rgba(74,222,128,0.04); }
        .notif-item.unread:hover { background: rgba(74,222,128,0.07); }

        .notif-icon {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .notif-item.unread .notif-icon {
          background: rgba(74,222,128,0.1);
          border-color: rgba(74,222,128,0.2);
        }

        .notif-body { flex: 1; min-width: 0; }

        .notif-title {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.82rem;
          color: #f0f0f0;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-msg {
          font-size: 0.77rem;
          color: rgba(240,240,240,0.45);
          margin: 0 0 3px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notif-time {
          font-size: 0.68rem;
          color: rgba(240,240,240,0.25);
        }

        .notif-read-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(240,240,240,0.2);
          font-size: 0.8rem;
          padding: 2px 4px;
          border-radius: 4px;
          flex-shrink: 0;
          transition: all 0.12s;
          line-height: 1;
        }

        .notif-read-btn:hover {
          color: #4ade80;
          background: rgba(74,222,128,0.1);
        }

        .notif-unread-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .notif-empty {
          padding: 36px 20px;
          text-align: center;
          color: rgba(240,240,240,0.25);
        }

        .notif-empty-icon { font-size: 1.8rem; margin-bottom: 8px; opacity: 0.5; }
        .notif-empty p { font-size: 0.82rem; margin: 0; }
      `}</style>

      <div className="notif-container" ref={dropdownRef}>
        {/* Cloche */}
        <div className="notif-bell" onClick={() => setIsOpen(o => !o)}>
          🔔
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <h3 className="notif-header-title">
                Notifications
                {unreadCount > 0 && (
                  <span className="notif-header-count">{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}</span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={handleMarkAllRead}>
                  Tout lire
                </button>
              )}
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <div className="notif-empty-icon">📭</div>
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notif-item ${!notif.read ? 'unread' : ''}`}
                  >
                    <div className="notif-icon">{getNotificationIcon(notif.type)}</div>
                    <div className="notif-body">
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-msg">{notif.message}</div>
                      <div className="notif-time">{formatTime(notif.createdAt)}</div>
                    </div>
                    {!notif.read && (
                      <>
                        <div className="notif-unread-dot" />
                        <button
                          className="notif-read-btn"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Marquer comme lu"
                        >
                          ✓
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;