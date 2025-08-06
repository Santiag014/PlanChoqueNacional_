import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireMisteryShopper, logAccess } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuración de multer para guardar las fotos en /uploads/YYYY-MM-DD
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date();
    const folder = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const dayDir = path.join(uploadsDir, folder);

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });

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

// Endpoint: Lista de PDVs - solo para Mystery Shoppers autenticados
router.get('/pdvs', authenticateToken, requireMisteryShopper, logAccess, async (req, res) => {
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
      LEFT JOIN registros_mistery_shopper rms ON registro_servicios.id = rms.id_registro_pdv
      WHERE registro_servicios.kpi_precio = 1 AND registro_servicios.estado_agente_id = 2 AND rms.id IS NOT NULL
      GROUP BY registro_servicios.pdv_id
      ORDER BY registro_servicios.fecha_registro ASC;
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener PDVs', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Detalle de un PDV - solo para Mystery Shoppers autenticados
router.get('/pdv-detalle', authenticateToken, requireMisteryShopper, logAccess, async (req, res) => {
  const { id_registro_pdv } = req.query;
  if (!id_registro_pdv) return res.status(400).json({ success: false, message: 'Falta el parámetro id_registro_pdv' });
  
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT pv.id, pv.codigo, pv.descripcion as nombrePDV, pv.direccion, pv.coordenadas,
             u.name as asesor, a.descripcion as agente, rms.nro_visita,
             GROUP_CONCAT(re_prod.referencia_id) AS referencias,
             GROUP_CONCAT(re_prod.presentacion) AS presentaciones,
             GROUP_CONCAT(re_prod.precio_sugerido) AS precios_sugeridos,
             GROUP_CONCAT(re_prod.precio_real) AS precios_reales,
             GROUP_CONCAT(re_prod.cantidad_cajas) AS cantidades_cajas,
             GROUP_CONCAT(re_prod.conversion_galonaje) AS galonajes
      FROM registro_servicios r_pdv
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      INNER JOIN registro_productos re_prod ON re_prod.registro_id = r_pdv.id
      LEFT JOIN users u ON pv.user_id = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      LEFT JOIN registros_mistery_shopper rms ON r_pdv.id = rms.id_registro_pdv
      WHERE r_pdv.id = ?
      GROUP BY pv.id, pv.codigo, pv.descripcion, pv.direccion, pv.coordenadas,
               u.name, a.descripcion, rms.nro_visita
      LIMIT 1
    `, [id_registro_pdv]);
    
    if (rows.length > 0) {
      const registro = rows[0];
      
      // Extraer lat/lng de la columna coordenadas
      let lat = null, lng = null;
      if (registro.coordenadas) {
        const parts = registro.coordenadas.split(',');
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
        }
      }

      // Procesar productos en formato de array para la tabla
      const productos = [];
      if (registro.referencias) {
        const referencias = registro.referencias.split(',');
        const presentaciones = registro.presentaciones ? registro.presentaciones.split(',') : [];
        const preciosSugeridos = registro.precios_sugeridos ? registro.precios_sugeridos.split(',') : [];
        const preciosReales = registro.precios_reales ? registro.precios_reales.split(',') : [];
        const cantidades = registro.cantidades_cajas ? registro.cantidades_cajas.split(',') : [];
        const galonajes = registro.galonajes ? registro.galonajes.split(',') : [];

        referencias.forEach((ref, index) => {
          productos.push({
            referencia: ref.trim(),
            presentacion: presentaciones[index] ? presentaciones[index].trim() : 'N/A',
            precio_sugerido: preciosSugeridos[index] ? parseFloat(preciosSugeridos[index].trim()) : 0,
            precio_real: preciosReales[index] ? parseFloat(preciosReales[index].trim()) : 0,
            cantidad_cajas: cantidades[index] ? parseInt(cantidades[index].trim()) : 0,
            galonaje: galonajes[index] ? parseFloat(galonajes[index].trim()) : 0
          });
        });
      }
      
      res.json({
        success: true,
        data: {
          id: registro.id,
          codigo: registro.codigo,
          nombrePDV: registro.nombrePDV,
          direccion: registro.direccion,
          coordenadas: registro.coordenadas,
          asesor: registro.asesor,
          agente: registro.agente,
          nro_visita: registro.nro_visita,
          lat,
          lng,
          productos: productos,
          total_productos: productos.length
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

// Endpoint: Guardar hallazgo y fotos - solo para Mystery Shoppers autenticados
router.post('/guardar-hallazgo', authenticateToken, requireMisteryShopper, logAccess, upload.array('fotos', 10), async (req, res) => {
  let conn;
  try {
    const { pdv_id, hallazgos, user_id, nro_visita, estado_productos } = req.body;
    
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

    conn = await getConnection();
    
    // Iniciar transacción para asegurar consistencia
    await conn.beginTransaction();

    try {
      // 1. Insertar en registros_mistery_shopper
      const [resultHallazgo] = await conn.execute(
        `INSERT INTO registros_mistery_shopper 
          (id_registro_pdv, id_user, hallazgo, nro_visita, id_estado, created_at, update_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [pdv_id, user_id, hallazgos || '', nro_visita || 1, estado_productos === 'aceptado' ? 1 : 2]
      );

      const idRegistroShopper = resultHallazgo.insertId;

      // 2. Insertar múltiples fotos en registro_fotografico_shopper
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fotoUrl = `/uploads/${folder}/${file.filename}`;
          
          await conn.execute(
            `INSERT INTO registro_fotografico_shopper 
              (id_registro, foto_seguimiento) 
             VALUES (?, ?)`,
            [idRegistroShopper, fotoUrl]
          );
        }
      }

      // Confirmar transacción
      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Reporte guardado correctamente', 
        data: { 
          id_registro: idRegistroShopper,
          fotos_guardadas: req.files ? req.files.length : 0,
          estado_productos: estado_productos
        } 
      });

    } catch (transactionError) {
      // Rollback en caso de error
      await conn.rollback();
      throw transactionError;
    }
    
  } catch (err) {
    console.error('Error al guardar reporte:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar reporte', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Obtener historial de hallazgos del usuario autenticado
router.get('/historial-hallazgos/:user_id', authenticateToken, requireMisteryShopper, logAccess, async (req, res) => {
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
        rms.id,
        rms.id_registro_pdv,
        rms.id_user,
        rms.foto_reporte,
        rms.hallazgo,
        rms.nro_visita,
        rms.created_at as fecha_hallazgo,
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion as direccion_pdv,
        u.name as nombre_usuario,
        a.descripcion as agente
      FROM registros_mistery_shopper rms
      INNER JOIN registros_pdv r_pdv ON rms.id_registro_pdv = r_pdv.id
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      LEFT JOIN users u ON rms.id_user = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      WHERE rms.id_user = ?
      ORDER BY rms.created_at DESC
    `;
    
    const [rows] = await conn.execute(query, [user_id]);
    
    // Procesar datos para enviar respuesta limpia
    const hallazgosProcesados = rows.map(row => ({
      id: row.id,
      codigo_pdv: row.codigo_pdv,
      nombre_pdv: row.nombre_pdv,
      direccion_pdv: row.direccion_pdv,
      agente: row.agente,
      hallazgo: row.hallazgo,
      nro_visita: row.nro_visita,
      fecha_hallazgo: row.fecha_hallazgo,
      foto_reporte: row.foto_reporte
    }));
    
    res.json({
      success: true,
      data: hallazgosProcesados,
      total: hallazgosProcesados.length
    });
    
  } catch (err) {
    console.error('Error obteniendo historial de hallazgos:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial de hallazgos', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint: Obtener detalles específicos de un hallazgo
router.get('/hallazgo-detalles/:hallazgo_id', authenticateToken, requireMisteryShopper, logAccess, async (req, res) => {
  const { hallazgo_id } = req.params;
  
  let conn;
  try {
    conn = await getConnection();
    
    // Verificar que el hallazgo pertenece al usuario autenticado
    const [hallazgoCheck] = await conn.execute(
      'SELECT id_user FROM registros_mistery_shopper WHERE id = ?', 
      [hallazgo_id]
    );
    
    if (hallazgoCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hallazgo no encontrado' 
      });
    }
    
    if (hallazgoCheck[0].id_user != req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para acceder a este hallazgo' 
      });
    }
    
    // Query completa para obtener todos los detalles del hallazgo
    const queryDetalles = `
      SELECT 
        rms.id,
        rms.id_registro_pdv,
        rms.id_user,
        rms.foto_reporte,
        rms.hallazgo,
        rms.nro_visita,
        rms.created_at as fecha_hallazgo,
        rms.update_at as fecha_actualizacion,
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
      FROM registros_mistery_shopper rms
      INNER JOIN registros_pdv r_pdv ON rms.id_registro_pdv = r_pdv.id
      INNER JOIN puntos_venta pv ON r_pdv.pdv_id = pv.id
      LEFT JOIN users u ON rms.id_user = u.id
      LEFT JOIN agente a ON pv.id_agente = a.id
      WHERE rms.id = ?
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [hallazgo_id]);
    
    if (detalles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Detalles del hallazgo no encontrados' 
      });
    }
    
    const hallazgo = detalles[0];
    
    // Extraer lat/lng de la columna coordenadas
    let lat = null, lng = null;
    if (hallazgo.coordenadas) {
      const parts = hallazgo.coordenadas.split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }
    
    res.json({
      success: true,
      data: {
        id: hallazgo.id,
        codigo_pdv: hallazgo.codigo_pdv,
        nombre_pdv: hallazgo.nombre_pdv,
        direccion_pdv: hallazgo.direccion_pdv,
        lat,
        lng,
        segmento: hallazgo.segmento,
        agente: hallazgo.agente,
        nombre_usuario: hallazgo.nombre_usuario,
        email_usuario: hallazgo.email_usuario,
        hallazgo: hallazgo.hallazgo,
        nro_visita: hallazgo.nro_visita,
        fecha_hallazgo: hallazgo.fecha_hallazgo,
        fecha_actualizacion: hallazgo.fecha_actualizacion,
        foto_reporte: hallazgo.foto_reporte,
        galonaje: hallazgo.galonaje,
        puntos_kpi: hallazgo.puntos_kpi,
        fecha_registro_pdv: hallazgo.fecha_registro_pdv
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo detalles del hallazgo:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener detalles del hallazgo', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint de diagnóstico para verificar autenticación de Mystery Shopper
router.get('/test-auth', authenticateToken, requireMisteryShopper, logAccess, async (req, res) => {
  res.json({
    success: true,
    message: 'Autenticación de Mystery Shopper funcionando correctamente',
    user: {
      userId: req.user.userId,
      email: req.user.email,
      tipo: req.user.tipo,
      nombre: req.user.nombre
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
