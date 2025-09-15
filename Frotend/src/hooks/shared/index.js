/**
 * @fileoverview Exportaciones de hooks compartidos entre todos los roles
 * Este archivo centraliza hooks reutilizables que pueden ser utilizados
 * por cualquier rol o componente en el sistema Plan Choque Terpel
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

// ============================================
// HOOKS DE UTILIDADES UI/UX
// ============================================

/**
 * Hook para manejo de responsive design y detección de dispositivos
 * Proporciona funcionalidades para:
 * - Detectar tamaño de pantalla (mobile, tablet, desktop)
 * - Detectar orientación del dispositivo
 * - Adaptación automática de componentes según dispositivo
 */
export { useResponsive } from './useResponsive';

// ============================================
// HOOKS DE CONTENIDO ESTÁTICO
// ============================================

/**
 * Hook para gestión de catálogos de productos y documentos
 * Proporciona:
 * - Lista de catálogos disponibles (Plan PDV, Oiltec, etc.)
 * - URLs de descarga de documentos
 * - Metadatos de catálogos (títulos, imágenes, descripciones)
 */
export { useCatalogos } from './useCatalogos';

// ============================================
// HOOKS DE NAVEGACIÓN
// ============================================

/**
 * Hook para gestión de navegación en páginas de inicio (Home)
 * Proporciona:
 * - Rutas específicas por rol de usuario
 * - Navegación programática entre secciones
 * - Validación de permisos de acceso por rol
 */
export { useHomeNavigation } from './useHomeNavigation';

// ============================================
// HOOKS DE DESCARGAS Y EXPORTACIÓN
// ============================================

/**
 * Hook para manejo de descargas de archivos Excel
 * Proporciona:
 * - Generación de reportes en formato Excel
 * - Descarga de datos filtrados
 * - Manejo de estados de descarga (loading, success, error)
 */
export { useExcelDownload } from './useExcelDownload';

/**
 * Hook para consulta de precios sugeridos
 * Proporciona:
 * - Consulta automática de precios por referencia y presentación
 * - Manejo de estados de carga y errores
 * - Integración con API de precios
 */
export { usePrecioSugerido } from './usePrecioSugerido';
