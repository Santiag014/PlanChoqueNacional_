import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';
import XLSX from 'xlsx';

const router = express.Router();

// ========================================================================
// 📊 ENDPOINTS PARA DASHBOARD ASESOR - MÉTRICAS PRINCIPALES
// ========================================================================

// ENDPOINT DE COBERTURA REAL PARA DASHBOARD ASESOR
router.get('/cobertura/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  let conn;
  try {
    conn = await getConnection();

    // Total de PDVs asignados al asesor
    const [pdvs] = await conn.execute(
      `SELECT id, codigo, descripcion AS nombre, direccion
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );

    // PDVs con al menos un registro en registro_servicios
    const [implementados] = await conn.execute(
      `SELECT DISTINCT pdv_id
         FROM registro_servicios
         WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [user_id]
    );
    const implementadosSet = new Set(implementados.map(r => r.pdv_id));

    // Cálculo de puntos cobertura
    const totalAsignados = pdvs.length;
    const totalImplementados = implementadosSet.size;
    const puntosCobertura = totalAsignados > 0 ? Math.round((totalImplementados / totalAsignados) * 150) : 0;

    // Asignar puntos individuales por PDV (ejemplo: 150 puntos repartidos entre los implementados)
    const puntosPorPDV = totalImplementados > 0 ? Math.floor(150 / totalAsignados) : 0;
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: implementadosSet.has(pdv.id) ? 'IMPLEMENTADO' : 'NO IMPLEMENTADO',
      puntos: implementadosSet.has(pdv.id) ? puntosPorPDV : 0
    }));

    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalImplementados,
      puntosCobertura
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener cobertura', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE VOLUMEN PARA DASHBOARD ASESOR
router.get('/volumen/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  let conn;
  try {
    conn = await getConnection();

    // Obtener la meta total de volumen (suma de meta_volumen de los PDVs del usuario)
    const [metaResult] = await conn.execute(
      `SELECT SUM(meta_volumen) as totalMeta 
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );
    const totalMeta = metaResult[0]?.totalMeta || 0;

    // Obtener el volumen real total (suma de conversion_galonaje)
    const [realResult] = await conn.execute(
      `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
       FROM registro_servicios
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id AND registro_servicios.user_id = ? AND registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`, [user_id]
    );
    const totalReal = realResult[0]?.totalReal || 0;

    // Obtener los puntos de volumen (id_kpi = 1 para volumen)
    const [puntosResult] = await conn.execute(
      `SELECT SUM(registro_puntos.puntos) as totalPuntos
       FROM registro_servicios
       INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
       WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 1 AND (registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2)`, [user_id]
    );
    const puntosVolumen = puntosResult[0]?.totalPuntos || 0;

    // Obtener detalle por PDV
    const [pdvs] = await conn.execute(
      `SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         pv.segmento,
         pv.meta_volumen AS meta,
         COALESCE(SUM(rp.conversion_galonaje), 0) AS \`real\`,
         COALESCE(SUM(rpt.puntos), 0) AS puntos
       FROM puntos_venta pv
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ? and (rs.estado_id = 2 AND rs.estado_agente_id = 2)
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       LEFT JOIN registro_puntos rpt ON rpt.id_visita = rs.id AND rpt.id_kpi = 1
       WHERE pv.user_id = ?
       GROUP BY pv.id, pv.codigo, pv.descripcion, pv.segmento, pv.meta_volumen`,
      [user_id, user_id]
    );

    // Obtener resumen por segmento
    const [segmentos] = await conn.execute(
      `SELECT 
         pv.segmento,
         COUNT(DISTINCT pv.id) AS cantidadPdvs,
         COALESCE(SUM(rp.conversion_galonaje), 0) AS totalGalones
       FROM puntos_venta pv
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ? AND(rs.estado_id = 2 AND rs.estado_agente_id = 2)
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       WHERE pv.user_id = ? 
       GROUP BY pv.segmento`,
      [user_id, user_id]
    );

    // Obtener detalle por producto (usando referencia_id)
    const [productos] = await conn.execute(
      `SELECT 
         rp.referencia_id AS nombre,
         COUNT(rp.id) AS numeroCajas,
         SUM(rp.conversion_galonaje) AS galonaje
       FROM registro_servicios rs
       INNER JOIN registro_productos rp ON rp.registro_id = rs.id
       WHERE rs.user_id = ? AND(rs.estado_id = 2 AND rs.estado_agente_id = 2)
       GROUP BY rp.referencia_id
       ORDER BY galonaje DESC`,
      [user_id]
    );

    // Calcular porcentajes para productos
    const totalGalonaje = productos.reduce((sum, p) => sum + p.galonaje, 0);
    productos.forEach(p => {
      p.porcentaje = totalGalonaje > 0 ? 
        Number(((p.galonaje / totalGalonaje) * 100).toFixed(1)) : 0;
    });

    res.json({
      success: true,
      pdvs,
      meta_volumen: totalMeta,
      real_volumen: totalReal,
      puntos: puntosVolumen,
      segmentos,
      productos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de volumen', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE VISITAS PARA DASHBOARD ASESOR
router.get('/visitas/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  let conn;
  try {
    conn = await getConnection();

    // Obtener todos los PDVs asignados al asesor
    const [pdvsResult] = await conn.execute(
      `SELECT id, codigo, descripcion AS nombre, direccion
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );
    const totalPdvs = pdvsResult.length;
    
    // Meta de visitas: 20 por cada PDV
    const metaVisitas = totalPdvs * 20;
    
    // Obtener el número real de visitas (registro_servicios)
    const [realResult] = await conn.execute(
      `SELECT COUNT(id) as totalVisitas
       FROM registro_servicios
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [user_id]
    );
    const totalVisitas = realResult[0]?.totalVisitas || 0;
    
    // Obtener los puntos de visitas (id_kpi = 3 para visitas/frecuencia)
    const [puntosResult] = await conn.execute(
      `SELECT SUM(registro_puntos.puntos) as totalPuntos
       FROM registro_servicios
       INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id AND registro_puntos.id_kpi = 3 AND (registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2)
       WHERE registro_servicios.user_id = ?`, [user_id]
    );
    const puntosVisitas = puntosResult[0]?.totalPuntos || 0;
    
    // Obtener detalle de visitas por PDV
    const [pdvs] = await conn.execute(
      `SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         COUNT(rs.id) AS cantidadVisitas,
         20 AS meta,
         COALESCE(SUM(rpt.puntos), 0) AS puntos
       FROM puntos_venta pv
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
       LEFT JOIN registro_puntos rpt ON rpt.id_visita = rs.id AND rpt.id_kpi = 3
       WHERE pv.user_id = ? 
       GROUP BY pv.id, pv.codigo, pv.descripcion`,
      [user_id, user_id]
    );
    
    // Calcular porcentaje de cumplimiento para cada PDV
    const pdvsDetalle = pdvs.map(pdv => {
      const porcentaje = pdv.meta > 0 ? Math.round((pdv.cantidadVisitas / pdv.meta) * 100) : 0;
      return {
        ...pdv,
        porcentaje
      };
    });
    
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
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2
       GROUP BY tipo`,
      [user_id]
    );

    res.json({
      success: true,
      pdvs: pdvsDetalle,
      meta_visitas: metaVisitas,
      real_visitas: totalVisitas,
      puntos: puntosVisitas,
      porcentajeCumplimiento: metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0,
      tiposVisita
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de visitas', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE PRECIOS PARA DASHBOARD ASESOR
router.get('/precios/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // 1. Obtener todos los PDVs asignados al asesor (igual que en cobertura)
    const [pdvs] = await conn.execute(
      `SELECT id, codigo, descripcion AS nombre, direccion
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );
    
    // 2. Obtener PDVs con al menos un reporte de precio (kpi_precio = 1)
    const [reportados] = await conn.execute(
      `SELECT DISTINCT pdv_id
       FROM registro_servicios
        LEFT JOIN registros_mistery_shopper 
          ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id
       WHERE user_id = ? AND kpi_precio = 1 AND registros_mistery_shopper.id IS NOT NULL`, [user_id]
    );
    const reportadosSet = new Set(reportados.map(r => r.pdv_id));

    // 3. Cálculo de puntos por precios (similar a cobertura)
    const totalAsignados = pdvs.length;
    const totalReportados = reportadosSet.size;
    const puntosPrecios = totalAsignados > 0 ? Math.round((totalReportados / totalAsignados) * 150) : 0;

    // 4. Asignar puntos individuales por PDV
    const puntosPorPDV = totalReportados > 0 ? Math.floor(150 / totalAsignados) : 0;
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: reportadosSet.has(pdv.id) ? 'REPORTADOS' : 'NO REPORTADOS',
      puntos: reportadosSet.has(pdv.id) ? puntosPorPDV : 0
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

// ========================================================================
// 📋 ENDPOINTS DE HISTORIAL Y CONSULTAS BÁSICAS
// ========================================================================

// HISTORIAL BÁSICO DE REGISTROS DEL ASESOR
router.get('/historial-registros-asesor/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Consulta básica solicitada
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
        registro_servicios.fecha_registro,
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
    LEFT JOIN productos_agrupados pa ON pa.registro_id = registro_servicios.id
    LEFT JOIN fotos_agrupadas fa ON fa.id_registro = registro_servicios.id
    LEFT JOIN implementacion_agrupada ia ON ia.id_registro = registro_servicios.id

    WHERE registro_servicios.user_id = ?;
    `;
    const [rows] = await conn.execute(query, [user_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
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

// RESULTADOS ESPECÍFICOS DE AUDITORÍAS (MYSTERY SHOPPER)
router.get('/resultados-auditorias/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Consulta específica para auditorias (registros con kpi_precio = 1)
    const query = `
      SELECT 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.segmento,
        users.name AS nombre_usuario,
        users.email AS email_usuario,
        registro_servicios.fecha_registro,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,

        CASE
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_accion,

        -- Si no hay registro asociado, el estado será 1 (En Revisión)
        IFNULL(registros_mistery_shopper.id_estado, 1) AS estado_mystery,

        -- Si no hay hallazgo registrado, mostrar 'Ninguno'
        IFNULL(registros_mistery_shopper.hallazgo, 'Ninguno') AS hallazgo,

        registro_servicios.observacion,

        -- Información de productos
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales

      FROM registro_servicios

      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = puntos_venta.user_id

      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id

      LEFT JOIN registros_mistery_shopper 
          ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id

      WHERE registro_servicios.kpi_precio = 1 AND registro_servicios.user_id = ?

      GROUP BY
          registro_servicios.id,
          registro_servicios.user_id,
          puntos_venta.codigo,
          puntos_venta.descripcion,
          puntos_venta.direccion,
          puntos_venta.segmento,
          users.name,
          users.email,
          registro_servicios.fecha_registro,
          registro_servicios.kpi_volumen,
          registro_servicios.kpi_precio,
          registro_servicios.kpi_frecuencia,
          tipo_accion,
          estado_mystery,
          hallazgo,
          registro_servicios.observacion

      ORDER BY
          registro_servicios.fecha_registro DESC,
          registro_servicios.created_at DESC
    `;

    const [rows] = await conn.execute(query, [user_id]);

    // Procesar datos para incluir información adicional de auditorias
    const datosProcessados = rows.map(row => {
      // Procesar fotos en formato de array si hay datos
      const fotos = [];
      if (row.fotos_pop) {
        const fotosArray = row.fotos_pop.split(',');
        fotosArray.forEach(foto => {
          if (foto.trim()) {
            fotos.push({
              ruta_archivo: foto.trim(),
              tipo: 'foto_pop'
            });
          }
        });
      }

      // Procesar productos en formato de array si hay datos
      const productos = [];
      if (row.referencias) {
        const referencias = row.referencias.split(',');
        const presentaciones = row.presentaciones ? row.presentaciones.split(',') : [];
        const preciosSugeridos = row.precios_sugeridos ? row.precios_sugeridos.split(',') : [];
        const preciosReales = row.precios_reales ? row.precios_reales.split(',') : [];

        referencias.forEach((ref, index) => {
          productos.push({
            referencia: ref.trim(),
            presentacion: presentaciones[index] ? presentaciones[index].trim() : 'N/A',
            precio_sugerido: preciosSugeridos[index] ? preciosSugeridos[index].trim() : 'N/A',
            precio_real: preciosReales[index] ? preciosReales[index].trim() : 'N/A'
          });
        });
      }

      return {
        ...row,
        fotos,
        productos,
        estado: row.estado_mystery === 1 ? 'En Revisión' : 
                row.estado_mystery === 2 ? 'Aprobado' : 
                row.estado_mystery === 3 ? 'Rechazado' : 'En Revisión',
        estado_agente: row.hallazgo !== 'Ninguno' ? 'Con Hallazgos' : 'Sin Hallazgos'
      };
    });

    res.json({
      success: true,
      data: datosProcessados,
      total: datosProcessados.length
    });

  } catch (err) {
    console.error('Error obteniendo resultados de auditorias:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resultados de auditorias',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ========================================================================
// 📊 ENDPOINTS DE EXPORTACIÓN A EXCEL - REPORTES DETALLADOS
// ========================================================================

// HISTORIAL COMPLETO DE VISITAS - EXPORTACIÓN A EXCEL
router.get('/historial-visitas/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Consulta completa combinando historial de visitas con detalles completos (basada en registro-detalles)
    const query = `
      SELECT 
      rs.id,
      rs.user_id,
      pv.codigo,
      pv.descripcion,
      pv.direccion,
      pv.coordenadas,
      pv.segmento,
      pv.meta_volumen,
      u.name AS nombre_usuario,
      u.email AS email_usuario,
      rs.fecha_registro,
      rs.created_at,
      rs.updated_at,
      rs.kpi_volumen,
      rs.kpi_precio,
      rs.kpi_frecuencia,
      CASE
          WHEN rs.kpi_volumen = 1 AND rs.kpi_precio = 1 THEN 'Volumen / Precio'
          WHEN rs.kpi_volumen = 1 THEN 'Volumen'
          WHEN rs.kpi_precio = 1 THEN 'Precio'
          WHEN rs.kpi_frecuencia = 1 AND rs.kpi_precio = 0 AND rs.kpi_volumen = 0 THEN 'Frecuencia'
          ELSE 'Otro'
      END AS tipo_accion,
      e1.descripcion AS estado_backoffice,
      e2.descripcion AS estado_agente,
      rs.observacion AS observacion_asesor,
      rs.observacion_agente AS observacion_agente,

      -- Subconsulta: Información de productos
      (
          SELECT GROUP_CONCAT(rp.referencia_id)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS referencias,
      (
          SELECT GROUP_CONCAT(rp.presentacion)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS presentaciones,
      (
          SELECT GROUP_CONCAT(rp.cantidad_cajas)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS cantidades_cajas,
      (
          SELECT GROUP_CONCAT(rp.conversion_galonaje)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS galones,
      (
          SELECT GROUP_CONCAT(rp.precio_sugerido)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS precios_sugeridos,
      (
          SELECT GROUP_CONCAT(rp.precio_real)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS precios_reales,

      -- Subconsulta: Totales
      (
          SELECT SUM(rp.cantidad_cajas)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS total_cajas,
      (
          SELECT SUM(rp.conversion_galonaje)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS total_galones,
      (
          SELECT SUM(rp.precio_real * rp.cantidad_cajas)
          FROM registro_productos rp
          WHERE rp.registro_id = rs.id
      ) AS valor_total_implementado,

      -- Subconsulta: Información fotográfica
      (
          SELECT GROUP_CONCAT(rf.foto_factura)
          FROM registro_fotografico_servicios rf
          WHERE rf.id_registro = rs.id
      ) AS fotos_factura,
      (
          SELECT GROUP_CONCAT(rf.foto_pop)
          FROM registro_fotografico_servicios rf
          WHERE rf.id_registro = rs.id
      ) AS fotos_pop,
      (
          SELECT GROUP_CONCAT(rf.foto_seguimiento)
          FROM registro_fotografico_servicios rf
          WHERE rf.id_registro = rs.id
      ) AS fotos_seguimiento,

      -- Subconsulta: Puntos obtenidos
      (
          SELECT COALESCE(SUM(rp.puntos), 0)
          FROM registro_puntos rp
          WHERE rp.id_visita = rs.id
      ) AS puntos_obtenidos

  FROM registro_servicios rs
  INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
  INNER JOIN users u ON u.id = pv.user_id
  INNER JOIN estados e1 ON e1.id = rs.estado_id
  INNER JOIN estados e2 ON e2.id = rs.estado_agente_id
  WHERE registro_servicios.user_id = ?
  ORDER BY rs.fecha_registro DESC, rs.created_at DESC;
    `;

    const [rows] = await conn.execute(query, [user_id]);

    // Procesar datos para coordenadas
    const datosProcessados = rows.map(row => {
      let lat = null, lng = null;
      if (row.coordenadas) {
        const coordenadas = row.coordenadas.split(',');
        if (coordenadas.length === 2) {
          lat = parseFloat(coordenadas[0].trim());
          lng = parseFloat(coordenadas[1].trim());
        }
      }

      return {
        ...row,
        latitud: lat,
        longitud: lng,
        // Procesar KPIs como texto legible
        kpi_volumen_activo: row.kpi_volumen === 1 ? 'Sí' : 'No',
        kpi_precio_activo: row.kpi_precio === 1 ? 'Sí' : 'No',
        kpi_frecuencia_activo: row.kpi_frecuencia === 1 ? 'Sí' : 'No',
        // Formatear fechas
        fecha_hora_creacion: row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
        fecha_hora_actualizacion: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A'
      };
    });

    // Generar respuesta con formato Excel
    
    // Crear el workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar datos para Excel con nombres de columnas más descriptivos
    const excelData = datosProcessados.map(row => ({
      'Código PDV': row.codigo,
      'Nombre PDV': row.descripcion,
      'Dirección': row.direccion,
      'Segmento': row.segmento,
      'Meta Volumen': row.meta_volumen,
      'Asesor': row.nombre_usuario,
      'Email Asesor': row.email_usuario,
      'Fecha Visita': row.fecha_registro,
      'Fecha/Hora Creación': row.fecha_hora_creacion,
      'Tipo Acción': row.tipo_accion,
      'Estado BackOffice': row.estado_backoffice,
      'Estado Agente': row.estado_agente,
      'Observaciones Asesor': row.observacion_asesor || 'Sin observaciones',
      'Observaciones Agente': row.observacion_agente || 'Sin observaciones',
      'Referencias Productos': row.referencias,
      'Presentaciones': row.presentaciones,
      'Cantidades Cajas': row.cantidades_cajas,
      'Conversión Galones': row.galones,
      'Precios Sugeridos': row.precios_sugeridos,
      'Precios Reales': row.precios_reales,
      'Fotos Factura': row.fotos_factura,
      'Fotos POP': row.fotos_pop,
      'Fotos Seguimiento': row.fotos_seguimiento
    }));
    
    // Crear la hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Historial de Visitas');
    
    // Generar el buffer del archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Configurar headers para descarga
    const fechaActual = new Date().toISOString().split('T')[0];
    const fileName = `historial_visitas_${user_id}_${fechaActual}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Enviar el archivo Excel
    res.send(excelBuffer);

  } catch (err) {
    console.error('Error generando Excel de historial de visitas:', err);
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel de historial de visitas',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ========================================================================
// 📋 ENDPOINT PARA CONSULTAR PRECIO SUGERIDO DE REFERENCIA
// ========================================================================

// Endpoint para consultar precio sugerido por referencia y presentación
router.get('/precio-sugerido/:referencia/:presentacion', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { referencia, presentacion } = req.params;

  if (!referencia || !presentacion) {
    return res.status(400).json({
      success: false,
      message: 'Referencia y presentación son requeridos'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Consulta para obtener el precio sugerido según referencia y presentación
    const query = `
      SELECT 
        referencias.descripcion,
        referencias_productos.presentacion,
        referencias_productos.precio_sugerido
      FROM referencias
      INNER JOIN referencias_productos ON referencias_productos.referencia_id = referencias.id
      WHERE referencias.descripcion = ? AND referencias_productos.presentacion = ?
      LIMIT 1
    `;
    
    const [resultado] = await conn.execute(query, [referencia, presentacion]);

    if (resultado.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró precio sugerido para esta referencia y presentación'
      });
    }

    const precioInfo = resultado[0];

    res.json({
      success: true,
      data: {
        referencia: precioInfo.descripcion,
        presentacion: precioInfo.presentacion,
        precio_sugerido: precioInfo.precio_sugerido
      }
    });

  } catch (err) {
    console.error('Error consultando precio sugerido:', err);
    res.status(500).json({
      success: false,
      message: 'Error al consultar precio sugerido',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ========================================================================
//  ENDPOINTS PARA RANKING 
// ========================================================================

// ENDPOINT PARA RANKING DE ASESORES DE MI EMPRESA
router.get('/ranking-mi-empresa', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const userId = req.user.id; // Obtenido del token

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

    // Obtener todos los asesores de la empresa (role_id = 1 y mismo agente_id) con información geográfica
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
         WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 1 AND (registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2)`, [asesor.id]
      );

      // Puntos por KPI 2 (Precios) - igual que en mis-puntos-totales
      const [puntosPrecios] = await conn.execute(
        `SELECT SUM(registro_puntos.puntos) as totalPuntos
         FROM registro_servicios
         INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
         WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 2 AND (registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2)`, [asesor.id]
      );

      // Puntos por KPI 3 (Visitas/Frecuencia) - igual que en mis-puntos-totales
      const [puntosVisitas] = await conn.execute(
        `SELECT SUM(registro_puntos.puntos) as totalPuntos
         FROM registro_servicios
         INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
         WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 3 AND (registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2)`, [asesor.id]
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
        es_usuario_actual: asesor.id == userId
      });
    }

    // Ordenar por total de puntos (mayor a menor)
    rankingDetallado.sort((a, b) => b.total_puntos - a.total_puntos);

    // Agregar posiciones
    rankingDetallado.forEach((asesor, index) => {
      asesor.posicion = index + 1;
    });

    // Encontrar la posición del usuario actual
    const posicionUsuario = rankingDetallado.find(a => a.id == userId);

    // Obtener información del agente/empresa
    const [agenteInfo] = await conn.execute(
      `SELECT name as nombre_agente FROM users WHERE id = ?`, [miAgenteId]
    );

    res.json({
      success: true,
      ranking: rankingDetallado,
      mi_posicion: posicionUsuario ? posicionUsuario.posicion : null,
      mi_info: posicionUsuario || null,
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

// ENDPOINT PARA OBTENER OPCIONES DE FILTROS GEOGRÁFICOS DEL RANKING
router.get('/ranking-filtros', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const userId = req.user.id;

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

// ========================================================================
//  ENDPOINTS PARA OBTENER PRESENTACIONES DE REFERENCIAS
// ========================================================================

router.get('/presentaciones-referencia/:referenciaDescripcion', async (req, res) => {
  let conn;
  try {
    const { referenciaDescripcion } = req.params;
    
    console.log('🔍 Consultando presentaciones para referencia:', referenciaDescripcion);

    conn = await getConnection();

    const query = `
      SELECT 
        referencias.descripcion as referencia_descripcion,
        referencias_productos.presentacion, 
        referencias_productos.conversion_galonaje 
      FROM referencias_productos	
      INNER JOIN referencias ON referencias_productos.referencia_id = referencias.id
      WHERE referencias.descripcion = ?
      ORDER BY referencias_productos.presentacion
    `;

    const [results] = await conn.execute(query, [referenciaDescripcion]);

    console.log('📋 Resultados encontrados:', results);

    if (results.length === 0) {
      return res.json({
        success: true,
        message: 'No se encontraron presentaciones para esta referencia',
        data: []
      });
    }

    res.json({
      success: true,
      data: results,
      referencia: referenciaDescripcion,
      total_presentaciones: results.length
    });

  } catch (error) {
    console.error('❌ Error al consultar presentaciones-referencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ========================================================================
// 📋 ENDPOINTS DE LA SECCIÓN IMPLEMENTACION PUNTO DE VENTA
// ========================================================================

// ENDPOINT DE GALONAJE POR PDV PARA IMPLEMENTACIONES
router.get('/galonaje-implementacion/:codigo_pdv', async (req, res) => {
  const { codigo_pdv } = req.params;
  let conn;

  try {
    conn = await getConnection();

    // 1. Obtener el pdv_id y segmento a partir del codigo_pdv
    const [pdvResult] = await conn.execute(
      `SELECT id, segmento, descripcion
       FROM puntos_venta 
       WHERE codigo = ?`,
      [codigo_pdv]
    );

    if (pdvResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PDV no encontrado para el usuario especificado'
      });
    }

    const pdv_id = pdvResult[0].id;
    const segmento = pdvResult[0].segmento;
    const descripcion = pdvResult[0].descripcion;

    // 2. Obtener el galonaje real total
    const [realResult] = await conn.execute(
      `SELECT SUM(registro_productos.conversion_galonaje) AS totalReal
       FROM registro_servicios
       INNER JOIN registro_productos 
         ON registro_productos.registro_id = registro_servicios.id
       WHERE registro_servicios.pdv_id = ?
         AND registro_servicios.estado_id = 2
         AND registro_servicios.estado_agente_id = 2`,
      [pdv_id]
    );

    const totalReal = realResult[0]?.totalReal || 0;

    // 3. Obtener las metas de compras
    const [comprasResult] = await conn.execute(
      `SELECT compra_1, compra_2, compra_3, compra_4, compra_5
       FROM puntos_venta__implementacion
       WHERE pdv_id = ?`,
      [pdv_id]
    );

    
    // 4. Verificar qué implementaciones están realizadas y validadas 
    const [implementacionResult] = await conn.execute(
      `SELECT DISTINCT(registros_implementacion.nro_implementacion) FROM registro_servicios
       INNER JOIN registros_implementacion ON registros_implementacion.id_registro = registro_servicios.id
       WHERE registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2 AND registro_servicios.pdv_id = ?`,
      [pdv_id]
    );

    // Obtener array de implementaciones completadas
    const implementacionesCompletadas = implementacionResult.map(row => row.nro_implementacion);

    const compras = comprasResult[0] || {
      compra_1: 0,
      compra_2: 0,
      compra_3: 0,
      compra_4: 0,
      compra_5: 0
    };

    // Crear objeto con estado de implementaciones
    const estadoImplementaciones = {
      implementacion_1: implementacionesCompletadas.includes(1),
      implementacion_2: implementacionesCompletadas.includes(2),
      implementacion_3: implementacionesCompletadas.includes(3),
      implementacion_4: implementacionesCompletadas.includes(4),
      implementacion_5: implementacionesCompletadas.includes(5)
    };

    res.json({
      success: true,
      totalReal,
      compras,
      implementaciones_completadas: implementacionesCompletadas,
      estado_implementaciones: estadoImplementaciones,
      pdv_id,
      segmento,
      descripcion,
      codigo_pdv
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de galonaje por PDV',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT PARA OBTENER PRODUCTOS DE IMPLEMENTACIÓN SEGÚN SEGMENTO Y NÚMERO
router.get('/productos-implementacion/:segmento/:nro_implementacion', async (req, res) => {
  const { segmento, nro_implementacion } = req.params;
  let conn;

  try {
    conn = await getConnection();

    console.log(`🔍 Consultando productos para segmento: ${segmento}, implementación: ${nro_implementacion}`);

    // Buscar productos específicos para el segmento e implementación
    const [productos] = await conn.execute(
      `SELECT id, nombre_producto
       FROM puntos_venta_productos_imp 
       WHERE segmento = ? AND nro_implementacion = ?
       ORDER BY nombre_producto`,
      [segmento, nro_implementacion]
    );

    // Si no hay productos específicos, buscar productos MULTISEGMENTO para esa implementación
    if (productos.length === 0) {
      const [productosMulti] = await conn.execute(
        `SELECT id, nombre_producto
         FROM puntos_venta_productos_imp 
         WHERE segmento = 'MULTISEGMENTO' AND nro_implementacion = ?
         ORDER BY nombre_producto`,
        [nro_implementacion]
      );

      if (productosMulti.length === 0) {
        return res.json({
          success: true,
          message: `No se encontraron productos para el segmento ${segmento} e implementación ${nro_implementacion}`,
          data: [],
          segmento,
          nro_implementacion
        });
      }

      return res.json({
        success: true,
        data: productosMulti,
        segmento: 'MULTISEGMENTO',
        nro_implementacion,
        total_productos: productosMulti.length,
        message: `Productos MULTISEGMENTO encontrados para implementación ${nro_implementacion}`
      });
    }

    res.json({
      success: true,
      data: productos,
      segmento,
      nro_implementacion,
      total_productos: productos.length
    });

  } catch (err) {
    console.error('❌ Error al obtener productos de implementación:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos de implementación',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});


export default router;
