import express from 'express';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { getConnection } from '../db.js';
import { authenticateToken, requireOT, requireUsersAgente, logAccess } from '../middleware/auth.js';
import { applyUserFilters, addUserRestrictions, getUserAgentsByName, getUserRestrictions } from '../config/userPermissions.js';

const router = express.Router();

// Consulta básica de historial - CON RESTRICCIONES POR USUARIO
router.get('/historial-registros', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

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
    const [rows] = await conn.execute(query, params);

    res.json({
      success: true,
      data: rows,
      total: rows.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (err) {
    console.error('Error obteniendo historial de registros:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de registros',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Consulta de detalle - SIN RESTRICCIÓN de permisos
router.get('/registro-detalles/:registro_id', authenticateToken, requireOT, logAccess, async (req, res) => {
  const { registro_id } = req.params;

  console.log('Obteniendo detalles para registro ID:', registro_id);

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

    // Verificar que el registro existe
    const [registroCheck] = await conn.execute(
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
    
    const [detalles] = await conn.execute(queryDetalles, [registro_id]);
    
    console.log('Detalles obtenidos de la BD:', detalles);

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
    console.error('Error obteniendo detalles del registro:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del registro',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE COBERTURA GLOBAL PARA DASHBOARD OT
router.get('/cobertura', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

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
    const [pdvs] = await conn.execute(pdvsQuery, pdvsParams);

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
    const [implementados] = await conn.execute(implementadosQuery, implementadosParams);
    const implementadosSet = new Set(implementados.map(r => r.pdv_id));

    // Cálculo de puntos cobertura (más realista)
    const totalAsignados = pdvs.length;
    const totalImplementados = implementadosSet.size;
    const puntosCobertura = totalAsignados > 0 ? Math.round((totalImplementados / totalAsignados) * 100) : 0;

    // Asignar puntos individuales por PDV (máximo 5 puntos por PDV implementado)
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: implementadosSet.has(pdv.id) ? 'IMPLEMENTADO' : 'NO IMPLEMENTADO',
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
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE VOLUMEN GLOBAL PARA DASHBOARD OT
router.get('/volumen', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // Consulta base para meta total de volumen con filtros de usuario
    const baseMetaQuery = `
      SELECT SUM(pv.meta_volumen) as totalMeta 
      FROM puntos_venta pv
      LEFT JOIN agente ag ON ag.id = pv.id_agente
    `;
    // Filtrar por nombre de agente/empresa como se hacía antes en frontend
    const { query: metaQuery, params: metaParams } = await applyUserFilters(baseMetaQuery, req.user.id, '', null, 'name', 'ag.descripcion');
    const [metaResult] = await conn.execute(metaQuery, metaParams);
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
    const [realResult] = await conn.execute(realQuery, realParams);
    const totalReal = realResult[0]?.totalReal || 0;

    // Calcular puntos de volumen de forma más realista
    const puntosVolumen = Math.min(totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0, 100);

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
    const [pdvs] = await conn.execute(pdvsQuery, pdvsParams);

    // Calcular puntos individuales por PDV basado en cumplimiento de meta
    const pdvsConPuntos = pdvs.map(pdv => {
      const cumplimiento = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
      let puntos = 0;
      
      if (cumplimiento >= 100) puntos = 10;
      else if (cumplimiento >= 80) puntos = 8;
      else if (cumplimiento >= 60) puntos = 6;
      else if (cumplimiento >= 40) puntos = 4;
      else if (cumplimiento >= 20) puntos = 2;
      else if (cumplimiento > 0) puntos = 1;
      
      return {
        ...pdv,
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
    const [segmentos] = await conn.execute(segmentosQuery, segmentosParams);

    // Consulta base para detalle por producto con filtros de usuario
    const baseProductosQuery = `
      SELECT 
         rp.referencia_id AS nombre,
         COUNT(rp.id) AS numeroCajas,
         SUM(rp.conversion_galonaje) AS galonaje
       FROM registro_servicios rs
       INNER JOIN registro_productos rp ON rp.registro_id = rs.id
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2
       GROUP BY rp.referencia_id
       ORDER BY galonaje DESC
    `;
    const { query: productosQuery, params: productosParams } = await applyUserFilters(baseProductosQuery, req.user.id, 'pv');
    const [productos] = await conn.execute(productosQuery, productosParams);

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
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE VISITAS GLOBAL PARA DASHBOARD OT
router.get('/visitas', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // Consulta base para todos los PDVs del sistema con filtros de usuario
    const basePdvsQuery = `
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
    `;

    // Aplicar filtros de usuario según permisos
    const { query: pdvsQuery, params: pdvsParams } = await applyUserFilters(basePdvsQuery, req.user.id, 'pv');
    const [pdvsResult] = await conn.execute(pdvsQuery, pdvsParams);
    const totalPdvs = pdvsResult.length;
    
    // Meta de visitas: 20 por cada PDV filtrado
    const metaVisitas = totalPdvs * 20;
    
    // Consulta base para el número real de visitas con filtros de usuario
    const baseRealQuery = `
      SELECT COUNT(rs.id) as totalVisitas
       FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2
    `;
    
    // Aplicar filtros de usuario a las visitas
    const { query: realQuery, params: realParams } = await applyUserFilters(baseRealQuery, req.user.id, 'pv');
    const [realResult] = await conn.execute(realQuery, realParams);
    const totalVisitas = realResult[0]?.totalVisitas || 0;
    
    // Calcular puntos de visitas de forma más realista
    const puntosVisitas = Math.min(metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0, 100);
    
    // Consulta base para detalle de visitas por PDV con filtros de usuario
    const basePdvsDetalleQuery = `
      SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         u.name as asesor_nombre,
         u.email as asesor_email,
         u.id as asesor_id,
         ag.descripcion as compania,
         ag.id as agente_id,
         COUNT(rs.id) AS cantidadVisitas,
         20 AS meta
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.estado_id = 2 AND rs.estado_agente_id = 2
       GROUP BY pv.id, pv.codigo, pv.descripcion, u.name, u.email, u.id, ag.descripcion, ag.id
    `;
    
    // Aplicar filtros de usuario al detalle
    const { query: pdvsDetalleQuery, params: pdvsDetalleParams } = await applyUserFilters(basePdvsDetalleQuery, req.user.id, 'pv');
    const [pdvs] = await conn.execute(pdvsDetalleQuery, pdvsDetalleParams);
    
    // Calcular porcentaje de cumplimiento y puntos para cada PDV
    const pdvsDetalle = pdvs.map(pdv => {
      const porcentaje = pdv.meta > 0 ? Math.round((pdv.cantidadVisitas / pdv.meta) * 100) : 0;
      let puntos = 0;
      
      if (porcentaje >= 100) puntos = 10;
      else if (porcentaje >= 80) puntos = 8;
      else if (porcentaje >= 60) puntos = 6;
      else if (porcentaje >= 40) puntos = 4;
      else if (porcentaje >= 20) puntos = 2;
      else if (porcentaje > 0) puntos = 1;
      
      return {
        ...pdv,
        porcentaje,
        puntos
      };
    });
    
    // Consulta base para tipos de visita con filtros de usuario
    const baseTiposQuery = `
      SELECT 
         CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen/Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
         END AS tipo,
         COUNT(*) AS cantidad
       FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2
       GROUP BY tipo
    `;
    
    // Aplicar filtros de usuario a los tipos de visita
    const { query: tiposQuery, params: tiposParams } = await applyUserFilters(baseTiposQuery, req.user.id, 'pv');
    const [tiposVisita] = await conn.execute(tiposQuery, tiposParams);

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
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para consultar información de precios GLOBAL
router.get('/precios', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
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
    
    const [pdvs] = await conn.execute(applyUserFilters(basePdvQuery, req.userRestrictions));
    
    // 2. Obtener PDVs con al menos un reporte de precio (kpi_precio = 1) filtrados por usuario  
    const reportadosQuery = `SELECT DISTINCT rs.pdv_id
       FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       LEFT JOIN registros_mistery_shopper rms ON rms.id_registro_pdv = rs.id 
       WHERE rs.kpi_precio = 1 AND rms.id IS NOT NULL`;
    
    const [reportados] = await conn.execute(applyUserFilters(reportadosQuery, req.userRestrictions));
    const reportadosSet = new Set(reportados.map(r => r.pdv_id));

    // 3. Cálculo de puntos por precios (más realista)
    const totalAsignados = pdvs.length;
    const totalReportados = reportadosSet.size;
    const puntosPrecios = totalAsignados > 0 ? Math.round((totalReportados / totalAsignados) * 100) : 0;

    // 4. Asignar puntos individuales por PDV (5 puntos por PDV reportado)
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: reportadosSet.has(pdv.id) ? 'REPORTADOS' : 'NO REPORTADOS',
      puntos: reportadosSet.has(pdv.id) ? 5 : 0
    }));
    
    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalReportados,
      puntosPrecios,
      porcentaje: totalAsignados > 0 ? Math.round((totalReportados / totalAsignados) * 100) : 0
    });
    
  } catch (error) {
    console.error('Error al consultar datos de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar información de precios',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para consultar información de profundidad GLOBAL
router.get('/profundidad', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
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
    
    const [pdvs] = await conn.execute(applyUserFilters(basePdvQuery, req.userRestrictions));
    
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
    
    const [conProfundidadQuery] = await conn.execute(applyUserFilters(profundidadQuery, req.userRestrictions));
    
    const pdvsConProfundidad = new Set(conProfundidadQuery.map(r => r.pdv_id));
    
    // 3. Cálculo de puntos por profundidad (más realista)
    const totalAsignados = pdvs.length;
    const totalConProfundidad = pdvsConProfundidad.size;
    const puntosProfundidad = totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 100) : 0;

    // 4. Asignar puntos individuales por PDV (8 puntos por PDV con profundidad)
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: pdvsConProfundidad.has(pdv.id) ? 'REGISTRADO' : 'NO REGISTRADO',
      puntos: pdvsConProfundidad.has(pdv.id) ? 8 : 0
    }));
    
    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalConProfundidad,
      puntosProfundidad,
      porcentaje: totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 100) : 0
    });
    
  } catch (error) {
    console.error('Error al consultar datos de profundidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar información de profundidad',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener todos los asesores (users con rol = 1)
router.get('/asesores', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

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
    const [asesores] = await conn.execute(asesoresQuery, asesoresParams);

    res.json({
      success: true,
      data: asesores,
      total: asesores.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (error) {
    console.error('Error al obtener lista de asesores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de asesores',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener todos los agentes comerciales
router.get('/agentes-comerciales', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

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

    const [agentes] = await conn.execute(query, params);

    res.json({
      success: true,
      data: agentes,
      total: agentes.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (error) {
    console.error('Error al obtener lista de agentes comerciales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de agentes comerciales',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener todos los puntos de venta
router.get('/puntos-venta', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

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
    const [pdvs] = await conn.execute(pdvsQuery, pdvsParams);

    res.json({
      success: true,
      data: pdvs,
      total: pdvs.length,
      userRestrictions: req.userRestrictions // Para debugging
    });

  } catch (error) {
    console.error('Error al obtener lista de puntos de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de puntos de venta',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
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
    console.error('Error obteniendo permisos de usuario:', error);
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
    console.error('Error buscando agentes por nombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar agentes',
      error: error.message
    });
  }
});

router.get('/implementaciones/excel', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  let workbook = null;
  
  try {
    console.log('🚀 Iniciando generación de Excel con múltiples hojas (Implementaciones y Visitas)...');
    console.log('🧠 Memoria inicial:', process.memoryUsage());
    
    // Verificar que el usuario tenga el dominio permitido para descargar el reporte
    const userEmail = req.user?.email || '';
    const emailLowerCase = userEmail.toLowerCase();
    
    if (!emailLowerCase.includes('@bullmarketing.com.co')) {
      console.log(`❌ Acceso denegado para el usuario: ${userEmail}. Dominio no autorizado.`);
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo los usuarios con dominio @bullmarketing.com.co pueden descargar este reporte.'
      });
    }
    
    console.log(`✅ Acceso autorizado para el usuario: ${userEmail}`);
    
    conn = await getConnection();
    
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
            -- Implementaciones realizadas
            COALESCE(impl.impl_1, 0) AS impl_1_realizada,
            COALESCE(impl.impl_2, 0) AS impl_2_realizada,
            COALESCE(impl.impl_3, 0) AS impl_3_realizada,
            COALESCE(impl.impl_4, 0) AS impl_4_realizada,
            COALESCE(impl.impl_5, 0) AS impl_5_realizada
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
              AND rs.estado_agente_id = 2
            GROUP BY rs.pdv_id
        ) g ON g.pdv_id = pv.id
        -- Implementaciones
        LEFT JOIN (
            SELECT 
                rs.pdv_id,
                SUM(CASE WHEN ri.nro_implementacion = 1 THEN 1 ELSE 0 END) AS impl_1,
                SUM(CASE WHEN ri.nro_implementacion = 2 THEN 1 ELSE 0 END) AS impl_2,
                SUM(CASE WHEN ri.nro_implementacion = 3 THEN 1 ELSE 0 END) AS impl_3,
                SUM(CASE WHEN ri.nro_implementacion = 4 THEN 1 ELSE 0 END) AS impl_4,
                SUM(CASE WHEN ri.nro_implementacion = 5 THEN 1 ELSE 0 END) AS impl_5
            FROM registro_servicios rs
            INNER JOIN registros_implementacion ri 
                    ON ri.id_registro = rs.id
            GROUP BY rs.pdv_id
        ) impl ON impl.pdv_id = pv.id
        ORDER BY a.descripcion, pv.descripcion;
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
                GROUP_CONCAT(CONCAT("https://api.plandelamejorenergia.com/uploads/", foto_factura)) AS fotos_factura,
                GROUP_CONCAT(CONCAT("https://api.plandelamejorenergia.com/uploads/", foto_seguimiento)) AS fotos_seguimiento
            FROM registro_fotografico_servicios
            GROUP BY id_registro
        )
        SELECT 
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
                WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Visita'
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
      finalQueryImplementaciones = baseQueryImplementaciones.replace(
        'ORDER BY a.descripcion, pv.descripcion',
        `WHERE ${agenteFilter}\n      ORDER BY a.descripcion, pv.descripcion`
      );
      queryParamsImplementaciones = userRestrictions.agenteIds;
      console.log('🔒 [Excel Implementaciones] Aplicando filtro de usuario para agentes:', userRestrictions.agenteIds);
    } else {
      console.log('🔓 [Excel Implementaciones] Usuario sin restricciones - puede ver todos los datos');
    }
    
    // Ejecutar query de implementaciones
    const [rawResultsImplementaciones] = await conn.execute(finalQueryImplementaciones, queryParamsImplementaciones);
    console.log(`📊 Consulta Implementaciones ejecutada. Registros encontrados: ${rawResultsImplementaciones.length}`);

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
      console.log('🔒 [Excel Visitas] Aplicando filtro de usuario para agentes:', userRestrictions.agenteIds);
    } else {
      console.log('🔓 [Excel Visitas] Usuario sin restricciones - puede ver todos los datos');
    }
    
    // Ejecutar query de visitas
    const [rawResultsVisitas] = await conn.execute(finalQueryVisitas, queryParamsVisitas);
    console.log(`📊 Consulta Visitas ejecutada. Registros encontrados: ${rawResultsVisitas.length}`);

    if (rawResultsImplementaciones.length === 0 && rawResultsVisitas.length === 0) {
      console.log('⚠️ No se encontraron registros en la base de datos');
      return res.status(404).json({ 
        success: false,
        message: 'No se encontraron registros para generar el reporte' 
      });
    }

    // Procesar datos para calcular estados de implementación de manera eficiente
    console.log('🔄 Procesando estados de implementación...');
    console.log('🔍 DEBUG: Primeros 3 registros crudos:', rawResultsImplementaciones.slice(0, 3).map(row => ({
      codigo: row.codigo,
      GalonajeVendido: row.GalonajeVendido,
      compra_1: row.compra_1,
      compra_2: row.compra_2,
      impl_1_realizada: row.impl_1_realizada,
      impl_2_realizada: row.impl_2_realizada
    })));
    
    const resultsImplementaciones = rawResultsImplementaciones.map((row, index) => {
      // Función auxiliar para determinar estado de implementación
      const getImplementacionStatus = (numeroImpl, galonaje, compraRequerida, implementacionRealizada) => {
        // Solo hacer debug en los primeros 3 registros
        if (index < 3) {
          console.log(`🔍 PDV ${row.codigo} - Impl ${numeroImpl}: galonaje=${galonaje}, compraReq=${compraRequerida}, realizada=${implementacionRealizada}`);
        }
        if (implementacionRealizada > 0) {
          return 'Realizada';
        } else if (galonaje >= compraRequerida) {
          return 'Pendiente';
        } else {
          return 'No Habilitado';
        }
      };

      // Calcular estados de cada implementación
      const impl1Status = getImplementacionStatus(1, row.GalonajeVendido, row.compra_1, row.impl_1_realizada);
      const impl2Status = getImplementacionStatus(2, row.GalonajeVendido, row.compra_2, row.impl_2_realizada);
      const impl3Status = getImplementacionStatus(3, row.GalonajeVendido, row.compra_3, row.impl_3_realizada);
      const impl4Status = getImplementacionStatus(4, row.GalonajeVendido, row.compra_4, row.impl_4_realizada);
      const impl5Status = getImplementacionStatus(5, row.GalonajeVendido, row.compra_5, row.impl_5_realizada);

      // Calcular total de implementaciones habilitadas
      const totalHabilitadas = [impl1Status, impl2Status, impl3Status, impl4Status, impl5Status]
        .filter(status => status === 'Realizada' || status === 'Pendiente').length;

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

    console.log(`✅ Procesamiento completado. Total de registros procesados: ${resultsImplementaciones.length}`);
    console.log('🎯 DEBUG: Estados calculados en los primeros 3 registros:', resultsImplementaciones.slice(0, 3).map(row => ({
      codigo: row.codigo,
      Total_Habilitadas: row.Total_Habilitadas,
      Implementacion_1: row.Implementacion_1,
      Implementacion_2: row.Implementacion_2,
      Implementacion_3: row.Implementacion_3,
      Implementacion_4: row.Implementacion_4,
      Implementacion_5: row.Implementacion_5
    })));
    console.log('🧠 Memoria después del procesamiento:', process.memoryUsage());

    // Crear nuevo workbook con ExcelJS
    console.log('📋 Creando workbook con ExcelJS para múltiples hojas...');
    workbook = new ExcelJS.Workbook();
    
    // ========== HOJA 1: IMPLEMENTACIONES ==========
    console.log('📋 Creando hoja de Implementaciones...');
    let worksheetImplementaciones;
    
    // Intentar cargar plantilla si existe
    const templatePath = path.join(process.cwd(), 'config', 'Plantilla_Implementaciones.xlsx');
    
    try {
      if (fs.existsSync(templatePath)) {
        console.log('📋 Cargando plantilla desde:', templatePath);
        await workbook.xlsx.readFile(templatePath);
        worksheetImplementaciones = workbook.worksheets[0]; // Primera hoja
        worksheetImplementaciones.name = 'Implementaciones'; // Asegurar el nombre
        console.log('✅ Plantilla cargada exitosamente');
        
        // Limpiar datos existentes (desde fila 5 en adelante)
        console.log('🧹 Limpiando datos existentes de la plantilla...');
        const maxRows = worksheetImplementaciones.rowCount;
        for (let i = 5; i <= maxRows; i++) {
          const row = worksheetImplementaciones.getRow(i);
          for (let j = 2; j <= 18; j++) { // Columnas B a R (expandido para más columnas)
            row.getCell(j).value = null;
          }
        }
      } else {
        console.log('⚠️ Plantilla no encontrada, creando hoja nueva');
        worksheetImplementaciones = workbook.addWorksheet('Implementaciones');
      }
    } catch (templateError) {
      console.log('⚠️ Error cargando plantilla, creando hoja nueva:', templateError.message);
      worksheetImplementaciones = workbook.addWorksheet('Implementaciones');
    }

    // ========== HOJA 2: VISITAS ==========
    console.log('📋 Configurando hoja de Visitas existente...');
    let worksheetVisitas;
    
    // Buscar la hoja de Visitas existente en la plantilla
    worksheetVisitas = workbook.getWorksheet('Visitas');
    
    if (!worksheetVisitas) {
      // Si no existe la hoja Visitas, crearla
      console.log('⚠️ Hoja Visitas no encontrada en plantilla, creando nueva...');
      worksheetVisitas = workbook.addWorksheet('Visitas');
    } else {
      console.log('✅ Hoja Visitas encontrada en plantilla');
      
      // Limpiar datos existentes en la hoja de Visitas (desde fila 5 en adelante)
      console.log('🧹 Limpiando datos existentes de la hoja Visitas...');
      const maxRowsVisitas = worksheetVisitas.rowCount;
      for (let i = 5; i <= maxRowsVisitas; i++) {
        const row = worksheetVisitas.getRow(i);
        for (let j = 2; j <= 25; j++) { // Columnas B a Y (expandido para visitas)
          row.getCell(j).value = null;
        }
      }
    }

    // ========== CONFIGURAR HOJA DE IMPLEMENTACIONES ==========
    console.log('🎨 Configurando hoja de Implementaciones...');
    
    // Definir headers para implementaciones
    const headersImplementaciones = [
      'Empresa', 'Código', 'nit', 'Nombre P.D.V', 'Dirección', 'Segmento', 'Ciudad', 'Departamento', 'Asesor',
      'Galones Comprado', 'Meta Volumen (TOTAL)','Cuantas implementaciones puede tener',
      'Primera implementación', 'Segunda implementación', 'Tercera implementación', 
      'Cuarta implementación', 'Quinta implementación'
    ];

    // Configurar la fila de headers (fila 4) para implementaciones
    console.log('🎨 Configurando headers con formato naranja para Implementaciones...');
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
    console.log('🎨 Configurando hoja de Visitas...');
    
    // Verificar si la fila 4 ya tiene headers configurados
    const headerRowVisitas = worksheetVisitas.getRow(4);
    const primeracelda = headerRowVisitas.getCell(2).value;
    
    // Solo configurar headers si no existen ya en la plantilla
    if (!primeracelda || primeracelda === '') {
      console.log('🎨 Configurando headers para Visitas (no existen en plantilla)...');
      
      // Definir headers para visitas
      const headersVisitas = [
        'Agente Comercial', 'Código', 'NIT', 'Nombre PDV', 'Dirección', 'Asesor', 'Cédula', 
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
    } else {
      console.log('✅ Headers de Visitas ya existen en plantilla, reutilizando formato existente');
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
    console.log(`📝 Escribiendo ${resultsImplementaciones.length} registros de implementaciones con colores de semáforo...`);
    let currentRowImplementaciones = 5;

    // Procesar en lotes para evitar problemas de memoria
    const batchSize = 100;
    for (let i = 0; i < resultsImplementaciones.length; i += batchSize) {
      const batch = resultsImplementaciones.slice(i, i + batchSize);
      console.log(`📦 Procesando lote implementaciones ${Math.floor(i/batchSize) + 1}/${Math.ceil(resultsImplementaciones.length/batchSize)} (${batch.length} registros)`);
      
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
          row['Meta Volumen (TOTAL)'] || 0,
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
        console.log('🗑️ Garbage collection ejecutado');
      }
    }

    // ========== ESCRIBIR DATOS DE VISITAS ==========
    console.log(`📝 Escribiendo ${rawResultsVisitas.length} registros de visitas con semáforo de estados...`);
    let currentRowVisitas = 5;

    // Procesar visitas en lotes para evitar problemas de memoria
    for (let i = 0; i < rawResultsVisitas.length; i += batchSize) {
      const batch = rawResultsVisitas.slice(i, i + batchSize);
      console.log(`📦 Procesando lote visitas ${Math.floor(i/batchSize) + 1}/${Math.ceil(rawResultsVisitas.length/batchSize)} (${batch.length} registros)`);
      
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
          row.fecha_registro ? new Date(row.fecha_registro).toLocaleDateString() : '',
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
          if (colIndex === 10 || colIndex === 11) { // Estado Backoffice y Estado Agente
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
        console.log('🗑️ Garbage collection visitas ejecutado');
      }
    }
    // ========== AUTO-AJUSTAR COLUMNAS ==========
    
    // Auto-ajustar anchos SOLO de las columnas con datos en la hoja de Implementaciones (B a R)
    console.log('📐 Auto-ajustando anchos de columna para Implementaciones (B-R)...');
    
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
      console.log(`📏 Implementaciones Columna ${columnLetter}: ancho ajustado a ${autoWidth}`);
    });
    
    // Auto-ajustar anchos SOLO de las columnas con datos en la hoja de Visitas (B a W)
    console.log('📐 Auto-ajustando anchos de columna para Visitas (B-W)...');
    
    // Definir explícitamente las columnas que contienen datos para visitas
    const columnasVisitas = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
    
    // Aplicar auto-ajuste SOLO a las columnas que contienen datos de visitas
    columnasVisitas.forEach(columnLetter => {
      const autoWidth = calculateColumnWidth(worksheetVisitas, columnLetter, currentRowVisitas + rawResultsVisitas.length);
      const column = worksheetVisitas.getColumn(columnLetter);
      column.width = autoWidth;
      console.log(`📏 Visitas Columna ${columnLetter}: ancho ajustado a ${autoWidth}`);
    });
    
    console.log('✅ Auto-ajuste completado para ambas hojas');

    // Generar archivo Excel
    console.log('💾 Generando archivo Excel...');
    console.log('🧠 Memoria antes de generar buffer:', process.memoryUsage());
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log('🧠 Memoria después de generar buffer:', process.memoryUsage());
    
    // Limpiar workbook de memoria
    workbook = null;
    
    // Forzar garbage collection si está disponible
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection final ejecutado');
    }

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    const filename = `Reporte_Implementaciones_y_Visitas_${timestamp}.xlsx`;

    console.log(`📦 Archivo generado: ${filename} (${buffer.length} bytes)`);

    // Configurar headers de respuesta
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');
    res.setHeader('Last-Modified', new Date().toUTCString());

    console.log(`📤 Enviando archivo: ${filename} (${buffer.length} bytes)`);

    // Enviar archivo
    res.end(buffer, 'binary');

  } catch (error) {
    console.error('❌ Error generando Excel de implementaciones:', error);
    console.log('🧠 Memoria en error:', process.memoryUsage());
    
    // Limpiar workbook en caso de error
    if (workbook) {
      workbook = null;
    }
    
    // Forzar garbage collection en caso de error
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection de error ejecutado');
    }
    
    if (res.headersSent) {
      console.error('Headers ya enviados, no se puede cambiar la respuesta');
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de implementaciones',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (conn) conn.release();
    
    // Limpiar memoria final
    if (workbook) {
      workbook = null;
    }
    
    console.log('🧠 Memoria al finalizar:', process.memoryUsage());
  }
});
export default router;
