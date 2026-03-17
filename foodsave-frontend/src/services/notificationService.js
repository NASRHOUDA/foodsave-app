import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3004/api';
const WS_URL  = 'http://localhost:3004';

class NotificationService {
  constructor() {
    this.socket        = null;
    this.listeners     = new Map(); // event -> [callback, ...]
    this.notifications = [];
    this.currentUserId = null;
    this.connecting    = false;
  }

  connect(userId) {
    // ✅ Ne pas reconnecter si déjà connecté pour le même user
    if (this.socket?.connected && this.currentUserId === String(userId)) {
      return;
    }

    // ✅ Éviter les connexions multiples simultanées
    if (this.connecting) return;
    this.connecting    = true;
    this.currentUserId = String(userId);

    console.log('🔄 Connexion WebSocket pour user', userId);

    // Déconnecter proprement si une socket existe déjà
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(WS_URL, {
      // ✅ polling uniquement — pas de upgrade vers websocket
      // Évite l'erreur "WebSocket is closed before connection established"
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.connecting = false;
      console.log('✅ WebSocket connecté, id:', this.socket.id);
      this.socket.emit('register', String(userId));
    });

    this.socket.on('registered', (data) => {
      console.log('👤 Enregistré:', data);
    });

    // ✅ Notification temps réel → met à jour state React via _emit
    this.socket.on('notification', (notification) => {
      console.log('📨 Notification reçue:', notification);
      this.notifications.unshift(notification);
      this._emit('notification', notification);
      this._emit('update', [...this.notifications]);
    });

    // ✅ Notifications en attente au login
    this.socket.on('pending_notifications', (notifications) => {
      console.log('📬 En attente:', notifications.length);
      // Fusionner sans doublons
      const ids = new Set(this.notifications.map(n => n.id));
      const newOnes = notifications.filter(n => !ids.has(n.id));
      this.notifications = [...newOnes, ...this.notifications];
      this._emit('update', [...this.notifications]);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Déconnecté:', reason);
      this.connecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion:', error.message);
      this.connecting = false;
    });
  }

  // ✅ Ne JAMAIS appeler disconnect() depuis useEffect cleanup
  // Le singleton reste connecté toute la session
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket        = null;
      this.currentUserId = null;
      this.connecting    = false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    // Éviter les doublons
    const existing = this.listeners.get(event);
    if (!existing.includes(callback)) {
      existing.push(callback);
    }
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.set(
      event,
      this.listeners.get(event).filter(cb => cb !== callback)
    );
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error('Listener error:', e); }
      });
    }
  }

  async fetchNotifications(userId) {
    try {
      const response = await axios.get(`${API_URL}/notifications/${userId}`);
      this.notifications = response.data;
      return response.data;
    } catch {
      return [];
    }
  }

  async markAsRead(notificationId) {
    this.notifications = this.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this._emit('update', [...this.notifications]);
    try { await axios.post(`${API_URL}/notifications/${notificationId}/read`); } catch (_) {}
  }

  async markAllAsRead(userId) {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this._emit('update', [...this.notifications]);
    try { await axios.post(`${API_URL}/notifications/${userId}/read-all`); } catch (_) {}
  }

  getAll()         { return [...this.notifications]; }
  getUnreadCount() { return this.notifications.filter(n => !n.read).length; }
}

// Singleton — une seule instance pour toute l'app
export default new NotificationService();