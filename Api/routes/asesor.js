import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Consulta básica de historial
router.get('/historial-registros/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.userId != user_id) {
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
        estado_agente_id
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      WHERE registro_servicios.user_id = ?
      ORDER BY registro_servicios.fecha_registro DESC
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

// Consulta de detalle
router.get('/registro-detalles/:registro_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { registro_id } = req.params;

  let conn;
  try {
    conn = await getConnection();

    // Consulta de detalle solicitada
    const queryDetalles = `
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
        END AS tipo_accion,
        e1.descripcion AS estado,
        e2.descripcion AS estado_agente,
        registro_servicios.observacion,
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.cantidad_cajas) AS cantidades_cajas,
        GROUP_CONCAT(registro_productos.conversion_galonaje) AS galonajes,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales,
        GROUP_CONCAT(registro_fotografico_servicios.foto_factura) AS fotos_factura,
        GROUP_CONCAT(registro_fotografico_servicios.foto_pop) AS fotos_pop,
        GROUP_CONCAT(registro_fotografico_servicios.foto_seguimiento) AS fotos_seguimiento
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = puntos_venta.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
      INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
      INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      INNER JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id
      WHERE registro_servicios.id = ?
      GROUP BY 
        registro_servicios.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        users.name,
        registro_servicios.fecha_registro,
        tipo_accion,
        e1.descripcion,
        e2.descripcion,
        registro_servicios.observacion
    `;
    const [detalles] = await conn.execute(queryDetalles, [registro_id]);

    if (detalles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalles del registro no encontrados'
      });
    }

    res.json({
      success: true,
      data: detalles[0]
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
         WHERE user_id = ?`, [user_id]
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
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE registro_servicios.user_id = ?`, [user_id]
    );
    const totalReal = realResult[0]?.totalReal || 0;

    // Obtener los puntos de volumen (id_kpi = 1 para volumen)
    const [puntosResult] = await conn.execute(
      `SELECT SUM(registro_puntos.puntos) as totalPuntos
       FROM registro_servicios
       INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
       WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 1`, [user_id]
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
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ?
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
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ?
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
       WHERE rs.user_id = ?
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
       WHERE user_id = ?`, [user_id]
    );
    const totalVisitas = realResult[0]?.totalVisitas || 0;
    
    // Obtener los puntos de visitas (id_kpi = 3 para visitas/frecuencia)
    const [puntosResult] = await conn.execute(
      `SELECT SUM(registro_puntos.puntos) as totalPuntos
       FROM registro_servicios
       INNER JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
       WHERE registro_servicios.user_id = ? AND registro_puntos.id_kpi = 3`, [user_id]
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
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ?
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
       WHERE user_id = ?
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

// Endpoint para consultar información de precios por PDV
router.get('/precios/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.userId != user_id) {
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
       WHERE user_id = ? AND kpi_precio = 1`, [user_id]
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

// Endpoint para consultar información de profundidad por PDV
router.get('/profundidad/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.userId != user_id) {
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
    
    // 2. Obtener PDVs con al menos una nueva referencia vendida
    const [conProfundidadQuery] = await conn.execute(
      `SELECT 
          rs.pdv_id,
          COUNT(*) AS nuevas_referencias
       FROM registro_servicios rs
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       LEFT JOIN portafolio_pdv pp 
          ON pp.pdv_id = rs.pdv_id AND pp.referencia_id = rp.referencia_id
       WHERE pp.referencia_id IS NULL AND rs.user_id = ?
       GROUP BY rs.pdv_id
       HAVING nuevas_referencias > 0`, [user_id]
    );
    
    const pdvsConProfundidad = new Set(conProfundidadQuery.map(r => r.pdv_id));
    
    // 3. Cálculo de puntos por profundidad
    const totalAsignados = pdvs.length;
    const totalConProfundidad = pdvsConProfundidad.size;
    const puntosProfundidad = totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 200) : 0;

    // 4. Asignar puntos individuales por PDV
    const puntosPorPDV = totalAsignados > 0 ? Math.floor(200 / totalAsignados) : 0;
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: pdvsConProfundidad.has(pdv.id) ? 'REGISTRADO' : 'NO REGISTRADO',
      puntos: pdvsConProfundidad.has(pdv.id) ? puntosPorPDV : 0
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

export default router;