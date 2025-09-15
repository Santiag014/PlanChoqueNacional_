/**
 * @fileoverview Componente de carga para verificación de autenticación
 * Se muestra mientras se verifica el estado de autenticación desde localStorage
 * para evitar páginas en blanco durante la carga
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

import React from 'react';

/**
 * Componente de carga específico para autenticación
 * 
 * Se muestra durante:
 * - Verificación inicial de tokens en localStorage
 * - Validación de sesión con el servidor
 * - Redirección entre páginas protegidas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.message] - Mensaje personalizado de carga
 * @param {boolean} [props.showLogo] - Mostrar logo de Terpel
 * @returns {JSX.Element} Componente de carga con branding Terpel
 */
export default function AuthLoadingScreen({ 
  message = 'Verificando autenticación...', 
  showLogo = true 
}) {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-content">
        {showLogo && (
          <div className="auth-loading-logo">
            <img 
              src="/logoTerpel.png" 
              alt="Terpel" 
              className="auth-loading-logo-img"
            />
          </div>
        )}
        
        <div className="auth-loading-spinner">
          <div className="auth-spinner"></div>
        </div>
        
        <div className="auth-loading-message">
          {message}
        </div>
        
        <div className="auth-loading-submessage">
          Plan Choque Nacional
        </div>
      </div>
    </div>
  );
}

/**
 * Componente más simple para mostrar solo el spinner
 */
export function SimpleAuthLoader({ message = 'Cargando...' }) {
  return (
    <div className="simple-auth-loader">
      <div className="simple-spinner"></div>
      <span>{message}</span>
    </div>
  );
}

/**
 * Componente para mostrar durante la verificación de roles específicos
 */
export function RoleVerificationLoader({ role, message }) {
  const defaultMessage = `Verificando permisos para ${role}...`;
  
  return (
    <div className="role-verification-loader">
      <div className="role-spinner"></div>
      <div className="role-message">
        {message || defaultMessage}
      </div>
    </div>
  );
}
