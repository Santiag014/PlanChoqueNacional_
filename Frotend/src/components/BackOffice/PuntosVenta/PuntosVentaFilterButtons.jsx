import React, { useState } from 'react';
import '../../../styles/Backoffice/filter-panel-new.css';

export default function PuntosVentaFilterButtons({
  filtroAgenteComercial = 'TODOS',
  setFiltroAgenteComercial = () => {},
  filtroCiudad = 'TODAS',
  setFiltroCiudad = () => {},
  filtroEstado = 'TODOS',
  setFiltroEstado = () => {},
  busquedaCodigo = '',
  setBusquedaCodigo = () => {},
  busquedaNombre = '',
  setBusquedaNombre = () => {},
  busquedaNit = '',
  setBusquedaNit = () => {},
  busquedaDireccion = '',
  setBusquedaDireccion = () => {}
}) {
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  const limpiarFiltros = () => {
    setFiltroAgenteComercial('TODOS');
    setFiltroCiudad('TODAS');
    setFiltroEstado('TODOS');
    setBusquedaCodigo('');
    setBusquedaNombre('');
    setBusquedaNit('');
    setBusquedaDireccion('');
  };

  const toggleFiltros = () => {
    setFiltrosExpanded(!filtrosExpanded);
  };

  // Contar filtros activos
  const filtrosActivos = [
    filtroAgenteComercial !== 'TODOS',
    filtroCiudad !== 'TODAS',
    filtroEstado !== 'TODOS',
    busquedaCodigo.trim() !== '',
    busquedaNombre.trim() !== '',
    busquedaNit.trim() !== '',
    busquedaDireccion.trim() !== ''
  ].filter(Boolean).length;

  return (
    <div className="backoffice-filtros-container">
      <div className="backoffice-filtros-header" onClick={toggleFiltros}>
        <h3 className="backoffice-filtros-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M9 12h12M3 18h18" stroke="#e30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Filtros de Puntos de Venta
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
          
          {/* Filtro por Agente Comercial */}
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

          {/* Búsqueda por Nombre PDV */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nombre PDV
            </label>
            <input
              type="text"
              className="backoffice-filtro-input"
              placeholder="Buscar por nombre..."
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
            />
          </div>

          {/* Búsqueda por NIT */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              NIT
            </label>
            <input
              type="text"
              className="backoffice-filtro-input"
              placeholder="Buscar por NIT..."
              value={busquedaNit}
              onChange={(e) => setBusquedaNit(e.target.value)}
            />
          </div>

          {/* Búsqueda por Dirección */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dirección
            </label>
            <input
              type="text"
              className="backoffice-filtro-input"
              placeholder="Buscar por dirección..."
              value={busquedaDireccion}
              onChange={(e) => setBusquedaDireccion(e.target.value)}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
