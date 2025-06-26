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

router.get('/zonas', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM zona');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener zonas', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

router.get('/regionales', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM regional');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener regionales', error: err.message });
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

export default router;
