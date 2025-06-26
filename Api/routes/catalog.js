import express from 'express';
import { getConnection } from '../db.js';

const router = express.Router();

// Obtener marcas
router.get('/marcas', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM marca');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener marcas', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener referencias por marca (para el carrusel de referencias según la marca seleccionada)
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
    console.error('Error en /referencias:', err); // <-- Agrega este log
    res.status(500).json({ success: false, message: 'Error al obtener referencias', error: err.message, data: [] });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener descripción de PDV por código y user_id
router.get('/pdv-desc', async (req, res) => {
  const { codigo, user_id } = req.query;
  if (!codigo) {
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
    const [rows] = await conn.execute(query, params);
    if (rows.length > 0) {
      res.json({ success: true, ...rows[0] });
    } else {
      res.json({ success: false, message: 'No encontrado' });
    }
  } catch (err) {
    console.error('Error en /pdv-desc:', err);
    res.status(500).json({ success: false, message: 'Error al buscar PDV', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;