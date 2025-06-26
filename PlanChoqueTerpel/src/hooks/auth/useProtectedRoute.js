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
    if (loading) return;

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo al login...');
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    // Si hay roles específicos requeridos, verificarlos
    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
      console.log(`Usuario sin permisos para acceder a ${location.pathname}. Rol requerido: ${allowedRoles}, Rol actual: ${user?.tipo}`);
      navigate('/unauthorized', { replace: true });
      return;
    }

    console.log(`Acceso autorizado a ${location.pathname} para usuario ${user?.nombre} (${user?.tipo})`);
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
    hasRequiredRole: allowedRoles.length === 0 || hasRole(allowedRoles)
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
export const useAsesorRoute = (redirectTo = '/') => {
  return useProtectedRoute(['asesor'], redirectTo);
};

/**
 * Hook para rutas específicas de Mystery Shopper
 */
export const useMysteryRoute = (redirectTo = '/') => {
  return useProtectedRoute(['misteryshopper'], redirectTo);
};

/**
 * Hook para rutas que permiten múltiples roles
 */
export const useMultiRoleRoute = (roles, redirectTo = '/') => {
  return useProtectedRoute(roles, redirectTo);
};
