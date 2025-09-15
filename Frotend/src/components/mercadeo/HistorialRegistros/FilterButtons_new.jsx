import React, { useState } from 'react';

export default function FilterButtons({ 
  filtroKPI, 
  setFiltroKPI, 
  filtroActividad, 
  setFiltroActividad,
  filtroEstadoBackoffice,
  setFiltroEstadoBackoffice,
  filtroEstadoAgente,
  setFiltroEstadoAgente,
  busquedaCodigo,
  setBusquedaCodigo,
  busquedaCedula,
  setBusquedaCedula,
  busquedaId,
  setBusquedaId,
  fechaActividad,
  setFechaActividad,
  fechaCreacion,
  setFechaCreacion,
  isMobile 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroKPI('TODOS');
    setFiltroActividad('TODAS');
    setFiltroEstadoBackoffice('TODOS');
    setFiltroEstadoAgente('TODOS');
    setBusquedaCodigo('');
    setBusquedaCedula('');
    setBusquedaId('');
    setFechaActividad('');
    setFechaCreacion('');
  };

  return (
    <div className="modern-filters-container">
      {/* Header de filtros moderno */}
      <div className="modern-filters-header" onClick={toggleFilters}>
        <div className="filters-header-left">
          <div className="filters-icon-wrapper">
            <svg className="filters-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div className="filters-title-wrapper">
            <span className="filters-title-main">Filtros de Búsqueda</span>
            <span className="filters-subtitle">Personaliza tu búsqueda</span>
          </div>
        </div>
        <div className="filters-header-right">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              limpiarFiltros();
            }}
            className="modern-clear-btn"
            title="Limpiar todos los filtros"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Limpiar</span>
          </button>
          <button className={`modern-expand-btn ${isExpanded ? 'expanded' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido de filtros moderno */}
      <div className={`modern-filters-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="modern-filters-grid">
          {/* Filtro por Código Punto de Venta */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/>
                </svg>
              </div>
              <span className="label-text">Código Punto de Venta</span>
            </label>
            <div className="modern-input-wrapper">
              <input
                type="text"
                value={busquedaCodigo}
                onChange={(e) => setBusquedaCodigo(e.target.value)}
                placeholder="Ingresa el código..."
                className="modern-filter-input"
              />
              <div className="input-border-effect"></div>
            </div>
          </div>

          {/* Filtro por Cédula del Asesor */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <span className="label-text">Cédula del Asesor</span>
            </label>
            <div className="modern-input-wrapper">
              <input
                type="text"
                value={busquedaCedula}
                onChange={(e) => setBusquedaCedula(e.target.value)}
                placeholder="Número de cédula..."
                className="modern-filter-input"
              />
              <div className="input-border-effect"></div>
            </div>
          </div>

          {/* Filtro por Tipo de Actividad */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <span className="label-text">Actividad</span>
            </label>
            <div className="modern-select-wrapper">
              <select 
                value={filtroActividad} 
                onChange={(e) => setFiltroActividad(e.target.value)}
                className="modern-filter-select"
              >
                <option value="TODAS">Todas las Actividades</option>
                <option value="VOLUMEN">Volumen</option>
                <option value="PRECIO">Precio</option>
                <option value="FRECUENCIA">Frecuencia</option>
                <option value="GALONAJE">Galonaje</option>
                <option value="IMPLEME">Impleme</option>
              </select>
              <div className="select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro Estado Backoffice */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span className="label-text">Estado BackOffice</span>
            </label>
            <div className="modern-select-wrapper">
              <select 
                value={filtroEstadoBackoffice} 
                onChange={(e) => setFiltroEstadoBackoffice(e.target.value)}
                className="modern-filter-select"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
              <div className="select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro Estado Agente */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                </svg>
              </div>
              <span className="label-text">Estado Agente</span>
            </label>
            <div className="modern-select-wrapper">
              <select 
                value={filtroEstadoAgente} 
                onChange={(e) => setFiltroEstadoAgente(e.target.value)}
                className="modern-filter-select"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
              <div className="select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro Fecha Factura (Fecha Actividad) */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2}/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2}/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/>
                </svg>
              </div>
              <span className="label-text">Fecha Factura</span>
            </label>
            <div className="modern-input-wrapper">
              <input
                type="date"
                value={fechaActividad}
                onChange={(e) => setFechaActividad(e.target.value)}
                className="modern-filter-input modern-date-input"
              />
              <div className="input-border-effect"></div>
            </div>
          </div>

          {/* Filtro Fecha Creación */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2}/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2}/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/>
                  <circle cx="8" cy="16" r="2" strokeWidth={2}/>
                </svg>
              </div>
              <span className="label-text">Fecha Creación</span>
            </label>
            <div className="modern-input-wrapper">
              <input
                type="date"
                value={fechaCreacion}
                onChange={(e) => setFechaCreacion(e.target.value)}
                className="modern-filter-input modern-date-input"
              />
              <div className="input-border-effect"></div>
            </div>
          </div>

          {/* Filtro por ID */}
          <div className="modern-filter-group">
            <label className="modern-filter-label">
              <div className="label-icon-wrapper">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                </svg>
              </div>
              <span className="label-text">ID</span>
            </label>
            <div className="modern-input-wrapper">
              <input
                type="text"
                value={busquedaId}
                onChange={(e) => setBusquedaId(e.target.value)}
                placeholder="Buscar por ID..."
                className="modern-filter-input"
              />
              <div className="input-border-effect"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
