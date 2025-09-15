import React from 'react';
import './filtros-mercadeo.css';

/**
 * Componente para mostrar filtros activos en mercadeo
 * Muestra de forma compacta los filtros aplicados
 */
export default function FiltroActivoMercadeo({ 
  filtros = {}, 
  onLimpiarFiltros, 
  isMobile = false,
  asesores = [],
  pdvs = []
}) {
  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtros.asesor_id || filtros.pdv_id || filtros.ciudad;

  if (!hayFiltrosActivos) {
    return null;
  }

  // Obtener nombres de los elementos filtrados
  const getNombreAsesor = (asesorId) => {
    const asesor = asesores.find(a => a.id === parseInt(asesorId));
    return asesor ? asesor.nombre : 'Desconocido';
  };

  const getNombrePdv = (pdvId) => {
    const pdv = pdvs.find(p => p.id === parseInt(pdvId));
    return pdv ? `${pdv.nombre} (${pdv.codigo})` : 'Desconocido';
  };

  return (
    <div className={`filtro-activo-container ${isMobile ? 'mobile' : ''}`}>
      {/* <div className="filtro-activo-header">
        <span className="filtro-activo-titulo">Filtros Aplicados:</span>
        <button 
          className="btn-limpiar-filtros-activos"
          onClick={onLimpiarFiltros}
          title="Limpiar todos los filtros"
        >
          Limpiar todos
        </button>
      </div>

      <div className="filtro-activo-contenido">
        {filtros.asesor_id && (
          <div className="filtro-activo-item">
            <span className="filtro-activo-tipo">Asesor:</span>
            <span className="filtro-activo-valor">{getNombreAsesor(filtros.asesor_id)}</span>
          </div>
        )}

        {filtros.pdv_id && (
          <div className="filtro-activo-item">
            <span className="filtro-activo-tipo">PDV:</span>
            <span className="filtro-activo-valor">{getNombrePdv(filtros.pdv_id)}</span>
          </div>
        )}

        {filtros.ciudad && (
          <div className="filtro-activo-item">
            <span className="filtro-activo-tipo">Ciudad:</span>
            <span className="filtro-activo-valor">{filtros.ciudad}</span>
          </div>
        )}
      </div> */}
    </div>
  );
}
