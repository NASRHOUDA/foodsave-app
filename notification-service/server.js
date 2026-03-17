const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS ultra-permissif pour le développement
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Configuration Socket.IO ultra-permissive
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"],
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Stockage en mémoire
const userSockets = new Map();
const notifications = [];

// Middleware pour logger toutes les requêtes
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Route racine pour éviter 404
app.get('/', (req, res) => {
  res.json({ 
    message: 'Notification Service', 
    status: 'running',
    websocket: 'ws://localhost:3004',
    endpoints: ['/health', '/api/notifications', '/api/stats']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'notification-service',
    websocket: 'active',
    connections: userSockets.size,
    notifications: notifications.length,
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Créer une notification
app.post('/api/notifications', (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    
    console.log(`📨 Nouvelle notification pour user ${userId}: ${title}`);
    
    const notification = {
      id: Date.now().toString(),
      userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.push(notification);
    
    // Envoyer en temps réel
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit('notification', notification);
      console.log(`✅ Notification envoyée en temps réel à ${userId}`);
    } else {
      console.log(`⏳ Utilisateur ${userId} hors ligne, notification stockée`);
    }
    
    res.status(201).json(notification);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les notifications
app.get('/api/notifications/:userId', (req, res) => {
  const userNotifications = notifications.filter(n => n.userId === req.params.userId);
  res.json(userNotifications);
});

// Statistiques
app.get('/api/stats', (req, res) => {
  res.json({
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    connected: userSockets.size,
    connections: Array.from(userSockets.entries()).map(([id, socket]) => ({ userId: id, socketId: socket }))
  });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Nouveau client WebSocket connecté:', socket.id);
  console.log('📋 Transport utilisé:', socket.conn.transport.name);

  // Envoyer un message de bienvenue
  socket.emit('welcome', { message: 'Connecté au serveur WebSocket', socketId: socket.id });

  socket.on('register', (userId) => {
    console.log(`👤 Tentative d'enregistrement: userId=${userId}, socket=${socket.id}`);
    userSockets.set(userId, socket.id);
    console.log(`✅ Utilisateur ${userId} enregistré avec succès`);
    
    // Confirmer l'enregistrement
    socket.emit('registered', { userId, success: true });
    
    // Envoyer les notifications non lues
    const userNotifications = notifications.filter(n => n.userId === userId && !n.read);
    if (userNotifications.length > 0) {
      socket.emit('pending_notifications', userNotifications);
      console.log(`📬 ${userNotifications.length} notification(s) en attente pour ${userId}`);
    }
  });

  socket.on('ping', (data) => {
    console.log('🏓 Ping reçu de', socket.id);
    socket.emit('pong', { time: Date.now() });
  });

  socket.on('disconnect', (reason) => {
    console.log(`👋 Client déconnecté: ${socket.id}, raison: ${reason}`);
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`✅ Utilisateur ${userId} retiré de la liste`);
        break;
      }
    }
  });

  socket.on('error', (error) => {
    console.error('❌ Erreur WebSocket:', error);
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Notification service running on port ${PORT}`);
  console.log(`📍 REST API: http://localhost:${PORT}`);
  console.log(`📍 WebSocket: ws://localhost:${PORT}`);
  console.log(`📍 CORS: activé pour toutes les origines`);
});

// Marquer une notification comme lue
app.post('/api/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📖 Marquage notification ${id} comme lue`);
    
    const notification = notifications.find(n => n.id === id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    notification.read = true;
    
    // Notifier via WebSocket
    const socketId = userSockets.get(notification.userId);
    if (socketId) {
      io.to(socketId).emit('notification_read', id);
    }
    
    res.json({ message: 'Notification marquée comme lue', id });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer toutes les notifications d'un utilisateur comme lues
app.post('/api/notifications/:userId/read-all', (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📚 Marquage toutes les notifications de ${userId} comme lues`);
    
    let count = 0;
    notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    
    // Notifier via WebSocket
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit('all_read');
    }
    
    res.json({ message: `${count} notification(s) marquée(s) comme lue(s)` });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
