import React, { useState, useEffect } from 'react';
import { useAsesoresOT, useAgentesOT, usePuntosVentaOT } from '../../hooks/ot';
// import '../../styles/Director/director-filtros-avanzados.css';

const FiltrosAvanzadosOT = ({ 
  filtros, 
  onFiltrosChange, 
  className = '' 
}) => {
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);

  // Hooks para obtener datos de las listas
  const { asesores, loading: loadingAsesores, error: errorAsesores } = useAsesoresOT();
  const { agentes, loading: loadingAgentes, error: errorAgentes } = useAgentesOT();
  const { pdvs, loading: loadingPdvs, error: errorPdvs } = usePuntosVentaOT();

  // Obtener compañías únicas de los puntos de venta
  const companias = [...new Set(pdvs.map(pdv => pdv.compania).filter(c => c))];

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    
    // Si se cambia el asesor, limpiar PDV ya que podrían no estar relacionados
    if (campo === 'asesor') {
      nuevosFiltros.pdv = '';
    }
    
    onFiltrosChange(nuevosFiltros);
  };

  const toggleFiltros = () => {
    setFiltrosExpandidos(!filtrosExpandidos);
  };

  const hayFiltrosActivos = Object.values(filtros).some(valor => valor);

  return (
    <div className={`filtros-avanzados-container ${className}`}>
      <div className="filtros-header">
        <button 
          className={`filtros-toggle ${filtrosExpandidos ? 'activo' : ''}`}
          onClick={toggleFiltros}
        >
          <span className="filtros-icon">⚙️</span>
          Filtros
          {hayFiltrosActivos && <span className="filtros-badge">•</span>}
        </button>
      </div>

      {filtrosExpandidos && (
        <div className="filtros-content">
          <div className="filtros-grid">
            {/* Filtro de Asesor */}
            <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">👤</span>
              </label>
              <select
                className="filtro-select"
                value={filtros.asesor || ''}
                onChange={(e) => handleFiltroChange('asesor', e.target.value)}
                disabled={loadingAsesores}
              >
                <option value="">Todos los asesores</option>
                {asesores.map(asesor => (
                  <option key={asesor.id} value={asesor.id}>
                    {asesor.name} - {asesor.email}
                  </option>
                ))}
              </select>
              {loadingAsesores && (
                <div className="filtro-loading">Cargando asesores...</div>
              )}
              {errorAsesores && (
                <div className="filtro-error">Error al cargar asesores</div>
              )}
            </div>

            {/* Filtro de Punto de Venta */}
            <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">📍</span>
                Punto de Venta
              </label>
              <select
                className="filtro-select"
                value={filtros.pdv || ''}
                onChange={(e) => handleFiltroChange('pdv', e.target.value)}
                disabled={loadingPdvs}
              >
                <option value="">Todos los PDVs</option>
                {pdvs
                  .filter(pdv => !filtros.asesor || pdv.asesor_id.toString() === filtros.asesor)
                  .map(pdv => (
                    <option key={pdv.id} value={pdv.id}>
                      {pdv.codigo} - {pdv.nombre}
                    </option>
                  ))}
              </select>
              {loadingPdvs && (
                <div className="filtro-loading">Cargando PDVs...</div>
              )}
              {errorPdvs && (
                <div className="filtro-error">Error al cargar PDVs</div>
              )}
            </div>

            {/* Filtro de Compañía */}
            <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">🏢</span>
                Compañía
              </label>
              <select
                className="filtro-select"
                value={filtros.compania || ''}
                onChange={(e) => handleFiltroChange('compania', e.target.value)}
              >
                <option value="">Todas las compañías</option>
                {companias.map(compania => (
                  <option key={compania} value={compania}>
                    {compania}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Agente Comercial */}
            {/* <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">👥</span>
                Agente Comercial
              </label>
              <select
                className="filtro-select"
                value={filtros.agente || ''}
                onChange={(e) => handleFiltroChange('agente', e.target.value)}
                disabled={loadingAgentes}
              >
                <option value="">Todos los agentes</option>
                {agentes.map(agente => (
                  <option key={agente.id} value={agente.id}>
                    {agente.nombre} - {agente.email}
                  </option>
                ))}
              </select>
              {loadingAgentes && (
                <div className="filtro-loading">Cargando agentes...</div>
              )}
              {errorAgentes && (
                <div className="filtro-error">Error al cargar agentes</div>
              )}
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltrosAvanzadosOT;
