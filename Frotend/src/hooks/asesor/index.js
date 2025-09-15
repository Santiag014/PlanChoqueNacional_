/**
 * @fileoverview Exportaciones de hooks específicos para el rol ASESOR
 * Este archivo centraliza todos los hooks relacionados con las funcionalidades
 * del asesor comercial en el sistema Plan Choque Terpel
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

// ============================================
// HOOKS DE GESTIÓN DE KPIs Y CÁLCULOS
// ============================================

/**
 * Hook para realizar cálculos de KPIs del asesor
 * Incluye métricas de performance, cumplimiento y objetivos
 */
export { useKpiCalculations } from './useKpiCalculations';

/**
 * Hook para la gestión y administración de KPIs
 * Permite crear, actualizar y eliminar KPIs del asesor
 */
export { useKpiManagement } from './useKpiManagement';

/**
 * Hook para consultar presentaciones disponibles por referencia
 * Obtiene desde la BD las presentaciones y factores de conversión de galonaje
 */
export { usePresentacionesReferencia } from './usePresentacionesReferencia';

// ============================================
// HOOKS DE DATOS DE PUNTO DE VENTA (PDV)
// ============================================

/**
 * Hook para obtener y gestionar datos de puntos de venta
 * Incluye información detallada de cada PDV asignado al asesor
 */
export { usePdvData } from './usePdvData';

/**
 * Hook para la selección y gestión de productos en PDVs
 * Maneja el catálogo de productos disponibles por punto de venta
 */
export { useProductSelection } from './useProductSelection';

// ============================================
// HOOKS DE REPORTES Y ENVÍO DE DATOS
// ============================================

/**
 * Hook para el envío y gestión de reportes del asesor
 * Maneja la validación, formato y envío de reportes periódicos
 */
export { useReportSubmission } from './useReportSubmission';

/**
 * Hook para el registro y envío de visitas a PDVs
 * Gestiona el proceso completo de registro de visitas comerciales
 */
export { useVisitaSubmission } from './useVisitaSubmission';

/**
 * Hook para el envío de implementaciones
 * Gestiona el proceso completo de envío de información de implementaciones
 */
export { useImplementacionSubmission } from './useImplementacionSubmission';

/**
 * Hook para obtener información de productos requeridos por implementación
 * Proporciona detalles sobre productos necesarios para cada tipo de implementación
 */
export { useImplementacionInfo } from './useImplementacionInfo';

// ============================================
// HOOKS DE AUDITORÍAS Y RESULTADOS
// ============================================

/**
 * Hook para obtener y gestionar resultados de auditorías
 * Proporciona acceso a los resultados de auditorías realizadas en PDVs
 */
export { useResultadosAuditorias } from './useResultadosAuditorias';

// ============================================
// HOOKS DE MÉTRICAS ESPECÍFICAS DEL ASESOR
// ============================================

/**
 * Hook para obtener métricas de cobertura del asesor
 * Calcula y proporciona datos de cobertura por PDV y territorio
 */
export { useCoberturaAsesor } from './useCoberturaAsesor';

/**
 * Hook para obtener métricas de volumen de ventas del asesor
 * Proporciona datos de volumen por producto y período
 */
export { useVolumenAsesor } from './useVolumenAsesor';

/**
 * Hook para obtener métricas de frecuencia de visitas del asesor
 * Calcula estadísticas de visitas realizadas vs programadas
 */
export { useVisitasAsesor } from './useVisitasAsesor';

/**
 * Hook para obtener métricas de precios competitivos del asesor
 * Analiza y compara precios en el mercado por territorio
 */
export { usePreciosAsesor } from './usePreciosAsesor';

/**
 * Hook para obtener métricas de profundidad de producto del asesor
 * Calcula la profundidad de productos vendidos por PDV
 */
export { useProfundidadAsesor } from './useProfundidadAsesor';

// ============================================
// HOOKS DE RANKING Y COMPETENCIA
// ============================================

/**
 * Hook para obtener y gestionar el ranking de asesores de la empresa
 * Consume datos reales del API para mostrar posicionamiento y competencia
 */
export { useRankingAsesor } from './useRankingAsesor';

// ============================================
// HOOKS DE IMPLEMENTACIÓN
// ============================================

/**
 * Hook para gestionar implementaciones de punto de venta
 * Maneja consulta de galonaje y cálculo de implementaciones disponibles
 */
export { useImplementacionPuntoVenta } from './useImplementacionPuntoVenta';

