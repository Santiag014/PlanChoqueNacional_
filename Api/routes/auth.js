import express from 'express';
import bcrypt from 'bcrypt';
import { getConnection } from '../db.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    let hash = user.password || user.contrasena;

    if (!hash) {
      return res.status(500).json({ success: false, message: 'No se encontró el hash de la contraseña en la base de datos.' });
    }

    password = String(password).trim();
    hash = String(hash).trim();

    if (hash.startsWith('$2y$')) {
      hash = hash.replace('$2y$', '$2a$');
    }

    const match = await bcrypt.compare(password, hash);

    if (match) {
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          apellido: user.apellido,
          rol: user.rol || user.rol_id,
          zona_id: user.zona_id,
          regional_id: user.regional_id,
          agente_id: user.agente_id
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: err.message });
  }
});

// Registro de usuario
router.post('/register', async (req, res) => {
  const { name, email, documento, password, rol_id, zona_id, regional_id, agente_id } = req.body;
  if (!name || !email || !documento || !password || !rol_id || !zona_id || !regional_id || !agente_id) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }
  try {
    const conn = await getConnection();
    const [exist] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }
    const hash = await bcrypt.hash(password, 12);
    await conn.execute(
      `INSERT INTO users (name, email, documento, password, rol_id, zona_id, regional_id, agente_id, created_at, update_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, documento, hash, rol_id, zona_id, regional_id, agente_id]
    );
    conn.release();
    res.json({ success: true, message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al registrar usuario', error: err.message });
  }
});

export default router;
