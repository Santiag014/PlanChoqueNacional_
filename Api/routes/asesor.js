// ✅ ARCHIVO OPTIMIZADO PARA POOL COMPARTIDO
// ============================================
// - NO crea conexiones individuales por consulta
// - USA executeQueryForMultipleUsers() para consultas normales
// - USA executeQueryFast() para consultas rápidas
// - El pool de 50 conexiones se comparte entre TODOS los usuarios
// - NUNCA excede el límite de 500 conexiones/hora

import express from 'express';
import { getConnection, executeQueryForMultipleUsers, executeQueryFast } from '../db.js';
import { authenticateToken, requireAsesor, logAccess } from '../middleware/auth.js';
import XLSX from 'xlsx';

const router = express.Router();

// ========================================================================
// 📊 ENDPOINTS PARA DASHBOARD ASESOR - MÉTRICAS PRINCIPALES
// ========================================================================

// === FUNCIÓN GLOBAL DE FACTOR DE COMPLEJIDAD ===
function calcularFactorComplejidad(totalAsignados) {
  let factor = 1;
  if (totalAsignados >= 1 && totalAsignados <= 3) {
    factor = 1;
  } else if (totalAsignados >= 4 && totalAsignados <= 6) {
    factor = 1.12;
  } else if (totalAsignados >= 7 && totalAsignados <= 9) {
    factor = 1.18;
  } else if (totalAsignados >= 10 && totalAsignados <= 12) {
    factor = 1.3;
  } else if (totalAsignados >= 13 && totalAsignados <= 15) {
    factor = 1.4;
  }
  return factor;
}

// ENDPOINT DE COBERTURA REAL PARA DASHBOARD ASESOR
router.get('/cobertura/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  const { pdv_id } = req.query; // AGREGADO: Soporte para filtro por PDV
  
  // console.log('🔍 === INICIO DEBUG ENDPOINT COBERTURA ===');
  // console.log('user_id recibido:', user_id);
  // console.log('pdv_id recibido:', pdv_id, 'tipo:', typeof pdv_id);
  // console.log('========================================');
  
  try {
    // PASO 1: SIEMPRE obtener datos GLOBALES para calcular puntos consistentes
    const todosLosPdvsGlobales = await executeQueryForMultipleUsers(
      `SELECT id, codigo, descripcion AS nombre, direccion
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );

    // PASO 2: PDVs con registros VÁLIDOS para puntos (GLOBAL - sin filtro)
    const implementadosValidosGlobales = await executeQueryForMultipleUsers(
      `SELECT DISTINCT pdv_id
       FROM registro_servicios
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2 AND fecha_registro <= ?`, 
      [user_id, '2025-09-06']
    );
    const implementadosValidosGlobalesSet = new Set(implementadosValidosGlobales.map(r => r.pdv_id));

    // PASO 3: PDVs con registros CUALQUIER FECHA (GLOBAL - para mostrar estado)
    const implementadosTodosGlobales = await executeQueryForMultipleUsers(
      `SELECT DISTINCT pdv_id
       FROM registro_servicios
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [user_id]
    );
    const implementadosTodosGlobalesSet = new Set(implementadosTodosGlobales.map(r => r.pdv_id));

    // PASO 4: Calcular puntos GLOBALES (base para distribución individual)
    const totalAsignadosGlobal = todosLosPdvsGlobales.length;
    const totalImplementadosRealGlobal = implementadosTodosGlobalesSet.size;
    const totalImplementadosPuntosGlobal = implementadosValidosGlobalesSet.size;
    let puntosCoberturaGlobal = totalAsignadosGlobal > 0 ? 
      Math.round((totalImplementadosPuntosGlobal / totalAsignadosGlobal) * 3000) : 0;

    // Aplica el factor de complejidad global
    puntosCoberturaGlobal = Math.round(puntosCoberturaGlobal * calcularFactorComplejidad(totalAsignadosGlobal));

    // PASO 5: Asignar puntos GLOBALES a cada PDV (proporcional al puntaje global ajustado)
    // Solo los PDVs implementados válidos reciben puntos, distribuidos proporcionalmente
    let totalImplementadosValidos = 0;
    todosLosPdvsGlobales.forEach(pdv => {
      if (implementadosValidosGlobalesSet.has(pdv.id)) totalImplementadosValidos++;
    });
    // Si no hay implementados válidos, todos reciben 0
    const puntosPorPDVGlobal = (totalAsignadosGlobal > 0 && totalImplementadosValidos > 0)
      ? Math.floor(puntosCoberturaGlobal / totalImplementadosValidos)
      : 0;
    const pdvsConPuntosGlobales = todosLosPdvsGlobales.map(pdv => {
      // Estado: REGISTRADO si tiene cualquier registro (sin importar fecha)
      const estado = implementadosTodosGlobalesSet.has(pdv.id) ? 'REGISTRADO' : 'NO REGISTRADO';
      // Puntos: SOLO si tiene registros válidos (antes del 2025-09-06) - proporcionales
      const puntos = implementadosValidosGlobalesSet.has(pdv.id) ? puntosPorPDVGlobal : 0;
      return {
        ...pdv,
        estado,
        puntos
      };
    });

    // PASO 6: Filtrar PDVs para mostrar (manteniendo sus puntos originales)
    let pdvsParaMostrar = pdvsConPuntosGlobales;
    if (pdv_id) {
      pdvsParaMostrar = pdvsConPuntosGlobales.filter(pdv => pdv.id == pdv_id);
    }

    // PASO 7: Calcular totales para la UI (filtrados si hay filtro, globales si no)
    let totalAsignadosUI, totalImplementadosUI, puntosCoberturaUI;
    
    if (pdv_id) {
      // Si hay filtro, mostrar valores del PDV específico
      totalAsignadosUI = pdvsParaMostrar.length;
      totalImplementadosUI = pdvsParaMostrar.filter(pdv => pdv.estado === 'REGISTRADO').length;
      puntosCoberturaUI = pdvsParaMostrar.reduce((sum, pdv) => sum + pdv.puntos, 0);
    } else {
      // Si no hay filtro, mostrar totales globales
      totalAsignadosUI = totalAsignadosGlobal;
      totalImplementadosUI = totalImplementadosRealGlobal;
      puntosCoberturaUI = puntosCoberturaGlobal;
    }

    // console.log('=== DEBUG COBERTURA ASESOR PUNTOS CONSISTENTES ===');
    // console.log('Filtro PDV aplicado:', pdv_id || 'NINGUNO');
    // console.log('--- VALORES GLOBALES ---');
    // console.log('Total asignados global:', totalAsignadosGlobal);
    // console.log('Total implementados real global:', totalImplementadosRealGlobal);
    // console.log('Total implementados válidos global:', totalImplementadosPuntosGlobal);
    // console.log('Puntos cobertura global:', puntosCoberturaGlobal);
    // console.log('Puntos por PDV global:', puntosPorPDVGlobal);
    // console.log('--- VALORES UI ---');
    // console.log('Total asignados UI:', totalAsignadosUI);
    // console.log('Total implementados UI:', totalImplementadosUI);
    // console.log('Puntos cobertura UI (CONSISTENTES):', puntosCoberturaUI);
    // console.log('PDVs a mostrar:', pdvsParaMostrar.length);
    // console.log('===================================================');

    res.json({
      success: true,
      pdvs: pdvsParaMostrar,                      // PDVs filtrados con puntos originales
      totalAsignados: totalAsignadosUI,           // Total UI (filtrado o global)
      totalImplementados: totalImplementadosUI,   // Total UI (filtrado o global)
      puntosCobertura: puntosCoberturaUI          // Puntos UI CONSISTENTES
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener cobertura', error: err.message });
  }
  // ✅ NO necesitamos finally ni conn.release() - el pool se encarga automáticamente
});

// ENDPOINT DE VOLUMEN PARA DASHBOARD ASESOR
router.get('/volumen/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  const { pdv_id } = req.query; // AGREGADO: Soporte para filtro por PDV
  
  // console.log('🔍 === INICIO DEBUG ENDPOINT VOLUMEN ===');
  // console.log('user_id recibido:', user_id);
  // console.log('pdv_id recibido:', pdv_id, 'tipo:', typeof pdv_id);
  // console.log('URL completa:', req.originalUrl);
  // console.log('Query params completos:', req.query);
  // console.log('=======================================');
  
  try {

    let whereClausePDV = 'WHERE pv.user_id = ?';
    let queryParamsPDV = [user_id];
    
    if (pdv_id) {
      whereClausePDV += ' AND pv.id = ?';
      queryParamsPDV.push(pdv_id);
    }

    // PASO 1: SIEMPRE obtener la meta total GLOBAL (sin filtro) para mantener contexto
    const metaGlobalResult = await executeQueryForMultipleUsers(
      `SELECT SUM(meta_volumen) as totalMeta 
       FROM puntos_venta 
       WHERE user_id = ?`, [user_id]
    );
    const totalMetaGlobal = metaGlobalResult[0]?.totalMeta || 0;

    // PASO 2: SIEMPRE obtener el volumen real GLOBAL (sin filtro) para mantener contexto
    const realGlobalResult = await executeQueryForMultipleUsers(
      `SELECT COALESCE(SUM(rp.conversion_galonaje), 0) as totalReal
       FROM registro_servicios rs
       INNER JOIN registro_productos rp ON rp.registro_id = rs.id
       WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)`, [user_id]
    );
    const totalRealGlobal = realGlobalResult[0]?.totalReal || 0;

    // PASO 4: Obtener TODOS los PDVs con sus datos (sin filtro) para calcular puntos globales
    const todosLosPdvsResult = await executeQueryForMultipleUsers(
      `SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         pv.segmento,
         pv.meta_volumen AS meta,
         COALESCE(vol.total_volumen, 0) AS \`real\`
       FROM puntos_venta pv
       LEFT JOIN (
         SELECT rs.pdv_id, SUM(rp.conversion_galonaje) as total_volumen
         FROM registro_servicios rs
         INNER JOIN registro_productos rp ON rp.registro_id = rs.id
         WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
         GROUP BY rs.pdv_id
       ) vol ON vol.pdv_id = pv.id
       WHERE pv.user_id = ?`, [user_id, user_id]
    );

    // PASO 3: Calcular puntos GLOBALES (base para distribución individual)
    let puntosVolumenGlobal = totalMetaGlobal > 0 ? 
      Math.round((totalRealGlobal / totalMetaGlobal) * 6000) : 0;
    // Aplica el factor de complejidad global
    puntosVolumenGlobal = Math.round(puntosVolumenGlobal * calcularFactorComplejidad(Array.isArray(todosLosPdvsResult) ? todosLosPdvsResult.length : 0));

    // PASO 5: Calcular distribución de puntos GLOBAL para cada PDV
    const todosLosPdvs = Array.isArray(todosLosPdvsResult) ? todosLosPdvsResult : [];
    const cumplimientoTotalGlobal = todosLosPdvs.reduce((sum, pdv) => {
      if (pdv.meta > 0) {
        return sum + (pdv.real / pdv.meta);
      }
      return sum;
    }, 0);

    // Asignar puntos GLOBALES a cada PDV (estos NO cambian nunca)
    const pdvsConPuntosGlobales = todosLosPdvs.map(pdv => {
      const cumplimiento = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
      
      let puntosPorPDV = 0;
      if (pdv.meta > 0 && cumplimientoTotalGlobal > 0) {
        const ratioCumplimiento = (pdv.real / pdv.meta);
        const proporcionCumplimiento = ratioCumplimiento / cumplimientoTotalGlobal;
        puntosPorPDV = Math.round(puntosVolumenGlobal * proporcionCumplimiento);
      }
      
      return {
        ...pdv,
        puntos: puntosPorPDV,
        cumplimiento: Number(cumplimiento.toFixed(2))
      };
    });

    // PASO 6: Filtrar PDVs para mostrar (manteniendo sus puntos originales)
    let pdvsParaMostrar = pdvsConPuntosGlobales;
    if (pdv_id) {
      pdvsParaMostrar = pdvsConPuntosGlobales.filter(pdv => pdv.id == pdv_id);
    }

    // PASO 7: Calcular totales para la UI (filtrados si hay filtro, globales si no)
    let totalMetaUI, totalRealUI, puntosUI, porcentajeUI;
    
    if (pdv_id) {
      // Si hay filtro, mostrar valores del PDV específico
      const pdvFiltrado = pdvsParaMostrar[0];
      totalMetaUI = pdvFiltrado ? pdvFiltrado.meta : 0;
      totalRealUI = pdvFiltrado ? pdvFiltrado.real : 0;
      puntosUI = pdvFiltrado ? pdvFiltrado.puntos : 0;
      porcentajeUI = pdvFiltrado ? pdvFiltrado.cumplimiento : 0;
      porcentajeUI = totalMetaUI > 0 ? Number(((totalRealUI / totalMetaUI) * 100).toFixed(1)) : 0;
    } else {
      // Si no hay filtro, mostrar totales globales
      totalMetaUI = totalMetaGlobal;
      totalRealUI = totalRealGlobal;
      puntosUI = puntosVolumenGlobal;
      porcentajeUI = totalMetaGlobal > 0 ? Number(((totalRealGlobal / totalMetaGlobal) * 100).toFixed(1)) : 0;
    }

    // console.log('=== DEBUG VOLUMEN ASESOR PUNTOS CONSISTENTES ===');
    // console.log('Filtro PDV aplicado:', pdv_id || 'NINGUNO');
    // console.log('Meta global:', totalMetaGlobal);
    // console.log('Real global:', totalRealGlobal);
    // console.log('Puntos globales:', puntosVolumenGlobal);
    // console.log('--- VALORES UI ---');
    // console.log('Meta UI:', totalMetaUI);
    // console.log('Real UI:', totalRealUI);
    // console.log('Puntos UI:', puntosUI);
    // console.log('Porcentaje UI:', porcentajeUI);
    // console.log('PDVs a mostrar:', pdvsParaMostrar.length);
    // console.log('================================================');

    // PASO 8: Obtener resumen por segmento (filtrado si hay pdv_id)
    let whereClauseSegmentos = 'WHERE pv.user_id = ?';
    let queryParamsSegmentos = [user_id];
    let subqueryParamsSegmentos = [user_id];
    
    if (pdv_id) {
      whereClauseSegmentos += ' AND pv.id = ?';
      queryParamsSegmentos.push(pdv_id);
      subqueryParamsSegmentos.push(pdv_id);
    }
    
    const segmentosResult = await executeQueryForMultipleUsers(
      `SELECT 
         pv.segmento,
         COUNT(DISTINCT pv.id) AS cantidadPdvs,
         COALESCE(SUM(vol_seg.total_galones), 0) AS totalGalones
       FROM puntos_venta pv
       LEFT JOIN (
         SELECT rs.pdv_id, SUM(rp.conversion_galonaje) as total_galones
         FROM registro_servicios rs
         INNER JOIN registro_productos rp ON rp.registro_id = rs.id
         WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
         ${pdv_id ? 'AND rs.pdv_id = ?' : ''}
         GROUP BY rs.pdv_id
       ) vol_seg ON vol_seg.pdv_id = pv.id
       ${whereClauseSegmentos} 
       GROUP BY pv.segmento`,
      [...subqueryParamsSegmentos, ...queryParamsSegmentos]
    );

    // Verificar que segmentos sea un array válido
    const segmentos = Array.isArray(segmentosResult) ? segmentosResult : [];

    // console.log('=== DEBUG SEGMENTOS FILTRADO CORREGIDO ===');
    // console.log('¿Hay filtro PDV para segmentos?:', !!pdv_id);
    // console.log('PDV ID para filtro:', pdv_id);
    // console.log('WHERE clause segmentos:', whereClauseSegmentos);
    // console.log('Parámetros subquery:', subqueryParamsSegmentos);
    // console.log('Parámetros WHERE principal:', queryParamsSegmentos);
    // console.log('Segmentos encontrados:', segmentos);
    // console.log('SQL construido para segmentos:', 
    //   `SELECT pv.segmento, COUNT(DISTINCT pv.id) AS cantidadPdvs, COALESCE(SUM(vol_seg.total_galones), 0) AS totalGalones
    //    FROM puntos_venta pv
    //    LEFT JOIN (
    //      SELECT rs.pdv_id, SUM(rp.conversion_galonaje) as total_galones
    //      FROM registro_servicios rs
    //      INNER JOIN registro_productos rp ON rp.registro_id = rs.id
    //      WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
    //      ${pdv_id ? 'AND rs.pdv_id = ?' : ''}
    //      GROUP BY rs.pdv_id
    //    ) vol_seg ON vol_seg.pdv_id = pv.id
    //    ${whereClauseSegmentos} 
    //    GROUP BY pv.segmento`);
    // console.log('===========================================');

    // PASO 9: Obtener detalle por producto (filtrado si hay pdv_id)
    let whereClauseProductos = 'WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)';
    let queryParamsProductos = [user_id];
    
    if (pdv_id) {
      whereClauseProductos += ' AND rs.pdv_id = ?';
      queryParamsProductos.push(pdv_id);
    }
    
    const productosResult = await executeQueryForMultipleUsers(
      `SELECT 
         rp.referencia_id AS nombre,
         COUNT(rp.id) AS numeroCajas,
         SUM(rp.conversion_galonaje) AS galonaje
       FROM registro_servicios rs
       INNER JOIN registro_productos rp ON rp.registro_id = rs.id
       ${whereClauseProductos}
       GROUP BY rp.referencia_id
       ORDER BY galonaje DESC`,
       
      queryParamsProductos
    );

    // Verificar que productos sea un array válido
    const productos = Array.isArray(productosResult) ? productosResult : [];

    // console.log('=== DEBUG PRODUCTOS FILTRADO CORREGIDO ===');
    // console.log('¿Hay filtro PDV para productos?:', !!pdv_id);
    // console.log('PDV ID para filtro productos:', pdv_id);
    // console.log('WHERE clause productos:', whereClauseProductos);
    // console.log('Parámetros productos:', queryParamsProductos);
    // console.log('Productos encontrados:', productos.length);
    // console.log('Detalle productos:', productos);
    // console.log('SQL construido para productos:', 
    //   `SELECT rp.referencia_id AS nombre, COUNT(rp.id) AS numeroCajas, SUM(rp.conversion_galonaje) AS galonaje
    //    FROM registro_servicios rs
    //    INNER JOIN registro_productos rp ON rp.registro_id = rs.id
    //    ${whereClauseProductos}
    //    GROUP BY rp.referencia_id
    //    ORDER BY galonaje DESC`);
    // console.log('===========================================');

    // Calcular porcentajes para productos basados en el galonaje filtrado
    const totalGalonaje = productos.reduce((sum, p) => sum + (p.galonaje || 0), 0);
    productos.forEach(p => {
      p.porcentaje = totalGalonaje > 0 ? 
        Number(((p.galonaje / totalGalonaje) * 100).toFixed(1)) : 0;
    });
    
    // console.log('=== DEBUG RESPUESTA FINAL VOLUMEN PUNTOS CONSISTENTES ===');
    // console.log('¿Hay filtro PDV?:', !!pdv_id);
    // console.log('Meta UI final:', totalMetaUI);
    // console.log('Real UI final:', totalRealUI);
    // console.log('Puntos UI final (CONSISTENTES):', puntosUI);
    // console.log('Porcentaje UI final:', porcentajeUI);
    // console.log('Total segmentos filtrados:', segmentos.length);
    // console.log('Total productos filtrados:', productos.length);
    // console.log('Total PDVs mostrados:', pdvsParaMostrar.length);
    // console.log('==========================================================');
    
    res.json({
      success: true,
      pdvs: pdvsParaMostrar,                      // PDVs filtrados con puntos originales
      meta_volumen: totalMetaUI,                  // Meta UI (filtrada o global) -> CORREGIDO
      real_volumen: totalRealUI,                  // Real UI (filtrado o global)
      porcentaje_cumplimiento: porcentajeUI,     // Porcentaje UI (filtrado o global)
      puntos: puntosUI,                          // Puntos UI CONSISTENTES
      segmentos,                                 // Resumen por segmento (filtrado si aplica)
      productos                                  // Resumen por producto (filtrado si aplica)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de volumen', error: err.message });
  }
});

// ENDPOINT DE VISITAS PARA DASHBOARD ASESOR
router.get('/visitas/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  const { pdv_id } = req.query; // AGREGADO: Soporte para filtro por PDV
  
  // console.log('🔍 === INICIO DEBUG ENDPOINT VISITAS ===');
  // console.log('user_id recibido:', user_id);
  // console.log('pdv_id recibido:', pdv_id, 'tipo:', typeof pdv_id);
  // console.log('=======================================');
  
  try {
    // PASO 1: SIEMPRE obtener datos GLOBALES para calcular puntos consistentes
    const todosLosPdvsGlobales = await executeQueryForMultipleUsers(
      `SELECT id, codigo, descripcion AS nombre, direccion
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );
    const totalPdvsGlobal = todosLosPdvsGlobales.length;
    const metaVisitasGlobal = totalPdvsGlobal * 10; // Meta global: 20 visitas por PDV
    
    // PASO 2: Obtener visitas reales GLOBALES (sin filtro, solo una visita por PDV por día)
    const realGlobalResult = await executeQueryForMultipleUsers(
    `SELECT COUNT(DISTINCT CONCAT(pdv_id, '-', DATE(fecha_registro))) as totalVisitas
       FROM registro_servicios
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [user_id]
    );
    const totalVisitasGlobal = realGlobalResult[0]?.totalVisitas || 0;
    
    // PASO 3: Calcular puntos GLOBALES (base para distribución individual)
    let puntosVisitasGlobal = metaVisitasGlobal > 0 ? 
      Math.round((totalVisitasGlobal / metaVisitasGlobal) * 1000) : 0;
    // Aplica el factor de complejidad global
    puntosVisitasGlobal = Math.round(puntosVisitasGlobal * calcularFactorComplejidad(totalPdvsGlobal));
    
    // PASO 4: Obtener detalle de visitas GLOBAL para cada PDV (sin filtro, solo una visita por PDV por día)
    const pdvsVisitasGlobalesResult = await executeQueryForMultipleUsers(
      `SELECT 
         pv.id,
         pv.codigo,
         pv.descripcion AS nombre,
         COUNT(DISTINCT DATE(rs.fecha_registro)) AS cantidadVisitas,
         10 AS meta
       FROM puntos_venta pv
       LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
       WHERE pv.user_id = ?
       GROUP BY pv.id, pv.codigo, pv.descripcion`,
      [user_id, user_id]
    );
    
    // PASO 5: Asignar puntos GLOBALES a cada PDV (estos NO cambian nunca)
    const pdvsConPuntosGlobales = Array.isArray(pdvsVisitasGlobalesResult) ? 
      pdvsVisitasGlobalesResult.map(pdv => {
        const porcentaje = pdv.meta > 0 ? Math.round((pdv.cantidadVisitas / pdv.meta) * 100 ) : 0;
        
        // Calcular puntos proporcionales: (visitas_del_pdv / total_visitas_global) * puntos_globales
        let puntosIndividuales = 0;
        if (pdv.cantidadVisitas > 0 && totalVisitasGlobal > 0) {
          puntosIndividuales = Math.round((pdv.cantidadVisitas / totalVisitasGlobal) * puntosVisitasGlobal);
        }
        
        return {
          ...pdv,
          porcentaje,
          puntos: puntosIndividuales // Puntos FIJOS basados en contexto global
        };
      }) : [];

    // PASO 6: Filtrar PDVs para mostrar (manteniendo sus puntos originales)
    let pdvsParaMostrar = pdvsConPuntosGlobales;
    if (pdv_id) {
      pdvsParaMostrar = pdvsConPuntosGlobales.filter(pdv => pdv.id == pdv_id);
    }

    // PASO 7: Calcular totales para la UI (filtrados si hay filtro, globales si no)
    let metaVisitasUI, totalVisitasUI, puntosVisitasUI, porcentajeUI;
    
    if (pdv_id) {
      // Si hay filtro, mostrar valores del PDV específico
      const pdvFiltrado = pdvsParaMostrar[0];
      metaVisitasUI = pdvFiltrado ? pdvFiltrado.meta : 0;
      totalVisitasUI = pdvFiltrado ? pdvFiltrado.cantidadVisitas : 0;
      puntosVisitasUI = pdvFiltrado ? pdvFiltrado.puntos : 0;
      porcentajeUI = metaVisitasUI > 0 ? Math.round((totalVisitasUI / metaVisitasUI) * 100) : 0;
      porcentajeUI = pdvFiltrado ? pdvFiltrado.porcentaje : 0;
    } else {
      // Si no hay filtro, mostrar totales globales
      metaVisitasUI = metaVisitasGlobal;
      totalVisitasUI = totalVisitasGlobal;
      puntosVisitasUI = puntosVisitasGlobal;
      porcentajeUI = metaVisitasGlobal > 0 ? Math.round((totalVisitasGlobal / metaVisitasGlobal) * 100) : 0;
    }

    // console.log('=== DEBUG VISITAS ASESOR PUNTOS CONSISTENTES ===');
    // console.log('Filtro PDV aplicado:', pdv_id || 'NINGUNO');
    // console.log('--- VALORES GLOBALES ---');
    // console.log('Total PDVs global:', totalPdvsGlobal);
    // console.log('Meta visitas global:', metaVisitasGlobal);
    // console.log('Total visitas global:', totalVisitasGlobal);
    // console.log('Puntos visitas global:', puntosVisitasGlobal);
    // console.log('--- VALORES UI ---');
    // console.log('Meta visitas UI:', metaVisitasUI);
    // console.log('Total visitas UI:', totalVisitasUI);
    // console.log('Puntos visitas UI (CONSISTENTES):', puntosVisitasUI);
    // console.log('Porcentaje UI:', porcentajeUI);
    // console.log('PDVs a mostrar:', pdvsParaMostrar.length);
    // console.log('================================================');
    
    // PASO 8: Obtener tipos de visita (filtrado si aplica, solo una visita por PDV por día)
    const tiposVisitaResult = await executeQueryForMultipleUsers(
      `SELECT 
         CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen/Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
         END AS tipo,
         COUNT(DISTINCT CONCAT(pdv_id, '-', DATE(fecha_registro))) AS cantidad
       FROM registro_servicios
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2
       ${pdv_id ? 'AND pdv_id = ?' : ''}
       GROUP BY tipo`,
      pdv_id ? [user_id, pdv_id] : [user_id]
    );

    // Verificar que tiposVisita sea un array válido
    const tiposVisita = Array.isArray(tiposVisitaResult) ? tiposVisitaResult : [];

    res.json({
      success: true,
      pdvs: pdvsParaMostrar,                      // PDVs filtrados con puntos originales
      meta_visitas: metaVisitasUI,                // Meta UI (filtrada o global)
      real_visitas: totalVisitasUI,               // Visitas UI (filtradas o globales)
      puntos: puntosVisitasUI,                    // Puntos UI CONSISTENTES
      porcentajeCumplimiento: porcentajeUI,       // Porcentaje UI (filtrado o global)
      tiposVisita                                 // Tipos de visita (filtrados si aplica)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener datos de visitas', error: err.message });
  }
});

// ENDPOINT DE PRECIOS PARA DASHBOARD ASESOR
router.get('/precios/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  try {

    // 1. Obtener todos los PDVs asignados al asesor
    const pdvs = await executeQueryForMultipleUsers(
      `SELECT id, codigo, descripcion AS nombre, direccion
       FROM puntos_venta
       WHERE user_id = ?`, [user_id]
    );
    
    // 2. Obtener PDVs con COBERTURA (estado_id = 2 AND estado_agente_id = 2)
    const pdvsConCobertura = await executeQueryForMultipleUsers(
      `SELECT DISTINCT pdv_id
       FROM registro_servicios
       WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [user_id]
    );
    const coberturaSet = new Set(pdvsConCobertura.map(r => r.pdv_id));

    // 3. Obtener datos de mystery shopper con cumplimiento y fecha_registro
    const mysteryData = await executeQueryForMultipleUsers(
      `SELECT 
        rm.id_pdv,
        rm.cumplimiento,
        rm.fecha_visita as fecha_registro,
        CASE 
          WHEN rm.cumplimiento >= 85 THEN 'Aceptado'
          ELSE 'No Aceptado'
        END as estado_aprobacion
       FROM registros_mystery rm
       INNER JOIN puntos_venta pv ON rm.id_pdv = pv.id
       WHERE pv.user_id = ?`, [user_id]
    );
    
    // Crear un mapa de datos de mystery por PDV
    const mysteryMap = new Map();
    mysteryData.forEach(m => {
      mysteryMap.set(m.id_pdv, {
        cumplimiento: m.cumplimiento,
        fecha_registro: m.fecha_registro,
        estado_aprobacion: m.estado_aprobacion
      });
    });

    // 4. Contar PDVs con mystery "Aceptado" (cumplimiento >= 95%)
    const pdvsAceptados = mysteryData.filter(m => m.estado_aprobacion === 'Aceptado');
    const totalAceptados = pdvsAceptados.length;

    // 5. Cálculo de puntos por precios (basado en PDVs ACEPTADOS vs PDVs con cobertura)
    const totalAsignados = pdvs.length;
    const totalConCobertura = coberturaSet.size; // META
    const totalReal = totalAceptados; // REAL (solo aceptados)
    
    let puntosPrecios = totalConCobertura > 0 ? Math.round((totalReal / totalConCobertura) * 2000) : 0;
    // Aplica el factor de complejidad global
    puntosPrecios = Math.round(puntosPrecios * calcularFactorComplejidad(totalAsignados));

    // 6. Asignar puntos SOLO a PDVs con estado "Aceptado"
    const puntosPorPDV = totalReal > 0 ? Math.floor(puntosPrecios / totalReal) : 0;
    const pdvsDetalle = pdvs.map(pdv => {
      const tieneCobertura = coberturaSet.has(pdv.id);
      const mysteryInfo = mysteryMap.get(pdv.id);
      const esAceptado = mysteryInfo && mysteryInfo.estado_aprobacion === 'Aceptado';
      
      return {
        ...pdv,
        // SOLO asignar puntos si es "Aceptado"
        puntos: esAceptado ? puntosPorPDV : 0,
        // Datos de mystery shopper
        cumplimiento: mysteryInfo ? mysteryInfo.cumplimiento : null,
        fecha_registro: mysteryInfo ? mysteryInfo.fecha_registro : null,
        estado_mystery: mysteryInfo ? mysteryInfo.estado_aprobacion : 'Sin Visita'
      };
    });
    
    res.json({
      success: true,
      pdvs: pdvsDetalle,
      totalAsignados,
      totalConCobertura, // META: PDVs con cobertura
      totalAceptados: totalReal, // REAL: PDVs con mystery aceptado
      puntosPrecios,
      porcentaje: totalConCobertura > 0 ? Math.round((totalReal / totalConCobertura) * 100) : 0
    });
    
  } catch (error) {
    console.error('Error al consultar datos de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar información de precios',
      error: error.message
    });
  }
});


// ENDPOINT DE BONIFICACIÓN PARA DASHBOARD ASESOR
router.get('/bonificacion/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;
  const { pdv_id, agente_id, desde, hasta } = req.query;
  try {
    await ejecutarCalculosDeBonos();

    // Construir filtros dinámicos
    let where = 'WHERE b.id_asesor = ?';
    let params = [user_id];
    if (pdv_id) {
      where += ' AND b.pdv_id = ?';
      params.push(pdv_id);
    }
    if (agente_id) {
      where += ' AND b.id_agente = ?';
      params.push(agente_id);
    }

    // Consulta para traer de bonificaciones
    const bonificaciones = await executeQueryForMultipleUsers(
      `SELECT b.*
       FROM retos_bonificadores b
       ${where}
       ORDER BY b.created DESC`,
      params
    );

    res.json({
      success: true,
      bonificaciones
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener bonificaciones', error: err.message });
  }
});

// ========================================================================
// 📋 LÓGICA PARA BONIFICADOR AUTOMÁTICO POR ASESOR
// ========================================================================

// Helper para Bonos Automáticos
const ejecutarCalculosDeBonos = async () => {
  try {
    const now = new Date();

  // ---------------------------------------------------------------
  // --- Lógica para "Primeros en Actuar" (Antes del 2025-09-06) ---
  // ---------------------------------------------------------------

  // const fechaCortePrimerosActuar = new Date('2025-09-06T23:59:59');
  // if (now > fechaCortePrimerosActuar) {
  //   const bonusDescriptionPrimerosActuar = 'Primeros en Actuar';
  //   const bonoPrimerosYaAsignado = await executeQueryFast(`SELECT id FROM retos_bonificadores WHERE descripcion = ? LIMIT 1`, [bonusDescriptionPrimerosActuar]);

  //   if (bonoPrimerosYaAsignado.length === 0) {
  //     console.log(`Iniciando cálculo de bono: '${bonusDescriptionPrimerosActuar}'...`);
      
  //     // Obtener todos los asesores
  //     const asesores = await executeQueryForMultipleUsers('SELECT id, name FROM users WHERE rol_id = 1');
      
  //     const asesoresConCobertura = [];
      
  //     for (const asesor of asesores) {
  //       const asesor_id = asesor.id;
        
  //       // Obtener total de PDVs asignados
  //       const pdvsAsignadosResult = await executeQueryFast(
  //         `SELECT COUNT(id) as total FROM puntos_venta WHERE user_id = ?`, [asesor_id]
  //       );
  //       const totalAsignados = pdvsAsignadosResult[0]?.total || 0;
        
  //       if (totalAsignados === 0) continue; // Saltar asesor sin PDVs
        
  //       // Obtener PDVs implementados antes del 2025-09-06
  //       const pdvsImplementadosResult = await executeQueryFast(
  //         `SELECT DISTINCT pdv_id, MIN(fecha_registro) as primera_fecha
  //          FROM registro_servicios 
  //          WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2 AND fecha_registro <= ?
  //          GROUP BY pdv_id`, 
  //         [asesor_id, '2025-09-06']
  //       );
  //       const totalImplementados = pdvsImplementadosResult.length;
        
  //       // Verificar si alcanzó 100% de cobertura
  //       if (totalImplementados >= totalAsignados) {
  //         // Encontrar la fecha en que completó el 100% (fecha del último PDV que completó la meta)
  //         const fechasOrdenadas = pdvsImplementadosResult
  //           .map(r => new Date(r.primera_fecha))
  //           .sort((a, b) => b - a); // Ordenar descendente
          
  //         const fechaCompletado = fechasOrdenadas[0]; // La fecha más reciente cuando completó el 100%
          
  //         asesoresConCobertura.push({
  //           asesor_id,
  //           asesor_nombre: asesor.name,
  //           totalAsignados,
  //           totalImplementados,
  //           fechaCompletado
  //         });
  //       }
  //     }
      
  //     // Ordenar por fecha de completado (los primeros en lograrlo)
  //     asesoresConCobertura.sort((a, b) => a.fechaCompletado - b.fechaCompletado);
      
  //     // Tomar solo los primeros 10
  //     const primeros10 = asesoresConCobertura.slice(0, 10);
      
  //     // Asignar el bono de 2000 puntos a cada uno
  //     for (const asesorData of primeros10) {
  //       try {
  //         const query = `INSERT INTO retos_bonificadores (id_asesor, puntos, descripcion, detalle, created) VALUES (?, ?, ?, ?, NOW())`;
  //         const params = [
  //           asesorData.asesor_id,
  //           2000,
  //           bonusDescriptionPrimerosActuar,
  //           `Uno de los primeros 10 asesores en lograr 100% de cobertura antes del 06/09/2025 (${asesorData.totalImplementados}/${asesorData.totalAsignados} PDV).`
  //         ];
  //         await executeQueryForMultipleUsers(query, params);
  //         console.log(`Bono '${bonusDescriptionPrimerosActuar}' asignado a asesor ${asesorData.asesor_nombre} (ID: ${asesorData.asesor_id}) - 2000 pts.`);
  //       } catch (err) {
  //         console.error('[BONOS] Error al insertar bono "Primeros en Actuar" para asesor:', asesorData.asesor_id, '| Error:', err.message);
  //       }
  //     }
      
  //     console.log(`[BONOS] Asignación de bonos "Primeros en Actuar" finalizada. Total asignados: ${primeros10.length} de ${asesoresConCobertura.length} elegibles.`);
  //   }
  // }

  // -------------------------------------------------- 
  // --- Lógica para "Campeón por Agente" (Mensual) ---
  // --------------------------------------------------
  // Calcula TODOS los meses desde Agosto 2025 hasta Diciembre 2025 (termina el 15)
  
  // const fechaInicioCampana = new Date('2025-08-01'); // Inicio de la campaña
  // const fechaFinCampana = new Date('2025-12-15T23:59:59'); // Fin de la campaña
  // const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // // Solo ejecutar si estamos en un mes posterior a agosto
  // if (now > fechaInicioCampana) {
  //   console.log('[BONOS] Iniciando cálculo de bonos "Campeón por Agente" para todos los meses...');
  //   
  //   // Iterar desde Agosto 2025 hasta Diciembre 2025
  //   let mesActual = new Date(fechaInicioCampana);
  //   let mesesProcesados = 0;
  //   let bonosAsignados = 0;
  //   
  //   while (mesActual <= new Date('2025-12-01')) { // Hasta diciembre inclusive
  //     // Calcular primer y último día del mes
  //     const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  //     let ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
  //     
  //     // EXCEPCIÓN: Diciembre solo va hasta el 15
  //     const esDiciembre = mesActual.getMonth() === 11 && mesActual.getFullYear() === 2025;
  //     if (esDiciembre) {
  //       ultimoDiaMes = new Date('2025-12-15');
  //       // Solo calcular diciembre si ya pasó el 15 de diciembre
  //       if (now <= fechaFinCampana) {
  //         console.log('[BONOS] ⊗ Diciembre aún no termina (campaña hasta 15/12), omitiendo...');
  //         break; // Salir del bucle, no calcular diciembre todavía
  //       }
  //     }
  //     
  //     const startDate = primerDiaMes.toISOString().slice(0, 10);
  //     const endDate = ultimoDiaMes.toISOString().slice(0, 10);
  //     const monthName = ultimoDiaMes.toLocaleString('es-CO', { month: 'long' });
  //     const year = ultimoDiaMes.getFullYear();
  //     const bonusDescription = `Campeón por Agente - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  //     const detalle = 'Más galones vendidos en tu zona, 1.000 pts extra.';
  //     
  //     // Verificar si ya existe este bono mensual
  //     const bonoMensualYaAsignado = await executeQueryFast(
  //       `SELECT id FROM retos_bonificadores WHERE descripcion = ? LIMIT 1`, 
  //       [bonusDescription]
  //     );
  //     
  //     if (bonoMensualYaAsignado.length === 0) {
  //       console.log(`[BONOS] Calculando bono: '${bonusDescription}'...`);
  //       const agentes = await executeQueryForMultipleUsers(
  //         'SELECT DISTINCT agente_id FROM users WHERE agente_id IS NOT NULL AND rol_id = 1'
  //       );
  //       
  //       if (agentes.length > 0) {
  //         for (const agente of agentes) {
  //           const rankingAgente = await executeQueryForMultipleUsers(
  //             `SELECT u.id as asesor_id, u.name as asesor_nombre, COALESCE(SUM(rp.conversion_galonaje), 0) as total_volumen 
  //              FROM users u 
  //              LEFT JOIN registro_servicios rs ON u.id = rs.user_id 
  //                AND rs.fecha_registro BETWEEN ? AND ? 
  //                AND rs.estado_id = 2 
  //                AND rs.estado_agente_id = 2 
  //              LEFT JOIN registro_productos rp ON rs.id = rp.registro_id 
  //              WHERE u.agente_id = ? AND u.rol_id = 1 
  //              GROUP BY u.id, u.name 
  //              ORDER BY total_volumen DESC 
  //              LIMIT 1`,
  //             [startDate, endDate, agente.agente_id]
  //           );
  //           
  //           if (rankingAgente.length > 0 && rankingAgente[0].total_volumen > 0) {
  //             const ganador = rankingAgente[0];
  //             await executeQueryForMultipleUsers(
  //               `INSERT INTO retos_bonificadores (id_asesor, puntos, descripcion, detalle, created) 
  //                VALUES (?, 1000, ?, ?, NOW())`, 
  //               [ganador.asesor_id, bonusDescription, detalle]
  //             );
  //             console.log(`[BONOS] ✓ Bono '${bonusDescription}' asignado a ${ganador.asesor_nombre} (ID: ${ganador.asesor_id}) - Agente ${agente.agente_id} - ${ganador.total_volumen} galones`);
  //             bonosAsignados++;
  //           }
  //         }
  //       }
  //       mesesProcesados++;
  //     } else {
  //       console.log(`[BONOS] ⊗ Bono '${bonusDescription}' ya existe, omitiendo...`);
  //     }
  //     
  //     // Avanzar al siguiente mes
  //     mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1);
  //   }
  //   
  //   console.log(`[BONOS] Proceso completado: ${mesesProcesados} meses procesados, ${bonosAsignados} bonos asignados.`);
  // }

  // ---------------------------------------------------------
  // --- Lógica para "Ejecución Perfecta" (Fin de Periodo) ---
  // ---------------------------------------------------------

  // const finDePeriodo = new Date('2025-12-15T23:59:59');
  // if (now > finDePeriodo) {
  //   const bonusDescriptionEp = 'Ejecución Perfecta';
  //   const bonoFinalYaAsignado = await executeQueryFast(`SELECT id FROM retos_bonificadores WHERE descripcion = ? LIMIT 1`, [bonusDescriptionEp]);
  //   if (bonoFinalYaAsignado.length === 0) {
  //     console.log(`Iniciando cálculo de bono de fin de periodo: '${bonusDescriptionEp}'...`);
  //     const asesores = await executeQueryForMultipleUsers('SELECT id FROM users WHERE rol_id = 1');
  //     for (const asesor of asesores) {
  //     const asesor_id = asesor.id;
  //     const pdvsAsignados = await executeQueryFast(`SELECT COUNT(id) as total FROM puntos_venta WHERE user_id = ?`, [asesor_id]);
  //     const totalAsignados = pdvsAsignados[0]?.total || 0;
  //     const pdvsImplementados = await executeQueryFast(`SELECT COUNT(DISTINCT pdv_id) as total FROM registro_servicios WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2 AND fecha_registro <= ?`, [asesor_id, '2025-12-20']);
  //     const totalImplementados = pdvsImplementados[0]?.total || 0;
  //     const coberturaOk = totalAsignados > 0 && totalImplementados >= totalAsignados;
  //     const metaFrecuencia = totalAsignados * 10;
  //     const realFrecuenciaResult = await executeQueryFast(`SELECT COUNT(DISTINCT CONCAT(pdv_id, DATE(fecha_registro))) as total FROM registro_servicios WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [asesor_id]);
  //     const realFrecuencia = realFrecuenciaResult[0]?.total || 0;
  //     const frecuenciaOk = metaFrecuencia > 0 && realFrecuencia >= metaFrecuencia;
  //     if (coberturaOk && frecuenciaOk) {
  //       await executeQueryForMultipleUsers(`INSERT INTO retos_bonificadores (id_asesor, puntos, descripcion, detalle, created) VALUES (?, 1000, ?, ?, NOW())`, [asesor_id, bonusDescriptionEp, 'Logra 100% en Cobertura y Frecuencia para 1.000 pts extra.']);
  //       console.log(`Bono '${bonusDescriptionEp}' asignado a asesor ${asesor_id}.`);
  //     }
  //   }
  //   console.log(`Cálculo de bono '${bonusDescriptionEp}' finalizado.`);
  // }
  // }

  // --- Lógica para "PDV en segunda y tercera fase de implementación" (Fecha de Corte) ---
  const fechaCorteFases = new Date('2025-10-25T23:59:59');
  if (now > fechaCorteFases) {
    const bonusDescriptionFases = 'PDV en segunda y tercera fase';
    const bonoFasesYaAsignado = await executeQueryFast(`SELECT id FROM retos_bonificadores WHERE descripcion = ? LIMIT 1`, [bonusDescriptionFases]);

    if (bonoFasesYaAsignado.length === 0) {
      console.log(`Iniciando cálculo de bono: '${bonusDescriptionFases}'...`);
      const asesores = await executeQueryForMultipleUsers('SELECT id FROM users WHERE rol_id = 1');

      for (const asesor of asesores) {
        const asesor_id = asesor.id;

        const pdvsAsignadosResult = await executeQueryFast(`SELECT COUNT(id) as totalPdvs FROM puntos_venta WHERE user_id = ?`, [asesor_id]);
        const totalPdvsAsignados = pdvsAsignadosResult[0]?.totalPdvs || 0;

        if (totalPdvsAsignados === 0) continue; // Saltar asesor sin PDVs

        const pdvsCompletadosResult = await executeQueryFast(
          `SELECT COUNT(*) as pdvsCompletados FROM (
            SELECT 1
            FROM registro_servicios rs
            INNER JOIN registros_implementacion ri ON rs.id = ri.id_registro
            WHERE rs.user_id = ? 
              AND rs.estado_id = 2 AND rs.estado_agente_id = 2
              AND DATE(rs.created_at) <= '2025-10-25'
              AND ri.acepto_implementacion = 'Si'
              AND ri.nro_implementacion IN (2, 3)
            GROUP BY rs.pdv_id
            HAVING COUNT(DISTINCT ri.nro_implementacion) = 2
          ) as subquery`,
          [asesor_id]
        );
        const pdvsConFase2y3 = pdvsCompletadosResult[0]?.pdvsCompletados || 0;

        if (pdvsConFase2y3 > 0) {
          try {
            // Si cumplió con todos, asigna 1000, si no, asigna proporcional
            const puntos = pdvsConFase2y3 >= totalPdvsAsignados
              ? 1000
              : Math.round((1000 / totalPdvsAsignados) * pdvsConFase2y3);
            const query = `INSERT INTO retos_bonificadores (id_asesor, puntos, descripcion, detalle, created) VALUES (?, ?, ?, ?, NOW())`;
            const params = [
              asesor_id,
              puntos,
              bonusDescriptionFases,
              `PDV completó segunda y tercera fase de implementación (${pdvsConFase2y3} de ${totalPdvsAsignados} PDV).`
            ];
            await executeQueryForMultipleUsers(query, params);
            console.log(`Bono '${bonusDescriptionFases}' asignado a asesor ${asesor_id} (${puntos} pts).`);
          } catch (err) {
            console.error('[BONOS] Error al insertar bono para asesor:', asesor_id, '| Consulta:', `INSERT INTO retos_bonificadores (id_asesor, puntos, descripcion, detalle, created) VALUES (?, ?, ?, ?, NOW())`, '| Params:', [asesor_id, puntos, bonusDescriptionFases, `PDV completó segunda y tercera fase de implementación (${pdvsConFase2y3} de ${totalPdvsAsignados} PDV).`], '| Error:', err.message);
          }
        }
      }
      // Log de éxito al finalizar la asignación de bonos de implementación
      console.log(`[BONOS] Asignación de bonos de implementación (PDV en segunda y tercera fase) finalizada correctamente para todos los asesores elegibles.`);
    }
  }

  } catch (error) {
    console.error('Error crítico al calcular bonos automáticos:', error);
  }
};

// ========================================================================
// 📋 ENDPOINTS DE HISTORIAL Y CONSULTAS BÁSICAS
// ========================================================================

// HISTORIAL BÁSICO DE REGISTROS DEL ASESOR
router.get('/historial-registros-asesor/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  try {

    // Consulta básica solicitada
    const query = `
    WITH productos_agrupados AS (
        SELECT 
            registro_id,
            GROUP_CONCAT(referencia_id) AS referencias,
            GROUP_CONCAT(presentacion) AS presentaciones,
            GROUP_CONCAT(cantidad_cajas) AS cantidades_cajas,
            GROUP_CONCAT(conversion_galonaje) AS galonajes,
            GROUP_CONCAT(precio_sugerido) AS precios_sugeridos,
            GROUP_CONCAT(precio_real) AS precios_reales
        FROM registro_productos
        GROUP BY registro_id
    ),
    fotos_agrupadas AS (
        SELECT 
            id_registro,
            GROUP_CONCAT(foto_factura) AS fotos_factura,
            GROUP_CONCAT(foto_seguimiento) AS fotos_seguimiento
        FROM registro_fotografico_servicios
        GROUP BY id_registro
    ),
    implementacion_agrupada AS (
        SELECT 
            ri.id_registro,
            ri.nro_implementacion,
            ri.acepto_implementacion,
            ri.observacion AS observacion_implementacion,
            ri.foto_remision,
            GROUP_CONCAT(rip.nombre_producto) AS productos_implementados,
            GROUP_CONCAT(rip.nro) AS nros_productos,
            GROUP_CONCAT(rip.foto_evidencia) AS fotos_evidencia
        FROM registros_implementacion ri
        LEFT JOIN registros_implementacion_productos rip ON rip.id_registro_implementacion = ri.id
        GROUP BY ri.id_registro, ri.nro_implementacion, ri.acepto_implementacion, ri.observacion, ri.foto_remision
    )
    SELECT 
        registro_servicios.id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        users.name,
        DATE_FORMAT(registro_servicios.fecha_registro, '%Y-%m-%d') AS fecha_registro,
        DATE_FORMAT(registro_servicios.created_at, '%Y-%m-%d') AS created_at,

        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Volumen / Precio'
            WHEN kpi_volumen = 1 THEN 'Volumen'
            WHEN kpi_precio = 1 THEN 'Precio'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_kpi,
        CASE
            WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Galonaje/Precios'
            WHEN kpi_volumen = 1 THEN 'Galonaje'
            WHEN kpi_precio = 1 THEN 'Precios'
            WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 AND IsImplementacion is null THEN 'Visita'
            WHEN IsImplementacion = 1 THEN 'Implementación'
            ELSE 'Otro'
        END AS tipo_accion,
        e1.descripcion AS estado_backoffice,
        e2.descripcion AS estado_agente,
        registro_servicios.observacion AS observacion_asesor,
        registro_servicios.observacion_agente AS observacion_agente,
        
        -- Datos de subconsultas
        pa.referencias,
        pa.presentaciones,
        pa.cantidades_cajas,
        pa.galonajes,
        pa.precios_sugeridos,
        pa.precios_reales,
        fa.fotos_factura,
        fa.fotos_seguimiento,
        ia.nro_implementacion,
        ia.acepto_implementacion,
        ia.observacion_implementacion,
        ia.foto_remision,
        ia.productos_implementados,
        ia.nros_productos,
        ia.fotos_evidencia
        
    FROM registro_servicios
    INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
    INNER JOIN users ON users.id = registro_servicios.user_id
    INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
    INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id
    LEFT JOIN productos_agrupados pa ON pa.registro_id = registro_servicios.id
    LEFT JOIN fotos_agrupadas fa ON fa.id_registro = registro_servicios.id
    LEFT JOIN implementacion_agrupada ia ON ia.id_registro = registro_servicios.id

    WHERE registro_servicios.user_id = ?
    ORDER BY registro_servicios.id DESC;
    `;
    const rows = await executeQueryForMultipleUsers(query, [user_id]);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('Error obteniendo historial de registros:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de registros',
      error: err.message
    });
  }
});

// RESULTADOS ESPECÍFICOS DE AUDITORÍAS (MYSTERY SHOPPER)
router.get('/resultados-auditorias/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  try {

    // Consulta específica para auditorias (registros con kpi_precio = 1)
    const query = `
      SELECT 
        registro_servicios.id,
        registro_servicios.user_id,
        puntos_venta.codigo,
        puntos_venta.descripcion,
        puntos_venta.direccion,
        puntos_venta.segmento,
        users.name AS nombre_usuario,
        users.email AS email_usuario,
        DATE_FORMAT(registro_servicios.fecha_registro, '%Y-%m-%d') AS fecha_registro,
        registro_servicios.kpi_volumen,
        registro_servicios.kpi_precio,
        registro_servicios.kpi_frecuencia,
        DATE_FORMAT(registro_servicios.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,

        CASE
            WHEN registro_servicios.kpi_precio = 1 THEN 'Precio'
            WHEN registro_servicios.kpi_frecuencia = 1 AND registro_servicios.kpi_precio = 0 AND registro_servicios.kpi_volumen = 0 THEN 'Frecuencia'
            ELSE 'Otro'
        END AS tipo_accion,

        -- Estados con nombres descriptivos
        e1.descripcion AS estado_backoffice,
        e2.descripcion AS estado_agente,

        -- Si no hay registro asociado, el estado será 1 (En Revisión)
        IFNULL(registros_mistery_shopper.id_estado, 1) AS estado_mystery,

        -- Si no hay hallazgo registrado, mostrar 'Ninguno'
        IFNULL(registros_mistery_shopper.hallazgo, 'Ninguno') AS hallazgo,

        registro_servicios.observacion,

        -- Información de productos
        GROUP_CONCAT(registro_productos.referencia_id) AS referencias,
        GROUP_CONCAT(registro_productos.presentacion) AS presentaciones,
        GROUP_CONCAT(registro_productos.precio_sugerido) AS precios_sugeridos,
        GROUP_CONCAT(registro_productos.precio_real) AS precios_reales

      FROM registro_servicios

      INNER JOIN puntos_venta ON puntos_venta.id = registro_servicios.pdv_id
      INNER JOIN users ON users.id = registro_servicios.user_id
      INNER JOIN estados e1 ON e1.id = registro_servicios.estado_id
      INNER JOIN estados e2 ON e2.id = registro_servicios.estado_agente_id

      LEFT JOIN registro_productos ON registro_productos.registro_id = registro_servicios.id
      LEFT JOIN registro_fotografico_servicios ON registro_fotografico_servicios.id_registro = registro_servicios.id

      LEFT JOIN registros_mistery_shopper 
          ON registros_mistery_shopper.id_registro_pdv = registro_servicios.id

      WHERE registro_servicios.kpi_precio = 1 AND registro_servicios.user_id = ?

      GROUP BY
          registro_servicios.id,
          registro_servicios.user_id,
          puntos_venta.codigo,
          puntos_venta.descripcion,
          puntos_venta.direccion,
          puntos_venta.segmento,
          users.name,
          users.email,
          registro_servicios.fecha_registro,
          registro_servicios.kpi_volumen,
          registro_servicios.kpi_precio,
          registro_servicios.kpi_frecuencia,
          registro_servicios.created_at,
          e1.descripcion,
          e2.descripcion,
          registros_mistery_shopper.id_estado,
          registros_mistery_shopper.hallazgo,
          registro_servicios.observacion

      ORDER BY
          registro_servicios.fecha_registro DESC,
          registro_servicios.created_at DESC
    `;

    const rows = await executeQueryForMultipleUsers(query, [user_id]);

    // Procesar datos para incluir información adicional de auditorias
    const datosProcessados = rows.map(row => {
      // Procesar fotos en formato de array si hay datos
      const fotos = [];
      if (row.fotos_pop) {
        const fotosArray = row.fotos_pop.split(',');
        fotosArray.forEach(foto => {
          if (foto.trim()) {
            fotos.push({
              ruta_archivo: foto.trim(),
              tipo: 'foto_pop'
            });
          }
        });
      }

      // Procesar productos en formato de array si hay datos
      const productos = [];
      if (row.referencias) {
        const referencias = row.referencias.split(',');
        const presentaciones = row.presentaciones ? row.presentaciones.split(',') : [];
        const preciosSugeridos = row.precios_sugeridos ? row.precios_sugeridos.split(',') : [];
        const preciosReales = row.precios_reales ? row.precios_reales.split(',') : [];

        referencias.forEach((ref, index) => {
          productos.push({
            referencia: ref.trim(),
            presentacion: presentaciones[index] ? presentaciones[index].trim() : 'N/A',
            precio_sugerido: preciosSugeridos[index] ? preciosSugeridos[index].trim() : 'N/A',
            precio_real: preciosReales[index] ? preciosReales[index].trim() : 'N/A'
          });
        });
      }

      return {
        ...row,
        fotos,
        productos,
        estado: row.estado_mystery === 1 ? 'En Revisión' : 
                row.estado_mystery === 2 ? 'Aprobado' : 
                row.estado_mystery === 3 ? 'Rechazado' : 'En Revisión',
        estado_agente: row.hallazgo !== 'Ninguno' ? 'Con Hallazgos' : 'Sin Hallazgos'
      };
    });

    res.json({
      success: true,
      data: datosProcessados,
      total: datosProcessados.length
    });

  } catch (err) {
    console.error('Error obteniendo resultados de auditorias:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resultados de auditorias',
      error: err.message
    });
  }
});

// ========================================================================
// 📊 ENDPOINTS DE EXPORTACIÓN A EXCEL - REPORTES DETALLADOS
// ========================================================================

// HISTORIAL COMPLETO DE VISITAS - EXPORTACIÓN A EXCEL
router.get('/historial-visitas/:user_id', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { user_id } = req.params;

  // Solo permitir ver sus propios registros
  if (req.user.id != user_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los datos de otro usuario'
    });
  }

  try {

    // Consulta completa combinando historial de visitas con detalles completos (basada en registro-detalles)
    const query = `
      SELECT 
          rs.id,
          rs.user_id,
          pv.codigo,
          pv.descripcion,
          pv.direccion,
          pv.coordenadas,
          pv.segmento,
          pv.meta_volumen,
          u.name AS nombre_usuario,
          u.email AS email_usuario,
          rs.fecha_registro,
          rs.created_at,
          rs.updated_at,
          rs.kpi_volumen,
          rs.kpi_precio,
          rs.kpi_frecuencia,
          CASE
              WHEN kpi_volumen = 1 AND kpi_precio = 1 THEN 'Galonaje/Precios'
              WHEN kpi_volumen = 1 THEN 'Galonaje'
              WHEN kpi_precio = 1 THEN 'Precios'
              WHEN kpi_frecuencia = 1 AND kpi_precio = 0 AND kpi_volumen = 0 AND IsImplementacion IS NULL THEN 'Visita'
              WHEN IsImplementacion = 1 THEN 'Implementación'
              ELSE 'Otro'
          END AS tipo_accion,
          e1.descripcion AS estado_backoffice,
          e2.descripcion AS estado_agente,
          rs.observacion AS observacion_asesor,
          rs.observacion_agente AS observacion_agente,

          -- Subconsulta: Información de productos
          (
              SELECT GROUP_CONCAT(rp.referencia_id)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS referencias,
          (
              SELECT GROUP_CONCAT(rp.presentacion)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS presentaciones,
          (
              SELECT GROUP_CONCAT(rp.cantidad_cajas)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS cantidades_cajas,
          (
              SELECT GROUP_CONCAT(rp.conversion_galonaje)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS galones,
          (
              SELECT GROUP_CONCAT(rp.precio_sugerido)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS precios_sugeridos,
          (
              SELECT GROUP_CONCAT(rp.precio_real)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS precios_reales,

          -- Subconsulta: Totales
          (
              SELECT SUM(rp.cantidad_cajas)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS total_cajas,
          (
              SELECT SUM(rp.conversion_galonaje)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS total_galones,
          (
              SELECT SUM(rp.precio_real * rp.cantidad_cajas)
              FROM registro_productos rp
              WHERE rp.registro_id = rs.id
          ) AS valor_total_implementado

      FROM registro_servicios rs
      INNER JOIN puntos_venta pv ON pv.id = rs.pdv_id
      INNER JOIN users u ON u.id = pv.user_id
      INNER JOIN estados e1 ON e1.id = rs.estado_id
      INNER JOIN estados e2 ON e2.id = rs.estado_agente_id
      WHERE rs.user_id = ?
      ORDER BY rs.fecha_registro DESC, rs.created_at DESC;
    `;

    const rows = await executeQueryForMultipleUsers(query, [user_id]);

    // Procesar datos para coordenadas
    const datosProcessados = rows.map(row => {
      let lat = null, lng = null;
      if (row.coordenadas) {
        const coordenadas = row.coordenadas.split(',');
        if (coordenadas.length === 2) {
          lat = parseFloat(coordenadas[0].trim());
          lng = parseFloat(coordenadas[1].trim());
        }
      }

      return {
        ...row,
        latitud: lat,
        longitud: lng,
        // Procesar KPIs como texto legible
        kpi_volumen_activo: row.kpi_volumen === 1 ? 'Sí' : 'No',
        kpi_precio_activo: row.kpi_precio === 1 ? 'Sí' : 'No',
        kpi_frecuencia_activo: row.kpi_frecuencia === 1 ? 'Sí' : 'No',
        // Formatear fechas
        fecha_hora_creacion: row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
        fecha_hora_actualizacion: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A'
      };
    });

    // Generar respuesta con formato Excel
    
    // Crear el workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar datos para Excel con nombres de columnas más descriptivos
    const excelData = datosProcessados.map(row => ({
      'Código PDV': row.codigo,
      'Nombre PDV': row.descripcion,
      'Dirección': row.direccion,
      'Segmento': row.segmento,
      // 'Meta Volumen': row.meta_volumen,
      'Asesor': row.nombre_usuario,
      'Email Asesor': row.email_usuario,
      'Fecha Visita': row.fecha_registro,
      'Fecha/Hora Creación': row.fecha_hora_creacion,
      'Tipo Acción': row.tipo_accion,
      'Estado BackOffice': row.estado_backoffice,
      'Estado AC': row.estado_agente,
      'Observaciones BackOffice': row.observacion_asesor || 'Sin observaciones',
      'Observaciones AC': row.observacion_agente || 'Sin observaciones'
    }));
    
    // Crear la hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Historial de Visitas');
    
    // Generar el buffer del archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Configurar headers para descarga
    const fechaActual = new Date().toISOString().split('T')[0];
    const fileName = `historial_visitas_${user_id}_${fechaActual}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Enviar el archivo Excel
    res.send(excelBuffer);

  } catch (err) {
    console.error('Error generando Excel de historial de visitas:', err);
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel de historial de visitas',
      error: err.message
    });
  }
});

// ========================================================================
// 📋 ENDPOINT PARA CONSULTAR PRECIO SUGERIDO DE REFERENCIA
// ========================================================================

// Endpoint para consultar precio sugerido por referencia y presentación
router.get('/precio-sugerido/:referencia/:presentacion', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const { referencia, presentacion } = req.params;

  if (!referencia || !presentacion) {
    return res.status(400).json({
      success: false,
      message: 'Referencia y presentación son requeridos'
    });
  }

  try {

    // Consulta para obtener el precio sugerido según referencia y presentación
    const query = `
      SELECT 
        referencias.descripcion,
        referencias_productos.presentacion,
        referencias_productos.precio_sugerido
      FROM referencias
      INNER JOIN referencias_productos ON referencias_productos.referencia_id = referencias.id
      WHERE referencias.descripcion = ? AND referencias_productos.presentacion = ?
      LIMIT 1
    `;
    
    const resultado = await executeQueryForMultipleUsers(query, [referencia, presentacion]);

    if (resultado.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró precio sugerido para esta referencia y presentación'
      });
    }

    const precioInfo = resultado[0];

    res.json({
      success: true,
      data: {
        referencia: precioInfo.descripcion,
        presentacion: precioInfo.presentacion,
        precio_sugerido: precioInfo.precio_sugerido
      }
    });

  } catch (err) {
    console.error('Error consultando precio sugerido:', err);
    res.status(500).json({
      success: false,
      message: 'Error al consultar precio sugerido',
      error: err.message
    });
  }
});

// ========================================================================
//  ENDPOINTS PARA RANKING 
// ========================================================================

// ENDPOINT PARA RANKING DE ASESORES DE MI EMPRESA
router.get('/ranking-mi-empresa', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const userId = req.user.id; // Obtenido del token

  try {

    // Primero obtener el agente_id del usuario logueado
    const miInfo = await executeQueryForMultipleUsers(
      `SELECT agente_id FROM users WHERE id = ?`, [userId]
    );

    if (!miInfo[0] || !miInfo[0].agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente_id asignado'
      });
    }

    const miAgenteId = miInfo[0].agente_id;

    // Obtener todos los asesores de la empresa (role_id = 1 y mismo agente_id) con información geográfica
    const asesores = await executeQueryForMultipleUsers(
      `SELECT users.id, users.name, users.email, users.agente_id, 
              departamento.descripcion AS departamento, 
              depar_ciudades.descripcion AS ciudad,
              departamento.id AS departamento_id,
              depar_ciudades.id AS ciudad_id
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE rol_id = 1 AND agente_id = ?
       ORDER BY name`, [miAgenteId]
    );

    // Para cada asesor, calcular sus puntos usando la MISMA LÓGICA que los endpoints individuales
    const rankingDetallado = [];

    for (const asesor of asesores) {
      // 1. PUNTOS COBERTURA - Misma lógica que endpoint /cobertura
      const pdvsAsesor = await executeQueryForMultipleUsers(
        `SELECT id FROM puntos_venta WHERE user_id = ?`, [asesor.id]
      );
      const totalAsignados = pdvsAsesor.length;

      const implementados = await executeQueryForMultipleUsers(
        `SELECT DISTINCT pdv_id FROM registro_servicios
         WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2 AND fecha_registro <= ?`, [asesor.id, '2025-09-06']
      );
      const totalImplementados = implementados.length;
      let puntosCobertura = totalAsignados > 0 ? Math.round((totalImplementados / totalAsignados) * 3000) : 0;
      // Aplica el factor de complejidad igual que en los endpoints principales
      puntosCobertura = Math.round(puntosCobertura * calcularFactorComplejidad(totalAsignados));

      // 2. PUNTOS VOLUMEN - MISMA LÓGICA GLOBAL que endpoint /volumen (máximo 6000)
      const metaVolumenResult = await executeQueryForMultipleUsers(
        `SELECT SUM(meta_volumen) as totalMeta 
         FROM puntos_venta 
         WHERE user_id = ?`, [asesor.id]
      );
      const totalMetaVolumen = metaVolumenResult[0]?.totalMeta || 0;
      const realVolumenResult = await executeQueryForMultipleUsers(
        `SELECT COALESCE(SUM(vol.total_volumen), 0) as totalReal
         FROM puntos_venta pv
         LEFT JOIN (
           SELECT rs.pdv_id, SUM(rp.conversion_galonaje) as total_volumen
           FROM registro_servicios rs
           INNER JOIN registro_productos rp ON rp.registro_id = rs.id
           WHERE rs.user_id = ? AND (rs.estado_id = 2 AND rs.estado_agente_id = 2)
           GROUP BY rs.pdv_id
         ) vol ON vol.pdv_id = pv.id
         WHERE pv.user_id = ?`, [asesor.id, asesor.id]
      );
      const totalRealVolumen = realVolumenResult[0]?.totalReal || 0;

      // 2. PUNTOS VOLUMEN - Aplica factor de complejidad
      let puntosVolumen = totalMetaVolumen > 0 ? Math.round((totalRealVolumen / totalMetaVolumen) * 6000) : 0;
      // Aplica el factor de complejidad igual que en los endpoints principales
      puntosVolumen = Math.round(puntosVolumen * calcularFactorComplejidad(totalAsignados));

      // 3. PUNTOS VISITAS - Igual que cobertura pero con meta de 10 visitas por PDV (solo una visita por PDV por día)
      const totalPdvs = pdvsAsesor.length;
      const metaVisitas = totalPdvs * 10;
      const realVisitasResult = await executeQueryForMultipleUsers(
        `SELECT COUNT(DISTINCT CONCAT(pdv_id, '-', DATE(fecha_registro))) as totalVisitas FROM registro_servicios
         WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [asesor.id]
      );
      const totalVisitas = realVisitasResult[0]?.totalVisitas || 0;

      // 3. PUNTOS VISITAS - Aplica factor de complejidad
      let puntosVisitas = metaVisitas > 0 ? Math.round((totalVisitas / metaVisitas) * 1000) : 0;
      // Aplica el factor de complejidad igual que en los endpoints principales
      puntosVisitas = Math.round(puntosVisitas * calcularFactorComplejidad(totalAsignados));

      // 4. PUNTOS PRECIOS - Misma lógica que endpoint /precios (basado en PDVs con cobertura vs PDVs con mystery aceptado)
      // Obtener PDVs con COBERTURA
      const pdvsConCoberturaPrecios = await executeQueryForMultipleUsers(
        `SELECT DISTINCT pdv_id
         FROM registro_servicios
         WHERE user_id = ? AND estado_id = 2 AND estado_agente_id = 2`, [asesor.id]
      );
      const totalConCobertura = pdvsConCoberturaPrecios.length; // META
      
      // Obtener PDVs con mystery ACEPTADO (cumplimiento >= 85)
      const mysteryAceptados = await executeQueryForMultipleUsers(
        `SELECT rm.id_pdv
         FROM registros_mystery rm
         INNER JOIN puntos_venta pv ON rm.id_pdv = pv.id
         WHERE pv.user_id = ? AND rm.cumplimiento >= 85`, [asesor.id]
      );
      const totalAceptados = mysteryAceptados.length; // REAL (solo aceptados)
      
      // Calcular puntos: (REAL / META) * 2000
      let puntosPrecios = totalConCobertura > 0 ? Math.round((totalAceptados / totalConCobertura) * 2000) : 0;
      // Aplica el factor de complejidad igual que en los endpoints principales
      puntosPrecios = Math.round(puntosPrecios * calcularFactorComplejidad(totalAsignados));

      // 5. PUNTOS BONIFICACIONES (retos y notificaciones)
      // Suma puntos de retos normales
      const bonificaciones = await executeQueryForMultipleUsers(
        `SELECT COALESCE(SUM(puntos),0) as totalBonificacion FROM retos_bonificadores WHERE id_asesor = ? AND (descripcion NOT LIKE '%notificaci%')`, [asesor.id]
      );
      const puntosBonificacion = Number(bonificaciones[0]?.totalBonificacion) || 0;

      // Suma puntos de notificaciones (solo por descripcion)
      const notificaciones = await executeQueryForMultipleUsers(
        `SELECT COALESCE(SUM(puntos),0) as totalNotificaciones FROM retos_bonificadores WHERE id_asesor = ? AND descripcion LIKE '%notificaci%'`, [asesor.id]
      );
      const puntosNotificaciones = Number(notificaciones[0]?.totalNotificaciones) || 0;

      // Suma ambos
      const puntosBonificacionTotal = puntosBonificacion + puntosNotificaciones;

      // Calcular total general usando la misma lógica que los endpoints individuales + bonificaciones + notificaciones
      const totalGeneral = puntosCobertura + puntosVolumen + puntosVisitas + puntosPrecios + puntosBonificacionTotal;

      // // DEBUG: Log para comparar con ranking de mercadeo
      // console.log(`=== RANKING ASESOR - ASESOR ${asesor.name} (ID: ${asesor.id}) ===`);
      // console.log(`PDVs asignados: ${totalAsignados}`);
      // console.log(`PDVs implementados: ${totalImplementados}`);
      // console.log(`Puntos cobertura: ${puntosCobertura}`);
      // console.log(`Meta volumen total: ${totalMetaVolumen}, Real volumen total: ${totalRealVolumen}`);
      // console.log(`Puntos volumen (GLOBAL, max 6000): ${puntosVolumen}`);
      // console.log(`Fórmula volumen: (${totalRealVolumen}/${totalMetaVolumen}) * 6000 = ${puntosVolumen}`);
      // console.log(`Meta visitas: ${metaVisitas}, Real visitas: ${totalVisitas}`);
      // console.log(`Puntos visitas: ${puntosVisitas}`);
      // console.log(`PDVs con precios: ${totalReportados}`);
      // console.log(`Puntos precios: ${puntosPrecios}`);
      // console.log(`Puntos bonificación (retos): ${puntosBonificacion}`);
      // console.log(`TOTAL PUNTOS: ${totalGeneral}`);
      // console.log('===============================================');

  rankingDetallado.push({
        id: asesor.id,
        name: asesor.name,
        email: asesor.email,
        departamento: asesor.departamento,
        ciudad: asesor.ciudad,
        departamento_id: asesor.departamento_id,
        ciudad_id: asesor.ciudad_id,
        // Desglose de puntos por KPI (igual que en endpoints individuales)
        puntos_cobertura: puntosCobertura, // Incluye factor de complejidad
        puntos_volumen: puntosVolumen,     // Incluye factor de complejidad
        puntos_visitas: puntosVisitas,     // Incluye factor de complejidad
        puntos_precios: puntosPrecios,     // Incluye factor de complejidad
        puntos_bonificacion: puntosBonificacionTotal,
        total_puntos: totalGeneral,
        // Información adicional para debugging
        total_pdvs_asignados: totalAsignados,
        total_pdvs_implementados: totalImplementados,
        total_visitas_realizadas: totalVisitas,
        meta_visitas: metaVisitas,
        total_precios_reportados: totalAceptados,
        es_usuario_actual: asesor.id == userId
      });
    }

    // Ordenar por total de puntos (mayor a menor)
    rankingDetallado.sort((a, b) => b.total_puntos - a.total_puntos);

    // Agregar posiciones
    rankingDetallado.forEach((asesor, index) => {
      asesor.posicion = index + 1;
    });

    // Encontrar la posición del usuario actual
    const posicionUsuario = rankingDetallado.find(a => a.id == userId);

    // Obtener información del agente/empresa
    const agenteInfo = await executeQueryForMultipleUsers(
      `SELECT name as nombre_agente FROM users WHERE id = ?`, [miAgenteId]
    );

    res.json({
      success: true,
      ranking: rankingDetallado,
      mi_posicion: posicionUsuario ? posicionUsuario.posicion : null,
      mi_info: posicionUsuario || null,
      total_asesores: rankingDetallado.length,
      empresa_info: {
        agente_id: miAgenteId,
        nombre_agente: agenteInfo[0]?.nombre_agente || 'No encontrado'
      }
    });

  } catch (err) {
    console.error('Error obteniendo ranking de mi empresa:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ranking de mi empresa',
      error: err.message
    });
  }
});

// ENDPOINT PARA OBTENER OPCIONES DE FILTROS GEOGRÁFICOS DEL RANKING
router.get('/ranking-filtros', authenticateToken, requireAsesor, logAccess, async (req, res) => {
  const userId = req.user.id;

  try {

    // Obtener el agente_id del usuario logueado
    const miInfo = await executeQueryForMultipleUsers(
      `SELECT agente_id FROM users WHERE id = ?`, [userId]
    );

    if (!miInfo[0] || !miInfo[0].agente_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene agente_id asignado'
      });
    }

    const miAgenteId = miInfo[0].agente_id;

    // Obtener todos los departamentos únicos de asesores de la empresa
    const departamentos = await executeQueryForMultipleUsers(
      `SELECT DISTINCT departamento.id, departamento.descripcion
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE users.rol_id = 1 AND users.agente_id = ?
       ORDER BY departamento.descripcion`, [miAgenteId]
    );

    // Obtener todas las ciudades únicas de asesores de la empresa
    const ciudades = await executeQueryForMultipleUsers(
      `SELECT DISTINCT depar_ciudades.id, depar_ciudades.descripcion, 
              depar_ciudades.id_departamento
       FROM users 
       INNER JOIN depar_ciudades ON depar_ciudades.id = users.ciudad_id
       INNER JOIN departamento ON departamento.id = depar_ciudades.id_departamento
       WHERE users.rol_id = 1 AND users.agente_id = ?
       ORDER BY depar_ciudades.descripcion`, [miAgenteId]
    );

    res.json({
      success: true,
      filtros: {
        departamentos: [
          { id: 'todos', descripcion: 'Todos los departamentos' },
          ...departamentos
        ],
        ciudades: [
          { id: 'todas', descripcion: 'Todas las ciudades', id_departamento: null },
          ...ciudades
        ]
      }
    });

  } catch (err) {
    console.error('Error obteniendo filtros de ranking:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener filtros de ranking',
      error: err.message
    });
  }
});

// ========================================================================
//  ENDPOINTS PARA OBTENER PRESENTACIONES DE REFERENCIAS
// ========================================================================

router.get('/presentaciones-referencia/:referenciaDescripcion', async (req, res) => {
  
  try {
    const { referenciaDescripcion } = req.params;
    
    console.log('🔍 Consultando presentaciones para referencia:', referenciaDescripcion);

    const query = `
      SELECT 
        referencias.descripcion as referencia_descripcion,
        referencias_productos.presentacion, 
        referencias_productos.conversion_galonaje 
      FROM referencias_productos	
      INNER JOIN referencias ON referencias_productos.referencia_id = referencias.id
      WHERE referencias.descripcion = ?
      ORDER BY referencias_productos.presentacion
    `;

    const results = await executeQueryForMultipleUsers(query, [referenciaDescripcion]);

    console.log('📋 Resultados encontrados:', results);

    if (results.length === 0) {
      return res.json({
        success: true,
        message: 'No se encontraron presentaciones para esta referencia',
        data: []
      });
    }

    res.json({
      success: true,
      data: results,
      referencia: referenciaDescripcion,
      total_presentaciones: results.length
    });

  } catch (error) {
    console.error('❌ Error al consultar presentaciones-referencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ========================================================================
// 📋 ENDPOINTS DE LA SECCIÓN IMPLEMENTACION PUNTO DE VENTA
// ========================================================================

// ENDPOINT DE GALONAJE POR PDV PARA IMPLEMENTACIONES
router.get('/galonaje-implementacion/:codigo_pdv', async (req, res) => {
  const { codigo_pdv } = req.params;

  try {
    // 1. Obtener el pdv_id y segmento a partir del codigo_pdv
    const pdvResult = await executeQueryForMultipleUsers(
      `SELECT id, segmento, descripcion
       FROM puntos_venta 
       WHERE codigo = ?`,
      [codigo_pdv]
    );

    if (pdvResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PDV no encontrado para el usuario especificado'
      });
    }

    const pdv_id = pdvResult[0].id;
    const segmento = pdvResult[0].segmento;
    const descripcion = pdvResult[0].descripcion;

    // 2. Obtener el galonaje real total
    const realResult = await executeQueryForMultipleUsers(
      `SELECT TRUNCATE(SUM(registro_productos.conversion_galonaje),2) AS totalReal
       FROM registro_servicios
       INNER JOIN registro_productos 
         ON registro_productos.registro_id = registro_servicios.id
       WHERE registro_servicios.pdv_id = ?
         AND registro_servicios.estado_id = 2
         AND registro_servicios.estado_agente_id = 2`,
      [pdv_id]
    );

    const totalReal = realResult[0]?.totalReal || 0;

    // 3. Obtener las metas de compras
    const comprasResult = await executeQueryForMultipleUsers(
      `SELECT compra_1, compra_2, compra_3, compra_4, compra_5
       FROM puntos_venta__implementacion
       WHERE pdv_id = ?`,
      [pdv_id]
    );

    // 4. Verificar qué implementaciones están realizadas y validadas 
    const implementacionResult = await executeQueryForMultipleUsers(
      `SELECT DISTINCT(registros_implementacion.nro_implementacion) FROM registro_servicios
       INNER JOIN registros_implementacion ON registros_implementacion.id_registro = registro_servicios.id
       WHERE registro_servicios.estado_id = 2 AND registro_servicios.estado_agente_id = 2 AND registro_servicios.pdv_id = ?`,
      [pdv_id]
    );

    // Verificar que implementacionResult sea un array válido y obtener array de implementaciones completadas
    const implementacionesCompletadas = Array.isArray(implementacionResult) ? 
      implementacionResult.map(row => row.nro_implementacion) : [];

    const compras = comprasResult[0] || {
      compra_1: 0,
      compra_2: 0,
      compra_3: 0,
      compra_4: 0,
      compra_5: 0
    };

    // Crear objeto con estado de implementaciones
    const estadoImplementaciones = {
      implementacion_1: implementacionesCompletadas.includes(1),
      implementacion_2: implementacionesCompletadas.includes(2),
      implementacion_3: implementacionesCompletadas.includes(3),
      implementacion_4: implementacionesCompletadas.includes(4),
      implementacion_5: implementacionesCompletadas.includes(5)
    };

    res.json({
      success: true,
      totalReal,
      compras,
      implementaciones_completadas: implementacionesCompletadas,
      estado_implementaciones: estadoImplementaciones,
      pdv_id,
      segmento,
      descripcion,
      codigo_pdv
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de galonaje por PDV',
      error: err.message
    });
  }
});

// ENDPOINT PARA OBTENER PRODUCTOS DE IMPLEMENTACIÓN SEGÚN SEGMENTO Y NÚMERO
router.get('/productos-implementacion/:segmento/:nro_implementacion', async (req, res) => {
  const { segmento, nro_implementacion } = req.params;

  try {

    console.log(`🔍 Consultando productos para segmento: ${segmento}, implementación: ${nro_implementacion}`);

    // Buscar productos específicos para el segmento e implementación
    const productos = await executeQueryForMultipleUsers(
      `SELECT id, nombre_producto
       FROM puntos_venta_productos_imp 
       WHERE segmento = ? AND nro_implementacion = ?
       ORDER BY nombre_producto`,
      [segmento, nro_implementacion]
    );

    // Si no hay productos específicos, buscar productos MULTISEGMENTO para esa implementación
    if (productos.length === 0) {
      const productosMulti = await executeQueryForMultipleUsers(
        `SELECT id, nombre_producto
         FROM puntos_venta_productos_imp 
         WHERE segmento = 'MULTISEGMENTO' AND nro_implementacion = ?
         ORDER BY nombre_producto`,
        [nro_implementacion]
      );

      if (productosMulti.length === 0) {
        return res.json({
          success: true,
          message: `No se encontraron productos para el segmento ${segmento} e implementación ${nro_implementacion}`,
          data: [],
          segmento,
          nro_implementacion
        });
      }

      return res.json({
        success: true,
        data: productosMulti,
        segmento: 'MULTISEGMENTO',
        nro_implementacion,
        total_productos: productosMulti.length,
        message: `Productos MULTISEGMENTO encontrados para implementación ${nro_implementacion}`
      });
    }

    res.json({
      success: true,
      data: productos,
      segmento,
      nro_implementacion,
      total_productos: productos.length
    });

  } catch (err) {
    console.error('❌ Error al obtener productos de implementación:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos de implementación',
      error: err.message
    });
  }
});



export default router;
