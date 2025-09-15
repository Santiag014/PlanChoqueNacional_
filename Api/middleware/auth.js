import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';
import logger from '../utils/logger.js';

// Secret key para JWT (debe coincidir con auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'terpel-plan-choque-secret-2025';

// Middleware para verificar autenticación
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      //logger.warn('Token inválido desde IP:', req.ip);
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
    }
    
    req.user = user;
    next();
  });
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    // Mapear IDs de rol a nombres de rol
    const roleMapping = {
      1: 'asesor',
      2: 'misteryshopper', 
      3: 'mercadeo_ac',
      4: 'director',
      5: 'ot', // Organización Terpel
      6: 'backoffice', // BackOffice
      // 7: 'implementacion', // Implementación - DESHABILITADO TEMPORALMENTE
      'asesor': 'asesor',
      'misteryshopper': 'misteryshopper',
      'mercadeo_ac': 'mercadeo_ac',
      'director': 'director',
      'ot': 'ot',
      'backoffice': 'backoffice'
      // 'implementacion': 'implementacion' // DESHABILITADO TEMPORALMENTE
    };

    const userRoleId = req.user.tipo;
    const userRole = roleMapping[userRoleId] || userRoleId;
    
    // Si allowedRoles es un string, convertirlo a array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}. Rol actual: ${userRole} (ID: ${userRoleId})` 
      });
    }

    next();
  };
};

// Middleware específico para asesores
export const requireAsesor = requireRole('asesor');

// Middleware específico para Mystery Shoppers
export const requireMisteryShopper = requireRole('misteryshopper');

// Middleware específico para Mercadeo AC
export const requireMercadeo = requireRole('mercadeo_ac');

// Middleware específico para Director
export const requireDirector = requireRole('director');

// Middleware específico para Organización Terpel
export const requireOT = requireRole('ot');

// Middleware específico para verificar relación en users_agente (para reportes OT)
export const requireUsersAgente = async (req, res, next) => {
  let conn;
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    conn = await getConnection();
    
    // Verificar si el usuario tiene relación en users_agente
    const [rows] = await conn.execute(
      'SELECT COUNT(*) as count FROM users_agente WHERE user_id = ?',
      [req.user.id]
    );

    if (rows[0].count === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para acceder a los reportes. Usuario sin relación de agente asignada.'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando relación users_agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    if (conn) conn.release();
  }
};

// Middleware específico para verificar si el usuario es Jefe de Zona
export const requireJefeZona = async (req, res, next) => {
  let conn;
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    // Verificar que el usuario tenga rol 5 (OT)
    if (req.user.tipo !== 5) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de Organización Terpel.'
      });
    }

    conn = await getConnection();
    
    // Verificar si el usuario es Jefe de Zona en users_agente
    const [rows] = await conn.execute(
      "SELECT rol_terpel FROM users_agente WHERE user_id = ? AND rol_terpel like '%Jefe%'",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere ser Jefe de Zona.'
      });
    }

    // Agregar información de jefe de zona al request
    req.user.isJefeZona = true;
    next();
  } catch (error) {
    console.error('Error verificando Jefe de Zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    if (conn) conn.release();
  }
};

// Middleware específico para BackOffice
export const requireBackOffice = requireRole('backoffice');

// Middleware específico para Implementación - DESHABILITADO TEMPORALMENTE
// export const requireImplementacion = requireRole('implementacion');

// Middleware para múltiples roles
export const requireAnyRole = (...roles) => requireRole(roles);

// Middleware de logging para auditoría
export const logAccess = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const user = req.user ? `${req.user.nombre} (${req.user.email})` : 'Usuario no autenticado';
  const route = `${req.method} ${req.originalUrl}`;
  next();
};
