import React from 'react';

export default function FilterButtons({ 
  filtroKPI, 
  filtroActividad, 
  filtroEstado, 
  filtroEstadoBackoffice,
  filtroEstadoAgente,
  onFiltroKPIChange, 
  onFiltroActividadChange, 
  onFiltroEstadoChange,
  onFiltroEstadoBackofficeChange,
  onFiltroEstadoAgenteChange,
  isMobile 
}) {

  const actividadOptions = [
    { value: 'TODAS', label: 'Todas las Actividades' },
    { value: 'GALONAJE/PRECIOS', label: 'GALONAJE/PRECIOS' },
    { value: 'IMPLEMENTACIÓN', label: 'IMPLEMENTACIÓN' },
    { value: 'VISITA', label: 'VISITA' }
  ];

  const estadoOptions = [
    { value: 'TODOS', label: 'Todos los Estados' },
    { value: 'VALIDADO', label: 'VALIDADO / APROBADO' },
    { value: 'PENDIENTE', label: 'PENDIENTE / EN REVISIÓN' },
    { value: 'RECHAZADO', label: 'RECHAZADO' }
  ];

  const estadoBackofficeOptions = [
    { value: 'TODOS', label: 'Todos los Estados BackOffice' },
    { value: 'VALIDADO', label: 'VALIDADO / APROBADO' },
    { value: 'PENDIENTE', label: 'PENDIENTE / EN REVISIÓN' },
    { value: 'RECHAZADO', label: 'RECHAZADO' }
  ];

  const estadoAgenteOptions = [
    { value: 'TODOS', label: 'Todos los Estados Agente' },
    { value: 'VALIDADO', label: 'VALIDADO / APROBADO' },
    { value: 'PENDIENTE', label: 'PENDIENTE / EN REVISIÓN' },
    { value: 'RECHAZADO', label: 'RECHAZADO' }
  ];

  return (
    <div className={`filter-selects ${isMobile ? 'mobile' : ''}`}>

      <div className="filter-group">
        <label htmlFor="actividad-select">Actividad:</label>
        <select 
          id="actividad-select"
          className="filter-select"
          value={filtroActividad}
          onChange={(e) => onFiltroActividadChange(e.target.value)}
        >
          {actividadOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="estado-backoffice-select">Estado BackOffice:</label>
        <select 
          id="estado-backoffice-select"
          className="filter-select"
          value={filtroEstadoBackoffice}
          onChange={(e) => onFiltroEstadoBackofficeChange(e.target.value)}
        >
          {estadoBackofficeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="estado-agente-select">Estado Agente:</label>
        <select 
          id="estado-agente-select"
          className="filter-select"
          value={filtroEstadoAgente}
          onChange={(e) => onFiltroEstadoAgenteChange(e.target.value)}
        >
          {estadoAgenteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}