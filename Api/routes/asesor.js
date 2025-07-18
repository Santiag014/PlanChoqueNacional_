import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';
import XLSX from 'xlsx';

const router = express.Router();

// Consulta básica de historial
router.get('/historial-registros-asesor/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
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
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_volumen = 1 THEN 'Implementacion'
            WHEN kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Visita'
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
      INNER JOIN users ON users.id = registro_servicios.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
      INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id
      WHERE registro_servicios.user_id = ?
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

// Endpoint específico para historial de visitas (descarga Excel con información completa)
router.get('/historial-visitas/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
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

    // Consulta completa combinando historial de visitas con detalles completos (basada en registro-detalles)
    const query = `
      SELECT 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
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
        -- Información de productos con más detalles
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.cantidad_cajas) AS cantidades_cajas,
        GROUP_CONCAT(registro_productos.conversion_galonaje) AS galones,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales,
        -- Información fotográfica
        GROUP_CONCAT(registro_fotografico_servicios.foto_factura) AS fotos_factura,
        GROUP_CONCAT(registro_fotografico_servicios.foto_pop) AS fotos_pop,
        GROUP_CONCAT(registro_fotografico_servicios.foto_seguimiento) AS fotos_seguimiento,
        -- Totales calculados
        SUM(registro_productos.cantidad_cajas) as total_cajas,
        SUM(registro_productos.conversion_galonaje) as total_galones,
        SUM(registro_productos.precio_real * registro_productos.cantidad_cajas) as valor_total_implementado,
        -- Puntos obtenidos
        COALESCE(SUM(registro_puntos.puntos), 0) AS puntos_obtenidos
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = puntos_venta.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
      INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id
      LEFT JOIN registro_puntos ON registro_puntos.id_visita = registro_servicios.id
      WHERE registro_servicios.user_id = ?
      GROUP BY 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
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
        registro_servicios.observacion
      ORDER BY registro_servicios.fecha_registro DESC, registro_servicios.created_at DESC
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
      'Estado': row.estado,
      'Estado Agente': row.estado_agente,
      'Observaciones': row.observacion || 'Sin observaciones',
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

// Endpoint específico para resultados de auditorias
router.get('/resultados-auditorias/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
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
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales,

        -- Información fotográfica
        GROUP_CONCAT(registro_fotografico_servicios.foto_pop) AS fotos_pop

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

export default router;