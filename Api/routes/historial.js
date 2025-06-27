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
    
    // Query mejorada para obtener registros con información completa y datos reales
    const query = `
      SELECT 
        r.id,
        r.pdv_id,
        r.user_id,
        CASE 
          WHEN k.descripcion IS NOT NULL THEN k.descripcion
          WHEN r.tipo_kpi IS NOT NULL THEN r.tipo_kpi
          ELSE 'N/A'
        END as tipo_kpi,
        r.fecha_registro,
        r.created_at,
        r.foto_evidencia,
        r.foto_factura,
        r.puntos_kpi,
        r.galonaje,
        pv.codigo as codigo_pdv,
        pv.nombre as nombre_pdv,
        pv.descripcion as descripcion_pdv,
        pv.direccion as direccion_pdv,
        u.name as nombre_agente,
        u.email as email_agente,
        k.descripcion as kpi_descripcion
      FROM registros_pdv r
      LEFT JOIN puntos_venta pv ON r.pdv_id = pv.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN kpi k ON r.kpi_id = k.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC, r.fecha_registro DESC
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
    
    // Query completa para obtener todos los detalles del registro
    const queryDetalles = `
      SELECT 
        pv.codigo,
        pv.descripcion,
        pv.direccion,
        r.foto_factura,
        r.galonaje,
        r.estado_id,
        r.estado_agente_id,
        r.kpi_id,
        r.puntos_kpi,
        r.foto_evidencia,
        r.tipo_kpi,
        r.fecha_registro,
        GROUP_CONCAT(DISTINCT ref.descripcion SEPARATOR ', ') AS referencias,
        GROUP_CONCAT(DISTINCT prp.presentacion SEPARATOR ', ') AS productos,
        GROUP_CONCAT(prp.cantidad SEPARATOR ', ') AS cantidad,
        GROUP_CONCAT(prp.precio SEPARATOR ', ') AS precio
      FROM puntos_venta pv
      INNER JOIN registros_pdv r ON r.pdv_id = pv.id
      LEFT JOIN productos_registros_pdv prp ON prp.registro_id = r.id
      LEFT JOIN referencias ref ON ref.id = prp.referencia_id
      WHERE r.id = ?
      GROUP BY 
        pv.codigo, pv.descripcion, pv.direccion, 
        r.foto_factura, r.galonaje, r.estado_id, 
        r.estado_agente_id, r.kpi_id, r.puntos_kpi,
        r.foto_evidencia, r.tipo_kpi, r.fecha_registro
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [registro_id]);
    
    if (detalles.length === 0) {
      return res.json({
        success: true,
        data: {
          productos: [],
          foto: registroCheck[0].foto_evidencia,
          pdv: {
            codigo: 'N/A',
            descripcion: 'N/A', 
            direccion: 'N/A'
          }
        }
      });
    }
    
    const registro = detalles[0];
    
    // Procesar los productos si existen
    let productos = [];
    if (registro.referencias && registro.productos) {
      const referencias = registro.referencias.split(', ');
      const presentaciones = registro.productos.split(', ');
      const cantidades = registro.cantidad ? registro.cantidad.split(', ') : [];
      const precios = registro.precio ? registro.precio.split(', ') : [];
      
      productos = referencias.map((ref, index) => ({
        referencia: ref,
        presentacion: presentaciones[index] || 'N/A',
        cantidad: cantidades[index] || 0,
        precio: precios[index] || 0,
        volumen: cantidades[index] || 0 // Para compatibilidad
      }));
    }
    
    res.json({
      success: true,
      data: {
        pdv: {
          codigo: registro.codigo,
          descripcion: registro.descripcion,
          direccion: registro.direccion
        },
        productos: productos,
        foto: registro.foto_evidencia || registro.foto_factura,
        galonaje: registro.galonaje,
        estado_id: registro.estado_id,
        estado_agente_id: registro.estado_agente_id,
        kpi_id: registro.kpi_id,
        puntos_kpi: registro.puntos_kpi,
        tipo_kpi: registro.tipo_kpi,
        fecha_registro: registro.fecha_registro
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
