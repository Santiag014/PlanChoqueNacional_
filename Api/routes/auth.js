import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';

const router = express.Router();

// Secret key para JWT (en producción debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'terpel-plan-choque-secret-2025';
const JWT_EXPIRES_IN = '24h';

// Login
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
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
      // Crear token JWT
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          tipo: user.tipo || user.rol || user.rol_id,
          nombre: user.nombre || user.name,
          apellido: user.apellido,
          agente_id: user.agente_id,
          IsPromotoria: user.IsPromotoria 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          apellido: user.apellido,
          tipo: user.tipo || user.rol || user.rol_id,
          zona_id: user.zona_id,
          regional_id: user.regional_id,
          agente_id: user.agente_id,
          IsPromotoria: user.IsPromotoria
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Registro de usuario
router.post('/register', async (req, res) => {
  const { name, email, documento, password, rol_id, zona_id, regional_id, agente_id } = req.body;
  if (!name || !email || !documento || !password || !rol_id || !zona_id || !regional_id || !agente_id) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }
  let conn;
  try {
    conn = await getConnection();
    const [exist] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }
    const hash = await bcrypt.hash(password, 12);
    await conn.execute(
      `INSERT INTO users (name, email, documento, password, rol_id, zona_id, regional_id, agente_id, created_at, update_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, documento, hash, rol_id, zona_id, regional_id, agente_id]
    );
    res.json({ success: true, message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al registrar usuario', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Middleware para verificar el token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Endpoint para verificar si el token es válido
router.post('/verify-token', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
    
    res.json({ 
      success: true, 
      message: 'Token válido',
      user: {
        id: decoded.userId,
        email: decoded.email,
        tipo: decoded.tipo,
        nombre: decoded.nombre,
        apellido: decoded.apellido
      }
    });
  });
});

// Endpoint para refrescar el token
router.post('/refresh-token', authenticateToken, (req, res) => {
  const { user } = req;
  
  // Crear un nuevo token con la misma información
  const newToken = jwt.sign(
    { 
      userId: user.userId,
      email: user.email,
      tipo: user.tipo,
      nombre: user.nombre,
      apellido: user.apellido
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    message: 'Token renovado exitosamente',
    token: newToken
  });
});

// Endpoint para logout (invalidar token en el cliente)
router.post('/logout', (req, res) => {
  // En una implementación más robusta, aquí podrías agregar el token a una lista negra
  res.json({ 
    success: true, 
    message: 'Logout exitoso' 
  });
});

export default router;