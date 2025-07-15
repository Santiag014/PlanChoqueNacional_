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

// Alrededor de la línea 40, cambiar el JSON.parse por una función segura
const parseJSONSafely = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }
  // Si ya es un objeto, devolverlo tal como está
  return data;
};


// NUEVO ENDPOINT: Recibe el objeto completo como lo ves en el modal de detalles
router.post('/cargar-registros-visita', upload.any(), async (req, res) => {
  console.log('LLEGA A LA RUTA /cargar-registro-visita')
  let conn;
  try {
    // Cuando se usa FormData, los campos complejos llegan como string, hay que parsearlos
    let registro = req.body;
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    // Forzar que productos sea array aunque venga null/undefined
    if (!Array.isArray(registro.productos)) {
      registro.productos = [];
    }
    if (typeof registro.fotos === 'string') {
      try {
        registro.fotos = JSON.parse(registro.fotos);
      } catch (e) {
        registro.fotos = { factura: [], implementacion: [] };
      }
    }
    const { pdv_id, fecha, fotos, productos, user_id } = registro;
    if (!registro || typeof registro !== 'object') {
      return res.status(400).json({ success: false, message: 'El objeto de registro es inválido' });
    }
    if (!pdv_id) {
      return res.status(400).json({ success: false, message: 'Debe enviar el id del punto de venta' });
    }
    if (!fecha) {
      return res.status(400).json({ success: false, message: 'Debe enviar la fecha del registro' });
    }

    conn = await getConnection();

    // 1. Guardar foto de seguimiento en carpeta y obtener URL
    let fotoSeguimientoUrl = null;
    if (req.files && req.files.length > 0) {
      // Solo tomamos la primera foto subida (foto_seguimiento)
      const file = req.files.find(f => f.fieldname === 'foto_seguimiento');
      if (file) {
        // Guardar la ruta relativa para la BD
        const folder = new Date().toISOString().slice(0, 10);
        fotoSeguimientoUrl = `storage/${folder}/${file.filename}`;
      }
    }


    // 2. Insertar en registro_servicios SOLO frecuencia (kpi 3)
    let kpi_volumen = 0, kpi_precio = 0, kpi_frecuencia = 1;

    // Buscar el id real del PDV usando el código
    const codigo_pdv = pdv_id;
    const [rows] = await conn.execute('SELECT id FROM puntos_venta WHERE codigo = ? OR id = ?', [codigo_pdv, codigo_pdv]);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'El código o id de PDV no existe' });
    }
    const pdv_id_real = rows[0].id;

    // Insertar en registro_servicios
    const [servicioResult] = await conn.execute(
      `INSERT INTO registro_servicios (pdv_id, user_id, estado_id, estado_agente_id, kpi_volumen, kpi_frecuencia, kpi_precio, fecha_registro, created_at, updated_at)
      VALUES (?, ?, 1, 1, ?, ?, ?, ?, NOW()-7, NOW()-7)`,
      [pdv_id_real, user_id, kpi_volumen, kpi_frecuencia, kpi_precio, fecha]
    );
    const registro_id = servicioResult.insertId;

    // 3. Insertar foto en registro_fotografico_servicios (campo foto_seguimiento)
    if (fotoSeguimientoUrl) {
      await conn.execute(
        `INSERT INTO registro_fotografico_servicios (id_registro, foto_seguimiento) VALUES (?, ?)`,
        [registro_id, fotoSeguimientoUrl]
      );
    }

    // 4. Insertar puntos SOLO para frecuencia (kpi 3)
    let puntos = 1;
    await conn.execute(
      'INSERT INTO registro_puntos (id_visita, id_kpi, puntos) VALUES (?, ?, ?)',
      [registro_id, 3, puntos]
    );

    res.json({
      success: true,
      message: 'Registro guardado correctamente',
      registro_id
    });
  } catch (err) {
    console.error('Error en cargar-registro-pdv:', err);
    res.status(500).json({ success: false, message: 'Error al guardar el registro', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;