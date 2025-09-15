/**
 * @fileoverview Punto de entrada principal para todos los hooks del sistema
 * Este archivo centraliza y re-exporta todos los hooks organizados por rol
 * y funcionalidad en el sistema Plan Choque Terpel
 * 
 * Estructura organizacional:
 * - auth/: Hooks de autenticación y autorización
 * - asesor/: Hooks específicos para asesores comerciales
 * - mystery/: Hooks para mystery shoppers
 * - ot/: Hooks para Organización Terpel (vista global)
 * - mercadeo/: Hooks para área de mercadeo (filtrado por agente)
 * - shared/: Hooks reutilizables entre todos los roles
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

// ============================================
// HOOKS DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================

/**
 * Re-exportación de todos los hooks relacionados con:
 * - Inicio de sesión y cierre de sesión
 * - Validación de roles y permisos
 * - Protección de rutas por rol
 * - Gestión de tokens de autenticación
 * - Validación de sesión única (anti múltiples sesiones)
 */
export * from './auth';

// ============================================
// HOOKS ESPECÍFICOS POR ROL
// ============================================

/**
 * Hooks específicos del asesor comercial
 * Incluye gestión de PDVs, KPIs, reportes, auditorías
 * y métricas específicas del territorio asignado
 */
export * from './asesor';

/**
 * Hooks específicos del Mystery Shopper
 * Funcionalidades para registros de visitas encubiertas
 * y evaluación de cumplimiento en PDVs
 */
// export * from './mystery';

/**
 * Hooks específicos de Organización Terpel
 * Vista global y consolidada de todas las operaciones
 * sin filtros territoriales - datos nacionales
 */
export * from './ot';

/**
 * Hooks específicos de Mercadeo
 * Vista filtrada por agente comercial con métricas
 * agregadas del territorio bajo supervisión
 */
export * from './mercadeo';

/**
 * Hooks específicos de BackOffice
 * Administración y gestión completa del sistema
 * sin restricciones territoriales - vista global
 */
export * from './backoffice';

// ============================================
// HOOKS COMPARTIDOS
// ============================================

/**
 * Hooks reutilizables entre todos los roles
 * Incluye utilidades de UI, navegación, descargas
 * y funcionalidades comunes del sistema
 */
export * from './shared';
