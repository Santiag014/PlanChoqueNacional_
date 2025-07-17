import React, { useState, useEffect } from 'react';
import './filtros-mercadeo.css';

/**
 * Compone          <select 
            id="filtro-asesor"
            value={filtrosLocal.asesor_id} 
            onChange={(e) => {
              console.log('Cambio de asesor:', e.target.value);
              handleFiltroChange('asesor_id', e.target.value);
            }}
            className="filtro-select"
          >
            <option value="">Todos los asesores</option>
            {console.log('Renderizando opciones de asesores. Total:', asesores?.length)}
            {(asesores && Array.isArray(asesores)) ? asesores.map(asesor => {
              console.log('Renderizando asesor:', asesor);
              return (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.nombre || asesor.name} - {asesor.codigo}
                </option>
              );
            }) : (
              console.log('No hay asesores o no es un array:', asesores)
            )}os avanzados para mercadeo
 * Permite filtrar por asesor y PDV
 */
export default function FiltrosAvanzadosMercadeo({ 
  asesores = [], 
  pdvs = [],
  filtros = {}, 
  onFiltrosChange, 
  className = ''
}) {
  console.log('=== PROPS FILTROS AVANZADOS ===');
  console.log('asesores prop:', asesores);
    console.log('FiltrosAvanzadosMercadeo props recibidas:', {
    asesores: asesores?.length,
    asesoresData: asesores?.slice(0, 2), // Solo los primeros 2 para debug
    pdvs: pdvs?.length,
    filtros: filtros
  });
  console.log('asesores.length:', asesores?.length);
  console.log('Primeros 3 asesores:', asesores?.slice(0, 3));
  console.log('pdvs prop:', pdvs);
  console.log('pdvs.length:', pdvs?.length);
  console.log('filtros prop:', filtros);
  console.log('================================');
  
  const [filtrosLocal, setFiltrosLocal] = useState({
    asesor_id: '',
    pdv_id: '',
    ...filtros
  });
  
  const [pdvsFiltrados, setPdvsFiltrados] = useState([]);

  // Actualizar filtros locales cuando cambien los filtros externos
  useEffect(() => {
    setFiltrosLocal(prev => ({ ...prev, ...filtros }));
  }, [filtros]);

  // Filtrar PDVs según el asesor seleccionado
  useEffect(() => {
    console.log('=== DEBUG FILTROS AVANZADOS ===');
    console.log('asesores:', asesores);
    console.log('pdvs:', pdvs);
    console.log('filtrosLocal.asesor_id:', filtrosLocal.asesor_id);
    
    if (filtrosLocal.asesor_id) {
      const pdvsDelAsesor = pdvs.filter(pdv => pdv.asesor_id === parseInt(filtrosLocal.asesor_id));
      console.log('PDVs del asesor seleccionado:', pdvsDelAsesor);
      setPdvsFiltrados(pdvsDelAsesor);
    } else {
      console.log('Mostrando todos los PDVs');
      setPdvsFiltrados(pdvs);
    }
    console.log('================================');
  }, [filtrosLocal.asesor_id, pdvs]);

  // Manejar cambio en los filtros
  const handleFiltroChange = (tipo, valor) => {
    const nuevosFiltros = { ...filtrosLocal };
    
    if (tipo === 'asesor_id') {
      nuevosFiltros.asesor_id = valor;
      // Limpiar PDV cuando cambie el asesor
      nuevosFiltros.pdv_id = '';
    } else if (tipo === 'pdv_id') {
      nuevosFiltros.pdv_id = valor;
    }

    setFiltrosLocal(nuevosFiltros);
    if (onFiltrosChange) {
      onFiltrosChange(nuevosFiltros);
    }
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtrosVacios = { asesor_id: '', pdv_id: '' };
    setFiltrosLocal(filtrosVacios);
    if (onFiltrosChange) {
      onFiltrosChange(filtrosVacios);
    }
  };

  return (
    <div className={`filtros-avanzados-container ${className}`}>
      <div className="filtros-header">
        <h3>Filtros Avanzados</h3>
        <button 
          className="btn-limpiar-filtros"
          onClick={limpiarFiltros}
          title="Limpiar todos los filtros"
        >
          🗑️ Limpiar
        </button>
      </div>

      <div className="filtros-grid">
        {/* Filtro por Asesor */}
        <div className="filtro-item">
          <label htmlFor="filtro-asesor">Asesor:</label>
          <select 
            id="filtro-asesor"
            value={filtrosLocal.asesor_id} 
            onChange={(e) => handleFiltroChange('asesor_id', e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los asesores</option>
            {asesores.map(asesor => (
              <option key={asesor.id} value={asesor.id}>
                {asesor.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por PDV */}
        <div className="filtro-item">
          <label htmlFor="filtro-pdv">Punto de Venta:</label>
          <select 
            id="filtro-pdv"
            value={filtrosLocal.pdv_id} 
            onChange={(e) => handleFiltroChange('pdv_id', e.target.value)}
            className="filtro-select"
            disabled={pdvsFiltrados.length === 0}
          >
            <option value="">Todos los PDVs</option>
            {pdvsFiltrados.map(pdv => (
              <option key={pdv.id} value={pdv.id}>
                {pdv.nombre} ({pdv.codigo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mostrar filtros activos */}
      {(filtrosLocal.asesor_id || filtrosLocal.pdv_id) && (
        <div className="filtros-activos">
          <span className="filtros-activos-label">Filtros activos:</span>
          <div className="filtros-activos-lista">
            {filtrosLocal.asesor_id && (
              <span className="filtro-activo">
                Asesor: {asesores.find(a => a.id === parseInt(filtrosLocal.asesor_id))?.nombre || 'Desconocido'}
                <button 
                  className="btn-quitar-filtro"
                  onClick={() => handleFiltroChange('asesor_id', '')}
                >
                  ×
                </button>
              </span>
            )}
            {filtrosLocal.pdv_id && (
              <span className="filtro-activo">
                PDV: {pdvs.find(p => p.id === parseInt(filtrosLocal.pdv_id))?.nombre || 'Desconocido'}
                <button 
                  className="btn-quitar-filtro"
                  onClick={() => handleFiltroChange('pdv_id', '')}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
