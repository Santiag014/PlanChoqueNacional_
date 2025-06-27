import React from 'react';

export default function FilterButtons({ filtroActivo, onFiltroChange, isMobile }) {
  const filtros = [
    { key: 'TODOS', label: 'TODOS' },
    { key: 'VOLUMEN', label: 'VOLUMEN' },
    { key: 'PRECIO', label: 'PRECIO' },
    { key: 'FRECUENCIA', label: 'FRECUENCIA' }
  ];

  return (
    <div className={`filter-buttons ${isMobile ? 'mobile' : ''}`}>
      {filtros.map((filtro) => (
        <button
          key={filtro.key}
          className={`filter-btn ${filtroActivo === filtro.key ? 'active' : ''} ${isMobile ? 'mobile-btn' : ''}`}
          onClick={() => onFiltroChange(filtro.key)}
        >
          <span className="filter-text">
            {isMobile && filtro.key !== 'TODOS' ? filtro.key.substring(0, 3) : filtro.label}
          </span>
        </button>
      ))}
    </div>
  );
}
