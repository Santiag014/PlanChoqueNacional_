import express from 'express';
import path from 'path';
import fs from 'fs';
import { getConnection } from '../db.js';
import { upload } from '../config/multer.js';
import { buildFileUrl, getCurrentStorageConfig } from '../config/storage.js';

const router = express.Router();

// Función para parsear JSON de forma segura
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

// ENDPOINT: Cargar registros de implementación
router.post('/cargar-registros-implementacion', upload.any(), async (req, res) => {
  console.log('LLEGA A LA RUTA /cargar-registros-implementacion');
  try {
    // Cuando se usa FormData, los campos complejos llegan como string, hay que parsearlos
    let registro = req.body;
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    
    // Parsear campos complejos si vienen como string
    if (typeof registro.productos === 'string') {
      try {
        registro.productos = JSON.parse(registro.productos);
      } catch (e) {
        registro.productos = [];
      }
    }
    
    // Forzar que productos sea array aunque venga null/undefined
    if (!Array.isArray(registro.productos)) {
      registro.productos = [];
    }

    const { 
      pdv_id, 
      fecha, 
      user_id, 
      nro_implementacion, 
      acepto_implementacion, 
      observacion_implementacion,
      productos,
      fotoRemision 
    } = registro;
    
    // Validaciones básicas
    if (!registro || typeof registro !== 'object') {
      return res.status(400).json({ success: false, message: 'El objeto de registro es inválido' });
    }
    if (!pdv_id) {
      return res.status(400).json({ success: false, message: 'Debe enviar el id del punto de venta' });
    }
    if (!fecha) {
      return res.status(400).json({ success: false, message: 'Debe enviar la fecha del registro' });
    }
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Debe enviar el id del usuario' });
    }
    if (!nro_implementacion) {
      return res.status(400).json({ success: false, message: 'Debe enviar el número de implementación' });
    }
    
    // 🚨 RESTRICCIÓN BACKEND: Comentarios OBLIGATORIOS
    if (!observacion_implementacion || !observacion_implementacion.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Los comentarios son obligatorios para cargar la implementación. Por favor ingresa una observación.',
        error_type: 'COMENTARIOS_OBLIGATORIOS'
      });
    }

    const conn = await getConnection();

    // 1. Buscar el id real del PDV usando el código
    const codigo_pdv = pdv_id;
    const [rows] = await conn.execute('SELECT id FROM puntos_venta WHERE codigo = ?', [codigo_pdv]);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'El código o id de PDV no existe' });
    }
    const pdv_id_real = rows[0].id;

    // 2. Crear registro en registro_servicios
    const [servicioResult] = await conn.execute(
      `INSERT INTO registro_servicios (
        pdv_id, 
        user_id, 
        fecha_registro, 
        estado_id, 
        estado_agente_id, 
        validacion_ia, 
        observacion, 
        observacion_agente, 
        kpi_volumen, 
        kpi_frecuencia, 
        kpi_precio, 
        IsImplementacion, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, 1, 1, NULL, NULL, NULL, 0, 1, 0, 1, NOW(), NULL)`,
      [pdv_id_real, user_id, fecha]
    );
    const registro_id = servicioResult.insertId;

    // 3. Procesar foto de remisión si existe
    let fotoRemisionUrl = null;
    let fotoRemisionHash = null;
    const md5File = (await import('md5-file')).default;
    if (req.files && req.files.length > 0) {
      const fotoRemisionFile = req.files.find(f => f.fieldname === 'fotoRemision');
      if (fotoRemisionFile) {
        const folder = new Date().toISOString().slice(0, 10);
        fotoRemisionUrl = `/uploads/${folder}/${fotoRemisionFile.filename}`;
        fotoRemisionHash = await md5File(fotoRemisionFile.path);
        
        // Desactivar la caché del navegador para la foto de remisión
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        console.log(`📸 Foto de remisión guardada: ${fotoRemisionFile.path}`);
        console.log(`🗃️ Ruta en BD: ${fotoRemisionUrl}`);
      }
    }

    // 4. Crear registro en registros_implementacion
    const [implementacionResult] = await conn.execute(
      `INSERT INTO registros_implementacion (
        id_registro, 
        nro_implementacion, 
        acepto_implementacion, 
        observacion,
        foto_remision
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        registro_id, 
        nro_implementacion, 
        acepto_implementacion || 'No', 
        observacion_implementacion || null,
        fotoRemisionUrl
      ]
    );
    const implementacion_id = implementacionResult.insertId;

    // 5. Procesar productos con sus fotos - FIX: Evitar duplicación de imágenes
    if (productos && productos.length > 0) {
      // PASO 1: Buscar la foto de implementación UNA SOLA VEZ
      let fotoImplementacionUrl = null;
      let fotoImplementacionHash = null;
      if (req.files && req.files.length > 0) {
        // FIX: Búsqueda estricta y sin ambigüedades para evitar "race conditions".
        // Se busca el nombre de campo exacto que envía el frontend.
        const fieldnameImplementacion = `foto_implementacion_${nro_implementacion}`;
        const fotoImplementacionFile = req.files.find(f => f.fieldname === fieldnameImplementacion);
        
        if (fotoImplementacionFile) {
          const folder = new Date().toISOString().slice(0, 10);
          fotoImplementacionUrl = `/uploads/${folder}/${fotoImplementacionFile.filename}`;
          fotoImplementacionHash = await md5File(fotoImplementacionFile.path);
          
          // Desactivar la caché del navegador para la foto de implementación
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          console.log(`📸 Foto de implementación encontrada: ${fotoImplementacionFile.path}`);
          console.log(`🗃️ Ruta en BD: ${fotoImplementacionUrl}`);
          // 🚨 VALIDACIÓN BACKEND: Verificar si es la misma foto que la remisión (por hash)
          if (fotoRemisionUrl && fotoImplementacionHash && fotoRemisionHash && fotoImplementacionHash === fotoRemisionHash) {
            console.warn('⚠️⚠️⚠️ BACKEND DETECTÓ DUPLICACIÓN: La misma foto (contenido) se está usando para implementación y remisión!');
            console.warn(`Archivo duplicado: ${fotoImplementacionUrl}`);
            console.warn('Archivos recibidos:', req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename }))); 
            // 🛑 RECHAZAR el registro con duplicación
            await conn.rollback();
            return res.status(400).json({ 
              success: false, 
              message: 'Error: No puedes usar la misma foto para la implementación y la remisión (mismo archivo). Por favor selecciona fotos diferentes.',
              error_type: 'FOTO_DUPLICADA'
            });
          }
        } else {
          console.log(`⚠️ No se encontró foto de implementación para número: ${nro_implementacion}`);
          console.log(`📋 Se esperaba el campo '${fieldnameImplementacion}'. Archivos disponibles:`, req.files.map(f => f.fieldname));
        }
      }

      // PASO 2: Insertar cada producto con la MISMA foto (evita duplicación)
      for (const producto of productos) {
        await conn.execute(
          `INSERT INTO registros_implementacion_productos (
            id_registro_implementacion, 
            nombre_producto, 
            nro, 
            foto_evidencia
          ) VALUES (?, ?, ?, ?)`,
          [
            implementacion_id,
            producto.nombre,
            producto.cantidad || 0,
            fotoImplementacionUrl  // Misma foto para todos los productos
          ]
        );
        
        console.log(`✅ Producto "${producto.nombre}" insertado con foto: ${fotoImplementacionUrl ? 'SI' : 'NO'}`);
      }
    }

    res.json({
      success: true,
      message: 'Registro de implementación guardado correctamente',
      registro_id,
      implementacion_id
    });

  } catch (err) {
    console.error('Error en cargar-registros-implementacion:', err);
    console.error('Detalles del error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
      // Agrega más detalles si es necesario para depurar
    });
    
    // Mensajes de error más específicos para implementaciones
    let errorMessage = 'Error al guardar la implementación';
    if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Error de conexión a la base de datos';
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Error en la estructura de la base de datos';
    } else if (err.message.includes('Duplicate entry')) {
      errorMessage = 'Ya existe una implementación con estos datos';
    } else if (err.code === 'ENOENT') {
      errorMessage = 'Error al guardar las fotografías';
    } else if (err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Error en los campos de la base de datos';
    }

    
    res.status(500).json({ 
      success: false, 
      message: errorMessage, 
      error: err.message,
      // Solo en desarrollo
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
   } finally {
    if (conn) conn.release();
  }
});

export default router;
