import express from 'express';
import { getConnection } from '../db.js';
import { authenticateToken, requireMercadeo, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Ruta de prueba sin autenticación
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de mercadeo funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta para verificar token y rol del usuario
router.get('/verify-token', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user,
    roleInfo: {
      tipo: req.user.tipo,
      expectedRole: req.user.tipo === 3 ? 'mercadeo_ac' : 'otro',
      id_agente: req.user.id_agente,
      agente_id: req.user.agente_id,
      allFields: Object.keys(req.user)
    },
    debug: {
      hasAgenteId: !!req.user.agente_id,
      agenteIdValue: req.user.agente_id,
      agenteIdType: typeof req.user.agente_id,
      userKeys: Object.keys(req.user)
    }
  });
});

// Consulta de detalle de registro
router.get('/registro-detalles/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { agente_id } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  // Validar que el registro_id es un número
  if (!registro_id || isNaN(registro_id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de registro inválido'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verificar que el registro existe y pertenece al agente
    const [registroCheck] = await conn.execute(
      `SELECT rs.id FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       WHERE rs.id = ? AND pv.id_agente = ?`,
      [registro_id, agente_id]
    );

    if (registroCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado o no tiene permisos para verlo'
      });
    }

    // Consulta de detalle completa con información adicional
    const queryDetalles = `
      SELECT 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
        puntos_venta.id_agente,
        users.name as nombre_usuario,
        users.email as email_usuario,
        registro_servicios.fecha_registro,
        registro_servicios.created_at,
        registro_servicios.updated_at,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen / Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_kpi,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_volumen = 1 THEN 'Implementacion'
            WHEN kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Visita'
            ELSE 'Otro'
        END AS tipo_accion,
        e1.descripcion AS estado,
        e2.descripcion AS estado_agente,
        registro_servicios.observacion,
        agente.descripcion as agente_descripcion,
        agente.nombre as agente_nombre,
        agente.email as agente_email,
        agente.telefono as agente_telefono,
        -- Información de productos con más detalles
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.cantidad_cajas) AS cantidades_cajas,
        GROUP_CONCAT(registro_productos.conversion_galonaje) AS galones,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales,
        GROUP_CONCAT(registro_productos.created_at) AS fechas_productos,
        -- Información fotográfica
        GROUP_CONCAT(registro_fotografico_servicios.foto_factura) AS fotos_factura,
        GROUP_CONCAT(registro_fotografico_servicios.foto_pop) AS fotos_pop,
        GROUP_CONCAT(registro_fotografico_servicios.foto_seguimiento) AS fotos_seguimiento,
        -- Totales calculados
        SUM(registro_productos.cantidad_cajas) as total_cajas,
        SUM(registro_productos.conversion_galonaje) as total_galones,
        SUM(registro_productos.precio_real * registro_productos.cantidad_cajas) as valor_total_implementado
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = puntos_venta.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
      INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
      LEFT JOIN agente ON agente.id = puntos_venta.id_agente
      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id
      WHERE registro_servicios.id = ? AND puntos_venta.id_agente = ?
      GROUP BY 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
        puntos_venta.id_agente,
        users.name,
        users.email,
        registro_servicios.fecha_registro,
        registro_servicios.created_at,
        registro_servicios.updated_at,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,
        tipo_kpi,
        tipo_accion,
        e1.descripcion,
        e2.descripcion,
        registro_servicios.observacion,
        agente.descripcion,
        agente.nombre,
        agente.email,
        agente.telefono
    `;
    
    const [detalles] = await conn.execute(queryDetalles, [registro_id, agente_id]);

    if (detalles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Detalles del registro no encontrados'
      });
    }

    const registro = detalles[0];
    
    // Procesar coordenadas si existen
    let lat = null, lng = null;
    if (registro.coordenadas) {
      const coordenadas = registro.coordenadas.split(',');
      if (coordenadas.length === 2) {
        lat = parseFloat(coordenadas[0].trim());
        lng = parseFloat(coordenadas[1].trim());
      }
    }

    // Procesar datos adicionales
    const datosCompletos = {
      ...registro,
      // Coordenadas procesadas
      lat,
      lng,
      // Información del agente
      agente: {
        descripcion: registro.agente_descripcion,
        nombre: registro.agente_nombre,
        email: registro.agente_email,
        telefono: registro.agente_telefono
      },
      // Resumen de totales
      resumen: {
        total_cajas: registro.total_cajas || 0,
        total_galones: registro.total_galones || 0,
        valor_total_implementado: registro.valor_total_implementado || 0
      }
    };

    res.json({
      success: true,
      data: datosCompletos
    });

  } catch (err) {
    console.error('Error obteniendo detalles del registro (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del registro',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener lista de asesores filtrada por agente_id
router.get('/asesores', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Consulta para obtener asesores que manejan PDVs de este agente
    const query = `
      SELECT DISTINCT 
        users.id,
        users.name,
        users.email,
        users.created_at,
        users.updated_at
      FROM users
      INNER JOIN puntos_venta ON puntos_venta.user_id = users.id
      WHERE puntos_venta.id_agente = ? AND users.rol_id = 1
      ORDER BY users.name
    `;
    
    const [rows] = await conn.execute(query, [agente_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo asesores (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de asesores',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener lista de puntos de venta filtrada por agente_id
router.get('/puntos-venta', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Consulta para obtener puntos de venta del agente
    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.coordenadas,
        puntos_venta.segmento,
        puntos_venta.meta_volumen,
        puntos_venta.id_agente,
        puntos_venta.user_id as asesor_id,
        users.id as user_id,
        users.name as nombre_asesor,
        users.email as email_asesor
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      WHERE puntos_venta.id_agente = ?
      ORDER BY puntos_venta.codigo
    `;
    
    const [rows] = await conn.execute(query, [agente_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo puntos de venta (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de puntos de venta',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});


// DASH
// Obtener métricas de cobertura filtradas por agente_id
router.get('/cobertura', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Consulta para obtener métricas de cobertura
    // LÓGICA DE PUNTOS POR COBERTURA:
    // Meta = PDVs asignados al agente
    // Real = PDVs con registros en registro_servicios
    // Puntos individuales = (IMPACTADOS/ASIGNADOS) * 150
    // Si tiene registro = puntos proporcionales, si no = 0 puntos
    
    // Primero obtener totales para calcular proporción
    const [totalesResult] = await conn.execute(
      `SELECT 
        COUNT(DISTINCT puntos_venta.id) as totalAsignados,
        COUNT(DISTINCT CASE WHEN registro_servicios.id IS NOT NULL THEN puntos_venta.id END) as totalImpactados
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       WHERE ${whereClause}`, queryParams
    );
    
    const totalAsignados = totalesResult[0]?.totalAsignados || 0;
    const totalImpactados = totalesResult[0]?.totalImpactados || 0;
    const porcentajeCobertura = totalAsignados > 0 ? (totalImpactados / totalAsignados) : 0;
    const puntosBasePorPDV = totalAsignados > 0 ? (150 / totalAsignados) : 0;

    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 THEN 'Registrado'
          ELSE 'No Registrado'
        END as estado,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 THEN ${puntosBasePorPDV}
          ELSE 0
        END as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name, users.id
      ORDER BY puntos_venta.codigo
    `;
    
    const [rows] = await conn.execute(query, queryParams);

    // Calcular puntos totales (IGUAL QUE ASESOR: 150 puntos máximo)
    const puntosCobertura = totalAsignados > 0 ? Math.round((totalImpactados / totalAsignados) * 150) : 0;
    
    res.json({
      success: true,
      pdvs: rows,
      data: rows,
      total: rows.length,
      // Métricas principales para el dashboard
      puntos: puntosCobertura,
      meta: totalAsignados,
      real: totalImpactados,
      porcentajeCumplimiento: Math.round(porcentajeCobertura * 100),
      // Propiedades adicionales para compatibilidad
      totalAsignados,
      totalImplementados: totalImpactados,
      puntosCobertura,
      estadisticas: {
        totalAsignados,
        totalImpactados,
        porcentajeCobertura: Math.round(porcentajeCobertura * 100),
        puntosTotal: puntosCobertura,
        puntosPorPDV: Number(puntosBasePorPDV.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de cobertura (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de cobertura',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener métricas de volumen filtradas por agente_id
router.get('/volumen', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener meta y real totales
    const [metaResult] = await conn.execute(
      `SELECT SUM(meta_volumen) as totalMeta
       FROM puntos_venta
       WHERE ${whereClause}`, queryParams
    );
    const totalMeta = metaResult[0]?.totalMeta || 0;

    const [realResult] = await conn.execute(
      `SELECT SUM(registro_productos.conversion_galonaje) as totalReal
       FROM registro_servicios
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause}`, queryParams
    );
    const totalReal = realResult[0]?.totalReal || 0;

    // Calcular puntos como en asesor (PERO ASESOR USA registro_puntos, aquí calculamos proporcionalmente)
    // LÓGICA CONSISTENTE: 200 puntos máximo por volumen
    const porcentajeVolumen = totalMeta > 0 ? (totalReal / totalMeta) : 0;
    const puntosVolumen = Math.round(porcentajeVolumen * 200);

    console.log('=== DEBUG VOLUMEN MERCADEO ===');
    console.log('totalMeta:', totalMeta);
    console.log('totalReal:', totalReal);
    console.log('porcentajeVolumen:', porcentajeVolumen);
    console.log('puntosVolumen:', puntosVolumen);

    // Obtener detalle por PDV
    const [pdvs] = await conn.execute(
      `SELECT 
         puntos_venta.id,
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         puntos_venta.segmento,
         puntos_venta.meta_volumen as meta,
         users.name as nombre_asesor,
         users.id as asesor_id,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) as \`real\`,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / puntos_venta.meta_volumen) * 100, 2
         ) as porcentaje
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, puntos_venta.segmento, puntos_venta.meta_volumen, users.name, users.id
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Calcular puntos individuales por PDV (contribución proporcional)
    const pdvsConPuntos = pdvs.map(pdv => {
      const cumplimiento = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
      const puntosIndividuales = totalMeta > 0 ? Math.round((pdv.real / totalMeta) * 200) : 0;
      
      return {
        ...pdv,
        puntos: puntosIndividuales,
        cumplimiento: Number(cumplimiento.toFixed(2))
      };
    });

    // Obtener resumen por segmento
    const [segmentos] = await conn.execute(
      `SELECT 
         puntos_venta.segmento,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         SUM(puntos_venta.meta_volumen) AS metaTotal,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) AS totalGalones,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / SUM(puntos_venta.meta_volumen)) * 100, 2
         ) as porcentajeCumplimiento
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.segmento
       ORDER BY totalGalones DESC`, queryParams
    );

    // Obtener detalle por producto
    const [productos] = await conn.execute(
      `SELECT 
         registro_productos.referencia_id AS nombre,
         COUNT(registro_productos.id) AS numeroCajas,
         SUM(registro_productos.cantidad_cajas) AS totalCajas,
         SUM(registro_productos.conversion_galonaje) AS galonaje,
         AVG(registro_productos.precio_real) AS precioPromedio,
         SUM(registro_productos.precio_real * registro_productos.cantidad_cajas) AS valorTotal
       FROM registro_servicios
       INNER JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause} AND registro_productos.referencia_id IS NOT NULL
       GROUP BY registro_productos.referencia_id
       ORDER BY galonaje DESC`, queryParams
    );

    // Calcular porcentajes para productos
    const totalGalonaje = productos.reduce((sum, p) => sum + p.galonaje, 0);
    productos.forEach(p => {
      p.porcentaje = totalGalonaje > 0 ? 
        Number(((p.galonaje / totalGalonaje) * 100).toFixed(1)) : 0;
    });

    // Obtener resumen por asesor
    const [resumenAsesores] = await conn.execute(
      `SELECT 
         users.id as asesor_id,
         users.name as nombre_asesor,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         SUM(puntos_venta.meta_volumen) AS metaTotal,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) AS realTotal,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / SUM(puntos_venta.meta_volumen)) * 100, 2
         ) as porcentajeCumplimiento
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY users.id, users.name
       ORDER BY realTotal DESC`, queryParams
    );

    const response = {
      success: true,
      pdvs: pdvsConPuntos,  // Cambiado para compatibilidad con asesor
      data: pdvsConPuntos,  // Mantenido para compatibilidad
      meta_volumen: totalMeta,
      real_volumen: totalReal,
      puntos: puntosVolumen,
      porcentajeCumplimiento: totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0,
      segmentos,
      productos,
      resumenAsesores,
      totales: {
        totalPdvs: pdvs.length,
        totalMeta: totalMeta,
        totalReal: totalReal,
        totalPuntos: pdvsConPuntos.reduce((sum, pdv) => sum + pdv.puntos, 0),
        promedioEfectividad: pdvs.length > 0 ? 
          Number((pdvsConPuntos.reduce((sum, pdv) => sum + pdv.porcentaje, 0) / pdvs.length).toFixed(2)) : 0
      }
    };

    console.log('=== RESPONSE FINAL VOLUMEN ===');
    console.log('response.puntos:', response.puntos);
    console.log('response.meta_volumen:', response.meta_volumen);
    console.log('response.real_volumen:', response.real_volumen);
    console.log('===============================');
    
    res.json(response);

  } catch (err) {
    console.error('Error obteniendo métricas de volumen (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de volumen',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener métricas de frecuencia (visitas) filtradas por agente_id
router.get('/visitas', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener meta y real de visitas
    const [metaResult] = await conn.execute(
      `SELECT COUNT(*) * 20 as metaVisitas
       FROM puntos_venta
       WHERE ${whereClause}`, queryParams
    );
    const metaVisitas = metaResult[0]?.metaVisitas || 0;

    const [realResult] = await conn.execute(
      `SELECT COUNT(registro_servicios.id) as totalVisitas
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause}`, queryParams
    );
    const totalVisitas = realResult[0]?.totalVisitas || 0;

    // Calcular puntos de visitas
    // LÓGICA DE PUNTOS POR VISITAS:
    // Meta = Total PDVs * 20 visitas
    // Real = Total visitas reportadas
    // Puntos totales = (VISITAS_REPORTADAS/META_VISITAS) * puntos_base
    // Usaremos 100 puntos base para visitas
    const porcentajeVisitas = metaVisitas > 0 ? (totalVisitas / metaVisitas) : 0;
    const puntosVisitas = Math.round(porcentajeVisitas * 100);

    // Obtener detalle por PDV
    // LÓGICA DE PUNTOS POR VISITAS:
    // Cada PDV contribuye proporcionalmente al total de 100 puntos
    // Obtener detalle por PDV (ESTRUCTURA IGUAL A ASESOR)
    const [pdvs] = await conn.execute(
      `SELECT 
         puntos_venta.id,
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         users.name as nombre_asesor,
         users.id as asesor_id,
         COUNT(registro_servicios.id) as cantidadVisitas,
         20 as meta,
         ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) as porcentaje,
         CASE 
           WHEN ? > 0 THEN ROUND((COUNT(registro_servicios.id) / ?) * 100, 2)
           ELSE 0
         END as puntos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name, users.id
       ORDER BY puntos_venta.codigo`, [...queryParams, metaVisitas, metaVisitas]
    );

    // Obtener tipos de visita
    const [tiposVisita] = await conn.execute(
      `SELECT 
         CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen/Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
         END AS tipo,
         COUNT(*) AS cantidad
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       WHERE ${whereClause}
       GROUP BY tipo`, queryParams
    );

    // Obtener resumen por asesor
    const [resumenAsesores] = await conn.execute(
      `SELECT 
         users.id as asesor_id,
         users.name as nombre_asesor,
         COUNT(DISTINCT puntos_venta.id) AS cantidadPdvs,
         COUNT(registro_servicios.id) as totalVisitas,
         COUNT(DISTINCT puntos_venta.id) * 20 as metaVisitas,
         ROUND((COUNT(registro_servicios.id) / (COUNT(DISTINCT puntos_venta.id) * 20)) * 100, 2) as porcentajeCumplimiento,
         COUNT(registro_servicios.id) * 2 as puntosGanados
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       WHERE ${whereClause}
       GROUP BY users.id, users.name
       ORDER BY totalVisitas DESC`, queryParams
    );

    res.json({
      success: true,
      pdvs,
      data: pdvs,
      // Métricas principales para el dashboard
      puntos: puntosVisitas,
      meta: metaVisitas,
      real: totalVisitas,
      porcentajeCumplimiento: metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 100) : 0,
      // Propiedades adicionales para compatibilidad
      meta_visitas: metaVisitas,
      real_visitas: totalVisitas,
      tiposVisita,
      resumenAsesores,
      totales: {
        totalPdvs: pdvs.length,
        totalMetaVisitas: metaVisitas,
        totalRealVisitas: totalVisitas,
        totalPuntosGanados: pdvs.reduce((sum, pdv) => sum + pdv.puntos, 0),
        promedioVisitasPorPdv: pdvs.length > 0 ? 
          Number((pdvs.reduce((sum, pdv) => sum + pdv.cantidadVisitas, 0) / pdvs.length).toFixed(2)) : 0
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de frecuencia (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de frecuencia',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener métricas de profundidad filtradas por agente_id
router.get('/profundidad', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener todos los PDVs asignados del agente
    const [pdvs] = await conn.execute(
      `SELECT 
         puntos_venta.id,
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         puntos_venta.direccion,
         users.name as nombre_asesor,
         users.id as asesor_id
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       WHERE ${whereClause}
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener PDVs con al menos una nueva referencia vendida
    const [conProfundidadQuery] = await conn.execute(
      `SELECT 
          registro_servicios.pdv_id,
          COUNT(DISTINCT registro_productos.referencia_id) AS nuevas_referencias
       FROM registro_servicios
       INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       LEFT JOIN portafolio_pdv ON 
          portafolio_pdv.pdv_id = registro_servicios.pdv_id AND 
          portafolio_pdv.referencia_id = registro_productos.referencia_id
       WHERE ${whereClause} AND portafolio_pdv.referencia_id IS NULL
       GROUP BY registro_servicios.pdv_id
       HAVING nuevas_referencias > 0`, queryParams
    );

    const pdvsConProfundidad = new Set(conProfundidadQuery.map(r => r.pdv_id));

    // Calcular métricas (IGUAL QUE ASESOR: 200 puntos máximo)
    const totalAsignados = pdvs.length;
    const totalConProfundidad = pdvsConProfundidad.size;
    const puntosProfundidad = totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 200) : 0;

    // Asignar puntos individuales por PDV (IGUAL QUE ASESOR)
    const puntosPorPDV = totalAsignados > 0 ? Math.floor(200 / totalAsignados) : 0;
    const pdvsDetalle = pdvs.map(pdv => ({
      ...pdv,
      estado: pdvsConProfundidad.has(pdv.id) ? 'REGISTRADO' : 'NO REGISTRADO',
      puntos: pdvsConProfundidad.has(pdv.id) ? puntosPorPDV : 0
    }));

    res.json({
      success: true,
      pdvs: pdvsDetalle,
      data: pdvsDetalle,
      // Métricas principales para el dashboard
      puntos: puntosProfundidad,
      meta: totalAsignados,
      real: totalConProfundidad,
      porcentajeCumplimiento: totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 100) : 0,
      // Propiedades adicionales para compatibilidad
      totalAsignados,
      totalConProfundidad,
      puntosProfundidad,
      porcentaje: totalAsignados > 0 ? Math.round((totalConProfundidad / totalAsignados) * 100) : 0
    });

  } catch (err) {
    console.error('Error obteniendo métricas de profundidad (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de profundidad',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener métricas de precios filtradas por agente_id
router.get('/precios', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Consulta para obtener métricas de precios
    // LÓGICA DE PUNTOS POR PRECIOS:
    // Meta = PDVs asignados al agente
    // Real = PDVs con reportes de precios (kpi_precio = 1)
    // Puntos totales = (PDVs_CON_PRECIOS/PDVs_ASIGNADOS) * 50
    
    // Primero obtener totales
    const [totalesResult] = await conn.execute(
      `SELECT 
        COUNT(DISTINCT puntos_venta.id) as totalAsignados,
        COUNT(DISTINCT CASE WHEN registro_servicios.kpi_precio = 1 THEN puntos_venta.id END) as totalConPrecios
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       WHERE ${whereClause}`, queryParams
    );
    
    const totalAsignados = totalesResult[0]?.totalAsignados || 0;
    const totalConPrecios = totalesResult[0]?.totalConPrecios || 0;
    const porcentajePrecios = totalAsignados > 0 ? (totalConPrecios / totalAsignados) : 0;
    const puntosPorPDV = totalAsignados > 0 ? Math.floor(150 / totalAsignados) : 0;

    const query = `
      SELECT 
        puntos_venta.id,
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        users.id as asesor_id,
        CASE 
          WHEN COUNT(CASE WHEN registro_servicios.kpi_precio = 1 THEN 1 END) > 0 THEN 'REPORTADOS'
          ELSE 'NO REPORTADOS'
        END as estado,
        CASE 
          WHEN COUNT(CASE WHEN registro_servicios.kpi_precio = 1 THEN 1 END) > 0 THEN ${puntosPorPDV}
          ELSE 0
        END as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name, users.id
      ORDER BY puntos_venta.codigo
    `;
    
    const [rows] = await conn.execute(query, queryParams);

    // Calcular puntos totales (IGUAL QUE ASESOR: 150 puntos máximo)
    const puntosPrecios = totalAsignados > 0 ? Math.round((totalConPrecios / totalAsignados) * 150) : 0;

    res.json({
      success: true,
      pdvs: rows,
      data: rows,
      total: rows.length,
      // Métricas principales para el dashboard
      puntos: puntosPrecios,
      meta: totalAsignados,
      real: totalConPrecios,
      porcentajeCumplimiento: Math.round(porcentajePrecios * 100),
      // Propiedades adicionales para compatibilidad
      totalAsignados,
      totalReportados: totalConPrecios,
      puntosPrecios,
      porcentaje: Math.round(porcentajePrecios * 100),
      estadisticas: {
        totalAsignados,
        totalConPrecios,
        porcentajePrecios: Math.round(porcentajePrecios * 100),
        puntosTotal: puntosPrecios,
        puntosPorPDV: Number(puntosPorPDV.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Error obteniendo métricas de precios (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de precios',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Ruta para descargar todos los KPIs en Excel
router.get('/download-kpis', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { agente_id } = req.user;
    
    if (!agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente asignado'
      });
    }

    // Filtros opcionales
    const { asesor_id, pdv_id } = req.query;
    
    // Construir filtros WHERE dinámicos
    let whereConditions = ['puntos_venta.id_agente = ?'];
    let queryParams = [agente_id];
    
    if (asesor_id) {
      whereConditions.push('puntos_venta.user_id = ?');
      queryParams.push(asesor_id);
    }
    
    if (pdv_id) {
      whereConditions.push('puntos_venta.id = ?');
      queryParams.push(pdv_id);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Obtener datos de cobertura
    const [cobertura] = await conn.execute(
      `SELECT 
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 THEN 'Registrado'
          ELSE 'No Registrado'
        END as estado,
        COUNT(registro_servicios.id) * 15 as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
      ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de volumen
    const [volumen] = await conn.execute(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         puntos_venta.segmento,
         puntos_venta.meta_volumen as meta,
         users.name as nombre_asesor,
         COALESCE(SUM(registro_productos.conversion_galonaje), 0) as \`real\`,
         ROUND(
           (COALESCE(SUM(registro_productos.conversion_galonaje), 0) / puntos_venta.meta_volumen) * 100, 2
         ) as porcentaje
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, puntos_venta.segmento, puntos_venta.meta_volumen, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de visitas
    const [visitas] = await conn.execute(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         users.name as nombre_asesor,
         COUNT(registro_servicios.id) as cantidadVisitas,
         20 as meta,
         ROUND((COUNT(registro_servicios.id) / 20) * 100, 2) as porcentaje,
         COUNT(registro_servicios.id) * 2 as puntos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de profundidad
    const [profundidad] = await conn.execute(
      `SELECT 
         puntos_venta.codigo,
         puntos_venta.descripcion as nombre,
         users.name as nombre_asesor,
         CASE 
           WHEN COUNT(DISTINCT registro_productos.referencia_id) > 0 THEN 'Registrado'
           ELSE 'No Registrado'
         END as estado,
         COUNT(DISTINCT registro_productos.referencia_id) * 12 as puntos
       FROM puntos_venta
       INNER JOIN users ON users.id = puntos_venta.user_id
       LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id
       LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
       WHERE ${whereClause}
       GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
       ORDER BY puntos_venta.codigo`, queryParams
    );

    // Obtener datos de precios
    const [precios] = await conn.execute(
      `SELECT 
        puntos_venta.codigo,
        puntos_venta.descripcion as nombre,
        users.name as nombre_asesor,
        CASE 
          WHEN COUNT(registro_servicios.id) > 0 THEN 'Precios Reportados'
          ELSE 'Precios No Reportados'
        END as estado,
        COUNT(registro_servicios.id) * 3 as puntos
      FROM puntos_venta
      INNER JOIN users ON users.id = puntos_venta.user_id
      LEFT JOIN registro_servicios ON registro_servicios.pdv_id = puntos_venta.id 
        AND registro_servicios.kpi_precio = 1
      WHERE ${whereClause}
      GROUP BY puntos_venta.id, puntos_venta.codigo, puntos_venta.descripcion, users.name
      ORDER BY puntos_venta.codigo`, queryParams
    );

    const allData = {
      cobertura,
      volumen,
      visitas,
      profundidad,
      precios
    };

    res.json({
      success: true,
      data: allData
    });

  } catch (err) {
    console.error('Error obteniendo datos para Excel (Mercadeo):', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos para Excel',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener historial de registros filtrado por agente_id (similar al de asesor pero filtrado por agente)
router.get('/historial-registros-mercadeo', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { agente_id } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Consulta similar a la del asesor pero filtrando por agente_id
    const query = `
      SELECT 
        registro_servicios.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        users.name,
        users.documento as cedula,
        registro_servicios.fecha_registro,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen / Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_kpi,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_volumen = 1 THEN 'Implementacion'
            WHEN kpi_precio = 1 THEN 'Implementacion'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Visita'
            ELSE 'Otro'
        END AS tipo_accion,
        e1.descripcion AS estado,
        registro_servicios.observacion,
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.cantidad_cajas) AS cantidades_cajas,
        GROUP_CONCAT(registro_productos.conversion_galonaje) AS galonajes,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales,
        GROUP_CONCAT(registro_fotografico_servicios.foto_factura) AS fotos_factura,
        GROUP_CONCAT(registro_fotografico_servicios.foto_pop) AS fotos_pop,
        GROUP_CONCAT(registro_fotografico_servicios.foto_seguimiento) AS fotos_seguimiento
      FROM registro_servicios
      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = registro_servicios.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_agente_id
      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id
      WHERE puntos_venta.id_agente = ?
      GROUP BY 
        registro_servicios.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        users.name,
        users.documento,
        registro_servicios.fecha_registro,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,
        e1.descripcion,
        registro_servicios.observacion
      ORDER BY registro_servicios.fecha_registro DESC
    `;
    const [rows] = await conn.execute(query, [agente_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo historial de registros de mercadeo:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de registros de mercadeo',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para aprobar/rechazar registros desde mercadeo
router.post('/actualizar-estado-registro/:registro_id', authenticateToken, requireMercadeo, logAccess, async (req, res) => {
  const { registro_id } = req.params;
  const { estado_agente_id, comentario } = req.body;
  const { agente_id } = req.user;

  if (!agente_id) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene agente asignado'
    });
  }

  // Validar estado_agente_id
  if (!estado_agente_id || ![2, 3].includes(Number(estado_agente_id))) {
    return res.status(400).json({
      success: false,
      message: 'Estado inválido. Debe ser 2 (aprobado) o 3 (rechazado)'
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verificar que el registro existe y pertenece al agente
    const [registroCheck] = await conn.execute(
      `SELECT rs.id FROM registro_servicios rs
       INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
       WHERE rs.id = ? AND pv.id_agente = ?`,
      [registro_id, agente_id]
    );

    if (registroCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado o no tiene permisos para modificarlo'
      });
    }

    // Actualizar estado del registro con comentario
    const updateQuery = `
      UPDATE registro_servicios 
      SET estado_agente_id = ?, 
          estado_id = ?,
          observacion = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    
    await conn.execute(updateQuery, [estado_agente_id, estado_agente_id, comentario, registro_id]);

    res.json({
      success: true,
      message: 'Estado del registro actualizado correctamente'
    });

  } catch (err) {
    console.error('Error actualizando estado del registro:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del registro',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// RUTAS DE PRUEBA SIN AUTENTICACIÓN
router.get('/test-asesores', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de asesores funcionando',
    data: []
  });
});

router.get('/test-puntos-venta', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de puntos de venta funcionando',
    data: []
  });
});

router.get('/test-cobertura', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de cobertura funcionando',
    data: []
  });
});

router.get('/test-volumen', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de volumen funcionando',
    data: []
  });
});

router.get('/test-visitas', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de visitas funcionando',
    data: []
  });
});

router.get('/test-profundidad', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de profundidad funcionando',
    data: []
  });
});

router.get('/test-precios', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de precios funcionando',
    data: []
  });
});

export default router;
