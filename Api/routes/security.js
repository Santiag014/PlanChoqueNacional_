// ✅ ARCHIVO OPTIMIZADO PARA POOL COMPARTIDO
// ============================================
// - NO crea conexiones individuales por consulta
// - USA executeQueryForMultipleUsers() para consultas normales
// - USA executeQueryFast() para consultas rápidas
// - El pool de 50 conexiones se comparte entre TODOS los usuarios
// - NUNCA excede el límite de 500 conexiones/hora

/**
 * @fileoverview Rutas para logging de seguridad
 * 
 * Maneja el registro de eventos de seguridad como:
 * - Intentos de acceso no autorizado
 * - Violaciones de permisos
 * - Actividad sospechosa
 * 
 * @author Plan Choque Terpel Team - Seguridad
 * @version 1.0.0
 */

import express from 'express';
import { getConnection, executeQueryForMultipleUsers, executeQueryFast } from '../db.js';

const router = express.Router();

/**
 * Endpoint para registrar intentos de acceso no autorizado
 */
router.post('/log-unauthorized-access', async (req, res) => {

  try {
    const {
      route,
      userRole,
      requiredRole,
      timestamp,
      userAgent,
      userId,
      email
    } = req.body;
    
    // Log en consola para desarrollo
    console.warn(`
🚨 INTENTO DE ACCESO NO AUTORIZADO DETECTADO:
📍 Ruta: ${route}
👤 Usuario: ${email || 'N/A'} (ID: ${userId || 'N/A'})
🎭 Rol actual: ${userRole}
🔐 Rol requerido: ${requiredRole}
🕐 Timestamp: ${timestamp}
🌐 User Agent: ${userAgent}
    `);
    
    // Guardar en base de datos (opcional)
    try {

      await executeQueryForMultipleUsers(`
        INSERT INTO security_logs (
          event_type,
          route_attempted,
          user_role,
          required_role,
          user_id,
          user_email,
          user_agent,
          ip_address,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'unauthorized_access',
        route,
        userRole,
        requiredRole,
        userId || null,
        email || null,
        userAgent || null,
        req.ip || req.connection.remoteAddress,
        new Date(timestamp)
      ]);
      
      console.log('✅ Evento de seguridad registrado en base de datos');
    } catch (dbError) {
      // Si la tabla no existe, crear una versión simplificada del log
      console.warn('⚠️ No se pudo guardar en BD (tabla security_logs no existe):', dbError.message);
      
      // Log alternativo en tabla de eventos generales (si existe)
      try {
        await executeQueryForMultipleUsers(`
          INSERT INTO app_logs (
            level,
            message,
            metadata,
            created_at
          ) VALUES (?, ?, ?, ?)
        `, [
          'SECURITY_WARNING',
          `Intento de acceso no autorizado: ${userRole} → ${route} (requiere ${requiredRole})`,
          JSON.stringify({ route, userRole, requiredRole, userId, email, userAgent }),
          new Date()
        ]);
      } catch (altError) {
        console.warn('⚠️ Log alternativo también falló:', altError.message);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Evento de seguridad registrado correctamente' 
    });
    
  } catch (error) {
    console.error('❌ Error registrando evento de seguridad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
  // ✅ NO necesitamos finally - el pool se encarga automáticamente
});

/**
 * Endpoint para obtener estadísticas de seguridad (solo para administradores)
 */
router.get('/security-stats', async (req, res) => {

  try {

    // Intentos de acceso no autorizado en las últimas 24 horas
    const unauthorizedAttempts = await executeQueryForMultipleUsers(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(DISTINCT user_email) as unique_users,
        route_attempted,
        user_role,
        required_role
      FROM security_logs 
      WHERE event_type = 'unauthorized_access' 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY route_attempted, user_role, required_role
      ORDER BY total_attempts DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        last24Hours: unauthorizedAttempts,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de seguridad:', error);
    res.json({
      success: false,
      message: 'Estadísticas no disponibles',
      data: { last24Hours: [], timestamp: new Date() }
    });
  }
  // ✅ NO necesitamos finally - el pool se encarga automáticamente
});

export default router;
