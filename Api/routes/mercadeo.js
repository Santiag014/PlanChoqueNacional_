/**
 * @fileoverview API de Mercadeo - Endpoints para supervisión territorial
 * 
 * Este módulo contiene todas las rutas para el rol Mercadeo AC que permite:
 * - Gestión de registros filtrados por territorio asignado
 * - Aprobación/rechazo de registros de implementación de su zona
 * - Consulta de métricas y KPIs de su territorio
 * - Análisis de datos de asesores bajo supervisión
 * 
 * Características principales:
 * - Acceso filtrado por agente_id (solo su territorio)
 * - Permisos de supervisión territorial
 * - Auditoría de acciones realizadas
 * - Validación de roles y autenticación
 * 
 * Diferencia con BackOffice:
 * - Mercadeo: Ve solo registros de su territorio/agentes asignados
 * - BackOffice: Ve todos los registros del sistema nacional
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 * @requires express
 * @requires mysql2/promise (a través de db.js)
 * @requires auth middleware (authenticateToken, requireMercadeo, logAccess)
 */

import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireMercadeo, logAccess } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ENDPOINTS DE DIAGNÓSTICO Y VERIFICACIÓN
// ============================================

/**
 * @route GET /api/mercadeo/test
 * @description Endpoint de prueba para verificar que el servicio Mercadeo funcione
 * @access Public (sin autenticación)
 * @returns {Object} Estado del servicio y timestamp
 * 
 * Uso: Verificar que la API esté funcionando correctamente
 * Ejemplo: GET /api/mercadeo/test
 */
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de mercadeo funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/mercadeo/verify-token
 * @description Verifica que el token del usuario sea válido y tenga rol Mercadeo
 * @access Private (requiere token válido)
 * @middleware authenticateToken
 * @returns {Object} Información del usuario y diagnóstico del token
 * 
 * Uso: Debugging y verificación de sesión en desarrollo
 * Ejemplo: GET /api/mercadeo/verify-token
 * Headers: Authorization: Bearer <token>
 */
router.get('/verify-token', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user,
    roleInfo: {
      tipo: req.user.tipo,
      expectedRole: req.user.tipo === 3 ? 'mercadeo_ac' : 'otro',
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
// ENDPOINTS DE GESTIÓN DE REGISTROS TERRITORIALES
// ============================================

/**
 * @route GET /api/mercadeo/registro-detalles/:registro_id
 * @description Obtiene información detallada de un registro del territorio asignado
 * @access Private (requiere rol Mercadeo)
 * @middleware authenticateToken, requireMercadeo, logAccess
 * @param {string} registro_id - ID único del registro a consultar
 * @returns {Object} Datos completos del registro incluyendo archivos
 * 
 * Uso: Ver detalles de registros para supervisión territorial
 * Ejemplo: GET /api/mercadeo/registro-detalles/123
 * Headers: Authorization: Bearer <token>
 * 
 * Filtro: Solo registros de asesores bajo supervisión del agente_id
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": {
 *     "registro_id": 123,
 *     "codigo": "EDS001",
 *     "fecha_visita": "2025-01-15",
 *     "tipo_kpi": "PRECIO",
 *     "estado": "pendiente",
 *     "asesor_name": "Juan Pérez",
 *     "archivos": [...]
 *   }
 * }
 */
router.get('/registro-detalles/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { agente_id } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  // Validar que el registro_id es un número
  if (!registro_id || isNaN(registro_id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de registro inválido'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verificar que el registro existe y pertenece al agente
    const [registroCheck] = await conn.execute(
      `SELECT rs.id FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       WHERE rs.id = ? AND pv.id_agente = ?`,
      [registro_id, agente_id]
    );

    if (registroCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado o no tiene permisos para verlo'
      });
    }

    // Consulta de detalle completa con información adicional
    const queryDetalles = `
      SELECT 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
        puntos_venta.id_agente,
        users.name as nombre_usuario,
        users.email as email_usuario,
        registro_servicios.fecha_registro,
        registro_servicios.created_at,
        registro_servicios.updated_at,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen / Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_kpi,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_volumen = 1 THEN 'Implementacion'
            WHEN kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Visita'
            ELSE 'Otro'
        END AS tipo_accion,
        e1.descripcion AS estado,
        e2.descripcion AS estado_agente,
        registro_servicios.observacion,
        agente.descripcion as agente_descripcion,
        agente.nombre as agente_nombre,
        agente.email as agente_email,
        agente.telefono as agente_telefono,
        -- Información de productos con más detalles
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.cantidad_cajas) AS cantidades_cajas,
        GROUP_CONCAT(registro_productos.conversion_galonaje) AS galones,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales,
        GROUP_CONCAT(registro_productos.created_at) AS fechas_productos,
        -- Información fotográfica
        GROUP_CONCAT(registro_fotografico_servicios.foto_factura) AS fotos_factura,
        GROUP_CONCAT(registro_fotografico_servicios.foto_pop) AS fotos_pop,
        GROUP_CONCAT(registro_fotografico_servicios.foto_seguimiento) AS fotos_seguimiento,
        -- Totales calculados
        SUM(registro_productos.cantidad_cajas) as total_cajas,
        SUM(registro_productos.conversion_galonaje) as total_galones,
        SUM(registro_productos.precio_real * registro_productos.cantidad_cajas) as valor_total_implementado
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = puntos_venta.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
      INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
      LEFT JOIN agente ON agente.id = puntos_venta.id_agente
      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id
      WHERE registro_servicios.id = ? AND puntos_venta.id_agente = ?
      GROUP BY 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
        puntos_venta.id_agente,
        users.name,
        users.email,
        registro_servicios.fecha_registro,
        registro_servicios.created_at,
        registro_servicios.updated_at,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,
        tipo_kpi,
        tipo_accion,
        e1.descripcion,
        e2.descripcion,
        registro_servicios.observacion,
        agente.descripcion,
        agente.nombre,
        agente.email,
        agente.telefono
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [registro_id, agente_id]);

    if (detalles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalles del registro no encontrados'
      });
    }

    const registro = detalles[0];
    
    // Procesar coordenadas si existen
    let lat = null, lng = null;
    if (registro.coordenadas) {
      const coordenadas = registro.coordenadas.split(',');
      if (coordenadas.length === 2) {
        lat = parseFloat(coordenadas[0].trim());
        lng = parseFloat(coordenadas[1].trim());
      }
    }

    // Procesar datos adicionales
    const datosCompletos = {
      ...registro,
      // Coordenadas procesadas
      lat,
      lng,
      // Información del agente
      agente: {
        descripcion: registro.agente_descripcion,
        nombre: registro.agente_nombre,
        email: registro.agente_email,
        telefono: registro.agente_telefono
      },
      // Resumen de totales
      resumen: {
        total_cajas: registro.total_cajas || 0,
        total_galones: registro.total_galones || 0,
        valor_total_implementado: registro.valor_total_implementado || 0
      }
    };

    res.json({
      success: true,
      data: datosCompletos
    });

  } catch (err) {
    console.error('Error obteniendo detalles del registro (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del registro',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ============================================
// ENDPOINTS DE DATOS TERRITORIALES - ASESORES
// ============================================

/**
 * @route GET /api/mercadeo/asesores
 * @description Obtiene lista de asesores del territorio asignado al mercadeo
 * @access Private (requiere rol Mercadeo)
 * @middleware authenticateToken, requireMercadeo, logAccess
 * @returns {Object} Lista de asesores con información básica
 * 
 * Uso: Cargar listado de asesores para filtros y selección
 * Ejemplo: GET /api/mercadeo/asesores
 * Headers: Authorization: Bearer <token>
 * 
 * Filtro territorial: Solo asesores que manejan PDVs asignados al agente_id
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 123,
 *       "name": "Juan Pérez",
 *       "email": "juan.perez@terpel.com",
 *       "cedula": "12345678",
 *       "pdv_count": 15
 *     }
 *   ]
 * }
 */
router.get('/asesores', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Consulta para obtener asesores que manejan PDVs de este agente
    const query = `
      SELECT DISTINCT 
        users.id,
        users.name,
        users.email,
        users.created_at,
        users.updated_at
      FROM users
      INNER JOIN puntos_venta ON puntos_venta.user_id = users.id
      WHERE puntos_venta.id_agente = ? AND users.rol_id = 1
      ORDER BY users.name
    `;
    
    const [rows] = await conn.execute(query, [agente_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo asesores (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de asesores',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ============================================
// ENDPOINTS DE DATOS TERRITORIALES - PUNTOS DE VENTA
// ============================================

/**
 * @route GET /api/mercadeo/puntos-venta
 * @description Obtiene lista de puntos de venta del territorio asignado
 * @access Private (requiere rol Mercadeo)
 * @middleware authenticateToken, requireMercadeo, logAccess
 * @returns {Object} Lista de PDVs con información detallada
 * 
 * Uso: Cargar puntos de venta para análisis territorial
 * Ejemplo: GET /api/mercadeo/puntos-venta
 * Headers: Authorization: Bearer <token>
 * 
 * Filtro territorial: Solo PDVs asignados al agente_id del mercadeo
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 456,
 *       "codigo": "EDS001",
 *       "nombre": "Estación Centro",
 *       "direccion": "Calle 123 #45-67",
 *       "ciudad": "Bogotá",
 *       "asesor_name": "Juan Pérez"
 *     }
 *   ]
 * }
 */
router.get('/puntos-venta', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Consulta para obtener puntos de venta del agente
    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
        puntos_venta.id_agente,
        puntos_venta.user_id as asesor_id,
        users.id as user_id,
        users.name as nombre_asesor,
        users.email as email_asesor
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      WHERE puntos_venta.id_agente = ?
      ORDER BY puntos_venta.codigo
    `;
    
    const [rows] = await conn.execute(query, [agente_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo puntos de venta (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de puntos de venta',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ============================================
// ENDPOINTS DE MÉTRICAS Y KPIs TERRITORIALES
// ============================================

/**
 * @route GET /api/mercadeo/cobertura
 * @description Obtiene métricas de cobertura del territorio asignado
 * @access Private (requiere rol Mercadeo)
 * @middleware authenticateToken, requireMercadeo, logAccess
 * @returns {Object} Datos de cobertura de productos por PDV
 * 
 * Uso: Dashboard de cobertura territorial para seguimiento
 * Ejemplo: GET /api/mercadeo/cobertura
 * Headers: Authorization: Bearer <token>
 * 
 * Filtro territorial: Solo datos de PDVs asignados al agente_id
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "pdv_codigo": "EDS001",
 *       "cobertura_total": 85.5,
 *       "productos_implementados": 17,
 *       "productos_totales": 20,
 *       "fecha_ultima_visita": "2025-01-15"
 *     }
 *   ]
 * }
 */
router.get('/cobertura', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Primero obtener totales para calcular proporción
    const [totalesResult] = await conn.execute(
      `SELECT 
        COUNT(DISTINCT puntos_venta.id) as totalAsignados,
        COUNT(DISTINCT CASE WHEN registro_servicios.id IS NOT NULL THEN puntos_venta.id END) as totalImpactados
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id AND registro_servicios.estado_id =2 AND registro_servicios.estado_agente_id = 2
       WHERE ${whereClause}`, queryParams
    );
    
    const totalAsignados = totalesResult[0]?.totalAsignados || 0;
    const totalImpactados = totalesResult[0]?.totalImpactados || 0;
    const porcentajeCobertura = totalAsignados > 0 ? (totalImpactados / totalAsignados) : 0;
    const puntosBasePorPDV = totalAsignados > 0 ? (150 / totalAsignados) : 0;

    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        CASE 
          WHEN (COUNT(registro_servicios.id) > 0 AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2) THEN 'Registrado'
          ELSE 'No Registrado'
        END as estado,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2 THEN ${puntosBasePorPDV}
          ELSE 0
        END as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name, users.id
      ORDER BY puntos_venta.codigo
    `;
    
    const [rows] = await conn.execute(query, queryParams);

    // Calcular puntos totales (IGUAL QUE ASESOR: 150 puntos máximo)
    const puntosCobertura = totalAsignados > 0 ? Math.round((totalImpactados / totalAsignados) * 150) : 0;
    
    res.json({
      success: true,
      pdvs: rows,
      data: rows,
      total: rows.length,
      // Métricas principales para el dashboard
      puntos: puntosCobertura,
      meta: totalAsignados,
      real: totalImpactados,
      porcentajeCumplimiento: Math.round(porcentajeCobertura * 100),
      // Propiedades adicionales para compatibilidad
      totalAsignados,
      totalImplementados: totalImpactados,
      puntosCobertura,
      estadisticas: {
        totalAsignados,
        totalImpactados,
        porcentajeCobertura: Math.round(porcentajeCobertura * 100),
        puntosTotal: puntosCobertura,
        puntosPorPDV: Number(puntosBasePorPDV.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de cobertura (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de cobertura',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @route GET /api/mercadeo/volumen
 * @description Obtiene métricas de volumen del territorio asignado
 * @access Private (requiere rol Mercadeo)
 * @middleware authenticateToken, requireMercadeo, logAccess
 * @query {number} asesor_id - Filtro opcional por asesor específico
 * @query {number} pdv_id - Filtro opcional por PDV específico
 * @returns {Object} Datos de volumen y metas por PDV
 * 
 * Uso: Dashboard de volumen territorial para seguimiento de metas
 * Ejemplo: GET /api/mercadeo/volumen?asesor_id=123
 * Headers: Authorization: Bearer <token>
 * 
 * Filtro territorial: Solo datos de PDVs asignados al agente_id
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "pdv_codigo": "EDS001",
 *       "meta_volumen": 10000,
 *       "volumen_actual": 8500,
 *       "porcentaje_cumplimiento": 85.0,
 *       "puntos_volumen": 127.5
 *     }
 *   ],
 *   "puntos": 127,
 *   "meta": 10000,
 *   "real": 8500
 * }
 */
router.get('/volumen', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener meta y real totales
    const [metaResult] = await conn.execute(
      `SELECT SUM(meta_volumen) as totalMeta
       FROM puntos_venta
       WHERE ${whereClause}`, queryParams
    );
    const totalMeta = metaResult[0]?.totalMeta || 0;

    const [realResult] = await conn.execute(
      `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
       FROM registro_servicios
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause} AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id `, queryParams
    );
    const totalReal = realResult[0]?.totalReal || 0;

    // Calcular puntos como en asesor (PERO ASESOR USA registro_puntos, aquí calculamos proporcionalmente)
    // LÓGICA CONSISTENTE: 200 puntos máximo por volumen
    const porcentajeVolumen = totalMeta > 0 ? (totalReal / totalMeta) : 0;
    const puntosVolumen = Math.round(porcentajeVolumen * 200);

    console.log('=== DEBUG VOLUMEN MERCADEO ===');
    console.log('totalMeta:', totalMeta);
    console.log('totalReal:', totalReal);
    console.log('porcentajeVolumen:', porcentajeVolumen);
    console.log('puntosVolumen:', puntosVolumen);

    // Obtener detalle por PDV
    const [pdvs] = await conn.execute(
      `SELECT 
         puntos_venta.id,
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         puntos_venta.segmento,
         puntos_venta.meta_volumen as meta,
         users.name as nombre_asesor,
         users.id as asesor_id,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) as \`real\`,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / puntos_venta.meta_volumen) * 100, 2
         ) as porcentaje
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, puntos_venta.segmento, puntos_venta.meta_volumen, users.name, users.id
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Calcular puntos individuales por PDV (contribución proporcional)
    const pdvsConPuntos = pdvs.map(pdv => {
      const cumplimiento = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
      const puntosIndividuales = totalMeta > 0 ? Math.round((pdv.real / totalMeta) * 200) : 0;
      
      return {
        ...pdv,
        puntos: puntosIndividuales,
        cumplimiento: Number(cumplimiento.toFixed(2))
      };
    });

    // Obtener resumen por segmento
    const [segmentos] = await conn.execute(
      `SELECT 
         puntos_venta.segmento,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         SUM(puntos_venta.meta_volumen) AS metaTotal,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) AS totalGalones,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / SUM(puntos_venta.meta_volumen)) * 100, 2
         ) as porcentajeCumplimiento
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.segmento
       ORDER BY totalGalones DESC`, queryParams
    );

    // Obtener detalle por producto
    const [productos] = await conn.execute(
      `SELECT 
         registro_productos.referencia_id AS nombre,
         COUNT(registro_productos.id) AS numeroCajas,
         SUM(registro_productos.cantidad_cajas) AS totalCajas,
         SUM(registro_productos.conversion_galonaje) AS galonaje,
         AVG(registro_productos.precio_real) AS precioPromedio,
         SUM(registro_productos.precio_real * registro_productos.cantidad_cajas) AS valorTotal
       FROM registro_servicios
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause} AND registro_productos.referencia_id IS NOT NULL
       GROUP BY registro_productos.referencia_id
       ORDER BY galonaje DESC`, queryParams
    );

    // Calcular porcentajes para productos
    const totalGalonaje = productos.reduce((sum, p) => sum + p.galonaje, 0);
    productos.forEach(p => {
      p.porcentaje = totalGalonaje > 0 ? 
        Number(((p.galonaje / totalGalonaje) * 100).toFixed(1)) : 0;
    });

    // Obtener resumen por asesor
    const [resumenAsesores] = await conn.execute(
      `SELECT 
         users.id as asesor_id,
         users.name as nombre_asesor,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         SUM(puntos_venta.meta_volumen) AS metaTotal,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) AS realTotal,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / SUM(puntos_venta.meta_volumen)) * 100, 2
         ) as porcentajeCumplimiento
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY users.id, users.name
       ORDER BY realTotal DESC`, queryParams
    );

    const response = {
      success: true,
      pdvs: pdvsConPuntos,  // Cambiado para compatibilidad con asesor
      data: pdvsConPuntos,  // Mantenido para compatibilidad
      meta_volumen: totalMeta,
      real_volumen: totalReal,
      puntos: puntosVolumen,
      porcentajeCumplimiento: totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0,
      segmentos,
      productos,
      resumenAsesores,
      totales: {
        totalPdvs: pdvs.length,
        totalMeta: totalMeta,
        totalReal: totalReal,
        totalPuntos: pdvsConPuntos.reduce((sum, pdv) => sum + pdv.puntos, 0),
        promedioEfectividad: pdvs.length > 0 ? 
          Number((pdvsConPuntos.reduce((sum, pdv) => sum + pdv.porcentaje, 0) / pdvs.length).toFixed(2)) : 0
      }
    };

    console.log('=== RESPONSE FINAL VOLUMEN ===');
    console.log('response.puntos:', response.puntos);
    console.log('response.meta_volumen:', response.meta_volumen);
    console.log('response.real_volumen:', response.real_volumen);
    console.log('===============================');
    
    res.json(response);

  } catch (err) {
    console.error('Error obteniendo métricas de volumen (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de volumen',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener métricas de frecuencia (visitas) filtradas por agente_id
router.get('/visitas', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener meta y real de visitas
    const [metaResult] = await conn.execute(
      `SELECT COUNT(*) * 20 as metaVisitas
       FROM puntos_venta
       WHERE ${whereClause}`, queryParams
    );
    const metaVisitas = metaResult[0]?.metaVisitas || 0;

    const [realResult] = await conn.execute(
      `SELECT COUNT(registro_servicios.id) as totalVisitas
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause} AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`, queryParams
    );
    const totalVisitas = realResult[0]?.totalVisitas || 0;

    const porcentajeVisitas = metaVisitas > 0 ? (totalVisitas / metaVisitas) : 0;
    const puntosVisitas = Math.round(porcentajeVisitas * 100);

    // Obtener detalle por PDV
    // LÓGICA DE PUNTOS POR VISITAS:
    // Cada PDV contribuye proporcionalmente al total de 100 puntos
    // Obtener detalle por PDV (ESTRUCTURA SIMPLIFICADA PARA DEBUG)
    const [pdvs] = await conn.execute(
      `SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        COUNT(registro_servicios.id) AS cantidadVisitas,
        20 AS meta,
        ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) AS porcentaje,
        ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) AS puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios 
        ON registro_servicios.pdv_id = puntos_venta.id 
        AND registro_servicios.estado_id = 2 
        AND registro_servicios.estado_agente_id = 2
      WHERE ${whereClause}
      GROUP BY 
        puntos_venta.id, 
        puntos_venta.codigo, 
        puntos_venta.descripcion, 
        users.name, 
        users.id
      ORDER BY puntos_venta.codigo`,
      queryParams
    );

    console.log('=== DEBUG PDV QUERY ===');
    console.log('whereClause:', whereClause);
    console.log('queryParams:', queryParams);
    console.log('metaVisitas:', metaVisitas);
    console.log('pdvs result length:', pdvs.length);
    console.log('pdvs result:', pdvs);

    // DEBUG: Verificar si existen PDVs para este agente
    const [debugPdvs] = await conn.execute(
      `SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.id_agente,
        users.name as nombre_asesor
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      WHERE puntos_venta.id_agente = ?
      ORDER BY puntos_venta.codigo`,
      [agente_id]
    );
    console.log('=== DEBUG: PDVs básicos para agente_id', agente_id, '===');
    console.log('debugPdvs count:', debugPdvs.length);
    console.log('debugPdvs:', debugPdvs);


    // Obtener tipos de visita
    const [tiposVisita] = await conn.execute(
      `SELECT 
         CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen/Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
         END AS tipo,
         COUNT(*) AS cantidad
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause} AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2
       GROUP BY tipo`, queryParams
    );

    // Obtener resumen por asesor
    const [resumenAsesores] = await conn.execute(
      `SELECT 
         users.id as asesor_id,
         users.name as nombre_asesor,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         COUNT(registro_servicios.id) as totalVisitas,
         COUNT(DISTINCT puntos_venta.id) * 20 as metaVisitas,
         ROUND((COUNT(registro_servicios.id) / (COUNT(DISTINCT puntos_venta.id) * 20)) * 100, 2) as porcentajeCumplimiento,
         COUNT(registro_servicios.id) * 2 as puntosGanados
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id 
         AND registro_servicios.estado_id = 2 
         AND registro_servicios.estado_agente_id = 2
       WHERE ${whereClause}
       GROUP BY users.id, users.name
       ORDER BY totalVisitas DESC`, queryParams
    );

    res.json({
      success: true,
      pdvs,
      data: pdvs,
      // Métricas principales para el dashboard
      puntos: puntosVisitas,
      meta: metaVisitas,
      real: totalVisitas,
      porcentajeCumplimiento: metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0,
      // Propiedades adicionales para compatibilidad
      meta_visitas: metaVisitas,
      real_visitas: totalVisitas,
      tiposVisita,
      resumenAsesores,
      totales: {
        totalPdvs: pdvs.length,
        totalMetaVisitas: metaVisitas,
        totalRealVisitas: totalVisitas,
        totalPuntosGanados: pdvs.reduce((sum, pdv) => sum + pdv.puntos, 0),
        promedioVisitasPorPdv: pdvs.length > 0 ? 
          Number((pdvs.reduce((sum, pdv) => sum + pdv.cantidadVisitas, 0) / pdvs.length).toFixed(2)) : 0
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de frecuencia (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de frecuencia',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener métricas de precios filtradas por agente_id
router.get('/precios', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Primero obtener totales
    const [totalesResult] = await conn.execute(
      `SELECT 
        COUNT(DISTINCT puntos_venta.id) as totalAsignados,
        COUNT(DISTINCT CASE WHEN registro_servicios.kpi_precio = 1 AND registros_mistery_shopper.id_registro_pdv IS NOT NULL THEN puntos_venta.id END) as totalConPrecios
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registros_mistery_shopper ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id
       WHERE ${whereClause}`, queryParams
    );
    
    const totalAsignados = totalesResult[0]?.totalAsignados || 0;
    const totalConPrecios = totalesResult[0]?.totalConPrecios || 0;
    const porcentajePrecios = totalAsignados > 0 ? (totalConPrecios / totalAsignados) : 0;
    const puntosPorPDV = totalAsignados > 0 ? Math.floor(150 / totalAsignados) : 0;

    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        CASE 
          WHEN COUNT(CASE WHEN registro_servicios.kpi_precio = 1 AND registros_mistery_shopper.id_registro_pdv IS NOT NULL THEN 1 END) > 0 THEN 'REPORTADOS'
          ELSE 'NO REPORTADOS'
        END as estado,
        CASE 
          WHEN COUNT(
            CASE 
              WHEN registro_servicios.kpi_precio = 1 AND registros_mistery_shopper.id_registro_pdv IS NOT NULL THEN 1 
            END
          ) > 0 THEN ${puntosPorPDV}
          ELSE 0
        END AS puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
      LEFT JOIN registros_mistery_shopper 
          ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id
      WHERE ${whereClause} 
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name, users.id
      ORDER BY puntos_venta.codigo
    `;
    
    const [rows] = await conn.execute(query, queryParams);

    // Calcular puntos totales (IGUAL QUE ASESOR: 150 puntos máximo)
    const puntosPrecios = totalAsignados > 0 ? Math.round((totalConPrecios / totalAsignados) * 150) : 0;

    res.json({
      success: true,
      pdvs: rows,
      data: rows,
      total: rows.length,
      // Métricas principales para el dashboard
      puntos: puntosPrecios,
      meta: totalAsignados,
      real: totalConPrecios,
      porcentajeCumplimiento: Math.round(porcentajePrecios * 100),
      // Propiedades adicionales para compatibilidad
      totalAsignados,
      totalReportados: totalConPrecios,
      puntosPrecios,
      porcentaje: Math.round(porcentajePrecios * 100),
      estadisticas: {
        totalAsignados,
        totalConPrecios,
        porcentajePrecios: Math.round(porcentajePrecios * 100),
        puntosTotal: puntosPrecios,
        puntosPorPDV: Number(puntosPorPDV.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de precios (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de precios',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Ruta para descargar todos los KPIs en Excel
router.get('/download-kpis', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener datos de cobertura
    const [cobertura] = await conn.execute(
      `SELECT 
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 THEN 'Registrado'
          ELSE 'No Registrado'
        END as estado,
        COUNT(registro_servicios.id) * 15 as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id AND registro_servicios.estado_id =2 AND registro_servicios.estado_agente_id = 2
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
      ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de volumen
    const [volumen] = await conn.execute(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         puntos_venta.segmento,
         puntos_venta.meta_volumen as meta,
         users.name as nombre_asesor,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) as \`real\`,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / puntos_venta.meta_volumen) * 100, 2
         ) as porcentaje
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id  AND registro_servicios.estado_id =2 AND registro_servicios.estado_agente_id = 2
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, puntos_venta.segmento, puntos_venta.meta_volumen, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de visitas
    const [visitas] = await conn.execute(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         users.name as nombre_asesor,
         COUNT(registro_servicios.id) as cantidadVisitas,
         20 as meta,
         ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) as porcentaje,
         COUNT(registro_servicios.id) * 2 as puntos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id AND registro_servicios.estado_id =2 AND registro_servicios.estado_agente_id = 2
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de profundidad
    const [profundidad] = await conn.execute(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         users.name as nombre_asesor,
         CASE 
           WHEN COUNT(DISTINCT registro_productos.referencia_id) > 0 THEN 'Registrado'
           ELSE 'No Registrado'
         END as estado,
         COUNT(DISTINCT registro_productos.referencia_id) * 12 as puntos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de precios
    const [precios] = await conn.execute(
      `SELECT 
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        CASE 
          WHEN (COUNT(registro_servicios.id) > 0 AND registros_mistery_shopper.id_registro_pdv IS NOT NULL) THEN 'Precios Reportados'
          ELSE 'Precios No. Reportados'
        END as estado,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 AND registros_mistery_shopper.id_registro_pdv IS NOT NULL THEN COUNT(registro_servicios.id) * 2
          ELSE 0
        END as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id 
        AND registro_servicios.kpi_precio = 1
      LEFT JOIN registros_mistery_shopper 
          ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
      ORDER BY puntos_venta.codigo`, queryParams
    );

    const allData = {
      cobertura,
      volumen,
      visitas,
      profundidad,
      precios
    };

    res.json({
      success: true,
      data: allData
    });

  } catch (err) {
    console.error('Error obteniendo datos para Excel (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos para Excel',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ============================================
// ENDPOINTS DE GESTIÓN DE REGISTROS Y VALIDACIÓN
// ============================================

/**
 * @route GET /api/mercadeo/historial-registros-mercadeo
 * @description Obtiene historial de registros del territorio para gestión y validación
 * @access Private (requiere rol Mercadeo)
 * @middleware authenticateToken, requireMercadeo, logAccess
 * @returns {Object} Lista de registros del territorio con estados de validación
 * 
 * Uso: Página principal de gestión de registros en Mercadeo
 * Ejemplo: GET /api/mercadeo/historial-registros-mercadeo
 * Headers: Authorization: Bearer <token>
 * 
 * Filtro territorial: Solo registros de PDVs asignados al agente_id
 * Diferencia con BackOffice: Mercadeo ve solo su territorio, BackOffice ve todo
 * 
 * Respuesta típica:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "registro_id": 123,
 *       "codigo": "EDS001",
 *       "fecha_visita": "2025-01-15",
 *       "tipo_kpi": "PRECIO",
 *       "estado": "pendiente",
 *       "asesor_name": "Juan Pérez",
 *       "archivos": [...]
 *     }
 *   ]
 * }
 */
router.get('/historial-registros-mercadeo', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { agente_id } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Consulta similar a la del asesor pero filtrando por agente_id
    const query = `
          SELECT 
        rs.id,
        agente.descripcion AS agente_comercial,
        pv.codigo,
        pv.descripcion AS nombre_pdv,
        pv.direccion,
        u.name,
        u.documento AS cedula,
        rs.fecha_registro,
        CASE
            WHEN rs.kpi_volumen = 1 AND rs.kpi_precio = 1 THEN 'Volumen / Precio'
            WHEN rs.kpi_volumen = 1 THEN 'Volumen'
            WHEN rs.kpi_precio = 1 THEN 'Precio'
            WHEN rs.kpi_frecuencia = 1 AND rs.kpi_precio = 0 AND rs.kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_kpi,
        CASE
            WHEN rs.kpi_volumen = 1 OR rs.kpi_precio = 1 THEN 'Implementacion'
            WHEN rs.kpi_frecuencia = 1 AND rs.kpi_precio = 0 AND rs.kpi_volumen = 0 THEN 'Visita'
            ELSE 'Otro'
        END AS tipo_accion,
        e1.descripcion AS estado_agente,
        e2.descripcion AS estado_backoffice,
        rs.observacion,
        rs.observacion_agente,
        rp.referencias,
        rp.presentaciones,
        rp.cantidades_cajas,
        rp.galonajes,
        rp.precios_sugeridos,
        rp.precios_reales,
        rf.fotos_factura,
        rf.fotos_pop,
        rf.fotos_seguimiento
        FROM registro_servicios rs
        INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
        INNER JOIN agente ON agente.id = pv.id_agente
        INNER JOIN users u ON u.id = rs.user_id
        INNER JOIN estados e1 ON e1.id = rs.estado_agente_id
        INNER JOIN estados e2 ON e2.id = rs.estado_id

        LEFT JOIN (
            SELECT 
                registro_id,
                GROUP_CONCAT(referencia_id) AS referencias,
                GROUP_CONCAT(presentacion) AS presentaciones,
                GROUP_CONCAT(cantidad_cajas) AS cantidades_cajas,
                GROUP_CONCAT(conversion_galonaje) AS galonajes,
                GROUP_CONCAT(precio_sugerido) AS precios_sugeridos,
                GROUP_CONCAT(precio_real) AS precios_reales
            FROM registro_productos
            GROUP BY registro_id
        ) rp ON rp.registro_id = rs.id

        LEFT JOIN (
            SELECT 
                id_registro,
                GROUP_CONCAT(foto_factura) AS fotos_factura,
                GROUP_CONCAT(foto_pop) AS fotos_pop,
                GROUP_CONCAT(foto_seguimiento) AS fotos_seguimiento
            FROM registro_fotografico_servicios
            GROUP BY id_registro
        ) rf ON rf.id_registro = rs.id
        WHERE rs.estado_id = 2 AND pv.id_agente = ?
        ORDER BY rs.fecha_registro DESC;`;
    const [rows] = await conn.execute(query, [agente_id]);

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
 * @description Actualización de Estado de Registros
 * 
 * Endpoints para la gestión del estado de registros desde el módulo de mercadeo.
 * Permite aprobar o rechazar registros con comentarios de seguimiento.
 */

/**
 * @route POST /api/mercadeo/actualizar-estado-registro/:registro_id
 * @description Actualiza el estado de un registro específico (aprobación/rechazo)
 * @param {string} registro_id - ID del registro a actualizar
 * @body {number} estado_agente_id - Estado del registro (2: aprobado, 3: rechazado)
 * @body {string} [comentario] - Comentario opcional sobre la decisión
 * @returns {Object} Confirmación de actualización
 * @returns {boolean} returns.success - Indica si la operación fue exitosa
 * @returns {string} returns.message - Mensaje descriptivo del resultado
 * @access Mercadeo
 * @middleware authenticateToken, requireMercadeo, logAccess
 * 
 * @example
 * // Request body:
 * {
 *   "estado_agente_id": 2,
 *   "comentario": "Registro aprobado - cumple con todos los criterios"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Estado del registro actualizado correctamente"
 * }
 */
// Endpoint para aprobar/rechazar registros desde mercadeo
router.post('/actualizar-estado-registro/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { estado_agente_id, comentario } = req.body;
  const { agente_id } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  // Validar estado_agente_id
  if (!estado_agente_id || ![2, 3].includes(Number(estado_agente_id))) {
    return res.status(400).json({
      success: false,
      message: 'Estado inválido. Debe ser 2 (aprobado) o 3 (rechazado)'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verificar que el registro existe y pertenece al agente
    const [registroCheck] = await conn.execute(
      `SELECT rs.id FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       WHERE rs.id = ? AND pv.id_agente = ?`,
      [registro_id, agente_id]
    );

    if (registroCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado o no tiene permisos para modificarlo'
      });
    }

    // Actualizar estado del registro con comentario
    const updateQuery = `
      UPDATE registro_servicios 
      SET estado_agente_id = ?, 
          observacion_agente = ?,
          updated_at = NOW()
      WHERE id = ?
    `;

    await conn.execute(updateQuery, [estado_agente_id, comentario, registro_id]);

    res.json({
      success: true,
      message: 'Estado del registro actualizado correctamente'
    });

  } catch (err) {
    console.error('Error actualizando estado del registro:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del registro',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @description Endpoints de Prueba
 * 
 * Endpoints de prueba sin autenticación para verificar el funcionamiento
 * de los diferentes módulos del sistema de mercadeo.
 * Útiles para diagnósticos y pruebas de conectividad.
 */

/**
 * @route GET /api/mercadeo/test-asesores
 * @description Endpoint de prueba para el módulo de asesores
 * @returns {Object} Confirmación de funcionamiento
 * @returns {boolean} returns.success - Siempre true
 * @returns {string} returns.message - Mensaje de confirmación
 * @returns {Array} returns.data - Array vacío
 * @access Public (sin autenticación)
 */
// RUTAS DE PRUEBA SIN AUTENTICACIÓN
router.get('/test-asesores', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de asesores funcionando',
    data: []
  });
});

/**
 * @route GET /api/mercadeo/test-puntos-venta
 * @description Endpoint de prueba para el módulo de puntos de venta
 * @returns {Object} Confirmación de funcionamiento del módulo de puntos de venta
 * @access Public (sin autenticación)
 */
router.get('/test-puntos-venta', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de puntos de venta funcionando',
    data: []
  });
});

router.get('/test-cobertura', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de cobertura funcionando',
    data: []
  });
});

router.get('/test-volumen', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de volumen funcionando',
    data: []
  });
});

router.get('/test-visitas', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de visitas funcionando',
    data: []
  });
});

router.get('/test-profundidad', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de profundidad funcionando',
    data: []
  });
});

router.get('/test-precios', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de precios funcionando',
    data: []
  });
});

// ============================================
//  ENDPOINTS PARA RANKING 
// ============================================

/**
 * @route GET /api/mercadeo/ranking-mi-empresa
 * @description Obtiene el ranking de asesores bajo supervisión del agente comercial
 * @access Private (requiere autenticación y rol MERCADEO)
 * @returns {Object} Ranking de asesores con filtros por territorio del agente
 * 
 * Funcionalidad:
 * - Filtra por agente_id del usuario autenticado
 * - Calcula puntos totales por asesor usando la misma lógica que asesor
 * - Ordena por puntuación descendente
 * - Incluye información de posicionamiento
 * - Proporciona datos de empresa/agente
 */
router.get('/ranking-mi-empresa', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const userId = req.user.userId; // Obtenido del token

  let conn;
  try {
    conn = await getConnection();

    // Primero obtener el agente_id del usuario logueado
    const [miInfo] = await conn.execute(
      `SELECT agente_id FROM users WHERE id = ?`, [userId]
    );

    if (!miInfo[0] || !miInfo[0].agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente_id asignado'
      });
    }

    const miAgenteId = miInfo[0].agente_id;

    // Obtener todos los asesores de la empresa (rol_id = 1 y mismo agente_id) con información geográfica
    const [asesores] = await conn.execute(
      `SELECT users.id, users.name, users.email, users.agente_id, 
              departamento.descripcion AS departamento, 
              depar_ciudades.descripcion AS ciudad,
              departamento.id AS departamento_id,
              depar_ciudades.id AS ciudad_id
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE rol_id = 1 AND agente_id = ?
       ORDER BY name`, [miAgenteId]
    );

    // Para cada asesor, calcular sus puntos usando la misma lógica que mis-puntos-totales
    const rankingDetallado = [];

    for (const asesor of asesores) {
      // Puntos por KPI 1 (Volumen) - igual que en mis-puntos-totales
      const [puntosVolumen] = await conn.execute(
        `SELECT SUM(registro_puntos.puntos) as totalPuntos
         FROM registro_servicios
         INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
         WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 1`, [asesor.id]
      );

      // Puntos por KPI 2 (Precios) - igual que en mis-puntos-totales
      const [puntosPrecios] = await conn.execute(
        `SELECT SUM(registro_puntos.puntos) as totalPuntos
         FROM registro_servicios
         INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
         WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 2`, [asesor.id]
      );

      // Puntos por KPI 3 (Visitas/Frecuencia) - igual que en mis-puntos-totales
      const [puntosVisitas] = await conn.execute(
        `SELECT SUM(registro_puntos.puntos) as totalPuntos
         FROM registro_servicios
         INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
         WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 3`, [asesor.id]
      );

      // Calcular totales - convertir a números para evitar concatenación (igual que mis-puntos-totales)
      const puntosVolumenTotal = Number(puntosVolumen[0]?.totalPuntos) || 0;
      const puntosPreciosTotal = Number(puntosPrecios[0]?.totalPuntos) || 0;
      const puntosVisitasTotal = Number(puntosVisitas[0]?.totalPuntos) || 0;
      const totalGeneral = puntosVolumenTotal + puntosPreciosTotal + puntosVisitasTotal;

      rankingDetallado.push({
        id: asesor.id,
        name: asesor.name,
        email: asesor.email,
        departamento: asesor.departamento,
        ciudad: asesor.ciudad,
        departamento_id: asesor.departamento_id,
        ciudad_id: asesor.ciudad_id,
        total_puntos: totalGeneral,
        es_usuario_actual: false // Para mercadeo, ningún asesor es el usuario actual
      });
    }

    // Ordenar por total de puntos (mayor a menor)
    rankingDetallado.sort((a, b) => b.total_puntos - a.total_puntos);

    // Agregar posiciones
    rankingDetallado.forEach((asesor, index) => {
      asesor.posicion = index + 1;
    });

    // Para mercadeo, no hay posición del usuario actual en el ranking (ya que es supervisor, no asesor)
    const posicionUsuario = null;

    // Obtener información del agente/empresa
    const [agenteInfo] = await conn.execute(
      `SELECT name as nombre_agente FROM users WHERE id = ?`, [miAgenteId]
    );

    res.json({
      success: true,
      ranking: rankingDetallado,
      mi_posicion: null, // Mercadeo no tiene posición en ranking de asesores
      mi_info: null,     // Mercadeo no está en el ranking
      total_asesores: rankingDetallado.length,
      empresa_info: {
        agente_id: miAgenteId,
        nombre_agente: agenteInfo[0]?.nombre_agente || 'No encontrado'
      }
    });

  } catch (err) {
    console.error('Error obteniendo ranking de mi empresa:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ranking de mi empresa',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @route GET /api/mercadeo/ranking-filtros
 * @description Obtiene opciones de filtros geográficos para el ranking
 * @access Private (requiere autenticación y rol MERCADEO)
 * @returns {Object} Departamentos y ciudades disponibles para filtrar
 * 
 * Funcionalidad:
 * - Filtra por asesores bajo supervisión del agente comercial
 * - Proporciona lista de departamentos únicos
 * - Proporciona lista de ciudades con relación a departamentos
 * - Incluye opciones "todos/todas" por defecto
 */
router.get('/ranking-filtros', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const userId = req.user.userId;

  let conn;
  try {
    conn = await getConnection();

    // Obtener el agente_id del usuario logueado
    const [miInfo] = await conn.execute(
      `SELECT agente_id FROM users WHERE id = ?`, [userId]
    );

    if (!miInfo[0] || !miInfo[0].agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente_id asignado'
      });
    }

    const miAgenteId = miInfo[0].agente_id;

    // Obtener todos los departamentos únicos de asesores de la empresa
    const [departamentos] = await conn.execute(
      `SELECT DISTINCT departamento.id, departamento.descripcion
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE users.rol_id = 1 AND users.agente_id = ?
       ORDER BY departamento.descripcion`, [miAgenteId]
    );

    // Obtener todas las ciudades únicas de asesores de la empresa
    const [ciudades] = await conn.execute(
      `SELECT DISTINCT depar_ciudades.id, depar_ciudades.descripcion, 
              depar_ciudades.id_departamento
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE users.rol_id = 1 AND users.agente_id = ?
       ORDER BY depar_ciudades.descripcion`, [miAgenteId]
    );

    res.json({
      success: true,
      filtros: {
        departamentos: [
          { id: 'todos', descripcion: 'Todos los departamentos' },
          ...departamentos
        ],
        ciudades: [
          { id: 'todas', descripcion: 'Todas las ciudades', id_departamento: null },
          ...ciudades
        ]
      }
    });

  } catch (err) {
    console.error('Error obteniendo filtros de ranking:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener filtros de ranking',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
