import React, { useState } from 'react';
import '../../styles/Mercadeo/filter-panel.css';

/**
 * Componente de filtros desplegables reutilizable para las páginas de Mercadeo
 * @param {Object} props
 * @param {Array} props.filters - Array de objetos con configuración de filtros
 * @param {Function} props.onFilterChange - Callback cuando cambia un filtro
 * @param {Function} props.onClearFilters - Callback para limpiar filtros
 * @param {number} props.totalResults - Total de resultados filtrados
 * @param {string} props.title - Título del panel de filtros
 */
export default function FilterPanel({ 
  filters = [], 
  onFilterChange, 
  onClearFilters, 
  totalResults = 0,
  title = "Filtros de Búsqueda"
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleInputChange = (filterId, value) => {
    if (onFilterChange) {
      onFilterChange(filterId, value);
    }
  };

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <div className="filter-panel">
      {/* Header del panel de filtros */}
      <div className="filter-panel-header" onClick={toggleExpanded}>
        <div className="filter-panel-title">
          <span className="filter-panel-icon">🔍</span>
          <h3>{title}</h3>
          <span className="filter-panel-count">
            ({totalResults} resultado{totalResults !== 1 ? 's' : ''})
          </span>
        </div>
        <div className={`filter-panel-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Contenido de los filtros */}
      <div className={`filter-panel-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="filter-panel-grid">
          {filters.map((filter) => (
            <div key={filter.id} className="filter-group">
              <label className="filter-label">
                <span className="filter-label-icon">{filter.icon}</span>
                {filter.label}
              </label>
              
              {filter.type === 'input' && (
                <div className="filter-input-wrapper">
                  <input
                    type={filter.inputType || 'text'}
                    placeholder={filter.placeholder}
                    value={filter.value}
                    onChange={(e) => handleInputChange(filter.id, e.target.value)}
                    className="filter-input"
                  />
                  <div className="filter-input-focus-border"></div>
                </div>
              )}

              {filter.type === 'select' && (
                <div className="filter-select-wrapper">
                  <select
                    value={filter.value}
                    onChange={(e) => handleInputChange(filter.id, e.target.value)}
                    className="filter-select"
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="filter-select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              )}

              {filter.type === 'date' && (
                <div className="filter-input-wrapper">
                  <input
                    type="date"
                    value={filter.value}
                    onChange={(e) => handleInputChange(filter.id, e.target.value)}
                    className="filter-input filter-date"
                  />
                  <div className="filter-input-focus-border"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="filter-panel-actions">
          <button 
            className="filter-clear-btn"
            onClick={handleClearAll}
          >
            <span className="filter-clear-icon">🗑️</span>
            Limpiar Filtros
          </button>
          
          <div className="filter-results-counter">
            <span className="filter-results-icon">📊</span>
            <span className="filter-results-text">
              Mostrando {totalResults} registro{totalResults !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
