import React, { useState } from 'react';
import '../../../styles/Backoffice/filter-panel-new.css';

export default function FilterButtons({
  filtroKPI,
  setFiltroKPI,
  filtroActividad,
  setFiltroActividad,
  filtroEstado,
  setFiltroEstado,
  filtroEstadoBackoffice,
  setFiltroEstadoBackoffice,
  filtroAgenteComercial,
  setFiltroAgenteComercial,
  busquedaCodigo,
  setBusquedaCodigo,
  busquedaAsesor,
  setBusquedaAsesor,
  busquedaCedula,
  setBusquedaCedula,
  busquedaId,
  setBusquedaId,
  filtroDia,
  setFiltroDia,
  filtroSemana,
  setFiltroSemana,
  filtroDiaCreacion,
  setFiltroDiaCreacion,
  isMobile
}) {
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  const limpiarFiltros = () => {
    setFiltroKPI('TODOS');
    setFiltroActividad('TODAS');
    setFiltroEstado('TODOS');
    setFiltroEstadoBackoffice('TODOS');
    setFiltroAgenteComercial('TODOS'); // Cambiado para coincidir
    setBusquedaCodigo('');
    setBusquedaAsesor('');
    setBusquedaCedula('');
    setBusquedaId('');
    setFiltroDia('');
    setFiltroSemana('');
    setFiltroDiaCreacion('');
  };

  const toggleFiltros = () => {
    setFiltrosExpanded(!filtrosExpanded);
  };

  // Contar filtros activos
  const filtrosActivos = [
    filtroKPI !== 'TODOS',
    filtroActividad !== 'TODAS',
    filtroEstado !== 'TODOS',
    filtroEstadoBackoffice !== 'TODOS',
    filtroAgenteComercial !== 'TODOS',
    busquedaCodigo.trim() !== '',
    busquedaAsesor.trim() !== '',
    busquedaCedula.trim() !== '',
    busquedaId.trim() !== '',
    filtroDia !== '',
    filtroSemana !== '',
    filtroDiaCreacion !== ''
  ].filter(Boolean).length;

  return (
    <div className="backoffice-filtros-container">
      <div className="backoffice-filtros-header" onClick={toggleFiltros}>
        <h3 className="backoffice-filtros-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M9 12h12M3 18h18" stroke="#e30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Filtros de Búsqueda
          {/* Indicador de filtros activos */}
          {filtrosActivos > 0 && (
            <span className="backoffice-filtros-activos-badge">
              {filtrosActivos}
            </span>
          )}
        </h3>
        
        {/* Botón desplegable mejorado - visible en todas las pantallas */}
        <div className="backoffice-filtros-header-actions">
          {/* Botón limpiar visible siempre */}
          <button 
            className="backoffice-filtros-limpiar-header" 
            onClick={(e) => {e.stopPropagation(); limpiarFiltros();}}
            title="Limpiar todos los filtros"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button className="backoffice-filtros-toggle" title={filtrosExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              className={`backoffice-filtros-toggle-icon ${filtrosExpanded ? 'expanded' : ''}`}
            >
              <path d="M6 9l6 6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      {/* Contenido de filtros (comportamiento de colapso mejorado) */}
      <div className={`backoffice-filtros-content ${filtrosExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="backoffice-filtros-grid">
          
          {/* Filtro por Agente Comercial - PRIORITARIO */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Agente Comercial
            </label>
            <select
              className="backoffice-filtro-select"
              value={filtroAgenteComercial}
              onChange={(e) => setFiltroAgenteComercial(e.target.value)}
            >
              <option value="TODOS">Todos los Agentes</option>
              <option value="Ludelpa">Ludelpa</option>
              <option value="R&R">R&R</option>
              <option value="Cia de Lubricante">Cia de Lubricante</option>
              <option value="Disterpel">Disterpel</option>
              <option value="Alger">Alger</option>
              <option value="Distertol">Distertol</option>
              <option value="Districandelaria">Districandelaria</option>
              <option value="Districol">Districol</option>
              <option value="DMT">DMT</option>
              <option value="Lubesol">Lubesol</option>
              <option value="Lubrisinu">Lubrisinu</option>
              <option value="Lubriter">Lubriter</option>
              <option value="Lubrixel">Lubrixel</option>
              <option value="SAJ">SAJ</option>
              <option value="Terdex">Terdex</option>
              <option value="Distribuciones Vicpimar">Distribuciones Vicpimar</option>
              <option value="Wings">Wings</option>
              <option value="Invertek">Invertek</option>
              <option value="Bull">Bull</option>
            </select>
          </div>

          {/* Búsqueda por Cédula del Asesor */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Cédula del Asesor
            </label>
            <input
              type="text"
              className="backoffice-filtro-input"
              placeholder="Buscar por cédula..."
              value={busquedaCedula}
              onChange={(e) => setBusquedaCedula(e.target.value)}
            />
          </div>

          {/* Búsqueda por ID */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              ID del Registro
            </label>
            <input
              type="text"
              className="backoffice-filtro-input"
              placeholder="Buscar por ID..."
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
            />
          </div>

          {/* Búsqueda por Código PDV */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Código PDV
            </label>
            <input
              type="text"
              className="backoffice-filtro-input"
              placeholder="Buscar por código..."
              value={busquedaCodigo}
              onChange={(e) => setBusquedaCodigo(e.target.value)}
            />
          </div>

          {/* Filtro por Tipo de Actividad */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tipo de Actividad
            </label>
            <select
              className="backoffice-filtro-select"
              value={filtroActividad}
              onChange={(e) => setFiltroActividad(e.target.value)}
            >
              <option value="TODAS">Todas las Actividades</option>
              <option value="Visita">Visita</option>
              <option value="Implementación">Implementación</option>
              <option value="Galonaje/Precios">Galonaje/Precios</option>
              <option value="Galonaje">Galonaje</option>
              <option value="Precios">Precios</option>
            </select>
          </div>

          {/* Estado BackOffice */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Estado BackOffice
            </label>
            <select
              className="backoffice-filtro-select"
              value={filtroEstadoBackoffice}
              onChange={(e) => setFiltroEstadoBackoffice(e.target.value)}
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="ACEPTADO">Aprobados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>

          {/* Estado Agente */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Estado Agente
            </label>
            <select
              className="backoffice-filtro-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="VALIDADO">Validados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>

          {/* Filtro por Día Específico */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Filtrar por Día
            </label>
            <input
              type="date"
              className="backoffice-filtro-input"
              value={filtroDia}
              onChange={(e) => {
                setFiltroDia(e.target.value);
                // Si se selecciona un día, limpiar filtro de semana
                if (e.target.value) {
                  setFiltroSemana('');
                }
              }}
              placeholder="Seleccionar día..."
            />
          </div>

          {/* Filtro por Semana */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                <rect x="7" y="12" width="3" height="3" fill="currentColor"/>
                <rect x="14" y="12" width="3" height="3" fill="currentColor"/>
              </svg>
              Filtrar por Semana
            </label>
            <input
              type="week"
              className="backoffice-filtro-input"
              value={filtroSemana}
              onChange={(e) => {
                setFiltroSemana(e.target.value);
                // Si se selecciona una semana, limpiar filtro de día
                if (e.target.value) {
                  setFiltroDia('');
                }
              }}
              placeholder="Seleccionar semana..."
            />
          </div>

          {/* Filtro por Día de Creación */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="16" r="1" fill="currentColor"/>
                <circle cx="15" cy="16" r="1" fill="currentColor"/>
              </svg>
              Filtrar por Día de Creación
            </label>
            <input
              type="date"
              className="backoffice-filtro-input"
              value={filtroDiaCreacion}
              onChange={(e) => {
                setFiltroDiaCreacion(e.target.value);
              }}
              placeholder="Seleccionar día de creación..."
            />
          </div>

        </div>
      </div>
    </div>
  );
}
