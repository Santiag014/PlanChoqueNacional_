import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getConnection } from '../db.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', new Date().toISOString().slice(0, 10));
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Verificar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

/**
 * Endpoint para cargar registros de visitas del Jefe de Zona
 * Guarda en la tabla registro_servicios_jfz
 */
router.post('/cargar_registros_visitas_jfz', upload.single('foto_seguimiento'), async (req, res) => {
  let conn;
  
  try {
    // Validar que se recibió el archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'La foto de seguimiento es requerida'
      });
    }

    // Obtener datos del cuerpo de la petición
    const { codigo_pdv, fecha_registro, user_id } = req.body;

    // Validaciones básicas
    if (!codigo_pdv) {
      return res.status(400).json({
        success: false,
        message: 'El código del PDV es requerido'
      });
    }

    if (!fecha_registro) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de registro es requerida'
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del usuario es requerido'
      });
    }

    conn = await getConnection();

    // Buscar el PDV por código para obtener su ID
    const [pdvQuery] = await conn.execute(`
      SELECT id, codigo, descripcion 
      FROM puntos_venta 
      WHERE codigo = ?
    `, [codigo_pdv]);

    if (pdvQuery.length === 0) {
      // Eliminar archivo subido si el PDV no existe
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Punto de venta no encontrado'
      });
    }

    const pdv = pdvQuery[0];

    // Preparar la ruta de la imagen (relativa para guardar en BD)
    const fotoPath = req.file.path.replace(/\\/g, '/');
    const fotoRelativa = fotoPath.replace(/.*uploads\//, '');

    // Insertar registro en la tabla registro_servicios_jfz
    const [insertResult] = await conn.execute(`
      INSERT INTO registro_servicios_jfz (
        pdv_id,
        user_id,
        fecha_registro,
        foto_seguimiento,
        created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `, [
      pdv.id,
      user_id,
      fecha_registro,
      fotoRelativa
    ]);

    // Log de éxito
    logger.info(`Registro de visita JFZ creado - ID: ${insertResult.insertId}, PDV: ${codigo_pdv}, Usuario: ${user_id}`);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Registro de visita guardado exitosamente',
      data: {
        id: insertResult.insertId,
        pdv_id: pdv.id,
        codigo_pdv: codigo_pdv,
        nombre_pdv: pdv.descripcion,
        user_id: user_id,
        fecha_registro: fecha_registro,
        foto_seguimiento: fotoRelativa,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    // Log del error
    logger.error('Error al cargar registro de visita JFZ:', error);

    // Eliminar archivo subido en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error al eliminar archivo:', unlinkError);
      }
    }

    // Respuesta de error
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el registro',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
});

/**
 * Endpoint para obtener registros de visitas del Jefe de Zona
 * Útil para mostrar historial o validaciones
 */
router.get('/obtener_registros_visitas_jfz/:user_id', async (req, res) => {
  let conn;
  
  try {
    const { user_id } = req.params;
    const { limite = 50, offset = 0, fecha_inicio, fecha_fin } = req.query;

    conn = await getConnection();

    // Construir query dinámico
    let whereClause = 'WHERE rsj.user_id = ?';
    let queryParams = [user_id];

    if (fecha_inicio) {
      whereClause += ' AND DATE(rsj.fecha_registro) >= ?';
      queryParams.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereClause += ' AND DATE(rsj.fecha_registro) <= ?';
      queryParams.push(fecha_fin);
    }

    const query = `
      SELECT 
        rsj.id,
        rsj.pdv_id,
        rsj.user_id,
        rsj.fecha_registro,
        rsj.foto_seguimiento,
        rsj.created_at,
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion,
        pv.ciudad,
        u.nombre as usuario_nombre
      FROM registro_servicios_jfz rsj
      INNER JOIN puntos_venta pv ON pv.id = rsj.pdv_id
      INNER JOIN users u ON u.id = rsj.user_id
      ${whereClause}
      ORDER BY rsj.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limite), parseInt(offset));

    const [registros] = await conn.execute(query, queryParams);

    res.json({
      success: true,
      data: registros,
      total: registros.length,
      limite: parseInt(limite),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Error al obtener registros de visitas JFZ:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros de visitas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
});

export default router;
