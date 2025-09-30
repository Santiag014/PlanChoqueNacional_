// ✅ ARCHIVO OPTIMIZADO PARA POOL COMPARTIDO
// ============================================
// - NO crea conexiones individuales por consulta
// - USA executeQueryForMultipleUsers() para consultas normales
// - USA executeQueryFast() para consultas rápidas
// - El pool de 50 conexiones se comparte entre TODOS los usuarios
// - NUNCA excede el límite de 500 conexiones/hora

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
import { getConnection, executeQueryForMultipleUsers, executeQueryFast } from '../db.js';
import { authenticateToken, requireMercadeo, logAccess } from '../middleware/auth.js';
import { enviarNotificacionCambioEstado, verificarConfiguracionEmail } from '../config/email.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  try {

    // Verificar que el registro existe y pertenece al agente
    const registroCheck = await executeQueryForMultipleUsers(
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
    
    const detalles = await executeQueryForMultipleUsers(queryDetalles, [registro_id, agente_id]);

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
  
  try {

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
    
    const rows = await executeQueryForMultipleUsers(query, [agente_id]);

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
  
  try {

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
    
    const rows = await executeQueryForMultipleUsers(query, [agente_id]);

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
  
  try {

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

    // MÉTRICAS FILTRADAS: Para cálculo de puntos (CON filtro de fecha)
    const totalesValidosResult = await executeQueryForMultipleUsers(
      `SELECT 
        COUNT(DISTINCT puntos_venta.id) as totalAsignados,
        COUNT(DISTINCT CASE 
          WHEN registro_servicios.id IS NOT NULL 
            AND registro_servicios.estado_id = 2 
            AND registro_servicios.estado_agente_id = 2 
            AND registro_servicios.fecha_registro <= '2025-09-06'
          THEN puntos_venta.id 
        END) as totalImpactadosValidos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id 
         AND registro_servicios.estado_id = 2 
         AND registro_servicios.estado_agente_id = 2
         AND registro_servicios.fecha_registro <= '2025-09-06'
       WHERE ${whereClause}`, queryParams
    );
    
    // MÉTRICAS REALES: Para mostrar el REAL (SIN filtro de fecha)
    const totalesRealesResult = await executeQueryForMultipleUsers(
      `SELECT 
        COUNT(DISTINCT CASE 
          WHEN registro_servicios.id IS NOT NULL 
            AND registro_servicios.estado_id = 2 
            AND registro_servicios.estado_agente_id = 2 
          THEN puntos_venta.id 
        END) as totalImpactadosReales
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id 
         AND registro_servicios.estado_id = 2 
         AND registro_servicios.estado_agente_id = 2
       WHERE ${whereClause}`, queryParams
    );
    
    const totalAsignados = totalesValidosResult[0]?.totalAsignados || 0;
    const totalImpactadosValidos = totalesValidosResult[0]?.totalImpactadosValidos || 0; // Para puntos
    const totalImpactadosReales = totalesRealesResult[0]?.totalImpactadosReales || 0; // Para mostrar en UI

    // MÉTRICAS BASE: Para cálculo de puntos (SIN filtros de PDV, solo agente/asesor)
    const whereConditionsBase = ['puntos_venta.id_agente = ?'];
    const queryParamsBase = [agente_id];
    
    if (asesor_id) {
      whereConditionsBase.push('puntos_venta.user_id = ?');
      queryParamsBase.push(asesor_id);
    }
    
    const whereClauseBase = whereConditionsBase.join(' AND ');

    const totalesBaseResult = await executeQueryForMultipleUsers(
      `SELECT 
        COUNT(DISTINCT puntos_venta.id) as totalAsignadosBase,
        COUNT(DISTINCT CASE 
          WHEN registro_servicios.id IS NOT NULL 
            AND registro_servicios.estado_id = 2 
            AND registro_servicios.estado_agente_id = 2 
            AND registro_servicios.fecha_registro <= '2025-09-06'
          THEN puntos_venta.id 
        END) as totalImpactadosBase
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id 
         AND registro_servicios.estado_id = 2 
         AND registro_servicios.estado_agente_id = 2
         AND registro_servicios.fecha_registro <= '2025-09-06'
       WHERE ${whereClauseBase}`, queryParamsBase
    );
    
    const totalAsignadosBase = totalesBaseResult[0]?.totalAsignadosBase || 0;
    const totalImpactadosBase = totalesBaseResult[0]?.totalImpactadosBase || 0;

    const porcentajeCobertura = totalAsignados > 0 ? (totalImpactadosReales / totalAsignados) : 0; // USAR REALES para el %
    
  // NUEVA MATRIZ DE PUNTOS MÁXIMOS: Cobertura = 3000
  const MAX_PUNTOS_COBERTURA = 3000;
  const puntosBasePorPDV = totalAsignadosBase > 0 ? (MAX_PUNTOS_COBERTURA / totalAsignadosBase) : 0;

    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        CASE 
          WHEN COUNT(CASE 
            WHEN registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2 
            THEN registro_servicios.id 
          END) > 0 THEN 'Registrado'
          ELSE 'No Registrado'
        END as estado,
        CASE 
          WHEN COUNT(CASE 
            WHEN registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2 AND registro_servicios.fecha_registro <= '2025-09-06'
            THEN registro_servicios.id 
          END) > 0 THEN ROUND(${puntosBasePorPDV}, 1)
          ELSE 0.0
        END as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name, users.id
      ORDER BY puntos_venta.codigo
    `;
    
    const rows = await executeQueryForMultipleUsers(query, queryParams);

  // PUNTOS BASE: Calculados con métricas base (sin filtros de PDV) - ESTÁTICOS
  const puntosCoberturaBase = totalAsignadosBase > 0 ? Math.round((totalImpactadosBase / totalAsignadosBase) * MAX_PUNTOS_COBERTURA) : 0;
    
    // CORREGIDO: Si hay filtro PDV específico y ese PDV no tiene datos → 0 puntos
    const puntosFinales = pdv_id && totalImpactadosValidos === 0 ? 0 : puntosCoberturaBase;
    
    console.log('=== DEBUG COBERTURA MERCADEO CORREGIDO ===');
    console.log('BASE - Asignados:', totalAsignadosBase, 'Impactados:', totalImpactadosBase, 'Puntos:', puntosCoberturaBase);
    console.log('FILTRADA - Asignados:', totalAsignados);
    console.log('REALES (para UI) - Impactados:', totalImpactadosReales);
    console.log('VÁLIDOS (para puntos) - Impactados:', totalImpactadosValidos);
    console.log('PDV filtro:', pdv_id, 'Puntos finales:', puntosFinales);
    console.log('Porcentaje con reales:', Math.round(porcentajeCobertura * 100) + '%');
    console.log('Filtros aplicados:', { asesor_id, pdv_id, agente_id });
    console.log('===============================');
    
    res.json({
      success: true,
      pdvs: rows,
      data: rows,
      total: rows.length,
      // Métricas principales para el dashboard
      puntos: puntosFinales, // Puntos ajustados (0 si PDV filtrado no tiene datos)
      meta: totalAsignados, // Meta filtrada (para UI)
      real: totalImpactadosReales, // REAL: Todos los PDVs con registros (sin filtro de fecha)
      porcentajeCumplimiento: Math.round(porcentajeCobertura * 100),
      // Propiedades adicionales para compatibilidad
      totalAsignados: totalAsignados,
      totalImplementados: totalImpactadosReales, // REAL: Usar impactados reales
      puntosCobertura: puntosFinales, // Puntos ajustados
      estadisticas: {
        totalAsignados,
        totalImpactados: totalImpactadosReales, // REAL: Usar impactados reales
        porcentajeCobertura: Math.round(porcentajeCobertura * 100),
        puntosTotal: puntosFinales, // Puntos ajustados
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
  
  try {

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

    // Obtener meta volumen - CORREGIDO: Aplicar TODOS los filtros (asesor_id y pdv_id)
    let metaQuery, metaParams;
    
    if (asesor_id && pdv_id) {
      // Filtro por asesor Y PDV específico
      metaQuery = `SELECT SUM(meta_volumen) as totalMeta FROM puntos_venta WHERE user_id = ? AND id = ?`;
      metaParams = [asesor_id, pdv_id];
    } else if (asesor_id) {
      // Solo filtro por asesor
      metaQuery = `SELECT SUM(meta_volumen) as totalMeta FROM puntos_venta WHERE user_id = ?`;
      metaParams = [asesor_id];
    } else if (pdv_id) {
      // Solo filtro por PDV (verificar que pertenezca al agente)
      metaQuery = `SELECT SUM(meta_volumen) as totalMeta FROM puntos_venta WHERE id_agente = ? AND id = ?`;
      metaParams = [agente_id, pdv_id];
    } else {
      // Sin filtros específicos, consultar por agente_id
      metaQuery = `SELECT SUM(meta_volumen) as totalMeta FROM puntos_venta WHERE id_agente = ?`;
      metaParams = [agente_id];
    }
    
    const metaResult = await executeQueryForMultipleUsers(metaQuery, metaParams);
    const totalMeta = metaResult[0]?.totalMeta || 0;

    // Obtener volumen real - CORREGIDO: Aplicar TODOS los filtros (asesor_id y pdv_id)
    let realQuery, realParams;
    
    if (asesor_id && pdv_id) {
      // Filtro por asesor Y PDV específico
      realQuery = `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
         FROM registro_servicios
         INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id AND registro_servicios.user_id = ? AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2
         WHERE registro_servicios.pdv_id = ?`;
      realParams = [asesor_id, pdv_id];
    } else if (asesor_id) {
      // Solo filtro por asesor (consulta idéntica a asesor.js)
      realQuery = `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
         FROM registro_servicios
         INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id AND registro_servicios.user_id = ? AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`;
      realParams = [asesor_id];
    } else if (pdv_id) {
      // Solo filtro por PDV (verificar que pertenezca al agente)
      realQuery = `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
         FROM registro_servicios
         INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
         INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
         WHERE puntos_venta.id_agente = ? AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2 AND puntos_venta.id = ?`;
      realParams = [agente_id, pdv_id];
    } else {
      // Sin filtros específicos, consultar por agente_id
      realQuery = `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
         FROM registro_servicios
         INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
         INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
         WHERE puntos_venta.id_agente = ? AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`;
      realParams = [agente_id];
    }
    
    const realResult = await executeQueryForMultipleUsers(realQuery, realParams);
    const totalReal = realResult[0]?.totalReal || 0;

    // NUEVA MATRIZ DE PUNTOS MÁXIMOS: Volumen = 6000
    const MAX_PUNTOS_VOLUMEN = 6000;
    let puntosVolumen = totalMeta > 0 ? Math.round((totalReal / totalMeta) * MAX_PUNTOS_VOLUMEN) : 0;

    console.log('=== DEBUG VOLUMEN MERCADEO (DISTRIBUCIÓN PROPORCIONAL) ===');
    console.log('Filtros aplicados:', { asesor_id, pdv_id, agente_id });
    console.log('totalMeta:', totalMeta);
    console.log('totalReal:', totalReal);
    console.log('puntosVolumen (SIN límite):', puntosVolumen);
    console.log('Fórmula: (' + totalReal + '/' + totalMeta + ') * 350 =', puntosVolumen);
    
    let logicaAplicada = 'CONSULTA POR AGENTE_ID';
    if (asesor_id && pdv_id) {
      logicaAplicada = 'FILTRO POR ASESOR Y PDV ESPECÍFICO';
    } else if (asesor_id) {
      logicaAplicada = 'FILTRO POR ASESOR - Fórmula idéntica a asesor.js';
    } else if (pdv_id) {
      logicaAplicada = 'FILTRO POR PDV ESPECÍFICO';
    }
    
    console.log('Lógica aplicada:', logicaAplicada);
    console.log('Parámetros meta:', metaParams);
    console.log('Parámetros real:', realParams);
    console.log('=======================================================');

    // Obtener detalle por PDV incluyendo puntos reales de registro_puntos
    // CORREGIDO: Usar subconsultas para evitar duplicación de puntos cuando hay múltiples productos
    let pdvWhereClause = whereClause;
    let asesorFilter = '';
    
    // Si hay filtro por asesor_id, agregarlo a las subconsultas
    if (asesor_id) {
      asesorFilter = ' AND rs.user_id = ' + asesor_id;
    }

    const pdvs = await executeQueryForMultipleUsers(
      `SELECT 
         puntos_venta.id,
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         puntos_venta.segmento,
         puntos_venta.meta_volumen as meta,
         users.name as nombre_asesor,
         users.id as asesor_id,
         COALESCE(vol.total_volumen, 0) as \`real\`,
         ROUND(
           (COALESCE(vol.total_volumen, 0) / puntos_venta.meta_volumen) * 100, 2
         ) as porcentaje
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN (
         SELECT rs.pdv_id, SUM(rp.conversion_galonaje) as total_volumen
         FROM registro_servicios rs
         INNER JOIN registro_productos rp ON rp.registro_id = rs.id
         WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2${asesorFilter}
         GROUP BY rs.pdv_id
       ) vol ON vol.pdv_id = puntos_venta.id
       WHERE ${whereClause}
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // CORREGIDO: Distribuir puntos totales proporcionalmente según % cumplimiento
    // 1. Calcular el cumplimiento total ponderado de todos los PDVs
    const cumplimientoTotal = pdvs.reduce((sum, pdv) => {
      if (pdv.meta > 0) {
        return sum + (pdv.real / pdv.meta); // Suma de ratios de cumplimiento
      }
      return sum;
    }, 0);
    
    const pdvsConPuntos = pdvs.map(pdv => {
      const cumplimiento = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
      
      // 2. Distribuir puntos totales proporcionalmente según cumplimiento
      let puntosPorPDV = 0;
      if (pdv.meta > 0 && cumplimientoTotal > 0) {
        const ratioCumplimiento = (pdv.real / pdv.meta); // Ratio individual
        const proporcionCumplimiento = ratioCumplimiento / cumplimientoTotal; // % del total
        puntosPorPDV = Math.round(puntosVolumen * proporcionCumplimiento); // SIN límite por PDV
      }
      
      return {
        ...pdv,
        puntos: puntosPorPDV, // Distribución proporcional por cumplimiento (SIN límite)
        cumplimiento: Number(cumplimiento.toFixed(2))
      };
    });

    // Debug: Verificar que la suma de puntos por PDV coincida con el total
    const sumaPuntosPorPDV = pdvsConPuntos.reduce((sum, pdv) => sum + pdv.puntos, 0);
    console.log('=== VERIFICACIÓN DE CONSISTENCIA (DISTRIBUCIÓN POR CUMPLIMIENTO) ===');
    console.log('Puntos totales calculados:', puntosVolumen);
    console.log('Suma de puntos distribuidos por PDV:', sumaPuntosPorPDV);
    console.log('Diferencia (debe ser mínima):', Math.abs(puntosVolumen - sumaPuntosPorPDV));
    console.log('Cumplimiento total ponderado:', cumplimientoTotal);
    console.log('Total meta:', totalMeta);
    console.log('Total real:', totalReal);
    console.log('PDVs con puntos:', pdvsConPuntos.filter(p => p.puntos > 0).map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      meta: p.meta,
      real: p.real,
      cumplimiento: p.cumplimiento + '%',
      puntos: p.puntos,
      proporcionCumplimiento: cumplimientoTotal > 0 ? ((p.real / p.meta) / cumplimientoTotal * 100).toFixed(2) + '%' : '0%',
      asesor: p.nombre_asesor
    })));
    console.log('===============================================');

    // Obtener resumen por segmento
    const segmentos = await executeQueryForMultipleUsers(
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
    const productos = await executeQueryForMultipleUsers(
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
       WHERE ${whereClause} 
         AND registro_servicios.estado_id = 2 
         AND registro_servicios.estado_agente_id = 2 
         AND registro_productos.referencia_id IS NOT NULL
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
    const resumenAsesores = await executeQueryForMultipleUsers(
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
  }
});

// Obtener métricas de frecuencia (visitas) filtradas por agente_id
router.get('/visitas', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  
  try {

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

    // MÉTRICAS FILTRADAS: Para mostrar en UI (aplicar todos los filtros)
    const metaResult = await executeQueryForMultipleUsers(
      `SELECT COUNT(*) * 10 as metaVisitas
       FROM puntos_venta
       WHERE ${whereClause}`, queryParams
    );
    const metaVisitas = metaResult[0]?.metaVisitas || 0;

    const realResult = await executeQueryForMultipleUsers(
      `SELECT COUNT(registro_servicios.id) as totalVisitas
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause} AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`, queryParams
    );
    const totalVisitas = realResult[0]?.totalVisitas || 0;

    // MÉTRICAS BASE: Para cálculo de puntos (SIN filtros de PDV, solo agente/asesor)
    const whereConditionsBase = ['puntos_venta.id_agente = ?'];
    const queryParamsBase = [agente_id];
    
    if (asesor_id) {
      whereConditionsBase.push('puntos_venta.user_id = ?');
      queryParamsBase.push(asesor_id);
    }
    
    const whereClauseBase = whereConditionsBase.join(' AND ');

    const metaBaseResult = await executeQueryForMultipleUsers(
      `SELECT COUNT(*) * 10 as metaBase
       FROM puntos_venta
       WHERE ${whereClauseBase}`, queryParamsBase
    );
    const metaBase = metaBaseResult[0]?.metaBase || 0;

    const realBaseResult = await executeQueryForMultipleUsers(
      `SELECT COUNT(registro_servicios.id) as totalVisitasBase
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClauseBase} AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`, queryParamsBase
    );
    const totalVisitasBase = realBaseResult[0]?.totalVisitasBase || 0;

    const porcentajeVisitas = metaVisitas > 0 ? (totalVisitas / metaVisitas) : 0;
    
  // NUEVA MATRIZ DE PUNTOS MÁXIMOS: Frecuencia = 1000
  const MAX_PUNTOS_FRECUENCIA = 1000;
  const puntosVisitasBase = metaBase > 0 ? Math.round((totalVisitasBase / metaBase) * MAX_PUNTOS_FRECUENCIA) : 0;
    
    console.log('=== DEBUG MÉTRICAS BASE vs FILTRADAS ===');
    console.log('Meta BASE (puntos):', metaBase, 'Visitas BASE:', totalVisitasBase, 'Puntos BASE:', puntosVisitasBase);
    console.log('Meta FILTRADA (UI):', metaVisitas, 'Visitas FILTRADAS:', totalVisitas);
    console.log('Filtros aplicados:', { asesor_id, pdv_id, agente_id });
    console.log('==========================================');

    // Obtener detalle por PDV
    const pdvs = await executeQueryForMultipleUsers(
      `SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        COUNT(registro_servicios.id) AS cantidadVisitas,
        20 AS meta,
        ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) AS porcentaje,
        COUNT(registro_servicios.id) AS visitasReales
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

    // CORREGIDO: Distribuir puntos BASE proporcionalmente (puntos estáticos)
    const pdvsConPuntos = pdvs.map(pdv => {
      // Distribuir proporcionalmente los puntos BASE según las visitas de cada PDV
      const puntosPdv = totalVisitasBase > 0 ? 
        Math.round((pdv.visitasReales / totalVisitasBase) * puntosVisitasBase) : 0;
      
      return {
        ...pdv,
        puntos: puntosPdv
      };
    });

    // Los puntos totales son BASE (estáticos, no cambian con filtros de PDV)
    const puntosVisitasReal = puntosVisitasBase;
    
    // CORREGIDO: Si hay filtro PDV específico y ese PDV no tiene datos → 0 puntos
    const puntosFinalesVisitas = pdv_id && totalVisitas === 0 ? 0 : puntosVisitasReal;

    console.log('=== DEBUG PDV QUERY ===');
    console.log('whereClause:', whereClause);
    console.log('queryParams:', queryParams);
    console.log('metaVisitas:', metaVisitas);
    console.log('puntosVisitasBase (estáticos):', puntosVisitasBase);
    console.log('PDV filtro:', pdv_id, 'Puntos finales:', puntosFinalesVisitas);

    // CORREGIDO: Los puntos totales ya están calculados arriba correctamente
    // Verificar consistencia (solo para debug)
    const sumaPuntosPorPDV = pdvsConPuntos.reduce((sum, pdv) => sum + Number(pdv.puntos), 0);
    
    console.log('=== VERIFICACIÓN PUNTOS ESTÁTICOS ===');
    console.log('Puntos BASE (estáticos):', puntosVisitasBase);
    console.log('Puntos usados en response:', puntosVisitasReal);
    console.log('Suma puntos PDVs:', sumaPuntosPorPDV);
    console.log('Meta FILTRADA (UI):', metaVisitas);
    console.log('Visitas FILTRADAS (UI):', totalVisitas);
    console.log('PDVs con puntos:', pdvsConPuntos.filter(p => p.puntos > 0).map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      cantidadVisitas: p.cantidadVisitas,
      puntos: p.puntos,
      asesor: p.nombre_asesor
    })));
    console.log('=======================================');

    // DEBUG: Verificar si existen PDVs para este agente
    const debugPdvs = await executeQueryForMultipleUsers(
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
    const tiposVisita = await executeQueryForMultipleUsers(
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

    // Obtener resumen por asesor - CORREGIDO: Usar cálculo manual como el total general
    const resumenAsesores = await executeQueryForMultipleUsers(
      `SELECT 
         users.id as asesor_id,
         users.name as nombre_asesor,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         COUNT(registro_servicios.id) as totalVisitas,
         COUNT(DISTINCT puntos_venta.id) * 20 as metaVisitas,
         ROUND((COUNT(registro_servicios.id) / (COUNT(DISTINCT puntos_venta.id) * 20)) * 100, 2) as porcentajeCumplimiento,
         ROUND((COUNT(registro_servicios.id) / (COUNT(DISTINCT puntos_venta.id) * 20)) * 150, 0) as puntosGanados
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
      pdvs: pdvsConPuntos,
      data: pdvsConPuntos,
      // Métricas principales para el dashboard
      puntos: puntosFinalesVisitas, // Puntos ajustados (0 si PDV filtrado no tiene datos)
      meta: metaVisitas, // Meta filtrada
      real: totalVisitas, // Visitas filtradas
      porcentajeCumplimiento: metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0,
      // Propiedades adicionales para compatibilidad
      meta_visitas: metaVisitas,
      real_visitas: totalVisitas,
      tiposVisita,
      resumenAsesores,
      totales: {
        totalPdvs: pdvsConPuntos.length,
        totalMetaVisitas: metaVisitas, // Meta filtrada
        totalRealVisitas: totalVisitas, // Visitas filtradas
        totalPuntosGanados: Number(pdvsConPuntos.reduce((sum, pdv) => sum + Number(pdv.puntos), 0).toFixed(2)),
        promedioVisitasPorPdv: pdvsConPuntos.length > 0 ? 
          Number((pdvsConPuntos.reduce((sum, pdv) => sum + pdv.cantidadVisitas, 0) / pdvsConPuntos.length).toFixed(2)) : 0
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de frecuencia (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de frecuencia',
      error: err.message
    });
  }
});

// Obtener métricas de precios filtradas por agente_id
router.get('/precios', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  
  try {

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
    const totalesResult = await executeQueryForMultipleUsers(
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
  // NUEVA MATRIZ DE PUNTOS MÁXIMOS: Precios = 2000
  const MAX_PUNTOS_PRECIOS = 2000;
  const puntosPorPDV = totalAsignados > 0 ? Math.floor(MAX_PUNTOS_PRECIOS / totalAsignados) : 0;

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
    
    const rows = await executeQueryForMultipleUsers(query, queryParams);

  // Calcular puntos totales (IGUAL QUE ASESOR: 2000 puntos máximo)
  const puntosPrecios = totalAsignados > 0 ? Math.round((totalConPrecios / totalAsignados) * MAX_PUNTOS_PRECIOS) : 0;

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
  }
});

// Ruta para descargar todos los KPIs en Excel
router.get('/download-kpis', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  
  try {

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
    const cobertura = await executeQueryForMultipleUsers(
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
    const volumen = await executeQueryForMultipleUsers(
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

    // Obtener datos de visitas (usando nueva lógica de 150 puntos)
    const visitas = await executeQueryForMultipleUsers(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         users.name as nombre_asesor,
         COUNT(registro_servicios.id) as cantidadVisitas,
         20 as meta,
         ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) as porcentaje,
         ROUND((COUNT(registro_servicios.id) / 20) * 150, 2) as puntos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id AND registro_servicios.estado_id =2 AND registro_servicios.estado_agente_id = 2
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de profundidad
    const profundidad = await executeQueryForMultipleUsers(
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
    const precios = await executeQueryForMultipleUsers(
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

  // Obtener parámetros de filtro de la query string
  const { 
    busquedaCodigo, 
    busquedaCedula, 
    busquedaId,
    fechaActividad,
    fechaCreacion,
    filtroKPI, 
    filtroActividad, 
    filtroEstadoBackoffice, 
    filtroEstadoAgente 
  } = req.query;

  try {

    // Construir condiciones WHERE dinámicas
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];

    // Filtro por código de PDV
    if (busquedaCodigo && busquedaCodigo.trim()) {
      whereConditions.push('puntos_venta.codigo LIKE ?');
      queryParams.push(`%${busquedaCodigo.trim()}%`);
    }

    // Filtro por cédula del asesor
    if (busquedaCedula && busquedaCedula.trim()) {
      whereConditions.push('users.documento LIKE ?');
      queryParams.push(`%${busquedaCedula.trim()}%`);
    }

    // Filtro por ID del registro
    if (busquedaId && busquedaId.trim()) {
      whereConditions.push('registro_servicios.id = ?');
      queryParams.push(busquedaId.trim());
    }

    // Filtro por fecha de actividad (fecha_registro que se muestra como FECHA FACTURA)
    if (fechaActividad && fechaActividad.trim()) {
      whereConditions.push('DATE(registro_servicios.fecha_registro) = ?');
      queryParams.push(fechaActividad.trim());
    }

    // Filtro por fecha de creación (created_at)
    if (fechaCreacion && fechaCreacion.trim()) {
      whereConditions.push('DATE(registro_servicios.created_at) = ?');
      queryParams.push(fechaCreacion.trim());
    }

    // Filtro por KPI
    if (filtroKPI && filtroKPI !== 'TODOS') {
      switch(filtroKPI) {
        case 'VOLUMEN':
          whereConditions.push('registro_servicios.kpi_volumen = 1');
          break;
        case 'PRECIO':
          whereConditions.push('registro_servicios.kpi_precio = 1');
          break;
        case 'FRECUENCIA':
          whereConditions.push('registro_servicios.kpi_frecuencia = 1 AND registro_servicios.kpi_precio = 0 AND registro_servicios.kpi_volumen = 0');
          break;
        case 'PRECIO_VOLUMEN':
          whereConditions.push('registro_servicios.kpi_volumen = 1 AND registro_servicios.kpi_precio = 1');
          break;
      }
    }

    // Filtro por Actividad
    if (filtroActividad && filtroActividad !== 'TODAS') {
      switch(filtroActividad.toUpperCase()) {
        case 'GALONAJE/PRECIOS':
          whereConditions.push('registro_servicios.kpi_volumen = 1 AND registro_servicios.kpi_precio = 1');
          break;
        case 'GALONAJE':
          whereConditions.push('registro_servicios.kpi_volumen = 1');
          break;
        case 'PRECIOS':
          whereConditions.push('registro_servicios.kpi_precio = 1');
          break;
        case 'VISITA':
          whereConditions.push('registro_servicios.kpi_frecuencia = 1 AND registro_servicios.kpi_precio = 0 AND registro_servicios.kpi_volumen = 0 AND registro_servicios.IsImplementacion IS NULL');
          break;
        case 'IMPLEMENTACIÓN':
          whereConditions.push('registro_servicios.IsImplementacion = 1');
          break;
      }
    }

    // Filtro por Estado BackOffice
    if (filtroEstadoBackoffice && filtroEstadoBackoffice !== 'TODOS') {
      whereConditions.push('e1.descripcion = ?');
      queryParams.push(filtroEstadoBackoffice);
    }

    // Filtro por Estado Agente
    if (filtroEstadoAgente && filtroEstadoAgente !== 'TODOS') {
      whereConditions.push('e2.descripcion = ?');
      queryParams.push(filtroEstadoAgente);
    }

    const whereClause = whereConditions.join(' AND ');

    // Consulta similar a la del asesor pero filtrando por agente_id
    const query = `
    WITH productos_agrupados AS (
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
        puntos_venta.descripcion,
        puntos_venta.direccion,
        users.name,
        users.documento,
        DATE_FORMAT(registro_servicios.fecha_registro, '%Y-%m-%d') AS fecha_registro,
        DATE_FORMAT(registro_servicios.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
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
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 AND IsImplementacion is null THEN 'Visita'
            WHEN IsImplementacion = 1 THEN 'Implementación'
            ELSE 'Otro'
        END AS tipo_accion,
        e1.descripcion AS estado_backoffice,
        e2.descripcion AS estado_agente,
        registro_servicios.observacion,
        registro_servicios.observacion_agente,
        
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
    LEFT JOIN productos_agrupados pa ON pa.registro_id = registro_servicios.id
    LEFT JOIN fotos_agrupadas fa ON fa.id_registro = registro_servicios.id
    LEFT JOIN implementacion_agrupada ia ON ia.id_registro = registro_servicios.id

    WHERE ${whereClause}
    ORDER BY registro_servicios.created_at DESC, registro_servicios.fecha_registro DESC`;
    const rows = await executeQueryForMultipleUsers(query, queryParams);

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

  try {

    // Verificar que el registro existe y obtener información completa para el email
    const registroCheck = await executeQueryForMultipleUsers(
      `SELECT 
         rs.id, 
         rs.user_id,
         rs.fecha_registro,
         rs.created_at,
         pv.codigo as codigo_pdv,
         pv.descripcion as nombre_pdv,
         u.name as nombre_asesor,
         u.email as email_asesor
       FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       INNER JOIN users u ON u.id = rs.user_id
       WHERE rs.id = ? AND pv.id_agente = ?`,
      [registro_id, agente_id]
    );

    if (registroCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado o no tiene permisos para modificarlo'
      });
    }

    const registro = registroCheck[0];

    // Obtener información del usuario de mercadeo que está actualizando
    const mercadeoInfo = await executeQueryForMultipleUsers(
      `SELECT u.name, u.email 
       FROM users u 
       WHERE u.agente_id = ?`,
      [agente_id]
    );

    const nombreMercadeo = mercadeoInfo.length > 0 ? mercadeoInfo[0].name : 'Equipo de Mercadeo';

    // Actualizar estado del registro con comentario
    const updateQuery = `
      UPDATE registro_servicios 
      SET estado_agente_id = ?, 
          observacion_agente = ?,
          updated_at = NOW()
      WHERE id = ?
    `;

    await executeQueryForMultipleUsers(updateQuery, [estado_agente_id, comentario, registro_id]);

    // Enviar email de notificación al asesor
    // if (registro.email_asesor) {
    //   try {
    //     const resultadoEmail = await enviarNotificacionCambioEstado({
    //       emailAsesor: registro.email_asesor,
    //       nombreAsesor: registro.nombre_asesor,
    //       registroId: registro_id,
    //       codigoPdv: registro.codigo_pdv,
    //       nombrePdv: registro.nombre_pdv,
    //       fechaRegistro: registro.fecha_registro,
    //       fechaCreacion: registro.created_at,
    //       nuevoEstado: Number(estado_agente_id),
    //       comentario: comentario || '',
    //       nombreMercadeo: nombreMercadeo
    //     });

    //     if (resultadoEmail.success) {
    //       console.log(`✅ Email enviado correctamente a ${registro.email_asesor} para registro #${registro_id}`);
    //     } else {
    //       console.error(`❌ Error enviando email a ${registro.email_asesor}:`, resultadoEmail.error);
    //     }
    //   } catch (emailError) {
    //     console.error('Error al enviar email de notificación:', emailError);
    //     // No fallar la operación si el email falla
    //   }
    // } else {
    //   console.log(`⚠️ No se encontró email para el asesor del registro #${registro_id}`);
    // }

    res.json({
      success: true,
      message: 'Estado del registro actualizado correctamente',
      email_enviado: !!registro.email_asesor
    });

  } catch (err) {
    console.error('Error actualizando estado del registro:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del registro',
      error: err.message
    });
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
  const userId = req.user.id; // Obtenido del token

  try {

    // Primero obtener el agente_id del usuario logueado
    const miInfo = await executeQueryForMultipleUsers(
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
    const asesores = await executeQueryForMultipleUsers(
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

    // Para cada asesor, calcular sus puntos usando la MISMA LÓGICA EXACTA que el ranking de asesor
    const rankingDetallado = [];

    // MATRIZ DE PUNTOS MÁXIMOS
    const MAX_PUNTOS = {
      cobertura: 3000,
      volumen: 6000,
      visitas: 1000,
      precios: 2000
    };

    for (const asesor of asesores) {
      // 1. PUNTOS COBERTURA
      const pdvsAsesor = await executeQueryForMultipleUsers(
        `SELECT id FROM puntos_venta WHERE user_id = ?`, [asesor.id]
      );
      const totalAsignados = pdvsAsesor.length;
      const implementados = await executeQueryForMultipleUsers(
        `SELECT DISTINCT pdv_id FROM registro_servicios
         WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2 AND fecha_registro <= ?`, [asesor.id, '2025-09-06']
      );
      const totalImplementados = implementados.length;
      const puntosCobertura = totalAsignados > 0 ? Math.round((totalImplementados / totalAsignados) * MAX_PUNTOS.cobertura) : 0;

      // 2. PUNTOS VOLUMEN
      const metaVolumenResult = await executeQueryForMultipleUsers(
        `SELECT SUM(meta_volumen) as totalMeta 
         FROM puntos_venta 
         WHERE user_id = ?`, [asesor.id]
      );
      const totalMetaVolumen = metaVolumenResult[0]?.totalMeta || 0;
      const realVolumenResult = await executeQueryForMultipleUsers(
        `SELECT COALESCE(SUM(vol.total_volumen), 0) as totalReal
         FROM puntos_venta pv
         LEFT JOIN (
           SELECT rs.pdv_id, SUM(rp.conversion_galonaje) as total_volumen
           FROM registro_servicios rs
           INNER JOIN registro_productos rp ON rp.registro_id = rs.id
           WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
           GROUP BY rs.pdv_id
         ) vol ON vol.pdv_id = pv.id
         WHERE pv.user_id = ?`, [asesor.id, asesor.id]
      );
      const totalRealVolumen = realVolumenResult[0]?.totalReal || 0;
      const puntosVolumen = totalMetaVolumen > 0 ? Math.round((totalRealVolumen / totalMetaVolumen) * MAX_PUNTOS.volumen) : 0;

      // 3. PUNTOS VISITAS
      const totalPdvs = pdvsAsesor.length;
      const metaVisitas = totalPdvs * 10;
      const realVisitas = await executeQueryForMultipleUsers(
        `SELECT COUNT(id) as totalVisitas FROM registro_servicios
         WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [asesor.id]
      );
      const totalVisitas = realVisitas[0]?.totalVisitas || 0;
      const puntosVisitas = metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * MAX_PUNTOS.visitas) : 0;

      // 4. PUNTOS PRECIOS
      const reportadosPrecios = await executeQueryForMultipleUsers(
        `SELECT DISTINCT pdv_id FROM registro_servicios
         LEFT JOIN registros_mistery_shopper ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id
         WHERE user_id = ? AND kpi_precio = 1 AND registros_mistery_shopper.id IS NOT NULL`, [asesor.id]
      );
      const totalReportados = reportadosPrecios.length;
      const puntosPrecios = totalAsignados > 0 ? Math.round((totalReportados / totalAsignados) * MAX_PUNTOS.precios) : 0;

      // 5. PUNTOS BONIFICACIÓN
      const bonificaciones = await executeQueryForMultipleUsers(
        `SELECT SUM(puntos) as totalBonificacion FROM retos_bonificadores WHERE id_asesor = ?`, [asesor.id]
      );
      const puntosBonificacion = 0;

      // TOTAL DE PUNTOS
      const totalGeneral = puntosCobertura + puntosVolumen + puntosVisitas + puntosPrecios + puntosBonificacion;

      rankingDetallado.push({
        id: asesor.id,
        name: asesor.name,
        email: asesor.email,
        departamento: asesor.departamento,
        ciudad: asesor.ciudad,
        departamento_id: asesor.departamento_id,
        ciudad_id: asesor.ciudad_id,
        puntos_cobertura: puntosCobertura,
        puntos_volumen: puntosVolumen,
        puntos_visitas: puntosVisitas,
        puntos_precios: puntosPrecios,
        puntos_bonificacion: puntosBonificacion,
        total_puntos: totalGeneral,
        pdvs_asignados: totalAsignados,
        pdvs_implementados: totalImplementados,
        meta_visitas: metaVisitas,
        real_visitas: totalVisitas,
        pdvs_con_precios: totalReportados,
        es_usuario_actual: false
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
    const agenteInfo = await executeQueryForMultipleUsers(
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
  const userId = req.user.id;

  try {

    // Obtener el agente_id del usuario logueado
    const miInfo = await executeQueryForMultipleUsers(
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
    const departamentos = await executeQueryForMultipleUsers(
      `SELECT DISTINCT departamento.id, departamento.descripcion
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE users.rol_id = 1 AND users.agente_id = ?
       ORDER BY departamento.descripcion`, [miAgenteId]
    );

    // Obtener todas las ciudades únicas de asesores de la empresa
    const ciudades = await executeQueryForMultipleUsers(
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
  }
});

/**
 * @route POST /api/mercadeo/test-email
 * @description Endpoint de prueba para verificar el envío de emails
 * @body {string} email - Email de destino para la prueba
 * @returns {Object} Resultado del envío de prueba
 * @access Mercadeo
 * @middleware authenticateToken, requireMercadeo
 */
router.post('/test-email', authenticateToken, requireMercadeo, async (req, res) => {
  const { email } = req.body;
  const { agente_id } = req.user;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email de destino es requerido'
    });
  }

  try {
    // ✅ USA POOL COMPARTIDO - NO crea conexión individual
    // Obtener información del usuario de mercadeo
    const mercadeoInfo = await executeQueryForMultipleUsers(
      `SELECT u.nombre, u.email 
       FROM usuarios u 
       WHERE u.agente_id = ?`,
      [agente_id]
    );

    const nombreMercadeo = mercadeoInfo.length > 0 ? mercadeoInfo[0].nombre : 'Equipo de Mercadeo';

    // Datos de prueba para el email
    const datosTest = {
      emailAsesor: email,
      nombreAsesor: 'Asesor de Prueba',
      registroId: 'TEST-001',
      nombrePdv: 'PDV de Prueba - Test Store',
      nuevoEstado: 2, // Aprobado para la prueba
      comentario: 'Este es un email de prueba del sistema de notificaciones automáticas.',
      nombreMercadeo: nombreMercadeo
    };

    const resultado = await enviarNotificacionCambioEstado(datosTest);

    res.json({
      success: resultado.success,
      message: resultado.success ? 
        'Email de prueba enviado correctamente' : 
        'Error al enviar email de prueba',
      detalles: resultado
    });

  } catch (error) {
    console.error('Error en test de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al probar email',
      error: error.message
    });
  }
});

/**
 * @route GET /api/mercadeo/verificar-email-config
 * @description Verifica que la configuración SMTP esté correcta
 * @returns {Object} Estado de la configuración
 * @access Mercadeo
 * @middleware authenticateToken, requireMercadeo
 */
router.get('/verificar-email-config', authenticateToken, requireMercadeo, async (req, res) => {
  try {
    const esValida = await verificarConfiguracionEmail();
    
    res.json({
      success: esValida,
      message: esValida ? 
        'Configuración de email válida' : 
        'Error en configuración de email',
      configuracion: {
        smtp_host: 'smtp.hostinger.com',
        smtp_port: '587',
        smtp_user: '***configurado*** (quemado en código)'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar configuración',
      error: error.message
    });
  }
});

/**
 * @route POST /api/mercadeo/probar-email
 * @description Endpoint simple para probar el envío de emails
 * @body {string} email - Email de destino
 * @returns {Object} Resultado del envío
 */
router.post('/probar-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email es requerido'
    });
  }

  try {
    const resultado = await enviarNotificacionCambioEstado({
      emailAsesor: email,
      nombreAsesor: 'Prueba Usuario',
      registroId: '12345',
      nombrePdv: 'PDV de Prueba',
      nuevoEstado: 2, // Aprobado
      comentario: 'Esta es una prueba del sistema de emails',
      nombreMercadeo: 'Sistema de Pruebas'
    });

    res.json({
      success: true,
      message: 'Email de prueba enviado correctamente',
      resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar email de prueba',
      error: error.message
    });
  }
});

// ========================================================================
// 📊 ENDPOINT PARA GENERAR REPORTE EXCEL DE IMPLEMENTACIONES Y VISITAS
// ========================================================================

/**
 * @route GET /api/mercadeo/implementaciones/excel
 * @description Genera reporte Excel completo de implementaciones y visitas para el territorio del mercadeo
 * @param {string} req.user.agente_id - ID del agente para filtrar territorio
 * @returns {File} Archivo Excel con dos hojas: Implementaciones y Visitas
 * 
 * Filtrado territorial:
 * - Solo datos de PDVs asignados al agente_id del usuario de mercadeo
 * - Todas las consultas están filtradas por territorio
 * 
 * Estructura del archivo:
 * - Hoja 1: Implementaciones (datos consolidados por PDV)
 * - Hoja 2: Visitas (historial detallado de registros)
 */
router.get('/implementaciones/excel', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  
  let workbook = null;
  
  try {
    // Logging para debug
    console.log('📊 Iniciando descarga de reporte de implementaciones...');
    console.log('👤 Usuario:', req.user?.email);
    console.log('🏢 Agente ID:', req.user?.agente_id);
  
    

    // Obtener agente_id del token para filtrado territorial
    const { agente_id } = req.user;
    
    if (!agente_id) {
      console.log('❌ Usuario sin agente_id asignado');
      return res.status(400).json({
        success: false,
        message: 'Usuario sin agente_id asignado. No se puede generar el reporte territorial.'
      });
    }

    // Query SQL optimizada para implementaciones - FILTRADO POR TERRITORIO
    const queryImplementaciones = `
      SELECT 
          a.descripcion AS agente,
          pv.codigo,
          pv.nit,
          pv.descripcion AS nombre_PDV,
          pv.direccion,
          pv.segmento,
          pv.ciudad,
          TRUNCATE(pv.meta_volumen,2) AS meta_volumen,
          d.descripcion AS departamento,
          u.name as Asesor,

          -- Total de compras redondeado a 2 decimales
          ROUND(
              COALESCE(pvi.compra_1,0) +
              COALESCE(pvi.compra_2,0) +
              COALESCE(pvi.compra_3,0) +
              COALESCE(pvi.compra_4,0) +
              COALESCE(pvi.compra_5,0)
          ,2) AS "Meta Volumen (TOTAL)",

          -- Galonaje vendido redondeado a 2 decimales
          ROUND(COALESCE(g.GalonajeVendido, 0),2) AS GalonajeVendido,

          -- Compras individuales
          COALESCE(pvi.compra_1, 0) AS compra_1,
          COALESCE(pvi.compra_2, 0) AS compra_2,
          COALESCE(pvi.compra_3, 0) AS compra_3,
          COALESCE(pvi.compra_4, 0) AS compra_4,
          COALESCE(pvi.compra_5, 0) AS compra_5,

          -- Implementaciones realizadas (autorizadas)
          COALESCE(impl.impl_1, 0) AS impl_1_realizada,
          COALESCE(impl.impl_2, 0) AS impl_2_realizada,
          COALESCE(impl.impl_3, 0) AS impl_3_realizada,
          COALESCE(impl.impl_4, 0) AS impl_4_realizada,
          COALESCE(impl.impl_5, 0) AS impl_5_realizada,

          -- Implementaciones no autorizadas
          COALESCE(impl.impl_1_no_autorizado, 0) AS impl_1_no_autorizado,
          COALESCE(impl.impl_2_no_autorizado, 0) AS impl_2_no_autorizado,
          COALESCE(impl.impl_3_no_autorizado, 0) AS impl_3_no_autorizado,
          COALESCE(impl.impl_4_no_autorizado, 0) AS impl_4_no_autorizado,
          COALESCE(impl.impl_5_no_autorizado, 0) AS impl_5_no_autorizado

      FROM puntos_venta pv
      LEFT JOIN depar_ciudades dc 
            ON dc.descripcion = pv.ciudad
      LEFT JOIN departamento d 
            ON d.id = dc.id_departamento
      LEFT JOIN puntos_venta__implementacion pvi 
            ON pvi.pdv_id = pv.id
      INNER JOIN agente a 
            ON a.id = pv.id_agente
      INNER JOIN users u 
            ON u.id = pv.user_id

      -- Galonaje vendido
      LEFT JOIN (
          SELECT 
              rs.pdv_id, 
              SUM(rp.conversion_galonaje) AS GalonajeVendido
          FROM registro_servicios rs
          INNER JOIN registro_productos rp 
                  ON rp.registro_id = rs.id
          WHERE rs.estado_id = 2 
            AND rs.estado_agente_id = 2   -- ✅ condición global
          GROUP BY rs.pdv_id
      ) g ON g.pdv_id = pv.id

      -- Implementaciones
      LEFT JOIN (
          SELECT 
              rs.pdv_id,
              -- Autorizadas (Si)
              SUM(CASE WHEN ri.nro_implementacion = 1 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) AS impl_1,
              SUM(CASE WHEN ri.nro_implementacion = 2 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) AS impl_2,
              SUM(CASE WHEN ri.nro_implementacion = 3 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) AS impl_3,
              SUM(CASE WHEN ri.nro_implementacion = 4 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) AS impl_4,
              SUM(CASE WHEN ri.nro_implementacion = 5 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) AS impl_5,

              -- No autorizadas (No)
              SUM(CASE WHEN ri.nro_implementacion = 1 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_1_no_autorizado,
              SUM(CASE WHEN ri.nro_implementacion = 2 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_2_no_autorizado,
              SUM(CASE WHEN ri.nro_implementacion = 3 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_3_no_autorizado,
              SUM(CASE WHEN ri.nro_implementacion = 4 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_4_no_autorizado,
              SUM(CASE WHEN ri.nro_implementacion = 5 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_5_no_autorizado
          FROM registro_servicios rs
          INNER JOIN registros_implementacion ri 
              ON ri.id_registro = rs.id
          WHERE rs.estado_id = 2 
            AND rs.estado_agente_id = 2   -- ✅ condición global
          GROUP BY rs.pdv_id
      ) impl ON impl.pdv_id = pv.id

      WHERE pv.id_agente = ?  -- ✅ FILTRO TERRITORIAL POR AGENTE_ID
      GROUP BY pv.codigo
      ORDER BY MAX(a.descripcion), MAX(pv.descripcion);
      `;

    // Query SQL para visitas con subconsultas para productos y fotos - FILTRADO POR TERRITORIO
    const queryVisitas = `
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
                GROUP_CONCAT(CONCAT("https://api.plandelamejorenergia.com", foto_factura)) AS fotos_factura,
                GROUP_CONCAT(CONCAT("https://api.plandelamejorenergia.com", foto_seguimiento)) AS fotos_seguimiento
            FROM registro_fotografico_servicios
            GROUP BY id_registro
        )
        SELECT 
            registro_servicios.id AS ID_Registro,
            agente.descripcion AS agente_comercial,
            puntos_venta.codigo,
            puntos_venta.nit,
            puntos_venta.descripcion AS nombre_pdv,
            puntos_venta.direccion,
            users.name,
            users.documento AS cedula,
            registro_servicios.fecha_registro,
            registro_servicios.created_at AS FechaCreacion,
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
            fa.fotos_seguimiento
            
        FROM registro_servicios
        INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
        INNER JOIN users ON users.id = registro_servicios.user_id
        INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
        INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
        INNER JOIN agente ON agente.id = puntos_venta.id_agente
        LEFT JOIN productos_agrupados pa ON pa.registro_id = registro_servicios.id
        LEFT JOIN fotos_agrupadas fa ON fa.id_registro = registro_servicios.id
        WHERE puntos_venta.id_agente = ? AND (registro_servicios.isImplementacion IS NULL OR registro_servicios.isImplementacion = 0)
        ORDER BY registro_servicios.id DESC;
    `;
    
    // Ejecutar consultas con filtro territorial
    const rawResultsImplementaciones = await executeQueryForMultipleUsers(queryImplementaciones, [agente_id]);
    console.log(`Implementaciones (Territorio ${agente_id}): ${rawResultsImplementaciones.length} registros`);

    const rawResultsVisitas = await executeQueryForMultipleUsers(queryVisitas, [agente_id]);
    console.log(`Visitas (Territorio ${agente_id}): ${rawResultsVisitas.length} registros`);

    if (rawResultsImplementaciones.length === 0 && rawResultsVisitas.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No se encontraron registros para generar el reporte de este territorio' 
      });
    }

    // Procesar datos para calcular estados de implementación
    const resultsImplementaciones = rawResultsImplementaciones.map((row, index) => {
      // Función auxiliar para determinar estado de implementación
      const getImplementacionStatus = (numeroImpl, galonaje, compraRequerida, implementacionRealizada, implementacionNoAutorizada) => {
        if (implementacionRealizada > 0) {
          return 'Realizada';
        } else if (implementacionNoAutorizada > 0) {
          return 'No Autorizo';
        } else if (galonaje >= compraRequerida) {
          return 'Pendiente';
        } else {
          return 'No Habilitado';
        }
      };

      // Calcular estados de cada implementación
      const impl1Status = getImplementacionStatus(1, row.GalonajeVendido, row.compra_1, row.impl_1_realizada, row.impl_1_no_autorizado);
      const impl2Status = getImplementacionStatus(2, row.GalonajeVendido, row.compra_2, row.impl_2_realizada, row.impl_2_no_autorizado);
      const impl3Status = getImplementacionStatus(3, row.GalonajeVendido, row.compra_3, row.impl_3_realizada, row.impl_3_no_autorizado);
      const impl4Status = getImplementacionStatus(4, row.GalonajeVendido, row.compra_4, row.impl_4_realizada, row.impl_4_no_autorizado);
      const impl5Status = getImplementacionStatus(5, row.GalonajeVendido, row.compra_5, row.impl_5_realizada, row.impl_5_no_autorizado);

      // Calcular total de implementaciones habilitadas (incluye Realizada, Pendiente y No Autorizo)
      const totalHabilitadas = [impl1Status, impl2Status, impl3Status, impl4Status, impl5Status]
        .filter(status => status === 'Realizada' || status === 'Pendiente' || status === 'No Autorizo').length;

      return {
        ...row,
        Total_Habilitadas: totalHabilitadas,
        Implementacion_1: impl1Status,
        Implementacion_2: impl2Status,
        Implementacion_3: impl3Status,
        Implementacion_4: impl4Status,
        Implementacion_5: impl5Status
      };
    });

    // Crear nuevo workbook con ExcelJS
    workbook = new ExcelJS.Workbook();
    
    // ========== HOJA 1: IMPLEMENTACIONES ==========
    let worksheetImplementaciones;
    
    // Intentar cargar plantilla si existe
    const templatePath = path.join(process.cwd(), 'config', 'Plantilla_Implementaciones.xlsx');
    
    try {
      if (fs.existsSync(templatePath)) {
        await workbook.xlsx.readFile(templatePath);
        worksheetImplementaciones = workbook.worksheets[0]; // Primera hoja
        worksheetImplementaciones.name = 'Implementaciones'; // Asegurar el nombre
        
        // Limpiar datos existentes (desde fila 5 en adelante)
        const maxRows = worksheetImplementaciones.rowCount;
        for (let i = 5; i <= maxRows; i++) {
          const row = worksheetImplementaciones.getRow(i);
          for (let j = 2; j <= 18; j++) { // Columnas B a R (expandido para más columnas)
            row.getCell(j).value = null;
          }
        }
      } else {
        worksheetImplementaciones = workbook.addWorksheet('Implementaciones');
      }
    } catch (templateError) {
      worksheetImplementaciones = workbook.addWorksheet('Implementaciones');
    }

    // ========== HOJA 2: VISITAS ==========
    let worksheetVisitas;
    
    // Buscar la hoja de Visitas existente en la plantilla
    worksheetVisitas = workbook.getWorksheet('Visitas');
    
    if (!worksheetVisitas) {
      // Si no existe la hoja Visitas, crearla
      worksheetVisitas = workbook.addWorksheet('Visitas');
    } else {
      // Limpiar datos existentes en la hoja de Visitas (desde fila 5 en adelante)
      const maxRowsVisitas = worksheetVisitas.rowCount;
      for (let i = 5; i <= maxRowsVisitas; i++) {
        const row = worksheetVisitas.getRow(i);
        for (let j = 2; j <= 25; j++) { // Columnas B a Y (expandido para visitas)
          row.getCell(j).value = null;
        }
      }
    }

    // ========== CONFIGURAR HOJA DE IMPLEMENTACIONES ==========
    
    // Definir headers para implementaciones
    const headersImplementaciones = [
      'Empresa', 'Código', 'nit', 'Nombre P.D.V', 'Dirección', 'Segmento', 'Ciudad', 'Departamento', 'Asesor', 'Meta Volumen (TOTAL)',
      'Galones Comprado','Cuantas implementaciones puede tener',
      'Primera implementación', 'Segunda implementación', 'Tercera implementación', 
      'Cuarta implementación', 'Quinta implementación'
    ];

    // Configurar la fila de headers (fila 4) para implementaciones
    const headerRowImplementaciones = worksheetImplementaciones.getRow(4);
    
    headersImplementaciones.forEach((header, index) => {
      const cell = headerRowImplementaciones.getCell(index + 2); // Empezar en columna B (índice 2)
      cell.value = header;
      
      // Aplicar estilo naranja al header
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E97132' } // Naranja
      };
      cell.font = {
        name: 'Calibri Light',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' } // Blanco
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '#E97132' } },
        left: { style: 'thin', color: { argb: '#E97132' } },
        bottom: { style: 'thin', color: { argb: '#E97132' } },
        right: { style: 'thin', color: { argb: '#E97132' } }
      };
    });

    // ========== CONFIGURAR HOJA DE VISITAS ==========
    
    // Verificar si la fila 4 ya tiene headers configurados
    const headerRowVisitas = worksheetVisitas.getRow(4);
    const primeracelda = headerRowVisitas.getCell(2).value;
    
    // Solo configurar headers si no existen ya en la plantilla
    if (!primeracelda || primeracelda === '') {
      
      // Definir headers para visitas
      const headersVisitas = [
        'Agente Comercial', 'Código', 'NIT', 'Nombre PDV', 'Dirección', 'Asesor', 'Cédula', 'ID_Registro',
        'Fecha Registro', 'Fecha Creación', 'Tipo Acción', 'Estado Backoffice', 'Estado Agente',
        'Observación Asesor', 'Observación Agente', 'Referencias', 'Presentaciones', 
        'Cantidad Cajas', 'Galonajes', 'Precios Sugeridos', 'Precios Reales', 
        'Fotos Factura', 'Fotos Seguimiento'
      ];

      // Configurar la fila de headers (fila 4) para visitas
      headersVisitas.forEach((header, index) => {
        const cell = headerRowVisitas.getCell(index + 2); // Empezar en columna B (índice 2)
        cell.value = header;
        
        // Aplicar estilo naranja al header
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E97132' } // Naranja
        };
        cell.font = {
          name: 'Calibri Light',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' } // Blanco
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: '#E97132' } },
          left: { style: 'thin', color: { argb: '#E97132' } },
          bottom: { style: 'thin', color: { argb: '#E97132' } },
          right: { style: 'thin', color: { argb: '#E97132' } }
        };
      });
    }

    // ========== FUNCIONES DE COLORES ==========
    
    // Función para obtener el color según el estado de implementación
    const getImplementacionColorFill = (estado) => {
      switch (estado) {
        case 'Realizada':
          return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF95DF8A' } }; // Verde #95DF8A
        case 'Pendiente':
          return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFDF84' } }; // Amarillo #EFDF84
        case 'No Habilitado':
        default:
          return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDA7683' } }; // Rosa #DA7683
      }
    };

    // Función para obtener el color según el estado de backoffice/agente
    const getEstadoColorFill = (estado) => {
      if (!estado) return null;
      
      const estadoLower = estado.toLowerCase();
      
      if (estadoLower.includes('revision') || estadoLower.includes('revisión')) {
        return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFDF84' } }; // Amarillo #EFDF84
      } else if (estadoLower.includes('aceptado') || estadoLower.includes('aprobado')) {
        return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF95DF8A' } }; // Verde #95DF8A
      } else if (estadoLower.includes('rechazado') || estadoLower.includes('rechazada')) {
        return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDA7683' } }; // Rosa/Rojo #DA7683
      }
      
      return null; // Sin color para otros estados
    };
    
    // ========== ESCRIBIR DATOS DE IMPLEMENTACIONES ==========
    let currentRowImplementaciones = 5;

    // Procesar en lotes para evitar problemas de memoria
    const batchSize = 100;
    for (let i = 0; i < resultsImplementaciones.length; i += batchSize) {
      const batch = resultsImplementaciones.slice(i, i + batchSize);
      
      batch.forEach((row, batchIndex) => {
        const dataRow = worksheetImplementaciones.getRow(currentRowImplementaciones + i + batchIndex);
        
        // Datos básicos de implementaciones
        const rowData = [
          row.agente || '',
          row.codigo || '',
          row.nit || '',
          row.nombre_PDV || '',
          row.direccion || '',
          row.segmento || '',
          row.ciudad || '',
          row.departamento || '',
          row.Asesor || '',
          row['meta_volumen'] || 0,
          row.GalonajeVendido || 0,
          row.Total_Habilitadas || 0,
          row.Implementacion_1 || 'No Habilitado',
          row.Implementacion_2 || 'No Habilitado',
          row.Implementacion_3 || 'No Habilitado',
          row.Implementacion_4 || 'No Habilitado',
          row.Implementacion_5 || 'No Habilitado'
        ];

        // Escribir cada celda con formato
        rowData.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 2); // Empezar en columna B
          cell.value = value;
          
          // Aplicar color de fondo si es columna de implementación (índices 12-16, que corresponden a las 5 implementaciones)
          if (colIndex >= 12 && colIndex <= 16) {
            cell.fill = getImplementacionColorFill(value);
          }
          
          // Fuente Calibri Light 10pt para todas las celdas
          cell.font = {
            name: 'Calibri Light',
            size: 10
          };
          
          // Bordes para todas las celdas con color #E97132
          cell.border = {
            top: { style: 'thin', color: { argb: '#E97132' } },
            left: { style: 'thin', color: { argb: '#E97132' } },
            bottom: { style: 'thin', color: { argb: '#E97132' } },
            right: { style: 'thin', color: { argb: '#E97132' } }
          };
          
          // Alineación
          if (typeof value === 'number') {
            cell.alignment = { horizontal: 'center' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }
        });
      });
      
      // Forzar garbage collection después de cada lote si está disponible
      if (global.gc) {
        global.gc();
      }
    }

    // ========== ESCRIBIR DATOS DE VISITAS ==========
    let currentRowVisitas = 5;

    // Procesar visitas en lotes para evitar problemas de memoria
    for (let i = 0; i < rawResultsVisitas.length; i += batchSize) {
      const batch = rawResultsVisitas.slice(i, i + batchSize);
      
      batch.forEach((row, batchIndex) => {
        const dataRow = worksheetVisitas.getRow(currentRowVisitas + i + batchIndex);
        
        // Datos básicos de visitas
        const rowData = [
          row.agente_comercial || '',
          row.codigo || '',
          row.nit || '',
          row.nombre_pdv || '',
          row.direccion || '',
          row.name || '', // Asesor
          row.cedula || '',
          row.ID_Registro || '',
          row.fecha_registro || '',
          row.FechaCreacion ? new Date(row.FechaCreacion).toLocaleDateString() : '',
          row.tipo_accion || '',
          row.estado_backoffice || '',
          row.estado_agente || '',
          row.observacion_asesor || '',
          row.observacion_agente || '',
          row.referencias || '',
          row.presentaciones || '',
          row.cantidades_cajas || '',
          row.galonajes || '',
          row.precios_sugeridos || '',
          row.precios_reales || '',
          row.fotos_factura || '',
          row.fotos_seguimiento || ''
        ];

        // Escribir cada celda con formato
        rowData.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 2); // Empezar en columna B
          cell.value = value;
          
          // Aplicar color de fondo para estados (columnas 10 y 11: Estado Backoffice y Estado Agente)
          if (colIndex === 11 || colIndex === 12) { // Estado Backoffice y Estado Agente
            const colorFill = getEstadoColorFill(value);
            if (colorFill) {
              cell.fill = colorFill;
            }
          }
          
          // Fuente Calibri Light 10pt para todas las celdas
          cell.font = {
            name: 'Calibri Light',
            size: 10
          };
          
          // Bordes para todas las celdas con color #E97132
          cell.border = {
            top: { style: 'thin', color: { argb: '#E97132' } },
            left: { style: 'thin', color: { argb: '#E97132' } },
            bottom: { style: 'thin', color: { argb: '#E97132' } },
            right: { style: 'thin', color: { argb: '#E97132' } }
          };
          
          // Alineación
          if (typeof value === 'number') {
            cell.alignment = { horizontal: 'center' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }
        });
      });
      
      // Forzar garbage collection después de cada lote si está disponible
      if (global.gc) {
        global.gc();
      }
    }
    
    // ========== AUTO-AJUSTAR COLUMNAS ==========
    
    // Auto-ajustar anchos SOLO de las columnas con datos en la hoja de Implementaciones (B a R)
    
    // Definir explícitamente las columnas que contienen datos para implementaciones
    const columnasImplementaciones = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
    
    // Función optimizada para calcular el ancho óptimo basado en el contenido
    const calculateColumnWidth = (worksheet, columnLetter, maxRow) => {
      const column = worksheet.getColumn(columnLetter);
      let maxWidth = 8; // Ancho mínimo
      
      // Solo revisar las filas que contienen datos (header + datos)
      const maxRowToCheck = Math.min(maxRow, worksheet.rowCount);
      
      for (let rowNumber = 4; rowNumber <= maxRowToCheck; rowNumber++) {
        const cell = worksheet.getCell(`${columnLetter}${rowNumber}`);
        if (cell.value) {
          const length = String(cell.value).length;
          maxWidth = Math.max(maxWidth, length);
        }
      }
      
      // Agregar padding y limitar el ancho máximo
      return Math.min(Math.max(maxWidth + 2, 8), 50);
    };

    // Aplicar auto-ajuste SOLO a las columnas que contienen datos de implementaciones
    columnasImplementaciones.forEach(columnLetter => {
      const autoWidth = calculateColumnWidth(worksheetImplementaciones, columnLetter, currentRowImplementaciones + resultsImplementaciones.length);
      const column = worksheetImplementaciones.getColumn(columnLetter);
      column.width = autoWidth;
    });
    
    // Auto-ajustar anchos SOLO de las columnas con datos en la hoja de Visitas (B a W)
    
    // Definir explícitamente las columnas que contienen datos para visitas
    const columnasVisitas = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'];
    
    // Aplicar auto-ajuste SOLO a las columnas que contienen datos de visitas
    columnasVisitas.forEach(columnLetter => {
      const autoWidth = calculateColumnWidth(worksheetVisitas, columnLetter, currentRowVisitas + rawResultsVisitas.length);
      const column = worksheetVisitas.getColumn(columnLetter);
      column.width = autoWidth;
    });
    
    // Generar archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Limpiar workbook de memoria
    workbook = null;
    
    // Forzar garbage collection si está disponible
    if (global.gc) {
      global.gc();
    }

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    const filename = `Reporte_Territorio_${agente_id}_${timestamp}.xlsx`;

    // Configurar headers de respuesta
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');
    res.setHeader('Last-Modified', new Date().toUTCString());

    // Enviar archivo
    res.end(buffer, 'binary');

  } catch (error) {
    console.error('❌ Error generando Excel de implementaciones (Mercadeo):', error);
    console.error('👤 Usuario afectado:', req.user?.email);
    console.error('🏢 Agente ID:', req.user?.agente_id);
    
    // Limpiar workbook en caso de error
    if (workbook) {
      workbook = null;
    }
    
    // Forzar garbage collection en caso de error
    if (global.gc) {
      global.gc();
    }
    
    if (res.headersSent) {
      return;
    }
    
    // Manejo específico de errores de token/autenticación
    if (error.name === 'JsonWebTokenError' || error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        error: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de implementaciones para este territorio',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Limpiar memoria final
    if (workbook) {
      workbook = null;
    }
  }
});

export default router;
