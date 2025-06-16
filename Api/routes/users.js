import express from 'express';
import { getConnection } from '../db.js';

const router = express.Router();

router.get('/roles', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM rol');
    conn.release();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener roles', error: err.message });
  }
});

router.get('/zonas', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM zona');
    conn.release();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener zonas', error: err.message });
  }
});

router.get('/regionales', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM regional');
    conn.release();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener regionales', error: err.message });
  }
});

router.get('/agentes', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, descripcion FROM agente');
    conn.release();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener agentes', error: err.message });
  }
});

export default router;
