/**
 * @fileoverview Exportaciones de hooks de autenticación y autorización
 * 
 * @author Plan Choque Terpel Team
 * @version 1.1.0 - Mejorado con protección de páginas
 */

// Hook base de autenticación
export { useAuth } from './useAuth';

// Hooks de rutas protegidas básicos
export { 
  useProtectedRoute, 
  useAuthRequired, 
  useAsesorRoute, 
  useMysteryRoute, 
  useMercadeoRoute,
  useDirectorRoute,
  useOTRoute,
  useJefeZonaRoute,
  useBackOfficeRoute,
  useMultiRoleRoute 
} from './useProtectedRoute';

// Hooks mejorados para protección de páginas (nuevo)
export {
  useMercadeoPageProtection,
  useAsesorPageProtection,
  useOTPageProtection,
  useBackOfficePageProtection,
  withMercadeoProtection as withPageProtection
} from './usePageProtection.jsx';