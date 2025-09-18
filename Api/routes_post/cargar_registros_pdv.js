import express from 'express';
import path from 'path';
import fs from 'fs';
import { getConnection } from '../db.js';
import { upload } from '../config/multer.js';
import { buildFileUrl, getCurrentStorageConfig } from '../config/storage.js';
import { enviarNotificacionComentarios } from '../config/email.js';

const router = express.Router();

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
router.post('/cargar-registro-pdv', upload.any(), async (req, res) => {
  console.log('LLEGA A LA RUTA /cargar-registro-pdv')
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
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe enviar al menos un producto' });
    }
    if (!pdv_id) {
      return res.status(400).json({ success: false, message: 'Debe enviar el id del punto de venta' });
    }
    if (!fecha) {
      return res.status(400).json({ success: false, message: 'Debe enviar la fecha del registro' });
    }

    conn = await getConnection();

    // 1. Procesar fotos subidas y construir URLs completas
    const today = new Date();
    const folder = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // Ajuste: Mapear los archivos subidos a los arrays correctos de nombres, aceptando fieldnames con índice (ej: factura_0, implementacion_0)
    const facturaNombres = [];
    const implementacionNombres = [];
    
    // PRIORIZAR archivos reales de req.files para evitar duplicación
    if (Array.isArray(req.files) && req.files.length > 0) {
      console.log('📸 Procesando archivos reales de req.files:', req.files.length);
      for (const file of req.files) {
        if (file.fieldname.startsWith('factura')) {
          facturaNombres.push(file.filename);
          console.log(`📸 Foto factura guardada: ${file.path}`);
        } else if (file.fieldname.startsWith('implementacion')) {
          implementacionNombres.push(file.filename);
          console.log(`📸 Foto implementación guardada: ${file.path}`);
        }
      }
    } else {
      // SOLO si NO hay archivos reales, usar los nombres que vengan en fotos (por compatibilidad con versiones anteriores)
      console.log('📸 No hay archivos reales, usando nombres del objeto fotos como fallback');
      if (fotos && fotos.factura && Array.isArray(fotos.factura)) {
        for (const nombre of fotos.factura) {
          if (typeof nombre === 'string' && nombre.trim() !== '') {
            facturaNombres.push(nombre);
          } else if (nombre && typeof nombre === 'object' && typeof nombre.filename === 'string' && nombre.filename.trim() !== '') {
            facturaNombres.push(nombre.filename);
          }
          // Si es un objeto vacío o no tiene filename, lo ignora
        }
      }
      if (fotos && fotos.implementacion && Array.isArray(fotos.implementacion)) {
        for (const nombre of fotos.implementacion) {
          if (typeof nombre === 'string' && nombre.trim() !== '') {
            implementacionNombres.push(nombre);
          } else if (nombre && typeof nombre === 'object' && typeof nombre.filename === 'string' && nombre.filename.trim() !== '') {
            implementacionNombres.push(nombre.filename);
          }
          // Si es un objeto vacío o no tiene filename, lo ignora
        }
      }
    }

    // Armar arrays de rutas relativas para guardar en BD (no URLs completas)
    const facturaUrls = facturaNombres.map(nombre => `/uploads/${folder}/${nombre}`);
    const implementacionUrls = implementacionNombres.map(nombre => `/uploads/${folder}/${nombre}`);

    console.log(`� DEBUG DUPLICACIÓN:`);
    console.log(`📁 Fotos factura detectadas: ${facturaNombres.length}`, facturaNombres);
    console.log(`📁 Fotos implementación detectadas: ${implementacionNombres.length}`, implementacionNombres);
    console.log(`�💾 Rutas factura en BD:`, facturaUrls);
    console.log(`💾 Rutas implementación en BD:`, implementacionUrls);
    console.log(`🌐 URLs públicas factura:`, facturaUrls.map(ruta => buildFileUrl(ruta.replace('/uploads/', ''))));
    console.log(`🌐 URLs públicas implementación:`, implementacionUrls.map(ruta => buildFileUrl(ruta.replace('/uploads/', ''))));

    // 2. Insertar en registro_servicios
    // Determinar los KPIs
    let kpi_volumen = 0, kpi_precio = 0, kpi_frecuencia = 0;
    for (const prod of productos) {
      if (prod.numeroCajas && prod.numeroCajas > 0) kpi_volumen = 1;
      if (prod.pvpReal && prod.pvpReal > 0) kpi_precio = 1;
    }
    // Si ambos están presentes, frecuencia es 1
    if (kpi_volumen && kpi_precio) kpi_frecuencia = 1;

  // Si recibes codigo_pdv en vez de pdv_id
  const codigo_pdv = pdv_id; // usa pdv_id si no hay codigo_pdv
  console.log('🔍 Código PDV recibido:', codigo_pdv);

  // Buscar el id real del PDV usando el código
  const [rows] = await conn.execute('SELECT id FROM puntos_venta WHERE codigo = ?', [codigo_pdv]);
  if (!rows.length) {
    return res.status(400).json({ success: false, message: 'El código o id de PDV no existe' });
  }
  const pdv_id_real = rows[0].id;
  console.log('✅ ID real del PDV encontrado:', pdv_id_real);
  console.log('🔄 Conversión: Código', codigo_pdv, '-> ID real', pdv_id_real);

  // Ahora usa pdv_id_real en el insert
  // Corregido: 10 columnas, 10 valores
  console.log('💾 Insertando en registro_servicios con pdv_id:', pdv_id_real);
  const [servicioResult] = await conn.execute(
    `INSERT INTO registro_servicios (pdv_id, user_id, estado_id, estado_agente_id, kpi_volumen, kpi_frecuencia, kpi_precio, fecha_registro, created_at, updated_at)
    VALUES (?, ?, 1, 1, ?, ?, ?, ?, NOW()-7, NOW()-7)`,
    [pdv_id_real, user_id, kpi_volumen, kpi_frecuencia, kpi_precio, fecha]
  );
  const registro_id = servicioResult.insertId;

    // 3. Insertar productos en registro_productos
    for (const prod of productos) {
      const comentarioFinal = (prod.comentarioVenta && typeof prod.comentarioVenta === 'string' && prod.comentarioVenta.trim().length > 0) 
        ? prod.comentarioVenta.trim() 
        : null;
      
      console.log(`🔍 Producto debug:`, {
        referencia: prod.referencia,
        tieneComentarios: prod.tieneComentarios,
        comentarioVenta: prod.comentarioVenta,
        comentarioFinal: comentarioFinal
      });
      
      await conn.execute(
        `INSERT INTO registro_productos (registro_id, referencia_id, presentacion, cantidad_cajas, conversion_galonaje, precio_sugerido, precio_real, comentario)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          registro_id,
          prod.referencia ?? null,
          prod.presentacion ?? null,
          prod.numeroCajas ?? null,
          prod.volumenGalones ?? null,
          prod.pvpSugerido ?? null,
          prod.pvpReal ?? null,
          comentarioFinal
        ]
      );
    }

    // 4. Insertar fotos en registro_fotografico_servicios
    for (const url of facturaUrls) {
      await conn.execute(
        `INSERT INTO registro_fotografico_servicios (id_registro, foto_factura) VALUES (?, ?)`,
        [registro_id, url]
      );
    }
    for (const url of implementacionUrls) {
      await conn.execute(
        `INSERT INTO registro_fotografico_servicios (id_registro, foto_pop) VALUES (?, ?)`,
        [registro_id, url]
      );
    }

    // 5. Calcular puntos y guardar en la tabla registro_puntos
    // KPIs: 1 = Volumen, 2 = Precio, 3 = Frecuencia
    // Si hay ambos, se insertan dos registros
    let galonaje = 0;
    for (const prod of productos) {
      galonaje += Number(prod.volumenGalones) || 0;
    }
    // Obtener meta del PDV para calcular puntos de volumen
    let meta_volumen = 0;
    if (kpi_volumen) {
      const [pdvMeta] = await conn.execute(
        'SELECT meta_volumen FROM puntos_venta WHERE id = ?',
        [pdv_id_real]
      );
      meta_volumen = pdvMeta[0]?.meta_volumen || 0;
    }

    // Si hay volumen (kpi 1)
    if (kpi_volumen) {
      let puntos = 0;
      if (meta_volumen > 0 && galonaje > 0) {
        const porcentaje = galonaje / meta_volumen;
        puntos = Math.round(porcentaje * 200);
      }
      await conn.execute(
        'INSERT INTO registro_puntos (id_visita, id_kpi, puntos) VALUES (?, ?, ?)',
        [registro_id, 1, puntos]
      );
    }
    // Si hay precio (kpi 2)
    if (kpi_precio) {
      let puntos = 2;
      await conn.execute(
        'INSERT INTO registro_puntos (id_visita, id_kpi, puntos) VALUES (?, ?, ?)',
        [registro_id, 2, puntos]
      );
    }
    // Si hay frecuencia (kpi 3)
    if (kpi_frecuencia) {
      let puntos = 1;
      await conn.execute(
        'INSERT INTO registro_puntos (id_visita, id_kpi, puntos) VALUES (?, ?, ?)',
        [registro_id, 3, puntos]
      );
    }

    // 6. OPTIMIZADO: Detectar comentarios Y enviar email en paralelo si los hay
    const productosConComentarios = productos.filter(prod => 
      prod.comentarioVenta && typeof prod.comentarioVenta === 'string' && prod.comentarioVenta.trim().length > 0
    );

    // Solo si HAY comentarios reales, enviar email en background (sin esperar)
    if (productosConComentarios.length > 0) {
      // Ejecutar email en background (sin await) para no ralentizar la respuesta
      enviarEmailComentariosBackground(registro_id, pdv_id_real, user_id, fecha, productosConComentarios, productos.length)
        .catch(error => {
          console.error(`❌ Error enviando email comentarios background:`, error.message);
        });
      
      console.log(`📧 Email de comentarios programado en background para registro ${registro_id} con ${productosConComentarios.length} productos`);
    }

    res.json({
      success: true,
      message: 'Registro guardado correctamente',
      registro_id,
      facturaUrls,
      implementacionUrls,
      comentarios_detectados: productosConComentarios.length > 0 ? productosConComentarios.length : 0
    });
  } catch (err) {
    console.error('Error en cargar-registro-pdv:', err);
    res.status(500).json({ success: false, message: 'Error al guardar el registro', error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 🚀 FUNCIÓN OPTIMIZADA: Enviar email en background sin bloquear la respuesta
async function enviarEmailComentariosBackground(registro_id, pdv_id_real, user_id, fecha, productosConComentarios, totalProductos) {
  let conn;
  try {
    // Obtener nueva conexión específica para esta operación background
    conn = await getConnection();
    
    // Consulta optimizada - solo los campos necesarios
    const [registroInfo] = await conn.execute(`
      SELECT 
        pv.codigo as codigo_pdv,
        pv.descripcion as nombre_pdv,
        pv.direccion,
        u.name as asesor_nombre,
        u.documento as asesor_cedula,
        ag.descripcion as agente_comercial
      FROM puntos_venta pv
      INNER JOIN users u ON u.id = ?
      LEFT JOIN agente ag ON ag.id = pv.id_agente
      WHERE pv.id = ?
    `, [user_id, pdv_id_real]);

    const info = registroInfo[0];
    
    // Crear detalles optimizados
    const detallesComentarios = productosConComentarios.map(prod => ({
      referencia: prod.referencia || 'Sin referencia',
      presentacion: prod.presentacion || 'Sin presentación', 
      comentario: prod.comentarioVenta
    }));

    // Enviar email
    await enviarNotificacionComentarios({
      registroId: registro_id,
      codigoPdv: info?.codigo_pdv || 'No asignado',
      nombrePdv: info?.nombre_pdv || 'Punto de venta no definido',
      direccionPdv: info?.direccion || 'Dirección no disponible',
      asesorNombre: info?.asesor_nombre || 'Asesor no identificado',
      asesorCedula: info?.asesor_cedula || 'Sin cédula',
      agenteComercial: info?.agente_comercial || 'Sin agente',
      fechaRegistro: fecha,
      detallesComentarios: detallesComentarios,
      totalProductos: totalProductos,
      productosConComentarios: productosConComentarios.length
    });
    
    console.log(`✅ Email comentarios enviado en background para registro ${registro_id}`);
    
  } catch (error) {
    console.error(`❌ Error en email background para registro ${registro_id}:`, error.message);
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

export default router;