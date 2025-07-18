import React from 'react';

export default function FilterButtonsAuditoria({ 
  filtroKPI, 
  setFiltroKPI,
  filtroActividad, 
  setFiltroActividad,
  filtroEstado, 
  setFiltroEstado,
  busquedaCodigo,
  setBusquedaCodigo,
  onLimpiarFiltros,
  totalRegistros,
  registrosFiltrados,
  isMobile 
}) {

  const estadoOptions = [
    { value: 'TODOS', label: 'Todos los Estados' },
    { value: 'VALIDADO', label: 'VALIDADO / APROBADO' },
    { value: 'PENDIENTE', label: 'PENDIENTE / EN REVISIÓN' },
    { value: 'RECHAZADO', label: 'RECHAZADO' }
  ];

  return (
    <div className={`filter-selects ${isMobile ? 'mobile' : ''}`}>
      {/* Buscador por código */}
      <div className="filter-group">
        <label htmlFor="codigo-search">Buscar por código PDV:</label>
        <input 
          type="text"
          id="codigo-search"
          className="filter-input"
          placeholder="Buscar por código de PDV..."
          value={busquedaCodigo}
          onChange={(e) => setBusquedaCodigo(e.target.value)}
        />
      </div>

      {/* <div className="filter-group">
        <label htmlFor="actividad-select">Tipo de Auditoria:</label>
        <select 
          id="actividad-select"
          className="filter-select"
          value={filtroActividad}
          onChange={(e) => setFiltroActividad(e.target.value)}
        >
          {actividadOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div> */}

      <div className="filter-group">
        <label htmlFor="estado-select">Estado de Auditoria:</label>
        <select 
          id="estado-select"
          className="filter-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          {estadoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Botón limpiar filtros */}
      <div className="filter-group">
        <button 
          className="clear-filters-btn" 
          onClick={onLimpiarFiltros}
          title="Limpiar todos los filtros"
        >
          🗑️ Limpiar Filtros
        </button>
      </div>

      {/* Contador de resultados */}
      <div className="filter-counter">
        <span>{registrosFiltrados} de {totalRegistros} auditorías</span>
      </div>
    </div>
  );
}
