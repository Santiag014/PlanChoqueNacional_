import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/shared/unauthorized.css';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
              fill="#e30613"
            />
          </svg>
        </div>
        
        <h1>Acceso No Autorizado</h1>
        
        <p>
          Lo sentimos, no tienes permisos para acceder a esta página. 
          Tu rol actual no permite el acceso a esta sección del sistema.
        </p>
        
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            Volver Atrás
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
