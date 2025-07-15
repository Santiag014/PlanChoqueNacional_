import React from 'react';

/**
 * Componente para una tarjeta de catálogo
 */
const CatalogCard = ({ catalogo, onDownload }) => {
  return (
    <div className="catalogo-card">
      <div className="catalogo-title">{catalogo.titulo}</div>
      <img 
        src={catalogo.img} 
        alt={catalogo.titulo} 
        className="catalogo-img" 
      />
      <a href={catalogo.link} download className="catalogo-link">
        <button
          className="catalogo-btn"
          onClick={() => onDownload(catalogo.link)}
        >
          DESCARGA
        </button>
      </a>
    </div>
  );
};

export default CatalogCard;
