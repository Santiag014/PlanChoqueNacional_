/**
 * @fileoverview Componente de protección de rutas por roles
 * 
 * Proporciona seguridad a nivel de ruta validando:
 * - Autenticación del usuario
 * - Autorización por rol específico
 * - Redirección automática a páginas no autorizadas
 * 
 * @author Plan Choque Terpel Team - Seguridad
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useSecurityAlert } from './SecurityAlerts';
import AuthLoadingScreen from './shared/AuthLoadingScreen';

/**
 * Mapeo de roles del sistema
 * Convierte IDs numéricos a nombres de roles legibles
 */
const ROLE_MAPPING = {
  1: 'asesor',
  2: 'misteryshopper', 
  3: 'mercadeo_ac',
  4: 'director',
  5: 'ot',
  6: 'backoffice',
  // 7: 'implementacion', // DESHABILITADO TEMPORALMENTE
  'asesor': 'asesor',
  'misteryshopper': 'misteryshopper',
  'mercadeo_ac': 'mercadeo_ac',
  'director': 'director',
  'ot': 'ot',
  'backoffice': 'backoffice'
  // 'implementacion': 'implementacion' // DESHABILITADO TEMPORALMENTE
};

/**
 * Componente de ruta protegida que valida autenticación y autorización
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componente a renderizar si tiene acceso
 * @param {string|string[]} props.allowedRoles - Rol(es) permitido(s) para acceder
 * @param {string} [props.redirectTo='/unauthorized'] - Página de redirección si no tiene acceso
 * @returns {JSX.Element} Componente protegido o redirección
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/unauthorized' 
}) {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  const { logUnauthorizedAccess } = useSecurityAlert();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      // Si aún está cargando la autenticación, esperar
      if (loading) {
        setChecking(true);
        return;
      }

      setChecking(true);

      // 1. Verificar si hay usuario autenticado
      if (!user) {
        //console.warn('🚫 Acceso denegado: Usuario no autenticado');
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // 2. Obtener rol del usuario
      const userRoleId = user.tipo || user.rol;
      const userRole = ROLE_MAPPING[userRoleId] || userRoleId;
      
      // 3. Normalizar roles permitidos
      const rolesPermitidos = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // 4. Verificar si el usuario tiene uno de los roles permitidos
      const tieneAcceso = rolesPermitidos.includes(userRole);
      
      if (tieneAcceso) {
        //console.log(`✅ Acceso permitido a ${location.pathname} para rol: ${userRole}`);
        setHasAccess(true);
      } else {
        console.warn(`🚫 Acceso denegado a ${location.pathname}. Rol: ${userRole}, Roles permitidos: ${rolesPermitidos.join(', ')}`);
        
        // Log de intento de acceso no autorizado
        logUnauthorizedAccess(
          location.pathname,
          userRole,
          rolesPermitidos.join(', ')
        );
        
        setHasAccess(false);
      }
      
      setChecking(false);
    };

    checkAccess();
  }, [user, loading, allowedRoles, location.pathname]);

  // Mostrar loading mientras se verifica
  if (loading || checking) {
    return <AuthLoadingScreen message="Verificando permisos de acceso..." />;
  }

  // Redirigir al login si no está autenticado
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Redirigir a página no autorizada si no tiene el rol correcto
  if (!hasAccess) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Renderizar el componente si tiene acceso
  return children;
}

/**
 * Hook para verificar roles en componentes
 * @param {string|string[]} requiredRoles - Roles requeridos
 * @returns {Object} Estado de verificación de roles
 */
export function useRoleCheck(requiredRoles) {
  const { user } = useAuthContext();
  const [hasRole, setHasRole] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!user) {
      setHasRole(false);
      setUserRole(null);
      return;
    }

    const userRoleId = user.tipo || user.rol;
    const role = ROLE_MAPPING[userRoleId] || userRoleId;
    setUserRole(role);

    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    setHasRole(rolesArray.includes(role));
  }, [user, requiredRoles]);

  return { hasRole, userRole, user };
}

// Componentes específicos por rol para facilitar el uso
export const AsesorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['asesor']}>{children}</ProtectedRoute>
);

export const MercadeoRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['mercadeo_ac']}>{children}</ProtectedRoute>
);

export const DirectorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['director']}>{children}</ProtectedRoute>
);

export const OTRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['ot']}>{children}</ProtectedRoute>
);

export const BackOfficeRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['backoffice']}>{children}</ProtectedRoute>
);

export const MysteryShopperRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['misteryshopper']}>{children}</ProtectedRoute>
);

// DESHABILITADO TEMPORALMENTE - ROL IMPLEMENTACIÓN
// export const ImplementacionRoute = ({ children }) => (
//   <ProtectedRoute allowedRoles={['implementacion']}>{children}</ProtectedRoute>
// );

// Componente para rutas que permiten múltiples roles
export const MultiRoleRoute = ({ children, roles }) => (
  <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
);
