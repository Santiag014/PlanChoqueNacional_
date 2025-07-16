import React from 'react';

export default function FilterButtons({ 
  filtroKPI, 
  filtroActividad, 
  filtroEstado, 
  onFiltroKPIChange, 
  onFiltroActividadChange, 
  onFiltroEstadoChange, 
  isMobile 
}) {

  const actividadOptions = [
    { value: 'TODAS', label: 'Todas las Actividades' },
    { value: 'IMPLEMENTACION', label: 'IMPLEMENTACIÓN' },
    { value: 'VISITA', label: 'VISITA' }
  ];

  const estadoOptions = [
    { value: 'TODOS', label: 'Todos los Estados' },
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
        <label htmlFor="estado-select">Estado:</label>
        <select 
          id="estado-select"
          className="filter-select"
          value={filtroEstado}
          onChange={(e) => onFiltroEstadoChange(e.target.value)}
        >
          {estadoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
