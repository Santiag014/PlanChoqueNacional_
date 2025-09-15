import React from 'react';
import NavigationButton from './NavigationButton';

/**
 * Componente para la grilla de navegación del home
 */
const NavigationGrid = ({ buttons, onNavigate }) => {
  return (
    <div className="home-navigation-container">
      <div className="home-navigation-grid">
        {buttons.map((btn) => (
          <NavigationButton
            key={btn.label}
            button={btn}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};

export default NavigationGrid;
