/**
 * @fileoverview Hook especializado para páginas de Mercadeo con manejo de estados mejorado
 * Soluciona el problema de páginas en blanco al recargar
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

import { useMercadeoRoute, useBackOfficeRoute } from './useProtectedRoute';
import { useEffect, useState } from 'react';

/**
 * Hook mejorado específicamente para páginas de Mercadeo
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
export function useMercadeoPageProtection({ 
  redirectTo = '/', 
  pageName = 'Página de Mercadeo',
  timeout = 8000 
} = {}) {
  
  // Hook base de protección
  const baseAuth = useMercadeoRoute(redirectTo);
  
  // Estados locales para mejor control
  const [pageReady, setPageReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // console.log(`🏪 ${pageName} - Estado de protección:`, {
    //   loading: baseAuth.loading,
    //   isAuthenticated: baseAuth.isAuthenticated,
    //   hasUser: !!baseAuth.user,
    //   isReady: baseAuth.isReady,
    //   pageReady
    // });

    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      if (baseAuth.loading && !pageReady) {
        //console.warn(`⚠️ ${pageName} - Timeout de carga alcanzado, forzando render`);
        setHasError(true);
        setErrorMessage('Tiempo de espera agotado. Intenta recargar la página.');
        setPageReady(true);
      }
    }, timeout);

    // Marcar página como lista cuando la autenticación esté completa
    if (!baseAuth.loading && baseAuth.isAuthenticated && baseAuth.isReady && !pageReady) {
      //console.log(`✅ ${pageName} - Página lista para mostrar`);
      setPageReady(true);
      setHasError(false);
    }

    // Si hay error de autenticación
    if (!baseAuth.loading && !baseAuth.isAuthenticated) {
      //console.log(`❌ ${pageName} - Usuario no autenticado`);
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

/**
 * Hook similar pero para páginas de Asesor
 */
export function useAsesorPageProtection({ 
  redirectTo = '/', 
  pageName = 'Página de Asesor',
  timeout = 8000 
} = {}) {
  
  const { useAsesorRoute } = require('./useProtectedRoute');
  const baseAuth = useAsesorRoute(redirectTo);
  
  const [pageReady, setPageReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (baseAuth.loading && !pageReady) {
        //console.warn(`⚠️ ${pageName} - Timeout alcanzado`);
        setPageReady(true);
      }
    }, timeout);

    if (!baseAuth.loading && baseAuth.isAuthenticated && baseAuth.isReady && !pageReady) {
      setPageReady(true);
    }

    return () => clearTimeout(timeoutId);
  }, [baseAuth.loading, baseAuth.isAuthenticated, baseAuth.isReady, pageReady]);

  return {
    ...baseAuth,
    pageReady,
    shouldShowContent: pageReady && baseAuth.isAuthenticated,
    shouldShowLoading: baseAuth.loading || !pageReady
  };
}

/**
 * Hook para páginas de Organización Terpel
 */
export function useOTPageProtection({ 
  redirectTo = '/', 
  pageName = 'Página de OT',
  timeout = 8000 
} = {}) {
  
  const { useOTRoute } = require('./useProtectedRoute');
  const baseAuth = useOTRoute(redirectTo);
  
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (baseAuth.loading && !pageReady) {
        setPageReady(true);
      }
    }, timeout);

    if (!baseAuth.loading && baseAuth.isAuthenticated && baseAuth.isReady && !pageReady) {
      setPageReady(true);
    }

    return () => clearTimeout(timeoutId);
  }, [baseAuth.loading, baseAuth.isAuthenticated, baseAuth.isReady, pageReady]);

  return {
    ...baseAuth,
    pageReady,
    shouldShowContent: pageReady && baseAuth.isAuthenticated,
    shouldShowLoading: baseAuth.loading || !pageReady
  };
}

/**
 * HOC para envolver páginas con protección automática
 * 
 * @param {React.Component} WrappedComponent - Componente a proteger
 * @param {Object} options - Opciones de protección
 * @returns {React.Component} Componente protegido
 */
export function withMercadeoProtection(WrappedComponent, options = {}) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  function ProtectedComponent(props) {
    const protection = useMercadeoPageProtection(options);
    
    // Mostrar loading
    if (protection.shouldShowLoading) {
      const AuthLoadingScreen = require('../../components/shared/AuthLoadingScreen').default;
      return <AuthLoadingScreen message={`Cargando ${options.pageName || 'página'}...`} />;
    }
    
    // Mostrar error si hay uno
    if (protection.hasError) {
      return (
        <div className="page-error">
          <h2>Error de Acceso</h2>
          <p>{protection.errorMessage}</p>
          <button onClick={() => window.location.reload()}>
            Recargar Página
          </button>
        </div>
      );
    }
    
    // Mostrar componente si todo está OK
    if (protection.shouldShowContent) {
      return <WrappedComponent {...props} protection={protection} />;
    }
    
    // Fallback - no debería llegar aquí
    return <div>Cargando...</div>;
  }
  
  ProtectedComponent.displayName = `withMercadeoProtection(${displayName})`;
  return ProtectedComponent;
}

/**
 * Hook mejorado específicamente para páginas de BackOffice
 * 
 * @param {Object} options - Configuración del hook
 * @param {string} [options.redirectTo='/'] - Ruta de redirección si no está autorizado
 * @param {string} [options.pageName] - Nombre de la página para logs
 * @param {number} [options.timeout=8000] - Timeout en ms para verificación
 * @returns {Object} Estado mejorado de autenticación para BackOffice
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
    // console.log(`🏢 ${pageName} - Estado de protección:`, {
    //   loading: baseAuth.loading,
    //   isAuthenticated: baseAuth.isAuthenticated,
    //   hasUser: !!baseAuth.user,
    //   isReady: baseAuth.isReady,
    //   pageReady
    // });

    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      if (!pageReady) {
        //console.warn(`⚠️ ${pageName} - Timeout de carga alcanzado, forzando render`);
        setHasError(true);
        setErrorMessage('Tiempo de espera agotado. Intenta recargar la página.');
        setPageReady(true);
      }
    }, timeout);

    // Marcar página como lista cuando la autenticación esté completa
    if (!baseAuth.loading && baseAuth.isAuthenticated && baseAuth.isReady && !pageReady) {
      //console.log(`✅ ${pageName} - Página lista para mostrar`);
      setPageReady(true);
      setHasError(false);
    }

    // Si hay error de autenticación
    if (!baseAuth.loading && !baseAuth.isAuthenticated) {
      //console.log(`❌ ${pageName} - Usuario no autenticado`);
      setHasError(true);
      setErrorMessage('Usuario no autenticado');
      setPageReady(true);
    }

    return () => clearTimeout(timeoutId);
  }, [baseAuth.loading, baseAuth.isAuthenticated, baseAuth.isReady, pageReady, pageName, timeout]);

  // Determinar si debe mostrar el contenido
  const shouldShowContent = pageReady && baseAuth.isAuthenticated && !hasError;

  // console.log(`📊 ${pageName} - Estado final:`, {
  //   pageReady,
  //   shouldShowContent,
  //   hasError,
  //   errorMessage
  // });

  return {
    user: baseAuth.user,
    loading: baseAuth.loading,
    isAuthenticated: baseAuth.isAuthenticated,
    hasRequiredRole: baseAuth.hasRequiredRole,
    pageReady,
    shouldShowContent,
    hasError,
    errorMessage
  };
}

// Exportar también las versiones específicas de hooks de protección
export { useMercadeoRoute, useAsesorRoute, useOTRoute, useDirectorRoute, useBackOfficeRoute } from './useProtectedRoute';
