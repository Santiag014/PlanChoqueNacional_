import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';

const router = express.Router();

// ========================================================================
// 🔐 CONFIGURACIÓN DE AUTENTICACIÓN JWT
// ========================================================================

// Secret key para JWT (en producción debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'terpel-plan-choque-secret-2025';
const JWT_EXPIRES_IN = '24h';

// ========================================================================
// 🚪 ENDPOINTS DE AUTENTICACIÓN PRINCIPAL
// ========================================================================

// LOGIN DE USUARIOS - ENDPOINT PRINCIPAL DE AUTENTICACIÓN
// LOGIN DE USUARIOS - ENDPOINT PRINCIPAL DE AUTENTICACIÓN
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  let conn;
  
  try {
    conn = await getConnection();
    
    // Buscar usuario por email en la base de datos
    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    const user = rows[0];
    
    // LOG DE DEPURACIÓN - DATOS DEL USUARIO
    console.log('🔍 DATOS COMPLETOS DEL USUARIO DESDE DB:', JSON.stringify(user, null, 2));
    console.log('🔗 Campo power_bi:', user.power_bi);
    console.log('🔗 Campo powerBI:', user.powerBI);
    console.log('🔗 Campo powerbi:', user.powerbi);
    console.log('📧 Email:', user.email);
    console.log('🎭 Tipo/Rol:', user.tipo || user.rol || user.rol_id);
    
    let hash = user.password || user.contrasena;
    
    // Verificar que exista el hash de la contraseña
    if (!hash) {
      return res.status(500).json({ success: false, message: 'No se encontró el hash de la contraseña en la base de datos.' });
    }
    
    // Preparar datos para comparación de contraseñas
    password = String(password).trim();
    hash = String(hash).trim();
    
    // Compatibilidad con hashes de PHP (convertir $2y$ a $2a$)
    if (hash.startsWith('$2y$')) {
      hash = hash.replace('$2y$', '$2a$');
    }
    
    // Verificar contraseña con bcrypt
    const match = await bcrypt.compare(password, hash);
    
    if (match) {
      // Crear token JWT con información del usuario
      const token = jwt.sign(
        { 
          id: user.id,  // Cambiado de userId a id para consistencia
          email: user.email,
          tipo: user.tipo || user.rol || user.rol_id,
          nombre: user.nombre || user.name,
          apellido: user.apellido,
          agente_id: user.agente_id,
          IsPromotoria: user.IsPromotoria,
          powerBI: user.power_bi  // Incluir el enlace de PowerBI en el token
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Respuesta exitosa con token y datos del usuario
      const responseData = {
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
          powerBI: user.power_bi,
          IsPromotoria: user.IsPromotoria
        }
      };
      
      // LOG DE DEPURACIÓN - RESPUESTA ENVIADA AL FRONTEND
      console.log('📤 RESPUESTA ENVIADA AL FRONTEND:', JSON.stringify(responseData, null, 2));
      console.log('🔗 PowerBI en respuesta:', responseData.user.powerBI);
      
      res.json(responseData);
    } else {
      res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
    
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// REGISTRO DE NUEVOS USUARIOS
router.post('/register', async (req, res) => {
  const { name, email, documento, password, rol_id, zona_id, regional_id, agente_id } = req.body;
  
  // Validar que todos los campos obligatorios estén presentes
  if (!name || !email || !documento || !password || !rol_id || !zona_id || !regional_id || !agente_id) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar si el email ya está registrado
    const [exist] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }
    
    // Encriptar contraseña con bcrypt
    const hash = await bcrypt.hash(password, 12);
    
    // Insertar nuevo usuario en la base de datos
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

// ========================================================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN
// ========================================================================

// MIDDLEWARE PRINCIPAL PARA VERIFICAR TOKEN JWT
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

// ========================================================================
// 🔍 ENDPOINTS DE VERIFICACIÓN Y GESTIÓN DE TOKENS
// ========================================================================

// VERIFICAR VALIDEZ DEL TOKEN ACTUAL
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
    
    // Respuesta con datos decodificados del token
    res.json({ 
      success: true, 
      message: 'Token válido',
      user: {
        id: decoded.id,  // Cambiado de decoded.userId a decoded.id
        email: decoded.email,
        tipo: decoded.tipo,
        nombre: decoded.nombre,
        apellido: decoded.apellido
      }
    });
  });
});

// RENOVAR TOKEN EXISTENTE (REFRESH TOKEN)
router.post('/refresh-token', authenticateToken, (req, res) => {
  const { user } = req;
  
  // Crear un nuevo token con la misma información del usuario
  const newToken = jwt.sign(
    { 
      id: user.id,  // Cambiado de userId a id para consistencia
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

// ========================================================================
// 🚪 ENDPOINT DE CIERRE DE SESIÓN
// ========================================================================

// LOGOUT - INVALIDAR SESIÓN DEL USUARIO
router.post('/logout', (req, res) => {
  // En una implementación más robusta, aquí podrías agregar el token a una lista negra
  res.json({ 
    success: true, 
    message: 'Logout exitoso' 
  });
});

export default router;