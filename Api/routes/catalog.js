import express from 'express';
import { getConnection } from '../db.js';

const router = express.Router();

// Estas rutas se montarán como /api/catalog/marcas cuando uses app.use('/api/catalog', catalogRoutes)
router.get('/marcas', async (req, res) => {
  console.log('Ruta /marcas accedida'); // Debug log
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM marca');
    console.log('Marcas encontradas:', rows.length); // Debug log
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener marcas:', err);
    res.status(500).json({ success: false, message: 'Error al obtener marcas', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener referencias por marca
router.get('/referencias', async (req, res) => {
  const { marca_id } = req.query;
  if (!marca_id) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro marca_id', data: [] });
  }
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, descripcion FROM referencias WHERE marca_id = ?',
      [marca_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error en /referencias:', err);
    res.status(500).json({ success: false, message: 'Error al obtener referencias', error: err.message, data: [] });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener descripción de PDV por código y user_id
router.get('/pdv-desc', async (req, res) => {
  console.log('🔍 Ruta /pdv-desc accedida'); // Debug log
  console.log('📋 Parámetros recibidos:', req.query); // Debug log
  
  const { codigo, user_id } = req.query;
  if (!codigo) {
    console.log('❌ Error: Falta el parámetro codigo');
    return res.status(400).json({ success: false, message: 'Falta el parámetro codigo' });
  }
  
  let conn;
  try {
    conn = await getConnection();
    let query = 'SELECT puntos_venta.id, puntos_venta.descripcion FROM puntos_venta WHERE puntos_venta.codigo = ?';
    let params = [codigo];
    
    if (user_id) {
      query += ' AND puntos_venta.user_id = ?';
      params.push(user_id);
    }
    
    console.log('🔍 Query SQL:', query);
    console.log('📝 Parámetros SQL:', params);
    
    const [rows] = await conn.execute(query, params);
    console.log('📊 Resultados encontrados:', rows.length);
    
    if (rows.length > 0) {
      console.log('✅ PDV encontrado:', rows[0]);
      res.json({ success: true, descripcion: rows[0].descripcion, id: rows[0].id });
    } else {
      console.log('❌ PDV no encontrado para código:', codigo);
      res.status(404).json({ success: false, message: 'PDV no encontrado' });
    }
  } catch (err) {
    console.error('💥 Error en /pdv-desc:', err);
    res.status(500).json({ success: false, message: 'Error al buscar PDV', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint de debug para productos por KPI
router.get('/productos-debug', async (req, res) => {
  console.log('🐛 Debug productos por KPI accedido');
  console.log('📋 Parámetros:', req.query);
  
  const { kpi, marca_id } = req.query;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Query base para obtener productos
    let query = 'SELECT * FROM productos WHERE 1=1';
    let params = [];
    
    if (marca_id) {
      query += ' AND marca_id = ?';
      params.push(marca_id);
    }
    
    console.log('🔍 Query productos:', query);
    console.log('📝 Parámetros:', params);
    console.log('🎯 KPI seleccionado:', kpi);
    
    const [rows] = await conn.execute(query, params);
    console.log('📊 Productos encontrados:', rows.length);
    
    res.json({ 
      success: true, 
      kpi: kpi,
      productos: rows,
      total: rows.length
    });
    
  } catch (err) {
    console.error('💥 Error en productos-debug:', err);
    res.status(500).json({ success: false, message: 'Error al obtener productos', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;