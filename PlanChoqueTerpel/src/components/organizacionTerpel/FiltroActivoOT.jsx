import React from 'react';
import '../../styles/Asesor/asesor-filtro-activo.css';

const FiltroActivoOT = ({ 
  filtros, 
  onLimpiarFiltros, 
  isMobile = false, 
  onDownloadAllKPIs, 
  onDownloadHistorial, 
  loadingDownload = false 
}) => {
  const hayFiltrosActivos = Object.values(filtros).some(valor => valor);

  if (!hayFiltrosActivos) return null;

  const getFiltroTexto = (campo, valor) => {
    switch (campo) {
      case 'asesor':
        return `Asesor: ${valor}`;
      case 'pdv':
        return `PDV: ${valor}`;
      case 'compania':
        return `Compañía: ${valor}`;
      case 'agente':
        return `Agente: ${valor}`;
      default:
        return '';
    }
  };

  const filtrosActivos = Object.entries(filtros)
    .filter(([_, valor]) => valor)
    .map(([campo, valor]) => ({
      campo,
      valor,
      texto: getFiltroTexto(campo, valor)
    }));

  return (
    <div className={`filtro-activo-container ${isMobile ? 'mobile' : ''}`}>
      <div className="filtro-activo-content">
        <div className="filtro-activo-header">
          <span className="filtro-activo-icon">🔍</span>
          <span className="filtro-activo-label">Filtros aplicados:</span>
        </div>
        
        <div className="filtro-activo-badges">
          {filtrosActivos.map(({ campo, texto }) => (
            <span key={campo} className="filtro-activo-badge">
              {texto}
            </span>
          ))}
        </div>

        <button 
          className="filtro-activo-limpiar"
          onClick={onLimpiarFiltros}
          title="Limpiar todos los filtros"
        >
          <span className="filtro-activo-limpiar-icon">×</span>
          <span className="filtro-activo-limpiar-text">Limpiar filtros</span>
        </button>
      </div>
    </div>
  );
};

export default FiltroActivoOT;
