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
  let conn;
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

    conn = await getConnection();

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
    if (req.files && req.files.length > 0) {
      const fotoRemisionFile = req.files.find(f => f.fieldname === 'fotoRemision');
      if (fotoRemisionFile) {
        const folder = new Date().toISOString().slice(0, 10);
        fotoRemisionUrl = `/uploads/${folder}/${fotoRemisionFile.filename}`;
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

    // 5. Procesar productos con sus fotos
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        // Buscar la foto correspondiente a este producto
        let fotoProductoUrl = null;
        if (req.files && req.files.length > 0) {
          // Buscar foto de implementación usando diferentes estrategias
          const nombreProducto = producto.nombre;
          const fotoProductoFile = req.files.find(f => {
            console.log(`🔍 Buscando foto para producto "${nombreProducto}", checking fieldname: "${f.fieldname}"`);
            return (
              // Buscar por fieldname específico de implementación
              f.fieldname === `foto_implementacion_${nro_implementacion}` ||
              // Buscar por nombre exacto del producto
              f.fieldname === nombreProducto ||
              // Buscar por variaciones del nombre
              f.fieldname === `foto_${nombreProducto}` || 
              f.fieldname === `producto_${nombreProducto}` ||
              f.fieldname.includes(nombreProducto.replace(/[^a-zA-Z0-9]/g, '')) ||
              // Buscar por coincidencia parcial
              f.fieldname.includes('implementacion') ||
              f.fieldname.includes('Implementacion') ||
              // NUEVO: Buscar por patrón con codificación mal formada
              f.fieldname.includes('ImplementaciÃ³n') ||
              f.fieldname.includes(`ImplementaciÃ³n ${nro_implementacion}`) ||
              // Buscar cualquier archivo que no sea fotoRemision (como fallback)
              (f.fieldname !== 'fotoRemision' && f.fieldname.includes(nro_implementacion))
            );
          });
          
          if (fotoProductoFile) {
            const folder = new Date().toISOString().slice(0, 10);
            fotoProductoUrl = `/uploads/${folder}/${fotoProductoFile.filename}`;
            console.log(`📸 Foto de producto "${nombreProducto}" encontrada y guardada: ${fotoProductoFile.path}`);
            console.log(`🗃️ Ruta en BD: ${fotoProductoUrl}`);
          } else {
            console.log(`⚠️ No se encontró foto para producto "${nombreProducto}"`);
            console.log(`📋 Archivos disponibles:`, req.files.map(f => f.fieldname));
          }
        }

        // Insertar producto en registros_implementacion_productos
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
            fotoProductoUrl
          ]
        );
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
    console.error('Stack trace:', err.stack);
    console.error('Request details:', {
      body: req.body,
      files: req.files?.map(f => ({ fieldname: f.fieldname, filename: f.filename, size: f.size })),
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type']
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
