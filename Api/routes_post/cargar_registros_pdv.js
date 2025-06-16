import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getConnection } from '../db.js';

const router = express.Router();

// Configuración de multer para guardar la foto en /public/storage/YYYY-MM-DD
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date();
    const folder = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const publicDir = path.join(process.cwd(), 'public');
    const storageDir = path.join(publicDir, 'storage');
    const dayDir = path.join(storageDir, folder);

    // Crea las carpetas si no existen
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

router.post('/cargar-registro-pdv', upload.single('foto'), async (req, res) => {
  try {
    const { codigoPDV, correspondeA, kpi, fecha, productos, userId } = req.body;
    const productosArr = JSON.parse(productos);

    // Carpeta del día
    const today = new Date();
    const folder = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // URL pública de la foto
    let fotoUrl = null;
    if (req.file) {
      // Solo la ruta relativa, sin host
      fotoUrl = `storage/${folder}/${req.file.filename}`;
    }

    // Buscar el id del PDV
    const conn = await getConnection();
    const [pdvRows] = await conn.execute(
      'SELECT id FROM puntos_venta WHERE codigo = ?',
      [codigoPDV]
    );
    if (!pdvRows.length) {
      conn.release();
      return res.status(400).json({ success: false, message: 'PDV no encontrado' });
    }
    const pdv_id = pdvRows[0].id;

    // Buscar el id y puntos del KPI
    const [kpiRows] = await conn.execute(
      'SELECT id, puntos FROM kpi WHERE descripcion = ?',
      [kpi]
    );
    if (!kpiRows.length) {
      conn.release();
      return res.status(400).json({ success: false, message: 'KPI no encontrado' });
    }
    const kpi_id = kpiRows[0].id;
    const kpi_puntos = kpiRows[0].puntos;

    // Calcular galonaje total
    const galonaje = productosArr.reduce((sum, p) => sum + Number(p.galones), 0);

    // Insertar en registros_pdv (tabla maestra)
    const [result] = await conn.execute(
      `INSERT INTO registros_pdv 
        (pdv_id, user_id, foto_factura, galonaje, created_at, update_at, estado_id, estado_agente_id, kpi_id, puntos_kpi) 
        VALUES (?, ?, ?, ?, NOW(), NOW(), 1, 1, ?, 0)`,
      [pdv_id, userId, fotoUrl, galonaje, kpi_id]
    );
    const registro_id = result.insertId;

    // Insertar productos en productos_registros_pdv (tabla hijos)
    for (const prod of productosArr) {
      await conn.execute(
        `INSERT INTO productos_registros_pdv 
          (registro_id, referencia_id, presentacion, cantidad, conversion_galonaje) 
          VALUES (?, ?, ?, ?, ?)`,
        [registro_id, prod.id, prod.presentacion, prod.cantidad, prod.galones]
      );
    }

    conn.release();
    res.json({ success: true, message: 'Registro guardado correctamente', fotoUrl });
  } catch (err) {
    console.error('Error en cargar-registro-pdv:', err);
    res.status(500).json({ success: false, message: 'Error al guardar el registro', error: err.message });
  }
});

export default router;
