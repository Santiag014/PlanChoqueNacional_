import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Asesor/navigation-carousel.css';

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

  const botones = buttonPages[activePage] || [];

  return (
    <div className="navigation-carousel">
      <div className="asesor-dashboard-root">
        <div className="asesor-dashboard-center">
          <div className="asesor-btn-container">
            {botones.map((btn) => (
              <div
                key={btn.label}
                className="asesor-btn"
                onClick={() => handleButtonClick(btn)}
              >
                <div className="asesor-btn-inner">
                  <div className="asesor-btn-icon">
                    <img src={btn.icon} alt={btn.label} />
                  </div>
                </div>
                <span className="asesor-btn-label">{btn.label}</span>
              </div>
            ))}
          </div>

          {/* Indicadores de página */}
          <div className="asesor-page-indicators">
            {buttonPages.map((_, index) => (
              <div
                key={index}
                className={`asesor-page-dot ${index === activePage ? 'active' : ''}`}
                onClick={() => handlePageChange(index)}
              />
            ))}
          </div>

          {/* Botones de navegación */}
          <div className="asesor-navigation-buttons">
            {activePage > 0 && (
              <button
                className="asesor-nav-btn asesor-nav-prev"
                onClick={() => handlePageChange(activePage - 1)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="#e30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            
            {activePage < buttonPages.length - 1 && (
              <button
                className="asesor-nav-btn asesor-nav-next"
                onClick={() => handlePageChange(activePage + 1)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#e30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
