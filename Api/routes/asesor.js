import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Endpoint KPI dashboard - solo para asesores autenticados
router.get('/dashboard-kpi/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }
  let conn;
  try {
    conn = await getConnection();
    // Total PDVs asignados
    const [pdvs] = await conn.execute('SELECT id FROM puntos_venta WHERE user_id = ?', [user_id]);
    const totalPDVs = pdvs.length;
    // Total PDVs con registros
    const [conReg] = await conn.execute(
      `SELECT DISTINCT pdv_id FROM registros_pdv WHERE user_id = ?`,
      [user_id]
    );
    const totalConReg = conReg.length;
    // Porcentaje
    const porcentaje = totalPDVs > 0 ? Math.round((totalConReg / totalPDVs) * 100) : 0;
    res.json({
      success: true,
      totalPDVs,
      totalConReg,
      porcentaje
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error KPI dashboard', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint KPI dashboard - solo para asesores autenticados
router.get('/pdv-desc/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }
  let conn;
  try {
    conn = await getConnection();
    // Total PDVs asignados
    const [pdvs] = await conn.execute('SELECT id FROM puntos_venta WHERE user_id = ?', [user_id]);
    const totalPDVs = pdvs.length;
    // Total PDVs con registros
    const [conReg] = await conn.execute(
      `SELECT DISTINCT pdv_id FROM registros_pdv WHERE user_id = ?`,
      [user_id]
    );
    const totalConReg = conReg.length;
    // Porcentaje
    const porcentaje = totalPDVs > 0 ? Math.round((totalConReg / totalPDVs) * 100) : 0;
    res.json({
      success: true,
      totalPDVs,
      totalConReg,
      porcentaje
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error KPI dashboard', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para metas y registros por PDV (para gráfica de barras y popup)
router.get('/pdv-metas/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }
  
  let conn;
  try {
    conn = await getConnection();
    // Trae PDVs asignados con meta
    const [pdvs] = await conn.execute(
      `SELECT pv.id, pv.codigo, pv.descripcion, pv.direccion, pv.meta_volumen as meta_galonaje,
              pv.segmento
       FROM puntos_venta pv
       LEFT JOIN agente a ON pv.id_agente = a.id
       WHERE pv.user_id = ?`,
      [user_id]
    );
    // Trae galonaje registrado por PDV
    const [registros] = await conn.execute(
      `SELECT pdv_id, SUM(galonaje) as galonaje_registrado
       FROM registros_pdv
       WHERE user_id = ?
       GROUP BY pdv_id`,
      [user_id]
    );
    // Mapea galonaje registrado
    const regMap = {};
    registros.forEach(r => { regMap[r.pdv_id] = Number(r.galonaje_registrado) || 0; });
    // Une info
    const data = pdvs.map(pdv => {
      const real = regMap[pdv.id] || 0;
      const meta = Number(pdv.meta_galonaje) || 0;
      const porcentaje = meta > 0 ? Math.round((real / meta) * 100) : 0;
      return {
        id: pdv.id,
        codigo: pdv.codigo,
        descripcion: pdv.descripcion,
        direccion: pdv.direccion || 'No disponible',
        segmento: pdv.segmento || 'No asignado',
        meta,
        real,
        porcentaje
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error metas PDV', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para plano cartesiano de KPIs
router.get('/kpi-puntos/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }
  
  let conn;
  try {
    conn = await getConnection();
    
    // Primero, asegurar que existan todos los KPIs necesarios
    await conn.execute(`
      INSERT IGNORE INTO kpi (id, descripcion, puntos) VALUES 
      (1, 'Volumen', 0),
      (2, 'Precio', 2),
      (3, 'Frecuencia', 1),
      (4, 'Cobertura', 3),
      (5, 'Profundidad', 2)
    `);
    
    // Ejemplo: cada registro_pdv tiene kpi_id, galonaje, etc.
    const [rows] = await conn.execute(
      `SELECT r.pdv_id, r.kpi_id, r.galonaje, r.puntos_kpi, pv.codigo
       FROM registros_pdv r
       INNER JOIN puntos_venta pv ON r.pdv_id = pv.id
       WHERE r.user_id = ?`,
      [user_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error puntos KPI', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: visitas-pdv-resumen
router.get('/visitas-pdv-resumen/:asesorId', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const asesorId = req.params.asesorId;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != asesorId) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }
  
  let conn;
  try {
    conn = await getConnection();
    // Consulta directa para visitas por PDV
    const [rows] = await conn.execute(
      `SELECT pv.codigo as num_pdv, COUNT(r.id) as visitas
       FROM puntos_venta pv
       LEFT JOIN registros_pdv r ON r.pdv_id = pv.id AND r.user_id = ?
       WHERE pv.user_id = ?
       GROUP BY pv.codigo`,
      [asesorId, asesorId]
    );
    const totalVisitas = rows.reduce((sum, v) => sum + Number(v.visitas), 0);
    const data = rows.map(v => ({
      ...v,
      porcentaje: totalVisitas > 0 ? (v.visitas / totalVisitas) * 100 : 0
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: 'Error al obtener visitas' });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: puntos por PDV para un KPI específico
router.get('/kpi-puntos-por-pdv/:user_id/:kpi_name', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id, kpi_name } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }
  
  let conn;
  try {
    conn = await getConnection();
    
    // Mapear nombres de KPI a IDs
    const kpiMapping = {
      'volumen': 1,
      'precio': 2, 
      'frecuencia': 3,
      'cobertura': 4,
      'profundidad': 5
    };
    
    const kpi_id = kpiMapping[kpi_name.toLowerCase()];
    if (!kpi_id) {
      return res.status(400).json({ success: false, message: 'KPI no válido' });
    }
    
    // Obtener puntos agrupados por PDV para el KPI específico
    const [rows] = await conn.execute(
      `SELECT 
        pv.codigo,
        pv.segmento,
        COALESCE(SUM(r.puntos_kpi), 0) as puntos_totales
       FROM puntos_venta pv
       LEFT JOIN registros_pdv r ON r.pdv_id = pv.id 
         AND r.user_id = ? 
         AND r.kpi_id = ?
       WHERE pv.user_id = ?
       GROUP BY pv.id, pv.codigo, pv.segmento
       ORDER BY puntos_totales DESC`,
      [user_id, kpi_id, user_id]
    );
    
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener puntos por PDV', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener historial de registros por asesor
router.get('/historial-registros/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // Query mejorada para obtener registros con información completa y datos reales
    const query = `
      SELECT 
        r.id,
        r.pdv_id,
        r.user_id,
        CASE 
          WHEN k.descripcion IS NOT NULL THEN k.descripcion
          WHEN r.kpi_id IS NOT NULL THEN r.kpi_id
          ELSE 'N/A'
        END as tipo_kpi,
        r.created_at,
        r.foto_factura,
        r.foto_factura,
        r.puntos_kpi,
        r.galonaje,
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion as direccion_pdv,
        u.name as nombre_agente,
        u.email as email_agente,
        k.descripcion as kpi_descripcion
      FROM registros_pdv r
      LEFT JOIN puntos_venta pv ON r.pdv_id = pv.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN kpi k ON r.kpi_id = k.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;
    
    const [rows] = await conn.execute(query, [user_id]);
    
    // Procesar datos para enviar respuesta limpia
    const registrosProcesados = rows.map(row => ({
      id: row.id,
      codigo_pdv: row.codigo_pdv,
      nombre_pdv: row.nombre_pdv || row.descripcion_pdv,
      nombre_agente: row.nombre_agente,
      email_agente: row.email_agente,
      tipo_kpi: row.tipo_kpi,
      fecha_registro: row.fecha_registro || row.created_at,
      puntos_kpi: row.puntos_kpi,
      galonaje: row.galonaje,
      foto_evidencia: row.foto_evidencia || row.foto_factura
    }));
    
    res.json({
      success: true,
      data: registrosProcesados,
      total: registrosProcesados.length
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

// Endpoint para obtener detalles específicos de un registro
router.get('/registro-detalles/:registro_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar que el registro pertenece al usuario autenticado
    const [registroCheck] = await conn.execute(
      'SELECT user_id, kpi_id, foto_factura FROM registros_pdv WHERE id = ?', 
      [registro_id]
    );
    
    if (registroCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro no encontrado' 
      });
    }
    
    if (registroCheck[0].user_id != req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para acceder a este registro' 
      });
    }
    
    // Query completa para obtener todos los detalles del registro
    const queryDetalles = `
      SELECT 
        r.id,
        r.pdv_id,
        r.user_id,
        r.kpi_id,
        r.created_at as fecha_registro,
        r.foto_factura,
        r.puntos_kpi,
        r.galonaje,
        r.precio_litro,
        r.marca_id,
        r.referencia_id,
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion as direccion_pdv,
        pv.segmento,
        u.name as nombre_agente,
        u.email as email_agente,
        k.descripcion as kpi_descripcion,
        m.descripcion as marca_descripcion,
        ref.descripcion as referencia_descripcion
      FROM registros_pdv r
      LEFT JOIN puntos_venta pv ON r.pdv_id = pv.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN kpi k ON r.kpi_id = k.id
      LEFT JOIN marca m ON r.marca_id = m.id
      LEFT JOIN referencias ref ON r.referencia_id = ref.id
      WHERE r.id = ?
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [registro_id]);
    
    if (detalles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Detalles del registro no encontrados' 
      });
    }
    
    const registro = detalles[0];
    
    res.json({
      success: true,
      data: {
        id: registro.id,
        codigo_pdv: registro.codigo_pdv,
        nombre_pdv: registro.nombre_pdv,
        direccion_pdv: registro.direccion_pdv,
        segmento: registro.segmento,
        nombre_agente: registro.nombre_agente,
        email_agente: registro.email_agente,
        kpi_descripcion: registro.kpi_descripcion,
        fecha_registro: registro.fecha_registro,
        puntos_kpi: registro.puntos_kpi,
        galonaje: registro.galonaje,
        precio_litro: registro.precio_litro,
        marca_descripcion: registro.marca_descripcion,
        referencia_descripcion: registro.referencia_descripcion,
        foto_evidencia: registro.foto_factura
      }
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

export default router;
