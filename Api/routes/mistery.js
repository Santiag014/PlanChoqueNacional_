import express from 'express';
import { getConnection } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Endpoint: Lista de PDVs
router.get('/pdvs', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        pv.codigo, 
        a.descripcion as agente,
        r_pdv.created_at as fecha,
        r_pdv.id as id_registro_pdv
      FROM puntos_venta pv
      LEFT JOIN agente a ON pv.id_agente = a.id
      INNER JOIN registros_pdv r_pdv ON r_pdv.pdv_id = pv.id
      WHERE r_pdv.kpi_id = 2
      ORDER BY pv.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener PDVs', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Detalle de un PDV
router.get('/pdv-detalle', async (req, res) => {
  const { id_registro_pdv } = req.query;
  if (!id_registro_pdv) return res.status(400).json({ success: false, message: 'Falta el parámetro id_registro_pdv' });
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT pv.id, pv.codigo, pv.descripcion as nombrePDV, pv.direccion, pv.coordenadas,
             u.name as asesor, a.descripcion as agente, rms.nro_visita
      FROM registros_pdv r_pdv
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      LEFT JOIN users u ON pv.user_id = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      LEFT JOIN registros_mistery_shopper rms ON r_pdv.id = rms.id_registro_pdv
      WHERE r_pdv.id = ?
      LIMIT 1
    `, [id_registro_pdv]);
    if (rows.length > 0) {
      // Extraer lat/lng de la columna coordenadas
      let lat = null, lng = null;
      if (rows[0].coordenadas) {
        const parts = rows[0].coordenadas.split(',');
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
        }
      }
      res.json({
        ...rows[0],
        lat,
        lng
      });
    } else {
      res.status(404).json({ success: false, message: 'PDV no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener detalle', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Configuración de multer para guardar la foto en /public/storage/YYYY-MM-DD
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date();
    const folder = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const publicDir = path.join(process.cwd(), 'public');
    const storageDir = path.join(publicDir, 'storage');
    const dayDir = path.join(storageDir, folder);

    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir);

    cb(null, dayDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const now = new Date();
    const timestamp = Date.now();
    const hora = now.toTimeString().slice(0,8).replace(/:/g, '-'); // HH-MM-SS
    const name = `${timestamp}-${hora}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Endpoint: Guardar hallazgo y foto
router.post('/guardar-hallazgo', upload.single('foto'), async (req, res) => {
  let conn;
  try {
    const { pdv_id, hallazgos, user_id, nro_visita } = req.body;
    if (!pdv_id || !user_id) return res.status(400).json({ success: false, message: 'Faltan parámetros obligatorios' });

    // Carpeta del día
    const today = new Date();
    const folder = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // URL pública de la foto
    let fotoUrl = null;
    if (req.file) {
      fotoUrl = `storage/${folder}/${req.file.filename}`;
    }

    conn = await getConnection();
    await conn.execute(
      `INSERT INTO registros_mistery_shopper 
        (id_registro_pdv, id_user, foto_reporte, hallazgo, nro_visita, created_at, update_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [pdv_id, user_id, fotoUrl, hallazgos, nro_visita || null]
    );
    res.json({ success: true, message: 'Hallazgo guardado correctamente', fotoUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al guardar hallazgo', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;