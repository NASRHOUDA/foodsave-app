const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host:     process.env.DB_HOST     || 'postgres',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'foodsave_users',
  user:     process.env.DB_USER     || 'foodsave',
  password: process.env.DB_PASSWORD || 'foodsave123',
});

const initDB = async () => {
  try {
    // Table users avec les nouveaux champs pour le matching
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                   SERIAL PRIMARY KEY,
        email                VARCHAR(255) UNIQUE NOT NULL,
        password             VARCHAR(255) NOT NULL,
        name                 VARCHAR(255) NOT NULL,
        role                 VARCHAR(50) NOT NULL CHECK (role IN ('merchant', 'association', 'volunteer')),
        phone                VARCHAR(50),
        address              TEXT,

        -- Champs pour le matching
        capacity             FLOAT DEFAULT 100,
        lat                  FLOAT DEFAULT 48.8566,
        lon                  FLOAT DEFAULT 2.3522,
        preferred_food_types TEXT[] DEFAULT '{}',

        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrations — ajouter les colonnes si elles n'existent pas (pour les BDs existantes)
    const migrations = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS capacity FLOAT DEFAULT 100",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS lat FLOAT DEFAULT 48.8566",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS lon FLOAT DEFAULT 2.3522",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_food_types TEXT[] DEFAULT '{}'",
    ];

    for (const sql of migrations) {
      await pool.query(sql);
    }

    console.log('✅ Table users prête avec champs matching');
  } catch (err) {
    console.error('❌ Erreur init DB:', err);
  }
};

initDB();

const JWT_SECRET = process.env.JWT_SECRET || 'foodsave-secret-key-2024';

// ── Health ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service', database: 'postgresql' });
});

// ── Inscription ───────────────────────────────────────────────────────
app.post('/api/users/register', async (req, res) => {
  try {
    const {
      email, password, name, role, phone, address,
      // Nouveaux champs matching
      capacity, lat, lon, preferred_food_types
    } = req.body;

    if (!['merchant', 'association', 'volunteer'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, phone, address, capacity, lat, lon, preferred_food_types)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, name, role, phone, address, capacity, lat, lon, preferred_food_types, created_at`,
      [
        email,
        hashedPassword,
        name,
        role,
        phone || null,
        address || null,
        capacity || 100,
        lat || 48.8566,
        lon || 2.3522,
        preferred_food_types || [],
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Connexion ─────────────────────────────────────────────────────────
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Middleware auth ────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ── Profil ────────────────────────────────────────────────────────────
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, phone, address,
              capacity, lat, lon, preferred_food_types, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Mettre à jour le profil (capacity, lat, lon, preferred_food_types) ──
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { phone, address, capacity, lat, lon, preferred_food_types } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET phone = COALESCE($1, phone),
           address = COALESCE($2, address),
           capacity = COALESCE($3, capacity),
           lat = COALESCE($4, lat),
           lon = COALESCE($5, lon),
           preferred_food_types = COALESCE($6, preferred_food_types)
       WHERE id = $7
       RETURNING id, email, name, role, phone, address, capacity, lat, lon, preferred_food_types`,
      [phone, address, capacity, lat, lon, preferred_food_types, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur update profile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Liste des associations (avec champs matching) ─────────────────────
app.get('/api/users/associations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, phone, address,
              capacity, lat, lon, preferred_food_types
       FROM users WHERE role = 'association'`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Liste des commerçants ─────────────────────────────────────────────
app.get('/api/users/merchants', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, phone, address, lat, lon
       FROM users WHERE role = 'merchant'`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Utilisateur par ID ────────────────────────────────────────────────
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, phone, address,
              capacity, lat, lon, preferred_food_types
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ User service running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});