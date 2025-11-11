// ✅ ARCHIVO OPTIMIZADO PARA POOL COMPARTIDO
// ============================================
// - NO crea conexiones individuales por consulta
// - USA executeQueryForMultipleUsers() para consultas normales
// - USA executeQueryFast() para consultas rápidas
// - El pool de 50 conexiones se comparte entre TODOS los usuarios
// - NUNCA excede el límite de 500 conexiones/hora

import express from 'express';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { getConnection, executeQueryForMultipleUsers, executeQueryFast } from '../db.js';
import { authenticateToken, requireOT, requireUsersAgente, requireJefeZona, logAccess } from '../middleware/auth.js';
import { applyUserFilters, addUserRestrictions, getUserAgentsByName, getUserRestrictions } from '../config/userPermissions.js';
import { upload } from '../config/multer.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Consulta básica de historial - CON RESTRICCIONES POR USUARIO
router.get('/historial-registros', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // Consulta base sin filtros de usuario
    const baseQuery = `
      SELECT 
        registro_servicios.id,
        puntos_venta.codigo, 
        registro_servicios.fecha_registro, 
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_volumen = 1 THEN 'Implementacion'
            WHEN kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Visita'
            ELSE 'Otro'
        END AS tipo_accion,
        estado_id,
        estado_agente_id,
        users.name as nombre_asesor,
        users.email as email_asesor,
        puntos_venta.id_agente as agente_id
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = registro_servicios.user_id
      ORDER BY registro_servicios.fecha_registro DESC
    `;

    // Aplicar filtros de usuario según permisos
    const { query, params } = await applyUserFilters(baseQuery, req.user.id, 'puntos_venta');
    const rows = await executeQueryForMultipleUsers(query, params);

    res.json({
      success: true,
      data: rows,
      total: rows.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (err) {
    logger.error('Error obteniendo historial de registros:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de registros',
      error: err.message
    });
  }
});

// Consulta de detalle - SIN RESTRICCIÓN de permisos
router.get('/registro-detalles/:registro_id', authenticateToken, requireOT, logAccess, async (req, res) => {
  const { registro_id } = req.params;

  // logger.debug('Obteniendo detalles para registro ID:', registro_id); // Solo en debug

  // Validar que el registro_id es un número
  if (!registro_id || isNaN(registro_id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de registro inválido'
    });
  }

  try {

    // Verificar que el registro existe
    const registroCheck = await executeQueryForMultipleUsers(
      'SELECT id FROM registro_servicios WHERE id = ?',
      [registro_id]
    );

    if (registroCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
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
        GROUP_CONCAT(registro_productos.marca) AS marcas,
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
      WHERE registro_servicios.id = ?
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
        tipo_accion,
        e1.descripcion,
        e2.descripcion,
        registro_servicios.observacion,
        agente.descripcion,
        agente.nombre,
        agente.email,
        agente.telefono
    `;
    
    const detalles = await executeQueryForMultipleUsers(queryDetalles, [registro_id]);
    
    // logger.debug('Detalles obtenidos de la BD:', detalles); // Solo en debug cuando sea necesario

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
      // Información adicional del agente
      agente: registro.agente_descripcion ? {
        descripcion: registro.agente_descripcion,
        nombre: registro.agente_nombre,
        email: registro.agente_email,
        telefono: registro.agente_telefono
      } : null,
      // Totales calculados
      resumen: {
        total_cajas: registro.total_cajas || 0,
        total_galones: registro.total_galones || 0,
        valor_total_implementado: registro.valor_total_implementado || 0
      },
      // Información KPI estructurada
      kpis: {
        volumen: registro.kpi_volumen === 1,
        precio: registro.kpi_precio === 1,
        frecuencia: registro.kpi_frecuencia === 1
      }
    };

    // Asegurar que devolvemos JSON válido
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      data: datosCompletos
    });

  } catch (err) {
    logger.error('Error obteniendo detalles del registro:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del registro',
      error: err.message
    });
  }
});

// ENDPOINT DE COBERTURA GLOBAL PARA DASHBOARD OT
router.get('/cobertura', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // Consulta base para PDVs del sistema
    const basePdvsQuery = `
      SELECT 
        pv.id, 
        pv.codigo, 
        pv.descripcion AS nombre, 
        pv.direccion,
        u.name as asesor_nombre,
        u.email as asesor_email,
        ag.descripcion as compania,
        ag.id as agente_id,
        u.id as asesor_id,
        pv.id_agente
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
    `;

    // Aplicar filtros de usuario según permisos - filtrar por nombre de agente
    const { query: pdvsQuery, params: pdvsParams } = await applyUserFilters(basePdvsQuery, req.user.id, '', null, 'name', 'ag.descripcion');
    const pdvs = await executeQueryForMultipleUsers(pdvsQuery, pdvsParams);

    // Consulta base para registros implementados
    const baseImplementadosQuery = `
      SELECT DISTINCT rs.pdv_id
      FROM registro_servicios rs
      INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2
    `;

    // Aplicar filtros de usuario a los implementados - filtrar por nombre de agente
    const { query: implementadosQuery, params: implementadosParams } = await applyUserFilters(baseImplementadosQuery, req.user.id, '', null, 'name', 'ag.descripcion');
    const implementados = await executeQueryForMultipleUsers(implementadosQuery, implementadosParams);
    const implementadosSet = new Set(implementados.map(r => r.pdv_id));

    // Cálculo de puntos cobertura (más realista)
    const totalAsignados = pdvs.length;
    const totalImplementados = implementadosSet.size;
    // Matriz máxima de puntos para cobertura: 3.000
    const puntosCobertura = totalAsignados > 0 ? Math.round((totalImplementados / totalAsignados) * 3000) : 0;

    // Asignar puntos individuales por PDV (máximo 5 puntos por PDV implementado)
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: implementadosSet.has(pdv.id) ? 'REGISTRADO' : 'NO REGISTRADO',
      puntos: implementadosSet.has(pdv.id) ? 5 : 0
    }));

    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalImplementados,
      puntosCobertura,
      userRestrictions: req.userRestrictions // Para debugging
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener cobertura', error: err.message });
  }
});

// ENDPOINT DE VOLUMEN GLOBAL PARA DASHBOARD OT
router.get('/volumen', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // Consulta base para meta total de volumen con filtros de usuario
    const baseMetaQuery = `
      SELECT SUM(pv.meta_volumen) as totalMeta 
      FROM puntos_venta pv
      LEFT JOIN agente ag ON ag.id = pv.id_agente
    `;
    // Filtrar por nombre de agente/empresa como se hacía antes en frontend
    const { query: metaQuery, params: metaParams } = await applyUserFilters(baseMetaQuery, req.user.id, '', null, 'name', 'ag.descripcion');
    const metaResult = await executeQueryForMultipleUsers(metaQuery, metaParams);
    const totalMeta = metaResult[0]?.totalMeta || 0;

    // Consulta base para volumen real con filtros de usuario
    const baseRealQuery = `
      SELECT SUM(registro_productos.conversion_galonaje) as totalReal
      FROM registro_servicios
      INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      INNER JOIN puntos_venta pv ON pv.id = registro_servicios.pdv_id
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      WHERE registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2
    `;
    // Filtrar por nombre de agente/empresa como se hacía antes en frontend
    const { query: realQuery, params: realParams } = await applyUserFilters(baseRealQuery, req.user.id, '', null, 'name', 'ag.descripcion');
    const realResult = await executeQueryForMultipleUsers(realQuery, realParams);
    const totalReal = realResult[0]?.totalReal || 0;

  // Matriz máxima de puntos para volumen: 6.000
  const puntosVolumen = totalMeta > 0 ? Math.round((totalReal / totalMeta) * 6000) : 0;

    // Consulta base para detalle por PDV con información del asesor
    const basePdvsQuery = `
      SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         pv.segmento,
         pv.meta_volumen AS meta,
         u.name as asesor_nombre,
         u.email as asesor_email,
         u.id as asesor_id,
         ag.descripcion as compania,
         ag.id as agente_id,
         pv.id_agente,
         COALESCE(SUM(rp.conversion_galonaje), 0) AS \`real\`
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.estado_id = 2 AND rs.estado_agente_id = 2
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       GROUP BY pv.id, pv.codigo, pv.descripcion, pv.segmento, pv.meta_volumen, u.name, u.email, u.id, ag.descripcion, ag.id, pv.id_agente
    `;
    // Filtrar por nombre de agente/empresa como se hacía antes en frontend
    const { query: pdvsQuery, params: pdvsParams } = await applyUserFilters(basePdvsQuery, req.user.id, '', null, 'name', 'ag.descripcion');
    const pdvs = await executeQueryForMultipleUsers(pdvsQuery, pdvsParams);

    // Calcular puntos proporcionales por PDV (igual que asesor.js)
      // Sumar el cumplimiento total global (galonaje real / meta por PDV, máximo 1 por PDV)
      const cumplimientoTotalGlobal = pdvs.reduce((sum, pdv) => {
        const meta = pdv.meta || 0;
        const real = pdv.real || 0;
        return sum + (meta > 0 ? Math.min(real / meta, 1) : 0);
      }, 0);

      // Calcular puntos globales para cada PDV
      const puntosPorPDVGlobal = pdvs.length > 0 ? Math.floor(6000 / pdvs.length) : 0;

      // Asignar puntos proporcionales por PDV
      const pdvsConPuntos = pdvs.map(pdv => {
        const meta = pdv.meta || 0;
        const real = pdv.real || 0;
        const porcentaje = meta > 0 ? Math.round((real / meta) * 100) : 0;
        let puntos = 0;
        if (porcentaje >= 100) {
          puntos = puntosPorPDVGlobal;
        } else {
          puntos = Math.round((porcentaje / 100) * puntosPorPDVGlobal);
        }
        return {
          ...pdv,
          porcentaje,
          puntos
        };
      });

    // Consulta base para resumen por segmento con filtros de usuario
    const baseSegmentosQuery = `
      SELECT 
         pv.segmento,
         COUNT(DISTINCT pv.id) AS cantidadPdvs,
         COALESCE(SUM(rp.conversion_galonaje), 0) AS totalGalones
       FROM puntos_venta pv
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.estado_id = 2 AND rs.estado_agente_id = 2
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       GROUP BY pv.segmento
    `;
    const { query: segmentosQuery, params: segmentosParams } = await applyUserFilters(baseSegmentosQuery, req.user.id, 'pv');
    const segmentos = await executeQueryForMultipleUsers(segmentosQuery, segmentosParams);

    // Leer filtros de la UI
    const { compania, asesor_id, pdv_id } = req.query;

    // Construir condiciones y parámetros para el filtro
    let whereConditions = ['rs.estado_id = 2', 'rs.estado_agente_id = 2'];
    let queryParams = [];

    // Filtros por compañía
    if (compania) {
      const agenteInfo = await executeQueryForMultipleUsers('SELECT id FROM agente WHERE descripcion = ?', [compania]);
      if (agenteInfo.length > 0) {
        whereConditions.push('pv.id_agente = ?');
        queryParams.push(agenteInfo[0].id);
      }
    }
    // Filtro por asesor
    if (asesor_id) {
      whereConditions.push('u.id = ?');
      queryParams.push(asesor_id);
    }
    // Filtro por punto de venta
    if (pdv_id) {
      whereConditions.push('pv.id = ?');
      queryParams.push(pdv_id);
    }

    // Filtros de usuario (restricciones)
    const userRestrictions = req.userRestrictions;
    if (userRestrictions && userRestrictions.hasRestrictions && userRestrictions.agenteIds.length > 0) {
      const placeholders = userRestrictions.agenteIds.map(() => '?').join(',');
      whereConditions.push(`pv.id_agente IN (${placeholders})`);
      queryParams.push(...userRestrictions.agenteIds);
    }

    // Unir condiciones
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Consulta base para detalle por producto con filtros
    const productosQuery = `
      SELECT 
         rp.referencia_id AS nombre,
         COUNT(rp.id) AS numeroCajas,
         SUM(rp.conversion_galonaje) AS galonaje
       FROM registro_servicios rs
       INNER JOIN registro_productos rp ON rp.registro_id = rs.id
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       INNER JOIN users u ON u.id = pv.user_id
       ${whereClause}
       GROUP BY rp.referencia_id
       ORDER BY galonaje DESC
    `;
    const productos = await executeQueryForMultipleUsers(productosQuery, queryParams);

    // Calcular porcentajes para productos
    const totalGalonaje = productos.reduce((sum, p) => sum + p.galonaje, 0);
    productos.forEach(p => {
      p.porcentaje = totalGalonaje > 0 ? 
        Number(((p.galonaje / totalGalonaje) * 100).toFixed(1)) : 0;
    });

    res.json({
      success: true,
      pdvs: pdvsConPuntos,
      meta_volumen: totalMeta,
      real_volumen: totalReal,
      puntos: puntosVolumen,
      segmentos,
      productos,
      userRestrictions: req.userRestrictions // Para debugging
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de volumen', error: err.message });
  }
});

// ENDPOINT DE VISITAS GLOBAL PARA DASHBOARD OT
router.get('/visitas', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {
    // 1. Leer filtros de la UI
    const { compania, asesor_id, pdv_id } = req.query;

    // 2. Obtener restricciones del usuario (si las tiene)
    const userRestrictions = req.userRestrictions;

    // 3. Construir condiciones y parámetros de forma centralizada
    let whereConditions = [];
    let queryParams = [];

    // Aplicar restricciones de usuario primero (si existen)
    if (userRestrictions && userRestrictions.hasRestrictions && userRestrictions.agenteIds.length > 0) {
      const placeholders = userRestrictions.agenteIds.map(() => '?').join(',');
      whereConditions.push(`pv.id_agente IN (${placeholders})`);
      queryParams.push(...userRestrictions.agenteIds);
    }

    // Aplicar filtros de la UI
    if (compania) {
      // NOTA: El filtro de compañía ahora se maneja por id_agente para mayor precisión
      const agenteInfo = await executeQueryForMultipleUsers('SELECT id FROM agente WHERE descripcion = ?', [compania]);
      if (agenteInfo.length > 0) {
        whereConditions.push('pv.id_agente = ?');
        queryParams.push(agenteInfo[0].id);
      }
    }
    if (asesor_id) {
      whereConditions.push('u.id = ?');
      queryParams.push(asesor_id);
    }
    if (pdv_id) {
      whereConditions.push('pv.id = ?');
      queryParams.push(pdv_id);
    }

    // Unir todas las condiciones con 'AND'
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 4. Ejecutar consultas con la cláusula WHERE unificada

    // Consulta para PDVs (meta)
    const pdvsQuery = `
      SELECT 
        pv.id, 
        pv.codigo, 
        pv.descripcion AS nombre, 
        pv.direccion,
        u.name as asesor_nombre,
        u.email as asesor_email,
        u.id as asesor_id,
        ag.descripcion as compania,
        ag.id as agente_id
      FROM puntos_venta pv
      INNER JOIN users u ON u.id = pv.user_id
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      ${whereClause}
    `;
    const pdvs = await executeQueryForMultipleUsers(pdvsQuery, queryParams);
    const totalPdvs = pdvs.length;

    const metaVisitas = totalPdvs * 10;

    // Consulta para visitas reales - Solo una visita por PDV por día
    // CORREGIDO: Siempre aplicar filtro de estados, con o sin whereClause
    const whereClauseVisitas = whereClause 
      ? whereClause.replace('WHERE', 'WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2 AND')
      : 'WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2';
    
    const realQuery = `
      SELECT COUNT(DISTINCT CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro))) as totalVisitas
      FROM registro_servicios rs
      INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
      INNER JOIN users u ON u.id = pv.user_id
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      ${whereClauseVisitas}
    `;
    const realResult = await executeQueryForMultipleUsers(realQuery, queryParams);
    const totalVisitas = realResult[0]?.totalVisitas || 0;

    const puntosVisitas = metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 1000) : 0;

    // Consulta para detalle por PDV - Solo una visita por PDV por día
    const pdvsDetalleQuery = `
      SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         u.name as asesor_nombre,
         u.id as asesor_id,
         ag.descripcion as compania,
         ag.id as agente_id,
         COUNT(DISTINCT DATE(rs.fecha_registro)) AS cantidadVisitas,
         10 AS meta
      FROM puntos_venta pv
      INNER JOIN users u ON u.id = pv.user_id
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.estado_id = 2 AND rs.estado_agente_id = 2
      ${whereClause}
      GROUP BY pv.id, pv.codigo, pv.descripcion, u.name, u.id, ag.descripcion, ag.id
    `;
    const pdvsDetalleRaw = await executeQueryForMultipleUsers(pdvsDetalleQuery, queryParams);

    const puntosPorPDVGlobal = pdvsDetalleRaw.length > 0 ? Math.floor(1000 / pdvsDetalleRaw.length) : 0;
    const pdvsDetalle = pdvsDetalleRaw.map(pdv => {
      const meta = pdv.meta || 0;
      const real = pdv.cantidadVisitas || 0;
      const porcentaje = meta > 0 ? Math.round((real / meta) * 100) : 0;
      let puntos = 0;
      if (porcentaje >= 100) {
        puntos = puntosPorPDVGlobal;
      } else {
        puntos = Math.round((porcentaje / 100) * puntosPorPDVGlobal);
      }
      return {
        ...pdv,
        porcentaje,
        puntos
      };
    });

    // CORREGIDO: Aplicar filtro de estados también a tipos de visita
    const whereClauseTipos = whereClause 
      ? whereClause.replace('WHERE', 'WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2 AND')
      : 'WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2';
    
    const tiposQuery = `
      SELECT 
         CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen/Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
         END AS tipo,
         COUNT(DISTINCT CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro))) AS cantidad
      FROM registro_servicios rs
      INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
      INNER JOIN users u ON u.id = pv.user_id
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      ${whereClauseTipos}
      GROUP BY tipo
    `;
    const tiposVisita = await executeQueryForMultipleUsers(tiposQuery, queryParams);

    res.json({
      success: true,
      pdvs: pdvsDetalle,
      meta_visitas: metaVisitas,
      real_visitas: totalVisitas,
      puntos: puntosVisitas,
      porcentajeCumplimiento: metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0,
      tiposVisita,
      userRestrictions: req.userRestrictions // Para debugging
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de visitas', error: err.message });
  }
});

// Endpoint para consultar información de precios GLOBAL
router.get('/precios', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // 1. Obtener todos los PDVs del sistema filtrados por usuario
    const basePdvQuery = `SELECT 
        pv.id, 
        pv.codigo, 
        pv.descripcion AS nombre, 
        pv.direccion,
        u.name as asesor_nombre,
        u.email as asesor_email,
        u.id as asesor_id,
        ag.descripcion as compania,
        ag.id as agente_id
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente`;
    
    const { query: pdvsQuery, params: pdvsParams } = await applyUserFilters(basePdvQuery, req.user.id, 'pv');
    const pdvs = await executeQueryForMultipleUsers(pdvsQuery, pdvsParams);
    
    // 2. Obtener PDVs con al menos un reporte de precio (kpi_precio = 1) filtrados por usuario  
    const reportadosQuery = `SELECT DISTINCT rs.pdv_id
       FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       LEFT JOIN registros_mistery_shopper rms ON rms.id_registro_pdv = rs.id 
       WHERE rs.kpi_precio = 1 AND rms.id IS NOT NULL`;
    
    const { query: reportadosQueryFinal, params: reportadosParams } = await applyUserFilters(reportadosQuery, req.user.id, 'pv');
    const reportados = await executeQueryForMultipleUsers(reportadosQueryFinal, reportadosParams);
    const reportadosSet = new Set(reportados.map(r => r.pdv_id));

  // 3. Cálculo de puntos por precios (matriz máxima: 2.000)
  const totalAsignados = pdvs.length;
  const totalReportados = reportadosSet.size;
  const puntosPrecios = totalAsignados > 0 ? Math.round((totalReportados / totalAsignados) * 2000) : 0;

    // 4. Asignar puntos individuales por PDV proporcionalmente (igual que asesor.js)
    const puntosPorPDVGlobal = totalAsignados > 0 ? Math.floor(2000 / totalAsignados) : 0;
    const pdvsDetalle = pdvs.map(pdv => {
      const reportado = reportadosSet.has(pdv.id);
      let puntos = 0;
      if (reportado) {
        puntos = puntosPorPDVGlobal;
      }
      return {
        ...pdv,
        estado: reportado ? 'REPORTADOS' : 'NO REPORTADOS',
        puntos
      };
    });
    
    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalReportados,
      puntosPrecios,
      porcentaje: totalAsignados > 0 ? Math.round((totalReportados / totalAsignados) * 100) : 0
    });
    
  } catch (error) {
    logger.error('Error al consultar datos de precios:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al consultar información de precios',
      error: error.message
    });
  }
});

// Endpoint para consultar información de profundidad GLOBAL
router.get('/profundidad', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // 1. Obtener todos los PDVs del sistema filtrados por usuario
    const basePdvQuery = `SELECT 
        pv.id, 
        pv.codigo, 
        pv.descripcion AS nombre, 
        pv.direccion,
        u.name as asesor_nombre,
        u.email as asesor_email,
        u.id as asesor_id,
        ag.descripcion as compania,
        ag.id as agente_id
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente`;
    
    const { query: pdvsQuery2, params: pdvsParams2 } = await applyUserFilters(basePdvQuery, req.user.id, 'pv');
    const pdvs = await executeQueryForMultipleUsers(pdvsQuery2, pdvsParams2);
    
    // 2. Obtener PDVs con al menos una nueva referencia vendida filtrados por usuario
    const profundidadQuery = `SELECT 
          rs.pdv_id,
          COUNT(*) AS nuevas_referencias
       FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       LEFT JOIN portafolio_pdv pp 
          ON pp.pdv_id = rs.pdv_id AND pp.referencia_id = rp.referencia_id
       WHERE pp.referencia_id IS NULL
       GROUP BY rs.pdv_id
       HAVING nuevas_referencias > 0`;
    
    const { query: profundidadQueryFinal, params: profundidadParams } = await applyUserFilters(profundidadQuery, req.user.id, 'pv');
    const conProfundidadQuery = await executeQueryForMultipleUsers(profundidadQueryFinal, profundidadParams);
    
    const pdvsConProfundidad = new Set(conProfundidadQuery.map(r => r.pdv_id));
    
    // 3. Cálculo de puntos por profundidad (más realista)
    const totalAsignados = pdvs.length;
    const totalConProfundidad = pdvsConProfundidad.size;
    const puntosProfundidad = totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 100) : 0;

    // 4. Asignar puntos individuales por PDV proporcionalmente (igual que asesor.js)
    const puntosPorPDVGlobal = totalAsignados > 0 ? Math.floor(100 / totalAsignados) : 0;
    const pdvsDetalle = pdvs.map(pdv => {
      const tieneProfundidad = pdvsConProfundidad.has(pdv.id);
      let puntos = 0;
      if (tieneProfundidad) {
        puntos = puntosPorPDVGlobal;
      }
      return {
        ...pdv,
        estado: tieneProfundidad ? 'REGISTRADO' : 'NO REGISTRADO',
        puntos
      };
    });
    
    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalConProfundidad,
      puntosProfundidad,
      porcentaje: totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 100) : 0
    });
    
  } catch (error) {
    logger.error('Error al consultar datos de profundidad:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al consultar información de profundidad',
      error: error.message
    });
  }
});

// Endpoint para obtener todos los asesores (users con rol = 1)
router.get('/asesores', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // Consulta base para asesores con información de compañía
    const baseAsesoresQuery = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.created_at,
        u.updated_at,
        ag.descripcion as compania,
        pv.id_agente
       FROM users u
       LEFT JOIN puntos_venta pv ON pv.user_id = u.id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       WHERE u.rol_id = 1
       ORDER BY u.name
    `;

    // Aplicar filtros de usuario según permisos
    const { query: asesoresQuery, params: asesoresParams } = await applyUserFilters(baseAsesoresQuery, req.user.id, 'pv');
    const asesores = await executeQueryForMultipleUsers(asesoresQuery, asesoresParams);

    res.json({
      success: true,
      data: asesores,
      total: asesores.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (error) {
    logger.error('Error al obtener lista de asesores:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de asesores',
      error: error.message
    });
  }
});

// Endpoint para obtener todos los agentes comerciales
router.get('/agentes-comerciales', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // Consulta base para agentes comerciales
    const baseAgentesQuery = `
      SELECT 
        ag.id,
        ag.descripcion
       FROM agente ag
    `;

    // Aplicar filtros de usuario según permisos
    // Nota: Para agentes usamos el campo 'id' directamente, no 'id_agente'
    const restrictions = req.userRestrictions;
    let query = baseAgentesQuery;
    let params = [];

    if (restrictions && restrictions.hasRestrictions && restrictions.agenteIds && restrictions.agenteIds.length > 0) {
      const placeholders = restrictions.agenteIds.map(() => '?').join(',');
      query += ` WHERE ag.id IN (${placeholders})`;
      params = restrictions.agenteIds;
    }

    const agentes = await executeQueryForMultipleUsers(query, params);

    res.json({
      success: true,
      data: agentes,
      total: agentes.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (error) {
    logger.error('Error al obtener lista de agentes comerciales:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de agentes comerciales',
      error: error.message
    });
  }
});

// Endpoint para obtener todos los puntos de venta
router.get('/puntos-venta', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  try {

    // Consulta base para puntos de venta
    const basePdvsQuery = `
      SELECT 
        pv.id,
        pv.codigo,
        pv.descripcion as nombre,
        pv.direccion,
        pv.segmento,
        ag.descripcion as agente_descripcion,
        ag.descripcion as compania,
        u.name as asesor_nombre,
        u.id as asesor_id,
        ag.id as agente_id,
        pv.id_agente
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       ORDER BY pv.codigo
    `;

    // Aplicar filtros de usuario según permisos
    const { query: pdvsQuery, params: pdvsParams } = await applyUserFilters(basePdvsQuery, req.user.id, 'pv');
    const pdvs = await executeQueryForMultipleUsers(pdvsQuery, pdvsParams);

    res.json({
      success: true,
      data: pdvs,
      total: pdvs.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (error) {
    logger.error('Error al obtener lista de puntos de venta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de puntos de venta',
      error: error.message
    });
  }
});

// Nueva ruta para obtener permisos y agentes permitidos del usuario
router.get('/user-permissions', authenticateToken, requireOT, addUserRestrictions, async (req, res) => {
  try {
    const { getUserAllowedAgents } = await import('../config/userPermissions.js');
    const allowedAgents = await getUserAllowedAgents(req.user.id);

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        hasRestrictions: req.userRestrictions?.hasRestrictions || false,
        allowedAgents: allowedAgents,
        restrictedAgentIds: req.userRestrictions?.agenteIds || []
      }
    });

  } catch (error) {
    logger.error('Error obteniendo permisos de usuario:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos de usuario',
      error: error.message
    });
  }
});

// Buscar agentes por nombre - CON RESTRICCIONES POR USUARIO
router.get('/buscar-agentes', authenticateToken, requireOT, async (req, res) => {
  try {
    const { nombre } = req.query;
    
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "nombre" es requerido'
      });
    }

    const agentes = await getUserAgentsByName(req.user.id, nombre);

    res.json({
      success: true,
      data: agentes,
      total: agentes.length,
      searchTerm: nombre
    });

  } catch (error) {
    logger.error('Error buscando agentes por nombre:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al buscar agentes',
      error: error.message
    });
  }
});

router.get('/implementaciones/excel', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  
  let workbook = null;
  
  try {
    // Verificar que el usuario tenga el dominio permitido para descargar el reporte
    const userEmail = req.user?.email || '';
    const emailLowerCase = userEmail.toLowerCase();
    
    if (!emailLowerCase.includes('@bullmarketing.com.co')) {
      logger.security(`Acceso denegado para usuario: ${userEmail}. Dominio no autorizado.`);
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo los usuarios con dominio @bullmarketing.com.co pueden descargar este reporte.'
      });
    }

    // Query SQL optimizada para implementaciones
    const baseQueryImplementaciones = `
    SELECT 
      a.descripcion AS agente,
      pv.codigo,
      pv.nit,
      pv.descripcion AS nombre_PDV,
      pv.direccion,
      pv.segmento,
      pv.ciudad,
      TRUNCATE(pv.meta_volumen,2)AS meta_volumen,
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
      COALESCE(impl.impl_5_1, 0) AS impl_5_1_realizada,
      COALESCE(impl.impl_5_2, 0) AS impl_5_2_realizada,

      -- Implementaciones no autorizadas
      COALESCE(impl.impl_1_no_autorizado, 0) AS impl_1_no_autorizado,
      COALESCE(impl.impl_2_no_autorizado, 0) AS impl_2_no_autorizado,
      COALESCE(impl.impl_3_no_autorizado, 0) AS impl_3_no_autorizado,
      COALESCE(impl.impl_4_no_autorizado, 0) AS impl_4_no_autorizado,
      COALESCE(impl.impl_5_1_no_autorizado, 0) AS impl_5_1_no_autorizado,
      COALESCE(impl.impl_5_2_no_autorizado, 0) AS impl_5_2_no_autorizado

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

        -- Implementación 5 dividida en dos columnas
        CASE 
          WHEN SUM(CASE WHEN ri.nro_implementacion = 5 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) >= 1 
            THEN 1 ELSE 0 
        END AS impl_5_1,
        CASE 
          WHEN SUM(CASE WHEN ri.nro_implementacion = 5 AND ri.acepto_implementacion = 'Si' THEN 1 ELSE 0 END) >= 2 
            THEN 1 ELSE 0 
        END AS impl_5_2,

        -- No autorizadas (No)
        SUM(CASE WHEN ri.nro_implementacion = 1 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_1_no_autorizado,
        SUM(CASE WHEN ri.nro_implementacion = 2 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_2_no_autorizado,
        SUM(CASE WHEN ri.nro_implementacion = 3 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_3_no_autorizado,
        SUM(CASE WHEN ri.nro_implementacion = 4 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) AS impl_4_no_autorizado,
        CASE 
          WHEN SUM(CASE WHEN ri.nro_implementacion = 5 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) >= 1 
            THEN 1 ELSE 0 
        END AS impl_5_1_no_autorizado,
        CASE 
          WHEN SUM(CASE WHEN ri.nro_implementacion = 5 AND ri.acepto_implementacion = 'No' THEN 1 ELSE 0 END) >= 2 
            THEN 1 ELSE 0 
        END AS impl_5_2_no_autorizado
      FROM registro_servicios rs
      INNER JOIN registros_implementacion ri 
        ON ri.id_registro = rs.id
      WHERE rs.estado_id = 2 
      AND rs.estado_agente_id = 2   -- ✅ condición global
      GROUP BY rs.pdv_id
    ) impl ON impl.pdv_id = pv.id

    GROUP BY pv.codigo
    ORDER BY MAX(a.descripcion), MAX(pv.descripcion);
    `;

    // Query SQL para visitas con subconsultas para productos y fotos
    const baseQueryVisitas = `
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
        ORDER BY registro_servicios.id DESC;
    `;

    // Obtener restricciones de usuario para aplicarlas manualmente
    const userRestrictions = await getUserRestrictions(req.user.id);
    
    // ========== EJECUTAR CONSULTA DE IMPLEMENTACIONES ==========
    let finalQueryImplementaciones = baseQueryImplementaciones;
    let queryParamsImplementaciones = [];
    
    // Si el usuario tiene restricciones, agregar filtro WHERE
    if (userRestrictions && userRestrictions.hasRestrictions) {
      const agenteFilter = `pv.id_agente IN (${userRestrictions.agenteIds.map(() => '?').join(',')})`;
      // Agregar WHERE antes de GROUP BY - buscar el patrón exacto
      finalQueryImplementaciones = baseQueryImplementaciones.replace(
        'GROUP BY pv.codigo',
        `WHERE ${agenteFilter}\n    GROUP BY pv.codigo`
      );
      queryParamsImplementaciones = userRestrictions.agenteIds;
    }
    
    // Ejecutar query de implementaciones
    const rawResultsImplementaciones = await executeQueryForMultipleUsers(finalQueryImplementaciones, queryParamsImplementaciones);
    logger.metric(`Implementaciones: ${rawResultsImplementaciones.length} registros`);

    // ========== EJECUTAR CONSULTA DE VISITAS ==========
    let finalQueryVisitas = baseQueryVisitas;
    let queryParamsVisitas = [];
    
    // Si el usuario tiene restricciones, agregar filtro WHERE
    if (userRestrictions && userRestrictions.hasRestrictions) {
      const agenteFilter = `puntos_venta.id_agente IN (${userRestrictions.agenteIds.map(() => '?').join(',')})`;
      finalQueryVisitas = baseQueryVisitas.replace(
        'ORDER BY registro_servicios.id DESC',
        `WHERE ${agenteFilter}\n        ORDER BY registro_servicios.id DESC`
      );
      queryParamsVisitas = userRestrictions.agenteIds;
    }
    
    // Ejecutar query de visitas
    const rawResultsVisitas = await executeQueryForMultipleUsers(finalQueryVisitas, queryParamsVisitas);
    logger.metric(`Visitas: ${rawResultsVisitas.length} registros`);

    if (rawResultsImplementaciones.length === 0 && rawResultsVisitas.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No se encontraron registros para generar el reporte' 
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

      // --- Nueva lógica para Implementación 5 (dos columnas)
      let impl5_1 = 'No Habilitado';
      let impl5_2 = 'No Habilitado';
      const galonaje = row.GalonajeVendido;
      const compra5 = row.compra_5;
      const impl5_1_realizada = row.impl_5_1_realizada || 0;
      const impl5_2_realizada = row.impl_5_2_realizada || 0;
      const impl5_1_no_autorizado = row.impl_5_1_no_autorizado || 0;
      const impl5_2_no_autorizado = row.impl_5_2_no_autorizado || 0;

      if (galonaje < compra5) {
        impl5_1 = 'No Habilitado';
        impl5_2 = 'No Habilitado';
      } else {
        // Implementación 5_1
        if (impl5_1_realizada > 0) {
          impl5_1 = 'Realizada';
        } else if (impl5_1_no_autorizado > 0) {
          impl5_1 = 'No Autorizo';
        } else {
          impl5_1 = 'Pendiente';
        }
        // Implementación 5_2
        if (impl5_2_realizada > 0) {
          impl5_2 = 'Realizada';
        } else if (impl5_2_no_autorizado > 0) {
          impl5_2 = 'No Autorizo';
        } else {
          impl5_2 = 'Pendiente';
        }
      }

      // Calcular estados de las otras implementaciones
      const impl1Status = getImplementacionStatus(1, row.GalonajeVendido, row.compra_1, row.impl_1_realizada, row.impl_1_no_autorizado);
      const impl2Status = getImplementacionStatus(2, row.GalonajeVendido, row.compra_2, row.impl_2_realizada, row.impl_2_no_autorizado);
      const impl3Status = getImplementacionStatus(3, row.GalonajeVendido, row.compra_3, row.impl_3_realizada, row.impl_3_no_autorizado);
      const impl4Status = getImplementacionStatus(4, row.GalonajeVendido, row.compra_4, row.impl_4_realizada, row.impl_4_no_autorizado);

      // Calcular total de implementaciones habilitadas (incluye Realizada, Pendiente y No Autorizo)
      const totalHabilitadas = [impl1Status, impl2Status, impl3Status, impl4Status, impl5_1, impl5_2]
        .filter(status => status === 'Realizada' || status === 'Pendiente' || status === 'No Autorizo').length;

      return {
        ...row,
        Total_Habilitadas: totalHabilitadas,
        Implementacion_1: impl1Status,
        Implementacion_2: impl2Status,
        Implementacion_3: impl3Status,
        Implementacion_4: impl4Status,
        Implementacion_5_1: impl5_1,
        Implementacion_5_2: impl5_2
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
            const cell = row.getCell(j);
            cell.value = null;
            cell.fill = undefined;
            cell.font = undefined;
            cell.border = undefined;
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
          const cell = row.getCell(j);
          cell.value = null;
          cell.fill = undefined;
          cell.font = undefined;
          cell.border = undefined;
        }
      }
    }

    // ========== CONFIGURAR HOJA DE IMPLEMENTACIONES ==========
    
    // Definir headers para implementaciones
    const headersImplementaciones = [
      'Empresa', 'Código', 'nit', 'Nombre P.D.V', 'Dirección', 'Segmento', 'Ciudad', 'Departamento', 'Asesor', 'Meta Volumen (TOTAL)',
      'Galones Comprado','Cuantas implementaciones puede tener',
      'Primera implementación', 'Segunda implementación', 'Tercera implementación', 
      'Cuarta implementación', 'Quinta implementación 1', 'Quinta implementación 2'
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
          row.Implementacion_5_1 || 'No Habilitado',
          row.Implementacion_5_2 || 'No Habilitado'
        ];

        // Escribir cada celda con formato
        rowData.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 2); // Empezar en columna B
          cell.value = value;
          
          // Aplicar color de fondo si es columna de implementación (índices 12-17, que corresponden a las 6 implementaciones)
          if (colIndex >= 12 && colIndex <= 17) {
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
    
  // Definir explícitamente las columnas que contienen datos para implementaciones (ahora hasta S)
  const columnasImplementaciones = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
    
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
    const filename = `Reporte_Implementaciones_y_Visitas_${timestamp}.xlsx`;

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
    console.error('❌ Error generando Excel de implementaciones:', error);
    
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
    
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de implementaciones',
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

// ========================================================================
// 👨‍💼 ENDPOINTS PARA JEFE DE ZONA - FUNCIONALIDAD INTEGRADA
// ========================================================================
// 
// NOTA: Esta funcionalidad se integró aquí porque el rol "Jefe de Zona" 
// es conceptualmente parte de la "Organización Terpel" (OT).
// Anteriormente estaba en un archivo separado jefe-zona.js pero se 
// consolidó para simplificar la estructura de la API.
//
// Funcionalidades incluidas:
// - Gestión de PDVs asignados al Jefe de Zona
// - Registro de visitas de seguimiento 
// - Historial de visitas realizadas
// - Verificación de permisos de Jefe de Zona
// ========================================================================

// Obtener PDVs asignados al Jefe de Zona según su empresa
router.get('/jefe-zona/pdvs-asignados', authenticateToken, requireOT, requireJefeZona, logAccess, async (req, res) => {
  
  try {

    // Obtener las empresas asignadas al jefe de zona
    const agentesQuery = await executeQueryForMultipleUsers(`
      SELECT DISTINCT a.id as agente_id, a.descripcion as agente_nombre
      FROM users_agente ua
      INNER JOIN agente a ON a.id = ua.agente_id
      WHERE ua.user_id = ? AND ua.rol_terpel LIKE '%Jefe%'
    `, [req.user.id]);

    if (agentesQuery.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tiene empresas asignadas como Jefe de Zona'
      });
    }

    const agenteIds = agentesQuery.map(a => a.agente_id);
    const placeholders = agenteIds.map(() => '?').join(',');

    // Obtener todos los PDVs de las empresas asignadas
    const pdvs = await executeQueryForMultipleUsers(`
      SELECT 
        pv.id,
        pv.codigo,
        pv.descripcion as nombre,
        pv.direccion,
        pv.ciudad,
        pv.id_agente,
        a.descripcion as agente_nombre
      FROM puntos_venta pv
      INNER JOIN agente a ON a.id = pv.id_agente
      WHERE pv.id_agente IN (${placeholders})
      ORDER BY pv.codigo ASC
    `, agenteIds);

    res.json({
      success: true,
      data: {
        pdvs,
        empresas: agentesQuery,
        total_pdvs: pdvs.length,
        total_empresas: agentesQuery.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo PDVs del Jefe de Zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los puntos de venta asignados',
      error: error.message
    });
  }
});

// Obtener información específica de un PDV por código
router.get('/jefe-zona/pdv-info/:codigo', authenticateToken, requireOT, requireJefeZona, logAccess, async (req, res) => {
  const { codigo } = req.params;

  try {

    // Primero verificar que el PDV pertenece a las empresas del jefe de zona
    const agentesQuery = await executeQueryForMultipleUsers(`
      SELECT agente_id FROM users_agente 
      WHERE user_id = ? AND rol_terpel LIKE '%Jefe%'
    `, [req.user.id]);

    if (agentesQuery.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tiene empresas asignadas como Jefe de Zona'
      });
    }

    const agenteIds = agentesQuery.map(a => a.agente_id);
    const placeholders = agenteIds.map(() => '?').join(',');

    // Buscar el PDV por código dentro de las empresas permitidas
    const pdvQuery = await executeQueryForMultipleUsers(`
      SELECT 
        pv.id,
        pv.codigo,
        pv.descripcion as nombre,
        pv.direccion,
        pv.ciudad,
        pv.id_agente,
        a.descripcion as agente_nombre
      FROM puntos_venta pv
      INNER JOIN agente a ON a.id = pv.id_agente
      WHERE pv.codigo = ? AND pv.id_agente IN (${placeholders})
    `, [codigo, ...agenteIds]);

    if (pdvQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PDV no encontrado o no autorizado para este usuario'
      });
    }

    res.json({
      success: true,
      data: pdvQuery[0]
    });

  } catch (error) {
    console.error('Error obteniendo información del PDV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del PDV',
      error: error.message
    });
  }
});

// Registrar visita de seguimiento por Jefe de Zona
router.post('/jefe-zona/registrar-visita', 
  authenticateToken, 
  requireOT, 
  requireJefeZona, 
  upload.single('foto_seguimiento'),
  logAccess, 
  async (req, res) => {
    const { codigo_pdv, fecha } = req.body;

    try {
      // Validaciones básicas
      if (!codigo_pdv || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'Código PDV y fecha son requeridos'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'La foto de seguimiento es requerida'
        });
      }

      // Verificar que el PDV pertenece a las empresas del jefe de zona
      const agentesQuery = await executeQueryForMultipleUsers(`
        SELECT agente_id FROM users_agente 
        WHERE user_id = ? AND rol_terpel LIKE '%Jefe%'
      `, [req.user.id]);

      if (agentesQuery.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tiene empresas asignadas como Jefe de Zona'
        });
      }

      const agenteIds = agentesQuery.map(a => a.agente_id);
      const placeholders = agenteIds.map(() => '?').join(',');

      // Buscar el PDV
      const pdvQuery = await executeQueryForMultipleUsers(`
        SELECT id, codigo, descripcion 
        FROM puntos_venta 
        WHERE codigo = ? AND id_agente IN (${placeholders})
      `, [codigo_pdv, ...agenteIds]);

      if (pdvQuery.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'PDV no encontrado o no autorizado'
        });
      }

      const pdv = pdvQuery[0];

      // Preparar la ruta de la imagen
      const fotoPath = req.file.path.replace(/\\/g, '/');
      const fotoUrl = fotoPath.replace('uploads/', '');

      // Insertar el registro de visita
      const result = await executeQueryForMultipleUsers(`
        INSERT INTO registro_visitas_jefe_zona (
          user_id,
          pdv_id,
          codigo_pdv,
          fecha_visita,
          foto_seguimiento,
          fecha_registro,
          estado
        ) VALUES (?, ?, ?, ?, ?, NOW(), 'activo')
      `, [
        req.user.id,
        pdv.id,
        codigo_pdv,
        fecha,
        fotoUrl
      ]);

      res.json({
        success: true,
        message: 'Visita registrada exitosamente',
        data: {
          id: result.insertId,
          codigo_pdv,
          nombre_pdv: pdv.descripcion,
          fecha_visita: fecha,
          foto_seguimiento: fotoUrl
        }
      });

    } catch (error) {
      console.error('Error registrando visita:', error);
      
      // Eliminar archivo subido si hay error
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error eliminando archivo:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar la visita',
        error: error.message
      });
  }
  }
);

// Obtener historial de visitas del Jefe de Zona
router.get('/jefe-zona/historial-visitas', authenticateToken, requireOT, requireJefeZona, logAccess, async (req, res) => {
  const { fecha_inicio, fecha_fin, codigo_pdv } = req.query;
  const user_id = req.user.id; // Obtener el ID del usuario logueado

  try {

    // Construir query dinámico con filtro obligatorio por user_id
    let whereClause = 'WHERE rv.user_id = ?';
    let queryParams = [user_id];

    // Agregar filtros opcionales
    if (fecha_inicio) {
      whereClause += ' AND DATE(rv.fecha_registro) >= ?';
      queryParams.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereClause += ' AND DATE(rv.fecha_registro) <= ?';
      queryParams.push(fecha_fin);
    }

    if (codigo_pdv) {
      whereClause += ' AND pv.codigo = ?';
      queryParams.push(codigo_pdv);
    }

    const query = `
      SELECT 
        rv.id,
        pv.codigo as codigo_pdv,
        rv.foto_seguimiento,
        rv.fecha_registro,
        rv.fecha_registro as fecha_visita,
        pv.descripcion as nombre_pdv,
        pv.direccion,
        pv.ciudad,
        a.descripcion as agente_nombre,
        rv.user_id,
        rv.created_at
      FROM registro_servicios_jfz rv
      INNER JOIN puntos_venta pv ON pv.id = rv.pdv_id
      INNER JOIN agente a ON a.id = pv.id_agente
      ${whereClause}
      ORDER BY rv.fecha_registro DESC
    `;

    const visitas = await executeQueryForMultipleUsers(query, queryParams);

    res.json({
      success: true,
      data: visitas,
      total: visitas.length,
      user_id: user_id // Para debugging
    });

  } catch (error) {
    console.error('Error obteniendo historial de visitas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de visitas',
      error: error.message
    });
  }
});

// Verificar si el usuario es Jefe de Zona
router.get('/jefe-zona/verificar-jefe-zona', authenticateToken, requireOT, logAccess, async (req, res) => {
  
  try {

    const rows = await executeQueryForMultipleUsers(`
      SELECT 
        ua.rol_terpel,
        ua.agente_id,
        a.descripcion as agente_nombre
      FROM users_agente ua
      INNER JOIN agente a ON a.id = ua.agente_id
      WHERE ua.user_id = ?
    `, [req.user.id]);

    const esJefeZona = rows.some(row => row.rol_terpel && row.rol_terpel.includes('JEFE DE ZONA'));
    const empresasAsignadas = rows.filter(row => row.rol_terpel && row.rol_terpel.includes('JEFE DE ZONA'));

    res.json({
      success: true,
      data: {
        esJefeZona,
        empresasAsignadas,
        totalEmpresas: empresasAsignadas.length
      }
    });

  } catch (error) {
    console.error('Error verificando Jefe de Zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado de Jefe de Zona',
      error: error.message
    });
  }
});

export default router;