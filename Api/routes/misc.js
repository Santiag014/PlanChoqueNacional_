import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Ruta pública para verificar la conexión a la base de datos
router.get('/check-db', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    res.json({ connected: true, message: 'Conexión exitosa a la base de datos' });
  } catch (err) {
    res.status(500).json({ connected: false, message: 'Error de conexión', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Ruta protegida para desarrolladores/administradores
router.get('/tablas', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.query('SHOW TABLES');
    res.json({ success: true, tablas: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener tablas', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

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

// Nuevo endpoint para metas y registros por PDV (para gráfica de barras y popup)
router.get('/pdv-metas/:user_id', async (req, res) => {
  const { user_id } = req.params;
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

// Nuevo endpoint para plano cartesiano de KPIs
router.get('/kpi-puntos/:user_id', async (req, res) => {
  const { user_id } = req.params;
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

// Nuevo endpoint: visitas-pdv-resumen
router.get('/visitas-pdv-resumen/:asesorId', async (req, res) => {
  const asesorId = req.params.asesorId;
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

// Nuevo endpoint: puntos por PDV para un KPI específico
router.get('/kpi-puntos-por-pdv/:user_id/:kpi_name', async (req, res) => {
  const { user_id, kpi_name } = req.params;
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

export default router;