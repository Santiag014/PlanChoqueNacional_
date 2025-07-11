import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.get('/roles', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM rol');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener roles', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});


router.get('/agentes', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM agente');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener agentes', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener información detallada del PDV
router.get('/pdv-details', authenticateToken, async (req, res) => {
  const { codigo, user_id } = req.query;
  
  if (!codigo || !user_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Código de PDV y user_id son requeridos' 
    });
  }
  
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
    const [rows] = await conn.execute(
      `SELECT pv.codigo, pv.descripcion, pv.direccion, pv.segmento 
       FROM puntos_venta pv 
       WHERE pv.codigo = ? AND pv.user_id = ?`,
      [codigo, user_id]
    );
    
    if (rows.length > 0) {
      const pdv = rows[0];
      res.json({ 
        success: true, 
        descripcion: pdv.descripcion,
        direccion: pdv.direccion,
        segmento: pdv.segmento,
        codigo: pdv.codigo
      });
    } else {
      res.json({ 
        success: false, 
        message: 'PDV no encontrado' 
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener información del PDV', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener todos los PDVs del usuario (para el pop-up)
router.get('/pdvs-usuario', authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'user_id es requerido' 
    });
  }
  
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
    const [rows] = await conn.execute(
      `SELECT pv.codigo, pv.descripcion, pv.direccion, pv.segmento 
       FROM puntos_venta pv 
       WHERE pv.user_id = ?  
       ORDER BY pv.codigo`,
      [user_id]
    );
    
    res.json({ 
      success: true, 
      data: rows 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener PDVs del usuario', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener productos de implementación
router.get('/productos-implementacion', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        p.id,
        p.codigo,
        p.descripcion as nombre,
        p.imagen,
        p.precio_sugerido,
        m.descripcion as marca
      FROM productos p
      LEFT JOIN marcas m ON p.id_marca = m.id
      WHERE p.activo = 1
      ORDER BY m.descripcion, p.descripcion
    `);
    
    // Procesar las imágenes para usar la ruta correcta
    const productos = rows.map(producto => ({
      ...producto,
      imagen: producto.imagen ? `/storage/img_productos_carrusel/${producto.imagen}` : '/storage/img_productos_carrusel/default.png'
    }));
    
    res.json({ success: true, data: productos });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
