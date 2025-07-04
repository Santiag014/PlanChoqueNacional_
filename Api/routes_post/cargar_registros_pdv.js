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

router.post('/cargar-registro-pdv', upload.single('foto'), async (req, res) => {
  let conn;
  try {
    const { codigoPDV, correspondeA, kpi, fecha, productos, userId } = req.body;
    const productosArr = parseJSONSafely(productos);

    // DEBUG: Log para ver qué está llegando
    console.log('🔍 DEBUG - KPI recibido:', kpi);
    console.log('🔍 DEBUG - Productos recibidos:', JSON.stringify(productosArr, null, 2));

    // Validar que los datos de entrada sean correctos
    if (!productosArr || !Array.isArray(productosArr)) {
      return res.status(400).json({
        success: false,
        message: 'Los productos deben ser un array válido'
      });
    }

    // Solo validar productos para KPIs que los requieren (Volumen y Precio)
    if ((kpi === 'Volumen' || kpi === 'Precio') && productosArr.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un producto para este KPI'
      });
    }

    // Validar que cada producto tenga los campos necesarios (solo si hay productos)
    if (productosArr.length > 0) {
      let productosValidos = false;
      
      console.log('🔍 DEBUG - Validando productos para KPI:', kpi);
      
      if (kpi === 'Volumen') {
        // Para Volumen: necesita id y cantidad
        console.log('🔍 DEBUG - Validación para Volumen: id y cantidad');
        productosValidos = productosArr.every(producto => {
          const valido = producto && 
                 typeof producto.id !== 'undefined' && 
                 typeof producto.cantidad !== 'undefined';
          console.log('🔍 DEBUG - Producto válido para Volumen:', valido, producto);
          return valido;
        });
      } else if (kpi === 'Precio') {
        // Para Precio: necesita id y precio (cantidad no es necesaria)
        console.log('🔍 DEBUG - Validación para Precio: id y precio');
        productosValidos = productosArr.every(producto => {
          const valido = producto && 
                 typeof producto.id !== 'undefined' && 
                 typeof producto.precio !== 'undefined';
          console.log('🔍 DEBUG - Producto válido para Precio:', valido, producto);
          return valido;
        });
      } else {
        // Para otros KPIs: solo necesita id
        console.log('🔍 DEBUG - Validación para otros KPIs: solo id');
        productosValidos = productosArr.every(producto => {
          const valido = producto && typeof producto.id !== 'undefined';
          console.log('🔍 DEBUG - Producto válido para otros KPIs:', valido, producto);
          return valido;
        });
      }

      console.log('🔍 DEBUG - Productos válidos:', productosValidos);

      if (!productosValidos) {
        let mensajeError = 'Todos los productos deben tener id';
        if (kpi === 'Volumen') {
          mensajeError = 'Todos los productos deben tener id y cantidad';
        } else if (kpi === 'Precio') {
          mensajeError = 'Todos los productos deben tener id y precio';
        }
        
        return res.status(400).json({
          success: false,
          message: mensajeError
        });
      }
    }

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
    conn = await getConnection();
    const [pdvRows] = await conn.execute(
      'SELECT id FROM puntos_venta WHERE codigo = ?',
      [codigoPDV]
    );
    if (!pdvRows.length) {
      return res.status(400).json({ success: false, message: 'PDV no encontrado' });
    }
    const pdv_id = pdvRows[0].id;

    // Buscar el id y puntos del KPI
    const [kpiRows] = await conn.execute(
      'SELECT id FROM kpi WHERE descripcion = ?',
      [kpi]
    );
    if (!kpiRows.length) {
      return res.status(400).json({ success: false, message: 'KPI no encontrado' });
    }
    const kpi_id = kpiRows[0].id;

    // Calcular galonaje total (solo para Volumen)
    let galonaje = 0;
    if (kpi === 'Volumen') {
      galonaje = productosArr.reduce((sum, p) => sum + Number(p.galones), 0);
    } else {
      galonaje = null;
    }

    // Obtener meta del PDV para calcular puntos
    const [pdvMeta] = await conn.execute(
      'SELECT meta_volumen FROM puntos_venta WHERE id = ?',
      [pdv_id]
    );
    const meta_volumen = pdvMeta[0]?.meta_volumen || 0;

    // Calcular puntos según el tipo de KPI
    let puntos_calculados = 0;
    if (kpi === 'Volumen') {
      // KPI de VOLUMEN: porcentaje de meta * 200
      if (meta_volumen > 0 && galonaje > 0) {
        const porcentaje = (galonaje / meta_volumen);
        puntos_calculados = Math.round(porcentaje * 200);
      }
    } else if (kpi === 'Precio') {
      // KPI de PRECIO: 2 puntos por registro
      puntos_calculados = 2;
    } else if (kpi === 'Frecuencia') {
      // KPI de FRECUENCIA: 1 punto por registro
      puntos_calculados = 1;
    } else if (kpi === 'Cobertura') {
      // KPI de COBERTURA: 3 puntos por registro (nuevo PDV visitado)
      puntos_calculados = 3;
    } else if (kpi === 'Profundidad') {
      // KPI de PROFUNDIDAD: 2 puntos por registro (productos registrados)
      puntos_calculados = 2;
    }

    // Insertar en registros_pdv (tabla maestra) con tipo_kpi y puntos calculados
    const [result] = await conn.execute(
      `INSERT INTO registros_pdv 
        (pdv_id, user_id, foto_factura, galonaje, created_at, update_at, estado_id, estado_agente_id, kpi_id, puntos_kpi) 
        VALUES (?, ?, ?, ?, NOW(), NOW(), 1, 1, ?, ?)`,
      [pdv_id, userId, fotoUrl, galonaje, kpi_id, puntos_calculados]
    );
    const registro_id = result.insertId;

    // Insertar productos en productos_registros_pdv (tabla hijos) solo si hay productos
    if (productosArr.length > 0) {
      for (const prod of productosArr) {
        // Normaliza los valores para evitar undefined
        const referencia_id = prod.id ?? null;
        const presentacion = prod.presentacion ?? null;
        const cantidad = prod.cantidad ?? null;
        const galones = prod.galones ?? null;
        const precio = prod.precio ?? null;

        if (kpi === 'Volumen') {
          await conn.execute(
            `INSERT INTO productos_registros_pdv 
              (registro_id, referencia_id, presentacion, cantidad, conversion_galonaje) 
              VALUES (?, ?, ?, ?, ?)`,
            [registro_id, referencia_id, presentacion, cantidad, galones]
          );
        } else if (kpi === 'Precio') {
          await conn.execute(
            `INSERT INTO productos_registros_pdv 
              (registro_id, referencia_id, presentacion, cantidad, conversion_galonaje, precio) 
              VALUES (?, ?, ?, NULL, NULL, ?)`,
            [registro_id, referencia_id, presentacion, precio]
          );
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'Registro guardado correctamente', 
      fotoUrl,
      registro_id,
      puntos_calculados,
      kpi_tipo: kpi,
      galonaje_registrado: galonaje,
      meta_pdv: meta_volumen
    });
  } catch (err) {
    console.error('Error en cargar-registro-pdv:', err);
    res.status(500).json({ success: false, message: 'Error al guardar el registro', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
