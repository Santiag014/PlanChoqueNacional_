// ✅ ARCHIVO OPTIMIZADO PARA POOL COMPARTIDO
// ============================================
// - NO crea conexiones individuales por consulta
// - USA executeQueryForMultipleUsers() para consultas normales
// - USA executeQueryFast() para consultas rápidas
// - El pool de 50 conexiones se comparte entre TODOS los usuarios
// - NUNCA excede el límite de 500 conexiones/hora

import express from 'express';
import { getConnection, executeQueryForMultipleUsers, executeQueryFast } from '../db.js';

const router = express.Router();

// Test endpoint para verificar conectividad en producción
router.get('/test-connection', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    host: req.headers.host
  });
});

// Test endpoint POST para verificar si los POST requests funcionan
router.post('/test-post', (req, res) => {
  console.log('📡 Test POST recibido:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  res.json({ 
    success: true, 
    message: 'POST request funcionando correctamente',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });
});

// Obtener marcas - endpoint público
router.get('/marcas', async (req, res) => {
  try {
    // ✅ USA POOL COMPARTIDO - NO crea conexión individual
    const rows = await executeQueryForMultipleUsers('SELECT id, descripcion FROM marca');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener marcas', error: err.message });
  }
});

// Obtener descripción de PDV por código y user_id - endpoint público
router.get('/pdv-desc', async (req, res) => {
  const { codigo, user_id } = req.query;
  if (!codigo) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro codigo' });
  }
  try {
    // ✅ USA POOL COMPARTIDO - NO crea conexión individual
    let query = 'SELECT puntos_venta.id, puntos_venta.descripcion FROM puntos_venta WHERE puntos_venta.codigo = ?';
    let params = [codigo];
    if (user_id) {
      query += ' AND puntos_venta.user_id = ?';
      params.push(user_id);
    }
    // Log para depuración
    //console.log('Consulta PDV:', query, params);
    const rows = await executeQueryForMultipleUsers(query, params);
    if (rows.length > 0) {
      res.json({ success: true, ...rows[0] });
    } else {
      res.json({ success: false, message: 'No encontrado' });
    }
  } catch (err) {
    console.error('Error en /pdv-desc:', err);
    res.status(500).json({ success: false, message: 'Error al buscar PDV', error: err.message });
  }
});

// Obtener descripción de PDV por código y user_id - endpoint público
router.get('/pdv-info', async (req, res) => {
  const {user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro (ID_USUARIO)' });
  }
  try {
    // ✅ USA POOL COMPARTIDO - NO crea conexión individual
    let query = 'SELECT puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, puntos_venta.direccion FROM puntos_venta WHERE puntos_venta.user_id = ?';
    let params = [user_id];
    const rows = await executeQueryForMultipleUsers(query, params);
    if (rows.length > 0) {
      res.json({ success: true, data: rows });
    } else {
      res.json({ success: false, message: 'No encontrado' });
    }
  } catch (err) {
    console.error('Error en /pdv-desc:', err);
    res.status(500).json({ success: false, message: 'Error al buscar PDV', error: err.message });
  }
});

// Obtener descripción de PDV por código y user_id - endpoint público
router.get('/pdv-dentails', async (req, res) => {
  const { codigo, user_id } = req.query;
  if (!codigo) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro codigo' });
  }
  try {
    // ✅ USA POOL COMPARTIDO - NO crea conexión individual
    let query = 'SELECT puntos_venta.id, puntos_venta.descripcion,puntos_venta.direccion, puntos_venta.segmento FROM puntos_venta WHERE puntos_venta.codigo = ?';
    let params = [codigo];
    if (user_id) {
      query += ' AND puntos_venta.user_id = ?';
      params.push(user_id);
    }
    // Log para depuración
    //console.log('Consulta PDV:', query, params);
    const rows = await executeQueryForMultipleUsers(query, params);
    if (rows.length > 0) {
      res.json({ success: true, ...rows[0] });
    } else {
      res.json({ success: false, message: 'No encontrado' });
    }
  } catch (err) {
    console.error('Error en /pdv-desc:', err);
    res.status(500).json({ success: false, message: 'Error al buscar PDV', error: err.message });
  }
});

// Obtener referencias por marca (para el carrusel de referencias según la marca seleccionada)
router.get('/referencias', async (req, res) => {
  const { marca_id } = req.query;
  if (!marca_id) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro marca_id', data: [] });
  }
  try {
    // ✅ USA POOL COMPARTIDO - NO crea conexión individual
    const rows = await executeQueryForMultipleUsers(
      'SELECT id, descripcion FROM referencias WHERE marca_id = ?',
      [marca_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error en /referencias:', err);
    res.status(500).json({ success: false, message: 'Error al obtener referencias', error: err.message, data: [] });
  }
});

export default router;
