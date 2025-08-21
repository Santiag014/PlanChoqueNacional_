/**
 * @fileoverview API de BackOffice - Endpoints para administración del sistema
 * 
 * Este módulo contiene todas las rutas para el rol BackOffice que permite:
 * - Gestión completa de registros del sistema (sin restricciones territoriales)
 * - Aprobación/rechazo de registros de implementación
 * - Consulta de estadísticas globales
 * - Administración de estados de registros
 * 
 * Características principales:
 * - Acceso global a todos los registros (no filtrado por agente)
 * - Permisos de administración completos
 * - Auditoría de acciones realizadas
 * - Validación de roles y autenticación
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 * @requires express
 * @requires mysql2/promise (a través de db.js)
 * @requires auth middleware (authenticateToken, requireBackOffice, logAccess)
 */

import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireBackOffice, logAccess } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ENDPOINTS DE DIAGNÓSTICO Y VERIFICACIÓN
// ============================================

/**
 * @route GET /api/backoffice/test
 * @description Endpoint de prueba para verificar que el servicio BackOffice funcione
 * @access Public (sin autenticación)
 * @returns {Object} Estado del servicio y timestamp
 * 
 * Uso: Verificar que la API esté funcionando correctamente
 * Ejemplo: GET /api/backoffice/test
 */
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de BackOffice funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/backoffice/verify-token
 * @description Verifica que el token del usuario sea válido y tenga rol BackOffice
 * @access Private (requiere token válido)
 * @middleware authenticateToken
 * @returns {Object} Información del usuario y diagnóstico del token
 * 
 * Uso: Debugging y verificación de sesión en desarrollo
 * Ejemplo: GET /api/backoffice/verify-token
 * Headers: Authorization: Bearer <token>
 */
router.get('/verify-token', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user,
    roleInfo: {
      tipo: req.user.tipo,
      expectedRole: req.user.tipo === 6 ? 'backoffice' : 'otro',
      id_agente: req.user.id_agente,
      agente_id: req.user.agente_id,
      allFields: Object.keys(req.user)
    },
    debug: {
      hasAgenteId: !!req.user.agente_id,
      agenteIdValue: req.user.agente_id,
      agenteIdType: typeof req.user.agente_id,
      userKeys: Object.keys(req.user)
    }
  });
});

// ============================================
// ENDPOINTS DE GESTIÓN DE REGISTROS
// ============================================


/**
 * @route GET /api/backoffice/registros
 * @description Obtiene TODOS los registros del sistema sin filtros territoriales
 * @access Private (requiere rol BackOffice)
 * @middleware authenticateToken, requireBackOffice, logAccess
 * @returns {Object} Lista completa de registros con información de asesores
 * 
 * Uso: Cargar la tabla principal de gestión de registros en BackOffice
 * Ejemplo: GET /api/backoffice/registros
 * Headers: Authorization: Bearer <token>
 * 
 * Diferencia con Mercadeo: 
 * - Mercadeo ve solo registros de su territorio
 * - BackOffice ve TODOS los registros del sistema nacional
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": [...registros],
 *   "total": 1250,
 *   "message": "Se encontraron 1250 registros"
 * }
 */
router.get('/historial-registros-backoffice', authenticateToken, requireBackOffice, logAccess, async (req, res) => {
  // BackOffice puede ver todos los registros sin restricción de agente
  let conn;
  try {
    conn = await getConnection();

    // Consulta para obtener TODOS los registros (sin filtro por agente)
    const query = `
 WITH productos_agrupados AS (
    SELECT 
        registro_id,
        GROUP_CONCAT(referencia_id) AS referencias,
        GROUP_CONCAT(presentacion) AS presentaciones,
        GROUP_CONCAT(cantidad_cajas) AS cantidades_cajas,
        GROUP_CONCAT(ROUND(conversion_galonaje, 2)) AS galonajes,
        GROUP_CONCAT(ROUND(precio_sugerido, 0)) AS precios_sugeridos,
        GROUP_CONCAT(ROUND(precio_real, 0)) AS precios_reales
    FROM registro_productos
    GROUP BY registro_id
),
fotos_agrupadas AS (
    SELECT 
        id_registro,
        GROUP_CONCAT(foto_factura) AS fotos_factura,
        GROUP_CONCAT(foto_seguimiento) AS fotos_seguimiento
    FROM registro_fotografico_servicios
    GROUP BY id_registro
),
implementacion_agrupada AS (
    SELECT 
        ri.id_registro,
        ri.nro_implementacion,
        ri.acepto_implementacion,
        ri.observacion AS observacion_implementacion,
        ri.foto_remision,
        GROUP_CONCAT(rip.nombre_producto) AS productos_implementados,
        GROUP_CONCAT(rip.nro) AS nros_productos,
        GROUP_CONCAT(rip.foto_evidencia) AS fotos_evidencia
    FROM registros_implementacion ri
    LEFT JOIN registros_implementacion_productos rip ON rip.id_registro_implementacion = ri.id
    GROUP BY ri.id_registro, ri.nro_implementacion, ri.acepto_implementacion, ri.observacion, ri.foto_remision
)
SELECT 
    registro_servicios.id,
    puntos_venta.codigo,
    agente.descripcion AS agente_comercial,
    puntos_venta.descripcion AS nombre_pdv,
    puntos_venta.nit,
    puntos_venta.direccion,
    users.name,
    users.documento AS cedula,
    registro_servicios.fecha_registro,
    registro_servicios.created_at,
    CASE
        WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen / Precio'
        WHEN kpi_volumen = 1 THEN 'Volumen'
        WHEN kpi_precio = 1 THEN 'Precio'
        WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
        ELSE 'Otro'
    END AS tipo_kpi,
    CASE
        WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Galonaje/Precios'
        WHEN kpi_volumen = 1 THEN 'Galonaje'
        WHEN kpi_precio = 1 THEN 'Precios'
        WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 AND IsImplementacion IS NULL THEN 'Visita'
        WHEN IsImplementacion = 1 THEN 'Implementación'
        ELSE 'Otro'
    END AS tipo_accion,
    e1.descripcion AS estado_backoffice,
    e2.descripcion AS estado_agente,
    registro_servicios.observacion AS observacion_asesor,
    registro_servicios.observacion_agente AS observacion_agente,
    
    -- Datos de subconsultas
    pa.referencias,
    pa.presentaciones,
    pa.cantidades_cajas,
    pa.galonajes,
    pa.precios_sugeridos,
    pa.precios_reales,
    fa.fotos_factura,
    fa.fotos_seguimiento,
    ia.nro_implementacion,
    ia.acepto_implementacion,
    ia.observacion_implementacion,
    ia.foto_remision,
    ia.productos_implementados,
    ia.nros_productos,
    ia.fotos_evidencia
    
FROM registro_servicios
INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
INNER JOIN users ON users.id = registro_servicios.user_id
INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
INNER JOIN agente ON agente.id = puntos_venta.id_agente  -- ✅ Corregido
LEFT JOIN productos_agrupados pa ON pa.registro_id = registro_servicios.id
LEFT JOIN fotos_agrupadas fa ON fa.id_registro = registro_servicios.id
LEFT JOIN implementacion_agrupada ia ON ia.id_registro = registro_servicios.id
ORDER BY registro_servicios.id DESC;
    `;
    const [rows] = await conn.execute(query);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo historial de registros de mercadeo:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de registros de mercadeo',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @route PUT /api/backoffice/registro/:registro_id/estado
 * @description Actualiza el estado de un registro (aprobar, rechazar, pendiente)
 * @access Private (requiere rol BackOffice)
 * @middleware authenticateToken, requireBackOffice, logAccess
 * @param {string} registro_id - ID del registro a actualizar
 * @body {number} estado - Nuevo estado (1=pendiente, 2=aprobado, 3=rechazado)
 * @body {string} comentarios - Comentarios de la validación (opcional)
 * @returns {Object} Confirmación de actualización
 * 
 * Uso: Aprobar o rechazar registros desde la interfaz de BackOffice
 * Ejemplo: PUT /api/backoffice/registro/123/estado
 * Headers: Authorization: Bearer <token>, Content-Type: application/json
 * Body: {"estado": 2, "comentarios": "Cumple con los criterios"}
 * 
 * Estados válidos:
 * - 1: Pendiente de revisión
 * - 2: Aprobado/Validado
 * - 3: Rechazado
 */
router.put('/registro/:registro_id/estado', authenticateToken, requireBackOffice, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { estado, comentarios } = req.body;
  const { agente_id, name } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  // Validar que el registro_id es un número
  if (isNaN(parseInt(registro_id))) {
    return res.status(400).json({
      success: false,
      message: 'ID de registro inválido'
    });
  }

  // Validar estado
  const estadosValidos = [1, 2, 3]; // 1=pendiente, 2=aprobado, 3=rechazado
  if (!estadosValidos.includes(parseInt(estado))) {
    return res.status(400).json({
      success: false,
      message: 'Estado inválido'
    });
  }

  let connection;
  try {
    connection = await getConnection();

    // Actualizar el estado del registro
    const [updateResult] = await connection.execute(`
      UPDATE registro_servicios 
      SET 
        estado_id = ?,
        observacion = ?
      WHERE id = ?
    `, [estado, comentarios || '', registro_id]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo actualizar el registro'
      });
    }

    const estadoTexto = estado == 2 ? 'aprobado' : estado == 3 ? 'rechazado' : 'pendiente';

    res.json({
      success: true,
      message: `Registro ${estadoTexto} exitosamente`,
      data: {
        registro_id: parseInt(registro_id),
        nuevo_estado: parseInt(estado),
        comentarios: comentarios || '',
        validado_por: name || 'BackOffice',
        fecha_validacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al actualizar estado del registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ============================================
// ENDPOINTS DE GESTIÓN DE USUARIOS
// ============================================

/**
 * @route GET /api/backoffice/usuarios
 * @description Obtiene TODOS los usuarios del sistema
 * @access Private (requiere rol BackOffice)
 * @middleware authenticateToken, requireBackOffice, logAccess
 * @returns {Object} Lista completa de usuarios con información completa
 */
router.get('/usuarios', authenticateToken, requireBackOffice, logAccess, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const [usuarios] = await connection.execute(`
      SELECT agente.descripcion as agente_comercial, users.name, users.documento, users.email, rol.descripcion, depar_ciudades.descripcion as ciudad FROM users
      INNER JOIN agente ON agente.id = users.agente_id
      INNER JOIN rol ON rol.id = users.rol_id
      INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
      WHERE rol.id IN (1,3,5)
    `);

    res.json({
      success: true,
      data: usuarios,
      total: usuarios.length,
      message: 'Usuarios obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});


// ============================================
// ENDPOINTS DE GESTIÓN DE PUNTOS DE VENTA
// ============================================

/**
 * @route GET /api/backoffice/puntos-venta
 * @description Obtiene TODOS los puntos de venta del sistema
 * @access Private (requiere rol BackOffice)
 * @middleware authenticateToken, requireBackOffice, logAccess
 * @returns {Object} Lista completa de PDVs con información completa
 */
router.get('/puntos-venta', authenticateToken, requireBackOffice, logAccess, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const [puntosVenta] = await connection.execute(`
      SELECT agente.descripcion as agente_comercial,puntos_venta.codigo, puntos_venta.descripcion, puntos_venta.nit, puntos_venta.direccion, puntos_venta.ciudad, puntos_venta.segmento, puntos_venta.meta_volumen, users.documento, users.name FROM puntos_venta
      INNER JOIN users ON puntos_venta.user_id = users.id
      INNER JOIN agente ON agente.id = puntos_venta.id_agente
    `);

    res.json({
      success: true,
      data: puntosVenta,
      total: puntosVenta.length,
      message: 'Puntos de venta obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error al obtener puntos de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
