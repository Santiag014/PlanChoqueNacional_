import React, { useState } from 'react';

/**
 * Componente de botón flotante de filtros para móvil y escritorio
 */
const FilterButton = ({ filters, setFilters, isMobile }) => {
  const [showModal, setShowModal] = useState(false);

  // Ahora se muestra tanto en móvil como escritorio
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      nombre: '',
      codigo: ''
    });
  };

  const hasActiveFilters = filters.nombre || filters.codigo;

  return (
    <>
      {/* Botón flotante */}
      <button 
        className={`filter-float-button ${hasActiveFilters ? 'active' : ''}`}
        onClick={() => setShowModal(true)}
        title="Filtros"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
        </svg>
        {hasActiveFilters && <span className="filter-badge"></span>}
      </button>

      {/* Modal de filtros - Desde abajo */}
      {showModal && (
        <div className="filter-modal-overlay" onClick={() => setShowModal(false)}>
          <div className={`filter-modal-content ${isMobile ? 'filter-modal-bottom' : 'filter-modal-center'}`} onClick={e => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3>Filtros</h3>
              <button 
                className="filter-modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="filter-modal-body">
              <div className="filter-group">
                <label>Nombre PDV:</label>
                <input
                  type="text"
                  value={filters.nombre || ''}
                  onChange={(e) => handleFilterChange('nombre', e.target.value)}
                  placeholder="Buscar por nombre..."
                />
              </div>

              <div className="filter-group">
                <label>Código PDV:</label>
                <input
                  type="text"
                  value={filters.codigo || ''}
                  onChange={(e) => handleFilterChange('codigo', e.target.value)}
                  placeholder="Buscar por código..."
                />
              </div>
            </div>

            <div className="filter-modal-footer">
              <button 
                className="filter-clear-btn"
                onClick={clearFilters}
              >
                Limpiar
              </button>
              <button 
                className="filter-apply-btn"
                onClick={() => setShowModal(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterButton;
