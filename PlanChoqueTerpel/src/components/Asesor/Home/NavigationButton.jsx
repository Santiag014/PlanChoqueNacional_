import React from 'react';

/**
 * Componente para un botón de navegación del home
 */
const NavigationButton = ({ button, onNavigate }) => {
  return (
    <div
      className="home-nav-button"
      onClick={() => onNavigate(button.to, button.pdf)}
    >
      {/* Recuadro blanco para el ícono */}
      <div className="home-nav-icon-container">
        <div className="home-nav-icon-circle">
          <img 
            src={button.icon} 
            alt={button.label} 
            className="home-nav-icon"
          />
        </div>
      </div>
      {/* Texto rojo debajo del recuadro blanco */}
      <span className="home-nav-label">
        {button.label}
      </span>
    </div>
  );
};

export default NavigationButton;
