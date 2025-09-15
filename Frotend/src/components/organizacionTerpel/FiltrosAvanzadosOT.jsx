import React, { useState, useEffect } from 'react';
import { useAsesoresOT, useAgentesOT, usePuntosVentaOT } from '../../hooks/ot';
import '../../styles/Mercadeo/filtros-avanzados.css';

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

  // Filtrar PDVs basado en la compañía seleccionada
  const pdvsFiltrados = filtros.compania 
    ? pdvs.filter(pdv => pdv.compania === filtros.compania)
    : pdvs;

  // Filtrar PDVs por asesor si está seleccionado
  const pdvsDisponibles = filtros.asesor
    ? pdvsFiltrados.filter(pdv => pdv.asesor_id.toString() === filtros.asesor)
    : pdvsFiltrados;

  // Obtener asesores disponibles basado en filtros activos
  const asesoresDisponibles = () => {
    if (filtros.compania || filtros.pdv) {
      // Si hay filtros de compañía o PDV, mostrar solo asesores relacionados
      const pdvsRelevantes = filtros.pdv 
        ? pdvs.filter(pdv => pdv.id.toString() === filtros.pdv)
        : pdvsFiltrados;
      
      const asesorIds = [...new Set(pdvsRelevantes.map(pdv => pdv.asesor_id).filter(id => id))];
      return asesores.filter(asesor => asesorIds.includes(asesor.id));
    }
    return asesores;
  };

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    
    // Lógica de filtros enlazados
    if (campo === 'compania') {
      // Si se cambia la compañía, limpiar PDV y asesor
      nuevosFiltros.pdv = '';
      nuevosFiltros.asesor = '';
      
      // Mostrar feedback visual
      console.log(`🏢 Filtro por compañía: ${valor || 'Todas'}`);
      if (valor) {
        const pdvsDeLaCompania = pdvs.filter(pdv => pdv.compania === valor);
        console.log(`📍 ${pdvsDeLaCompania.length} PDVs disponibles en ${valor}`);
      }
    } else if (campo === 'pdv') {
      // Si se selecciona un PDV específico, auto-seleccionar su asesor
      if (valor) {
        const pdvSeleccionado = pdvs.find(pdv => pdv.id.toString() === valor);
        if (pdvSeleccionado && pdvSeleccionado.asesor_id) {
          nuevosFiltros.asesor = pdvSeleccionado.asesor_id.toString();
          console.log(`📍➡️👤 PDV seleccionado auto-asignó asesor: ${pdvSeleccionado.asesor_id}`);
        }
      } else {
        // Si se deselecciona el PDV, limpiar el asesor
        nuevosFiltros.asesor = '';
      }
    } else if (campo === 'asesor') {
      // Si se cambia el asesor, limpiar PDV para que se actualice la lista
      if (valor !== filtros.asesor) {
        nuevosFiltros.pdv = '';
        console.log(`👤 Asesor cambiado, limpiando selección de PDV`);
      }
    }
    
    onFiltrosChange(nuevosFiltros);
  };

  const toggleFiltros = () => {
    setFiltrosExpandidos(!filtrosExpandidos);
  };

  const limpiarTodosFiltros = () => {
    onFiltrosChange({
      asesor: '',
      pdv: '',
      compania: '',
      agente: ''
    });
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
        
        {hayFiltrosActivos && (
          <button 
            className="filtros-limpiar"
            onClick={limpiarTodosFiltros}
            title="Limpiar todos los filtros"
          >
            <span className="filtros-icon">🗑️</span>
            Limpiar filtros
          </button>
        )}
      </div>

      {filtrosExpandidos && (
        <div className="filtros-content">
          <div className="filtros-grid">
            {/* Filtro de Compañía */}
            <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">🏢</span>
                Compañía
                <small className="filtro-tooltip">Al seleccionar una compañía, se filtrarán los PDVs y asesores</small>
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

            {/* Filtro de Punto de Venta */}
            <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">📍</span>
                Punto de Venta
                <small className="filtro-tooltip">Al seleccionar un PDV, se auto-seleccionará su asesor</small>
              </label>
              <select
                className="filtro-select"
                value={filtros.pdv || ''}
                onChange={(e) => handleFiltroChange('pdv', e.target.value)}
                disabled={loadingPdvs}
              >
                <option value="">Todos los PDVs</option>
                {pdvsDisponibles.map(pdv => (
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
              {filtros.compania && (
                <div className="filtro-info">
                  Mostrando {pdvsDisponibles.length} PDVs de {filtros.compania}
                </div>
              )}
            </div>

            {/* Filtro de Asesor */}
            <div className="filtro-item">
              <label className="filtro-label">
                <span className="filtro-icon">👤</span>
                Asesor
                <small className="filtro-tooltip">Filtrado automáticamente según la compañía/PDV seleccionado</small>
              </label>
              <select
                className="filtro-select"
                value={filtros.asesor || ''}
                onChange={(e) => handleFiltroChange('asesor', e.target.value)}
                disabled={loadingAsesores}
              >
                <option value="">Todos los asesores</option>
                {asesoresDisponibles().map(asesor => (
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
              {(filtros.compania || filtros.pdv) && (
                <div className="filtro-info">
                  Mostrando {asesoresDisponibles().length} asesores disponibles
                </div>
              )}
            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default FiltrosAvanzadosOT;
