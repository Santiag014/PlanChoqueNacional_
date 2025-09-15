/**
 * @fileoverview Exportaciones de hooks específicos para el rol MERCADEO
 * Este archivo centraliza todos los hooks relacionados con las funcionalidades
 * del área de mercadeo en el sistema Plan Choque Terpel
 * 
 * Los hooks de mercadeo manejan datos filtrados por id_agente del usuario logueado
 * proporcionando vistas específicas por agente comercial
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

// ============================================
// HOOKS DE DATOS MAESTROS
// ============================================

/**
 * Hook para obtener la lista de asesores bajo el agente de mercadeo
 * Filtra asesores según el id_agente del usuario autenticado
 */
export { useAsesoresMercadeo } from './useAsesoresMercadeo.js';

/**
 * Hook para obtener puntos de venta gestionados por mercadeo
 * Proporciona lista de PDVs con filtro por agente comercial
 */
export { usePuntosVentaMercadeo } from './usePuntosVentaMercadeo.js';

// ============================================
// HOOKS DE MÉTRICAS Y KPIs
// ============================================

/**
 * Hook para métricas de cobertura filtradas por agente comercial
 * Calcula cobertura de PDVs por asesores bajo supervisión de mercadeo
 */
export { useCoberturaMercadeo } from './useCoberturaMercadeo.js';

/**
 * Hook para métricas de volumen de ventas por agente comercial
 * Proporciona datos de volumen agregados por territorio de mercadeo
 */
export { useVolumenMercadeo } from './useVolumenMercadeo.js';

/**
 * Hook para métricas de frecuencia de visitas por agente comercial
 * Analiza patrones de visitas de asesores por territorio
 */
export { useVisitasMercadeo } from './useVisitasMercadeo.js';

/**
 * Hook para métricas de precios competitivos por agente comercial
 * Analiza competitividad de precios en el territorio de mercadeo
 */
export { usePreciosMercadeo } from './usePreciosMercadeo.js';

// ============================================
// HOOKS DE HISTORIAL Y REPORTES
// ============================================

/**
 * Hook para obtener historial general de mercadeo
 * Proporciona datos históricos agregados por agente comercial
 */
export { useHistorialMercadeo } from './useHistorialMercadeo.js';

/**
 * Hook para obtener historial detallado de registros de mercadeo
 * Incluye registros específicos de implementaciones y auditorías
 */
export { useHistorialRegistrosMercadeo } from './useHistorialRegistrosMercadeo.js';

// ============================================
// HOOKS DE RANKING Y COMPETENCIA
// ============================================

/**
 * Hook para obtener y gestionar el ranking de asesores desde mercadeo
 * Proporciona datos de ranking filtrados por territorio del agente comercial
 */
export { useRankingMercadeo } from './useRankingMercadeo.js';
