import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireOT, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Consulta básica de historial - SIN RESTRICCIÓN user_id
router.get('/historial-registros', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // Consulta básica sin filtrar por user_id
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
        estado_agente_id,
        users.name as nombre_asesor,
        users.email as email_asesor
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = registro_servicios.user_id
      ORDER BY registro_servicios.fecha_registro DESC
    `;
    const [rows] = await conn.execute(query);

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
router.get('/cobertura', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // Total de PDVs en el sistema
    const [pdvs] = await conn.execute(
      `SELECT 
        pv.id, 
        pv.codigo, 
        pv.descripcion AS nombre, 
        pv.direccion,
        u.name as asesor_nombre,
        u.email as asesor_email,
        ag.descripcion as compania,
        ag.id as agente_id,
        u.id as asesor_id
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente`
    );

    // PDVs con al menos un registro en registro_servicios
    const [implementados] = await conn.execute(
      `SELECT DISTINCT pdv_id
       FROM registro_servicios WHERE registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`
    );
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
      puntosCobertura
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener cobertura', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE VOLUMEN GLOBAL PARA DASHBOARD OT
router.get('/volumen', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // Obtener la meta total de volumen (suma de meta_volumen de todos los PDVs)
    const [metaResult] = await conn.execute(
      `SELECT SUM(meta_volumen) as totalMeta 
       FROM puntos_venta`
    );
    const totalMeta = metaResult[0]?.totalMeta || 0;

    // Obtener el volumen real total (suma de conversion_galonaje)
    const [realResult] = await conn.execute(
      `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
       FROM registro_servicios
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2`
    );
    const totalReal = realResult[0]?.totalReal || 0;

    // Calcular puntos de volumen de forma más realista
    const puntosVolumen = Math.min(totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0, 100);

    // Obtener detalle por PDV con información del asesor
    const [pdvs] = await conn.execute(
      `SELECT 
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
         COALESCE(SUM(rp.conversion_galonaje), 0) AS \`real\`
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.estado_id = 2 AND rs.estado_agente_id = 2
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       GROUP BY pv.id, pv.codigo, pv.descripcion, pv.segmento, pv.meta_volumen, u.name, u.email, u.id, ag.descripcion, ag.id`
    );

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

    // Obtener resumen por segmento
    const [segmentos] = await conn.execute(
      `SELECT 
         pv.segmento,
         COUNT(DISTINCT pv.id) AS cantidadPdvs,
         COALESCE(SUM(rp.conversion_galonaje), 0) AS totalGalones
       FROM puntos_venta pv
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.estado_id = 2 AND rs.estado_agente_id = 2
       LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
       GROUP BY pv.segmento`
    );

    // Obtener detalle por producto (usando referencia_id)
    const [productos] = await conn.execute(
      `SELECT 
         rp.referencia_id AS nombre,
         COUNT(rp.id) AS numeroCajas,
         SUM(rp.conversion_galonaje) AS galonaje
       FROM registro_servicios rs
       INNER JOIN registro_productos rp ON rp.registro_id = rs.id
       WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2
       GROUP BY rp.referencia_id
       ORDER BY galonaje DESC`
    );

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
      productos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de volumen', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ENDPOINT DE VISITAS GLOBAL PARA DASHBOARD OT
router.get('/visitas', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    // Obtener todos los PDVs del sistema
    const [pdvsResult] = await conn.execute(
      `SELECT 
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
       LEFT JOIN agente ag ON ag.id = pv.id_agente`
    );
    const totalPdvs = pdvsResult.length;
    
    // Meta de visitas: 20 por cada PDV
    const metaVisitas = totalPdvs * 20;
    
    // Obtener el número real de visitas (registro_servicios)
    const [realResult] = await conn.execute(
      `SELECT COUNT(id) as totalVisitas
       FROM registro_servicios  WHERE estado_id = 2 AND estado_agente_id = 2`
    );
    const totalVisitas = realResult[0]?.totalVisitas || 0;
    
    // Calcular puntos de visitas de forma más realista
    const puntosVisitas = Math.min(metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0, 100);
    
    // Obtener detalle de visitas por PDV
    const [pdvs] = await conn.execute(
      `SELECT 
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
       GROUP BY pv.id, pv.codigo, pv.descripcion, u.name, u.email, u.id, ag.descripcion, ag.id`
    );
    
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
        WHERE estado_id = 2 AND estado_agente_id = 2
       GROUP BY tipo`
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

// Endpoint para consultar información de precios GLOBAL
router.get('/precios', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // 1. Obtener todos los PDVs del sistema
    const [pdvs] = await conn.execute(
      `SELECT 
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
       LEFT JOIN agente ag ON ag.id = pv.id_agente`
    );
    
    // 2. Obtener PDVs con al menos un reporte de precio (kpi_precio = 1)
    const [reportados] = await conn.execute(
      `SELECT DISTINCT pdv_id
       FROM registro_servicios
       LEFT JOIN registros_mistery_shopper ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id 
       WHERE registro_servicios.kpi_precio = 1 AND registros_mistery_shopper.id IS NOT NULL;`
    );
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
router.get('/profundidad', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // 1. Obtener todos los PDVs del sistema
    const [pdvs] = await conn.execute(
      `SELECT 
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
       LEFT JOIN agente ag ON ag.id = pv.id_agente`
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
       WHERE pp.referencia_id IS NULL
       GROUP BY rs.pdv_id
       HAVING nuevas_referencias > 0`
    );
    
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
router.get('/asesores', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const [asesores] = await conn.execute(
      `SELECT 
        id,
        name,
        email
       FROM users
       WHERE rol_id = 1
       ORDER BY name`
    );

    res.json({
      success: true,
      data: asesores,
      total: asesores.length
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
router.get('/agentes-comerciales', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const [agentes] = await conn.execute(
      `SELECT 
        id,
        descripcion
       FROM agente`
    );

    res.json({
      success: true,
      data: agentes,
      total: agentes.length
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
router.get('/puntos-venta', authenticateToken, requireOT, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const [pdvs] = await conn.execute(
      `SELECT 
        pv.id,
        pv.codigo,
        pv.descripcion as nombre,
        pv.direccion,
        pv.segmento,
        ag.descripcion as agente_descripcion,
        ag.descripcion as compania,
        u.name as asesor_nombre,
        u.id as asesor_id,
        ag.id as agente_id
       FROM puntos_venta pv
       INNER JOIN users u ON u.id = pv.user_id
       LEFT JOIN agente ag ON ag.id = pv.id_agente
       ORDER BY pv.codigo`
    );

    res.json({
      success: true,
      data: pdvs,
      total: pdvs.length
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

export default router;
