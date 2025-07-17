import React, { useState } from 'react';

export default function FilterButtons({ 
  filtroKPI, 
  setFiltroKPI, 
  filtroActividad, 
  setFiltroActividad,
  filtroEstado,
  setFiltroEstado,
  busquedaCodigo,
  setBusquedaCodigo,
  busquedaAsesor,
  setBusquedaAsesor,
  busquedaCedula,
  setBusquedaCedula,
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
    setFiltroEstado('TODOS');
    setBusquedaCodigo('');
    setBusquedaAsesor('');
    setBusquedaCedula('');
  };

  return (
    <div className="filters-container-collapsible">
      {/* Header de filtros */}
      <div className="filters-header" onClick={toggleFilters}>
        <div className="filters-header-content">
          <span className="filters-title">FILTROS</span>
        </div>
        <div className="filters-actions">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              limpiarFiltros();
            }}
            className="clear-filters-btn"
            title="Limpiar filtros"
          >
            ✕
          </button>
          <button className="expand-arrow" data-expanded={isExpanded}>
            ▼
          </button>
        </div>
      </div>

      {/* Contenido de filtros colapsable */}
      <div className={`filters-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="filters-grid">
          {/* Filtro por Asesor */}
          <div className="filter-group">
            <label>ASESOR</label>
            <input
              type="text"
              value={busquedaAsesor}
              onChange={(e) => setBusquedaAsesor(e.target.value)}
              placeholder="Todos los asesores"
              className="filter-input-small"
            />
          </div>

          {/* Filtro por Punto de Venta */}
          <div className="filter-group">
            <label>PUNTO DE VENTA</label>
            <input
              type="text"
              value={busquedaCodigo}
              onChange={(e) => setBusquedaCodigo(e.target.value)}
              placeholder="Todos los PDVs"
              className="filter-input-small"
            />
          </div>

          {/* Filtro por Cédula del Asesor */}
          <div className="filter-group">
            <label>CÉDULA ASESOR</label>
            <input
              type="text"
              value={busquedaCedula}
              onChange={(e) => setBusquedaCedula(e.target.value)}
              placeholder="Número de cédula"
              className="filter-input-small"
            />
          </div>
        </div>

        {/* Segunda fila de filtros */}
        <div className="filters-grid">
          {/* Filtro por KPI */}
          <div className="filter-group">
            <label>KPI</label>
            <select 
              value={filtroKPI} 
              onChange={(e) => setFiltroKPI(e.target.value)}
              className="filter-select-small"
            >
              <option value="TODOS">Todos</option>
              <option value="VOLUMEN">Volumen</option>
              <option value="PRECIO">Precio</option>
              <option value="FRECUENCIA">Frecuencia</option>
              <option value="PRECIO_VOLUMEN">Precio/Volumen</option>
            </select>
          </div>

          {/* Filtro por Actividad */}
          <div className="filter-group">
            <label>ACTIVIDAD</label>
            <select 
              value={filtroActividad} 
              onChange={(e) => setFiltroActividad(e.target.value)}
              className="filter-select-small"
            >
              <option value="TODAS">Todas</option>
              <option value="IMPLEMENTACION">Implementación</option>
              <option value="VISITA">Visita</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="filter-group">
            <label>ESTADO</label>
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filter-select-small"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="VALIDADO">Validado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
