/**
 * @fileoverview Hook especializado para páginas de BackOffice con manejo de estados mejorado
 * Soluciona el problema de páginas en blanco al recargar
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

import { useBackOfficeRoute } from '../auth/useProtectedRoute';
import { useEffect, useState } from 'react';

/**
 * Hook mejorado específicamente para páginas de BackOffice
 * 
 * Características:
 * - Previene páginas en blanco al recargar
 * - Manejo robusto de estados de carga
 * - Logs detallados para debugging
 * - Timeout de seguridad
 * 
 * @param {Object} options - Configuración del hook
 * @param {string} [options.redirectTo='/'] - Ruta de redirección si no está autorizado
 * @param {string} [options.pageName] - Nombre de la página para logs
 * @param {number} [options.timeout=8000] - Timeout en ms para verificación
 * @returns {Object} Estado mejorado de autenticación
 */
export function useBackOfficePageProtection({ 
  redirectTo = '/', 
  pageName = 'Página de BackOffice',
  timeout = 8000 
} = {}) {
  
  // Hook base de protección
  const baseAuth = useBackOfficeRoute(redirectTo);
  
  // Estados locales para mejor control
  const [pageReady, setPageReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    console.log(`🏢 ${pageName} - Estado de protección:`, {
      loading: baseAuth.loading,
      isAuthenticated: baseAuth.isAuthenticated,
      hasUser: !!baseAuth.user,
      isReady: baseAuth.isReady,
      pageReady
    });

    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      if (baseAuth.loading && !pageReady) {
        console.warn(`⚠️ ${pageName} - Timeout de carga alcanzado, forzando render`);
        setHasError(true);
        setErrorMessage('Tiempo de espera agotado. Intenta recargar la página.');
        setPageReady(true);
      }
    }, timeout);

    // Marcar página como lista cuando la autenticación esté completa
    if (!baseAuth.loading && baseAuth.isAuthenticated && baseAuth.isReady && !pageReady) {
      console.log(`✅ ${pageName} - Página lista para mostrar`);
      setPageReady(true);
      setHasError(false);
    }

    // Si hay error de autenticación
    if (!baseAuth.loading && !baseAuth.isAuthenticated) {
      console.log(`❌ ${pageName} - Usuario no autenticado`);
      setHasError(true);
      setErrorMessage('No tienes permisos para acceder a esta página.');
    }

    return () => clearTimeout(timeoutId);
  }, [baseAuth.loading, baseAuth.isAuthenticated, baseAuth.isReady, pageReady, pageName, timeout]);

  return {
    ...baseAuth,
    pageReady,
    shouldShowContent: pageReady && baseAuth.isAuthenticated && !hasError,
    shouldShowLoading: baseAuth.loading || !pageReady,
    hasError,
    errorMessage,
    // Funciones de utilidad
    canRender: () => pageReady && baseAuth.isAuthenticated && !hasError,
    needsLoading: () => baseAuth.loading || !pageReady,
    // Info para debugging
    debugInfo: {
      pageName,
      baseLoading: baseAuth.loading,
      baseAuth: baseAuth.isAuthenticated,
      baseReady: baseAuth.isReady,
      pageReady,
      hasError,
      errorMessage
    }
  };
}
