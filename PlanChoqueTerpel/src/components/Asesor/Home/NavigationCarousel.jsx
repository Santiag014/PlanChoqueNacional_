import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Asesor/navigation-carousel.css';

export default function NavigationCarousel({ buttonPages, currentPage, onNavigate }) {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(currentPage || 0);

  const handlePageChange = (pageIndex) => {
    setActivePage(pageIndex);
    onNavigate(pageIndex);
  };

  const handleButtonClick = (button) => {
    navigate(button.to);
  };

  return (
    <div className="navigation-carousel">
      {/* Botones principales de la página actual */}
      <div className="carousel-content">
        <div className="buttons-grid">
          {buttonPages[activePage]?.map((button, index) => (
            <button
              key={index}
              className="nav-button"
              onClick={() => handleButtonClick(button)}
            >
              <div className="button-icon">
                <img src={button.icon} alt={button.label} />
              </div>
              <span className="button-label">{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Indicadores de página en la parte inferior */}
      <div className="carousel-indicators">
        {buttonPages.map((_, pageIndex) => (
          <button
            key={pageIndex}
            className={`indicator ${activePage === pageIndex ? 'active' : ''}`}
            onClick={() => handlePageChange(pageIndex)}
          >
            <span className="indicator-dot"></span>
            <span className="indicator-label">
              {pageIndex === 0 ? 'Principal' : 'Más'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
