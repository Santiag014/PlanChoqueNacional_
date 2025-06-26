import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';

const router = express.Router();

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
    
    // Query para obtener registros con información del PDV y agente
    const query = `
      SELECT 
        r.id,
        r.pdv_id,
        r.user_id,
        r.tipo_kpi,
        r.fecha_registro,
        r.foto_evidencia,
        p.codigo as codigo_pdv,
        p.nombre as nombre_pdv,
        u.name as nombre_agente
      FROM registros_pdv r
      LEFT JOIN puntos_venta p ON r.pdv_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.fecha_registro DESC
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

// Endpoint para obtener detalles específicos de un registro
router.get('/registro-detalles/:registro_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar que el registro pertenece al usuario autenticado
    const [registroCheck] = await conn.execute(
      'SELECT user_id, tipo_kpi, foto_evidencia FROM registros_pdv WHERE id = ?', 
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
    
    const tipoKpi = registroCheck[0].tipo_kpi;
    const fotoEvidencia = registroCheck[0].foto_evidencia;
    
    let productos = [];
    
    // Obtener productos según el tipo de KPI
    if (tipoKpi && tipoKpi.toLowerCase() !== 'frecuencia') {
      let queryProductos = '';
      
      if (tipoKpi.toLowerCase() === 'precio') {
        queryProductos = `
          SELECT 
            p.referencia,
            p.presentacion,
            rp.precio
          FROM registro_productos rp
          JOIN productos p ON rp.producto_id = p.id
          WHERE rp.registro_id = ?
        `;
      } else if (tipoKpi.toLowerCase() === 'volumen') {
        queryProductos = `
          SELECT 
            p.referencia,
            p.presentacion,
            rp.volumen
          FROM registro_productos rp
          JOIN productos p ON rp.producto_id = p.id
          WHERE rp.registro_id = ?
        `;
      }
      
      if (queryProductos) {
        const [productosRows] = await conn.execute(queryProductos, [registro_id]);
        productos = productosRows;
      }
    }
    
    res.json({
      success: true,
      data: {
        productos: productos,
        foto: fotoEvidencia
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
