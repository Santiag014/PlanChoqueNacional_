import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import '../styles/shared/unauthorized.css';

/**
 * Mapeo de roles para mostrar nombres amigables
 */
const ROLE_NAMES = {
  1: 'Asesor',
  2: 'Mystery Shopper', 
  3: 'Mercadeo AC',
  4: 'Director',
  5: 'Organización Terpel',
  'asesor': 'Asesor',
  'misteryshopper': 'Mystery Shopper',
  'mercadeo_ac': 'Mercadeo AC',
  'director': 'Director',
  'ot': 'Organización Terpel'
};

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();

  // Obtener información del usuario y la página de origen
  const userRole = user?.tipo || user?.rol;
  const roleName = ROLE_NAMES[userRole] || 'Usuario';
  const fromPath = location.state?.from?.pathname || 'página solicitada';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Redirigir a la página principal según el rol
    const homeRoutes = {
      1: '/asesor/home',
      'asesor': '/asesor/home',
      2: '/misteryShopper/home',
      'misteryshopper': '/misteryShopper/home',
      3: '/mercadeo/home',
      'mercadeo_ac': '/mercadeo/home',
      4: '/director-zona/home',
      'director': '/director-zona/home',
      5: '/organizacion-terpel/home',
      'ot': '/organizacion-terpel/home'
    };

    const homeRoute = homeRoutes[userRole] || '/';
    navigate(homeRoute);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#e30613" strokeWidth="2" fill="none"/>
            <path d="M15 9l-6 6" stroke="#e30613" strokeWidth="2"/>
            <path d="M9 9l6 6" stroke="#e30613" strokeWidth="2"/>
          </svg>
        </div>
        
        <h1>🔒 Acceso Restringido</h1>
        
        <div className="unauthorized-info">
          <p className="main-message">
            No tienes permisos para acceder a <strong>{fromPath}</strong>
          </p>
          
          {user && (
            <div className="user-info">
              <p><strong>Usuario:</strong> {user.nombre || user.email}</p>
              <p><strong>Rol actual:</strong> {roleName}</p>
            </div>
          )}
          
          <p className="help-message">
            Tu rol actual no permite el acceso a esta sección del sistema. 
            Si necesitas acceso, contacta al administrador del sistema.
          </p>
        </div>
        
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            ← Volver Atrás
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            🏠 Ir a Mi Dashboard
          </button>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Cerrar Sesión
          </button>
        </div>

        <div className="security-note">
          <small>
            <strong>Nota de Seguridad:</strong> Este acceso ha sido registrado. 
            Todos los intentos de acceso no autorizado son monitoreados.
          </small>
        </div>
      </div>
    </div>
  );
}
