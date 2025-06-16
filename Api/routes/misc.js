import express from 'express';
import { getConnection } from '../db.js';

const router = express.Router();

router.get('/check-db', async (req, res) => {
  try {
    const conn = await getConnection();
    conn.release();
    res.json({ connected: true, message: 'Conexión exitosa a la base de datos' });
  } catch (err) {
    res.status(500).json({ connected: false, message: 'Error de conexión', error: err.message });
  }
});

router.get('/tablas', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query('SHOW TABLES');
    conn.release();
    res.json({ success: true, tablas: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener tablas', error: err.message });
  }
});

export default router;
