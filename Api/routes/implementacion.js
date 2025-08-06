import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireImplementacion, logAccess } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

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

// Endpoint: Lista de PDVs - solo para usuarios de Implementación autenticados
router.get('/pdvs', authenticateToken, requireImplementacion, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        pv.codigo, 
        a.descripcion as agente,
        registro_servicios.fecha_registro as fecha,
        registro_servicios.id as id_registro_pdv
      FROM puntos_venta pv
      LEFT JOIN agente a ON pv.id_agente = a.id
      INNER JOIN registro_servicios ON registro_servicios.pdv_id = pv.id
      WHERE registro_servicios.kpi_precio = 1;
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener PDVs', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Detalle de un PDV - solo para usuarios de Implementación autenticados
router.get('/pdv-detalle', authenticateToken, requireImplementacion, logAccess, async (req, res) => {
  const { id_registro_pdv } = req.query;
  if (!id_registro_pdv) return res.status(400).json({ success: false, message: 'Falta el parámetro id_registro_pdv' });
  
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT pv.id, pv.codigo, pv.descripcion as nombrePDV, pv.direccion, pv.coordenadas,
             u.name as asesor, a.descripcion as agente, rim.nro_visita
      FROM registros_pdv r_pdv
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      LEFT JOIN users u ON pv.user_id = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      LEFT JOIN registros_implementacion rim ON r_pdv.id = rim.id_registro_pdv
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
        success: true,
        data: {
          ...rows[0],
          lat,
          lng
        }
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

// Endpoint: Guardar implementación y foto - solo para usuarios de Implementación autenticados
router.post('/guardar-implementacion', authenticateToken, requireImplementacion, logAccess, upload.single('foto'), async (req, res) => {
  let conn;
  try {
    const { pdv_id, observaciones, user_id, nro_visita } = req.body;
    
    // Verificar que el usuario solo puede enviar datos con su propio user_id
    if (req.user.userId != user_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para enviar datos de otro usuario' 
      });
    }
    
    if (!pdv_id || !user_id) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros obligatorios' });
    }

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
      `INSERT INTO registros_implementacion 
        (id_registro_pdv, id_user, foto_reporte, observaciones, nro_visita, created_at, update_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [pdv_id, user_id, fotoUrl, observaciones, nro_visita || null]
    );
    
    res.json({ 
      success: true, 
      message: 'Implementación guardada correctamente', 
      data: { fotoUrl } 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar implementación', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Obtener historial de implementaciones del usuario autenticado
router.get('/historial-implementaciones/:user_id', authenticateToken, requireImplementacion, logAccess, async (req, res) => {
  const { user_id } = req.params;
  
  // Verificar que el usuario solo puede acceder a sus propios datos
  if (req.user.userId != user_id) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para acceder a los datos de otro usuario' 
    });
  }

  let conn;
  try {
    conn = await getConnection();
    
    const query = `
      SELECT 
        rim.id,
        rim.id_registro_pdv,
        rim.id_user,
        rim.foto_reporte,
        rim.observaciones,
        rim.nro_visita,
        rim.created_at as fecha_implementacion,
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion as direccion_pdv,
        u.name as nombre_usuario,
        a.descripcion as agente
      FROM registros_implementacion rim
      INNER JOIN registros_pdv r_pdv ON rim.id_registro_pdv = r_pdv.id
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      LEFT JOIN users u ON rim.id_user = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      WHERE rim.id_user = ?
      ORDER BY rim.created_at DESC
    `;
    
    const [rows] = await conn.execute(query, [user_id]);
    
    // Procesar datos para enviar respuesta limpia
    const implementacionesProcesadas = rows.map(row => ({
      id: row.id,
      codigo_pdv: row.codigo_pdv,
      nombre_pdv: row.nombre_pdv,
      direccion_pdv: row.direccion_pdv,
      agente: row.agente,
      observaciones: row.observaciones,
      nro_visita: row.nro_visita,
      fecha_implementacion: row.fecha_implementacion,
      foto_reporte: row.foto_reporte
    }));
    
    res.json({
      success: true,
      data: implementacionesProcesadas,
      total: implementacionesProcesadas.length
    });
    
  } catch (err) {
    console.error('Error obteniendo historial de implementaciones:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial de implementaciones', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Obtener detalles específicos de una implementación
router.get('/implementacion-detalles/:implementacion_id', authenticateToken, requireImplementacion, logAccess, async (req, res) => {
  const { implementacion_id } = req.params;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar que la implementación pertenece al usuario autenticado
    const [implementacionCheck] = await conn.execute(
      'SELECT id_user FROM registros_implementacion WHERE id = ?', 
      [implementacion_id]
    );
    
    if (implementacionCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Implementación no encontrada' 
      });
    }
    
    if (implementacionCheck[0].id_user != req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para acceder a esta implementación' 
      });
    }
    
    // Query completa para obtener todos los detalles de la implementación
    const queryDetalles = `
      SELECT 
        rim.id,
        rim.id_registro_pdv,
        rim.id_user,
        rim.foto_reporte,
        rim.observaciones,
        rim.nro_visita,
        rim.created_at as fecha_implementacion,
        rim.update_at as fecha_actualizacion,
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion as direccion_pdv,
        pv.coordenadas,
        pv.segmento,
        u.name as nombre_usuario,
        u.email as email_usuario,
        a.descripcion as agente,
        r_pdv.galonaje,
        r_pdv.puntos_kpi,
        r_pdv.created_at as fecha_registro_pdv
      FROM registros_implementacion rim
      INNER JOIN registros_pdv r_pdv ON rim.id_registro_pdv = r_pdv.id
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      LEFT JOIN users u ON rim.id_user = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      WHERE rim.id = ?
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [implementacion_id]);
    
    if (detalles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Detalles de la implementación no encontrados' 
      });
    }
    
    const implementacion = detalles[0];
    
    // Extraer lat/lng de la columna coordenadas
    let lat = null, lng = null;
    if (implementacion.coordenadas) {
      const parts = implementacion.coordenadas.split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }
    
    res.json({
      success: true,
      data: {
        id: implementacion.id,
        codigo_pdv: implementacion.codigo_pdv,
        nombre_pdv: implementacion.nombre_pdv,
        direccion_pdv: implementacion.direccion_pdv,
        lat,
        lng,
        segmento: implementacion.segmento,
        agente: implementacion.agente,
        nombre_usuario: implementacion.nombre_usuario,
        email_usuario: implementacion.email_usuario,
        observaciones: implementacion.observaciones,
        nro_visita: implementacion.nro_visita,
        fecha_implementacion: implementacion.fecha_implementacion,
        fecha_actualizacion: implementacion.fecha_actualizacion,
        foto_reporte: implementacion.foto_reporte,
        galonaje: implementacion.galonaje,
        puntos_kpi: implementacion.puntos_kpi,
        fecha_registro_pdv: implementacion.fecha_registro_pdv
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo detalles de la implementación:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener detalles de la implementación', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
