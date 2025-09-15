import React, { useState } from 'react';
import '../../../styles/Backoffice/filter-panel-new.css';

const UsuariosFilterButtons = ({
  filtroRol,
  setFiltroRol,
  filtroEstado,
  setFiltroEstado,
  filtroAgenteComercial,
  setFiltroAgenteComercial,
  filtroCiudad,
  setFiltroCiudad,
  busquedaCedula,
  setBusquedaCedula,
  busquedaNombre,
  setBusquedaNombre,
  busquedaEmail,
  setBusquedaEmail,
  isMobile
}) => {
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  const limpiarFiltros = () => {
    setFiltroRol('TODOS');
    setFiltroAgenteComercial('TODOS');
    setBusquedaCedula('');
    setBusquedaNombre('');
    setBusquedaEmail('');
  };

  const toggleFiltros = () => {
    setFiltrosExpanded(!filtrosExpanded);
  };

  // Contar filtros activos
  const filtrosActivos = [
    filtroRol !== 'TODOS',
    filtroAgenteComercial !== 'TODOS',
    busquedaCedula.trim() !== '',
    busquedaNombre.trim() !== '',
    busquedaEmail.trim() !== ''
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
          
          {/* Filtro por Rol */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              ROL
            </label>
            <select 
              value={filtroRol} 
              onChange={(e) => setFiltroRol(e.target.value)}
              className="backoffice-filtro-select"
            >
              <option value="TODOS">Todos los Roles</option>
              <option value="Asesor">Asesor</option>
              <option value="Mercadeo">Mercadeo</option>
              <option value="organizacion_terpel">Director OT</option>
            </select>
          </div>

          {/* Filtro por Agente Comercial */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              AGENTE COMERCIAL
            </label>
            <select 
              value={filtroAgenteComercial} 
              onChange={(e) => setFiltroAgenteComercial(e.target.value)}
              className="backoffice-filtro-select"
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


        </div>

        {/* Segunda fila de filtros - Búsquedas */}
        <div className="backoffice-filtros-grid">
          
          {/* Búsqueda por Cédula */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
              </svg>
              CÉDULA
            </label>
            <input
              type="text"
              placeholder="Número de cédula"
              value={busquedaCedula}
              onChange={(e) => setBusquedaCedula(e.target.value)}
              className="backoffice-filtro-input"
            />
          </div>

          {/* Búsqueda por Nombre */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              NOMBRE
            </label>
            <input
              type="text"
              placeholder="Nombre del usuario"
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
              className="backoffice-filtro-input"
            />
          </div>

          {/* Búsqueda por Email */}
          <div className="backoffice-filtro-item">
            <label className="backoffice-filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="backoffice-filtro-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
              </svg>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={busquedaEmail}
              onChange={(e) => setBusquedaEmail(e.target.value)}
              className="backoffice-filtro-input"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default UsuariosFilterButtons;
