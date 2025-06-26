import React from 'react';

export default function FilterButtons({ filtroActivo, onFiltroChange, isMobile }) {
  const filtros = [
    { key: 'TODOS', label: 'TODOS', color: '#6c757d' },
    { key: 'VOLUMEN', label: 'VOLUMEN', color: '#e30613' },
    { key: 'PRECIO', label: 'PRECIO', color: '#a1000b' },
    { key: 'FRECUENCIA', label: 'FRECUENCIA', color: '#007bff' }
  ];

  return (
    <div className={`filter-buttons ${isMobile ? 'mobile' : ''}`}>
      {filtros.map((filtro) => (
        <button
          key={filtro.key}
          className={`filter-btn ${filtroActivo === filtro.key ? 'active' : ''}`}
          style={{
            '--filter-color': filtro.color,
            backgroundColor: filtroActivo === filtro.key ? filtro.color : 'transparent',
            borderColor: filtro.color,
            color: filtroActivo === filtro.key ? 'white' : filtro.color
          }}
          onClick={() => onFiltroChange(filtro.key)}
        >
          {filtro.label}
        </button>
      ))}
    </div>
  );
}
