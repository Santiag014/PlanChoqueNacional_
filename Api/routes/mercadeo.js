import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireMercadeo, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Endpoint para obtener visitas por aprobar
router.get('/visitas-por-aprobar', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Query para obtener registros pendientes de aprobación
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
        r.puntos_kpi,
        r.galonaje,
        r.estado_mercadeo,
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
      WHERE r.estado_mercadeo IS NULL OR r.estado_mercadeo = 'PENDIENTE'
      ORDER BY r.created_at DESC
    `;
    
    const [rows] = await conn.execute(query);
    
    // Procesar datos para enviar respuesta limpia
    const visitasProcesadas = rows.map(row => ({
      id: row.id,
      codigo_pdv: row.codigo_pdv,
      nombre_pdv: row.nombre_pdv,
      nombre_agente: row.nombre_agente,
      email_agente: row.email_agente,
      tipo_kpi: row.tipo_kpi,
      fecha_registro: row.created_at,
      puntos_kpi: row.puntos_kpi,
      galonaje: row.galonaje,
      foto_evidencia: row.foto_factura,
      estado_mercadeo: row.estado_mercadeo || 'PENDIENTE'
    }));
    
    res.json({
      success: true,
      data: visitasProcesadas,
      total: visitasProcesadas.length
    });
    
  } catch (err) {
    console.error('Error obteniendo visitas por aprobar:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener visitas por aprobar', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para aprobar una visita
router.put('/aprobar-visita/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { comentarios } = req.body;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar que el registro existe
    const [registroCheck] = await conn.execute(
      'SELECT id FROM registros_pdv WHERE id = ?', 
      [registro_id]
    );
    
    if (registroCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro no encontrado' 
      });
    }
    
    // Actualizar el estado del registro
    const updateQuery = `
      UPDATE registros_pdv 
      SET 
        estado_mercadeo = 'APROBADO',
        comentarios_mercadeo = ?,
        fecha_aprobacion_mercadeo = NOW(),
        aprobado_por_mercadeo = ?
      WHERE id = ?
    `;
    
    await conn.execute(updateQuery, [comentarios || null, req.user.userId, registro_id]);
    
    res.json({
      success: true,
      message: 'Visita aprobada exitosamente'
    });
    
  } catch (err) {
    console.error('Error aprobando visita:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al aprobar la visita', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para rechazar una visita
router.put('/rechazar-visita/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { motivo_rechazo } = req.body;
  
  if (!motivo_rechazo) {
    return res.status(400).json({ 
      success: false, 
      message: 'El motivo de rechazo es requerido' 
    });
  }
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar que el registro existe
    const [registroCheck] = await conn.execute(
      'SELECT id FROM registros_pdv WHERE id = ?', 
      [registro_id]
    );
    
    if (registroCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro no encontrado' 
      });
    }
    
    // Actualizar el estado del registro
    const updateQuery = `
      UPDATE registros_pdv 
      SET 
        estado_mercadeo = 'RECHAZADO',
        motivo_rechazo_mercadeo = ?,
        fecha_rechazo_mercadeo = NOW(),
        rechazado_por_mercadeo = ?
      WHERE id = ?
    `;
    
    await conn.execute(updateQuery, [motivo_rechazo, req.user.userId, registro_id]);
    
    res.json({
      success: true,
      message: 'Visita rechazada exitosamente'
    });
    
  } catch (err) {
    console.error('Error rechazando visita:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al rechazar la visita', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener detalles específicos de una visita
router.get('/visita-detalles/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Query completa para obtener todos los detalles del registro
    const queryDetalles = `
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
        r.puntos_kpi,
        r.galonaje,
        r.estado_mercadeo,
        r.comentarios_mercadeo,
        r.motivo_rechazo_mercadeo,
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
      WHERE r.id = ?
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [registro_id]);
    
    if (detalles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }
    
    const registro = detalles[0];
    
    res.json({
      success: true,
      data: {
        id: registro.id,
        pdv: {
          codigo: registro.codigo_pdv,
          descripcion: registro.nombre_pdv,
          direccion: registro.direccion_pdv
        },
        agente: {
          nombre: registro.nombre_agente,
          email: registro.email_agente
        },
        foto: registro.foto_factura,
        galonaje: registro.galonaje,
        kpi_id: registro.kpi_id,
        puntos_kpi: registro.puntos_kpi,
        tipo_kpi: registro.tipo_kpi,
        fecha_registro: registro.created_at,
        estado_mercadeo: registro.estado_mercadeo || 'PENDIENTE',
        comentarios_mercadeo: registro.comentarios_mercadeo,
        motivo_rechazo_mercadeo: registro.motivo_rechazo_mercadeo
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo detalles de la visita:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener detalles de la visita', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para obtener productos de una visita específica
router.get('/visita-productos/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Query para obtener los productos comprados en esa visita
    const queryProductos = `
      SELECT 
        p.id,
        p.nombre as nombre_producto,
        p.precio_unitario,
        rp.cantidad,
        (p.precio_unitario * rp.cantidad) as total_producto,
        p.categoria,
        p.codigo_producto
      FROM registro_productos rp
      LEFT JOIN productos p ON rp.producto_id = p.id
      WHERE rp.registro_id = ?
      ORDER BY p.nombre ASC
    `;
    
    const [productos] = await conn.execute(queryProductos, [registro_id]);
    
    if (productos.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No se encontraron productos para esta visita'
      });
    }
    
    // Procesar productos para enviar respuesta limpia
    const productosProcesados = productos.map(producto => ({
      id: producto.id,
      nombre: producto.nombre_producto,
      codigo: producto.codigo_producto,
      precio_unitario: parseFloat(producto.precio_unitario) || 0,
      cantidad: parseInt(producto.cantidad) || 0,
      total: parseFloat(producto.total_producto) || 0,
      categoria: producto.categoria || 'N/A'
    }));
    
    // Calcular totales
    const totalGeneral = productosProcesados.reduce((sum, prod) => sum + prod.total, 0);
    const totalProductos = productosProcesados.length;
    
    res.json({
      success: true,
      data: productosProcesados,
      resumen: {
        total_productos: totalProductos,
        total_general: totalGeneral
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo productos de la visita:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos de la visita', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
