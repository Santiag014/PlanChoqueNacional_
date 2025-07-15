import React from 'react';
import CatalogCard from './CatalogCard';

/**
 * Componente para la lista de catálogos
 */
const CatalogList = ({ catalogos, onDownload }) => {
  return (
    <div className="catalogos-bg catalogos-padding-bottom">
      <div className="catalogos-list">
        {catalogos.map((catalogo, idx) => (
          <CatalogCard
            key={idx}
            catalogo={catalogo}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
};

export default CatalogList;
