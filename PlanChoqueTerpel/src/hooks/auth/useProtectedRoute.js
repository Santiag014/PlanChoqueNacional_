import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Hook para proteger rutas basado en roles
 * @param {string|Array} allowedRoles - Rol o roles permitidos para acceder a la ruta
 * @param {string} redirectTo - Ruta a la que redirigir si no está autorizado (por defecto '/')
 */
export const useProtectedRoute = (allowedRoles = [], redirectTo = '/') => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, hasRole } = useAuthContext();

  useEffect(() => {
    // Esperar a que termine de cargar la verificación del token
    if (loading) {
      return;
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated()) {
      console.log('🔒 Usuario no autenticado, redirigiendo al login...');
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }
    
  }, [
    user, 
    isAuthenticated, 
    loading, 
    hasRole, 
    allowedRoles, 
    navigate, 
    location.pathname, 
    redirectTo
  ]);

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    hasRequiredRole: isAuthenticated() // MODO DESARROLLO: Siempre true si está autenticado
    // hasRequiredRole: allowedRoles.length === 0 || hasRole(allowedRoles) // ORIGINAL COMENTADO
  };
};

/**
 * Hook simplificado para rutas que solo requieren autenticación
 */
export const useAuthRequired = (redirectTo = '/') => {
  return useProtectedRoute([], redirectTo);
};

/**
 * Hook para rutas específicas de asesor
 */
export const useAsesorRoute = (redirectTo = '/asesor/home') => {
  return useProtectedRoute(['asesor', 'ASESOR', 1], redirectTo);
};

/**
 * Hook para rutas específicas de Mystery Shopper
 */
export const useMysteryRoute = (redirectTo = '/') => {
  return useProtectedRoute(['misteryshopper', 'mystery_shopper', 'MYSTERY_SHOPPER', 2], redirectTo);
};

/**
 * Hook para rutas específicas de Mercadeo AC
 */
export const useMercadeoRoute = (redirectTo = '/') => {
  return useProtectedRoute(['mercadeo', 'MERCADEO', 'mercadeo_ac', 'MERCADEO_AC', 3], redirectTo);
};

/**
 * Hook para rutas específicas de Mercadeo AC
 */
export const useDirectorRoute = (redirectTo = '/') => {
  return useProtectedRoute(['director', 'DIRECTOR', 'Director', 4], redirectTo);
};
/**
 * Hook para rutas específicas de Mercadeo AC
 */
export const useOTRoute = (redirectTo = '/') => {
  return useProtectedRoute(['organizacionterpel','organizacion_terpel','ORGANIZACION_TERPEL','OrganizacionTerpel',5
  ], redirectTo);
};
/**
 * Hook para rutas que permiten múltiples roles
 */
export const useMultiRoleRoute = (roles, redirectTo = '/') => {
  return useProtectedRoute(roles, redirectTo);
};
