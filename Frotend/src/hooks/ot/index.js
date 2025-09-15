/**
 * @fileoverview Exportaciones de hooks específicos para el rol ORGANIZACIÓN TERPEL
 * Este archivo centraliza todos los hooks relacionados con las funcionalidades
 * del área de Organización Terpel en el sistema Plan Choque
 * 
 * Los hooks de OT manejan datos globales que ya vienen filtrados desde el backend
 * según los permisos del usuario logueado
 * 
 * @author Plan Choque Terpel Team
 * @version 2.0.0 - Migrado filtrado al backend
 */

// ============================================
// HOOKS DE PERMISOS
// ============================================

/**
 * Hook para obtener permisos del usuario desde el backend
 */
export { useUserPermissions } from './useUserPermissions';

// ============================================
// HOOKS DE MÉTRICAS Y KPIs GLOBALES
// ============================================

/**
 * Hook para métricas globales de cobertura de Organización Terpel
 * Proporciona vista consolidada de cobertura en todos los territorios
 * Aplica filtros de usuario cuando es necesario
 */
export { useCoberturaOT } from './useCoberturaOT';

/**
 * Hook para métricas globales de volumen de ventas de Organización Terpel
 * Consolida datos de volumen de todos los agentes y territorios
 */
export { useVolumenOT } from './useVolumenOT';

/**
 * Hook para métricas globales de frecuencia de visitas de Organización Terpel
 * Analiza patrones de visitas a nivel nacional
 */
export { useVisitasOT } from './useVisitasOT';

/**
 * Hook para métricas globales de precios competitivos de Organización Terpel
 * Vista consolidada de competitividad de precios nacional
 */
export { usePreciosOT } from './usePreciosOT';

// ============================================
// HOOKS DE INFORMACIÓN GENERAL Y MAESTROS
// ============================================

/**
 * Hook para obtener lista completa de asesores a nivel nacional
 * Proporciona datos de todos los asesores sin filtros territoriales
 */
export { useAsesoresOT } from './useAsesoresOT';

/**
 * Hook para obtener lista completa de agentes comerciales
 * Datos maestros de la estructura comercial de Organización Terpel
 */
export { useAgentesOT } from './useAgentesOT';

/**
 * Hook para obtener historial global de registros de Organización Terpel
 * Consolida histórico de toda la operación nacional
 */
export { useHistorialOT } from './useHistorialOT';

/**
 * Hook para obtener lista completa de puntos de venta a nivel nacional
 * Datos maestros de todos los PDVs sin filtros territoriales
 */
export { usePuntosVentaOT } from './usePuntosVentaOT';

/**
 * Hook para descargar reportes de usuarios filtrados
 * Genera archivos Excel con datos específicos por usuario
 */
export { useReportesUsuarios } from './useReportesUsuarios';

/**
 * Hook para descargar reportes de implementaciones
 * Genera archivos Excel con datos de implementaciones usando plantilla
 */
export { useImplementaciones } from './useImplementaciones';
