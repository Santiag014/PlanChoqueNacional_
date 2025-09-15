/**
 * @fileoverview Componente de ejemplo para demostrar el uso de aislamiento CSS por roles
 * Este componente muestra cómo implementar correctamente el aislamiento de estilos
 * para prevenir conflictos entre diferentes roles del sistema
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Componente que demuestra el uso correcto de contenedores de aislamiento CSS
 * 
 * Características:
 * - Aplica automáticamente la clase de contenedor según el rol del usuario
 * - Previene conflictos de estilos entre roles diferentes
 * - Proporciona un ejemplo de implementación para otros componentes
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido a renderizar dentro del contenedor
 * @param {string} [props.className] - Clases CSS adicionales
 * @returns {JSX.Element} Contenedor con aislamiento CSS aplicado
 */
export default function RoleIsolatedContainer({ children, className = '' }) {
  // ============================================
  // OBTENCIÓN DEL ROL DEL USUARIO
  // ============================================
  
  const { user } = useAuthContext();
  
  /**
   * Normalización del rol del usuario para determinar el contenedor correcto
   * Maneja múltiples formatos de rol (string, número, etc.)
   */
  const normalizeRole = (userRole) => {
    if (!userRole) return 'asesor'; // Rol por defecto
    
    // Convertir rol a string y normalizar
    const roleStr = String(userRole).toLowerCase();
    
    // Mapeo de roles a clases CSS
    const roleMapping = {
      '1': 'asesor',
      'asesor': 'asesor',
      '2': 'mystery',
      'mystery_shopper': 'mystery',
      '3': 'mercadeo',
      'mercadeo_ac': 'mercadeo',
      '4': 'director',
      'director': 'director',
      '5': 'ot',
      'organizacion_terpel': 'ot'
    };
    
    return roleMapping[roleStr] || 'asesor';
  };
  
  const normalizedRole = normalizeRole(user?.rol || user?.tipo);
  
  /**
   * Clase CSS del contenedor de aislamiento específica para el rol
   */
  const containerClass = `role-container--${normalizedRole}`;
  
  // ============================================
  // LOGGING PARA DESARROLLO (opcional)
  // ============================================
  
  // En modo desarrollo, mostrar información sobre el aislamiento aplicado
  if (process.env.NODE_ENV === 'development') {
    console.log(`RoleIsolatedContainer: Aplicando aislamiento para rol "${normalizedRole}"`);
  }
  
  // ============================================
  // RENDERIZADO
  // ============================================
  
  return (
    <div 
      className={`${containerClass} ${className}`.trim()}
      data-role={normalizedRole}
      data-testid={`role-container-${normalizedRole}`}
    >
      {children}
    </div>
  );
}

/**
 * Hook personalizado para obtener la clase de contenedor de rol
 * Útil para aplicar aislamiento CSS en componentes funcionales
 * 
 * @returns {Object} Objeto con información del rol y clases CSS
 * @returns {string} returns.containerClass - Clase CSS del contenedor de aislamiento
 * @returns {string} returns.role - Rol normalizado del usuario
 * @returns {boolean} returns.isValidRole - Si el rol es válido y reconocido
 */
export function useRoleContainer() {
  const { user } = useAuthContext();
  
  const normalizeRole = (userRole) => {
    if (!userRole) return 'asesor';
    
    const roleStr = String(userRole).toLowerCase();
    const roleMapping = {
      '1': 'asesor',
      'asesor': 'asesor',
      '2': 'mystery',
      'mystery_shopper': 'mystery',
      '3': 'mercadeo',
      'mercadeo_ac': 'mercadeo',
      '4': 'director',
      'director': 'director',
      '5': 'ot',
      'organizacion_terpel': 'ot'
    };
    
    return roleMapping[roleStr] || 'asesor';
  };
  
  const normalizedRole = normalizeRole(user?.rol || user?.tipo);
  const containerClass = `role-container--${normalizedRole}`;
  const isValidRole = normalizedRole !== 'asesor' || Boolean(user?.rol || user?.tipo);
  
  return {
    containerClass,
    role: normalizedRole,
    isValidRole
  };
}

/**
 * Componente de orden superior (HOC) para envolver componentes con aislamiento CSS
 * 
 * @param {React.Component} WrappedComponent - Componente a envolver
 * @returns {React.Component} Componente envuelto con aislamiento CSS
 */
export function withRoleIsolation(WrappedComponent) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const IsolatedComponent = (props) => {
    return (
      <RoleIsolatedContainer>
        <WrappedComponent {...props} />
      </RoleIsolatedContainer>
    );
  };
  
  IsolatedComponent.displayName = `withRoleIsolation(${displayName})`;
  
  return IsolatedComponent;
}

/**
 * EJEMPLO DE USO:
 * 
 * // Opción 1: Usar el componente directamente
 * <RoleIsolatedContainer>
 *   <MiComponenteEspecifico />
 * </RoleIsolatedContainer>
 * 
 * // Opción 2: Usar el hook en un componente funcional
 * function MiComponente() {
 *   const { containerClass, role } = useRoleContainer();
 *   
 *   return (
 *     <div className={containerClass}>
 *       <p>Contenido para rol: {role}</p>
 *     </div>
 *   );
 * }
 * 
 * // Opción 3: Usar el HOC
 * const MiComponenteAislado = withRoleIsolation(MiComponenteOriginal);
 */
