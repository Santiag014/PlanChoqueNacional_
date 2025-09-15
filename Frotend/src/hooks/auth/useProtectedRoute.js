import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * @fileoverview Hook mejorado para proteger rutas basado en roles
 * Maneja correctamente los estados de carga y previene páginas en blanco
 * 
 * @author Plan Choque Terpel Team
 * @version 1.1.0 - Mejorado para evitar páginas en blanco
 */

/**
 * Hook para proteger rutas basado en roles con mejor manejo de estados
 * 
 * Mejoras implementadas:
 * - Previene páginas en blanco durante la carga
 * - Mejor manejo del estado de autenticación
 * - Logs detallados para debugging
 * - Timeout de seguridad para evitar bucles infinitos
 * 
 * @param {string|Array} allowedRoles - Rol o roles permitidos para acceder a la ruta
 * @param {string} redirectTo - Ruta a la que redirigir si no está autorizado (por defecto '/')
 * @returns {object} Estado de autenticación y carga
 */
export const useProtectedRoute = (allowedRoles = [], redirectTo = '/') => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, hasRole } = useAuthContext();
  
  // Estado local para evitar renders innecesarios
  const [isReady, setIsReady] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {

    // Timeout de seguridad para evitar bucles infinitos de carga
    const timeoutId = setTimeout(() => {
      if (loading && !hasChecked) {
        // console.warn('⚠️ Timeout de carga alcanzado, forzando verificación');
        setHasChecked(true);
        setIsReady(true);
      }
    }, 5000); // 5 segundos de timeout

    // Esperar a que termine de cargar la verificación del token
    if (loading && !hasChecked) {
      // console.log('⏳ Esperando verificación de autenticación...');
      return () => clearTimeout(timeoutId);
    }

    // Marcar como verificado una vez que termine la carga
    if (!loading && !hasChecked) {
      setHasChecked(true);
      // console.log('✅ Verificación de autenticación completada');
    }

    // Solo proceder si ya no está cargando o si ya hemos verificado
    if ((loading && !hasChecked) || !hasChecked) {
      return () => clearTimeout(timeoutId);
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated()) {
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
      return () => clearTimeout(timeoutId);
    }

    // Verificar roles si se especificaron (comentado para desarrollo)
    if (allowedRoles.length > 0) {
      const userHasRole = hasRole(allowedRoles);
      // console.log('👮 Verificando roles:', {
      //   allowedRoles,
      //   userRole: user?.rol || user?.tipo,
      //   hasRole: userHasRole
      // });

      // En desarrollo, permitir acceso independientemente del rol
      if (!userHasRole && process.env.NODE_ENV !== 'development') {
        //console.log('❌ Usuario sin permisos suficientes, redirigiendo...');
        navigate('/unauthorized', { replace: true });
        return () => clearTimeout(timeoutId);
      }
    }

    // Todo OK, marcar como listo
    // console.log('✅ Acceso autorizado a:', location.pathname);
    setIsReady(true);
    
    return () => clearTimeout(timeoutId);
  }, [
    user, 
    isAuthenticated, 
    loading, 
    hasRole, 
    allowedRoles, 
    navigate, 
    location.pathname, 
    redirectTo,
    hasChecked
  ]);

  const authState = {
    user,
    loading: loading || !hasChecked,
    isAuthenticated: isAuthenticated(),
    hasRequiredRole: isAuthenticated(), // En desarrollo, siempre true si está autenticado
    isReady: isReady && !loading && hasChecked
  };

  // console.log('📊 useProtectedRoute - Retornando estado:', authState);

  return authState;
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
 * Hook para rutas específicas de Jefe de Zona (rol 5 con verificación especial)
 */
export const useJefeZonaRoute = (redirectTo = '/') => {
  return useProtectedRoute(['organizacionterpel','organizacion_terpel','ORGANIZACION_TERPEL','OrganizacionTerpel',5], redirectTo);
};

/**
 * Hook para rutas específicas de BackOffice
 */
export const useBackOfficeRoute = (redirectTo = '/') => {
  return useProtectedRoute(['backoffice', 'BACKOFFICE', 'BackOffice', 6], redirectTo);
};

/**
 * Hook para rutas que permiten múltiples roles
 */
export const useMultiRoleRoute = (roles, redirectTo = '/') => {
  return useProtectedRoute(roles, redirectTo);
};
