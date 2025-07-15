import React from 'react';

/**
 * Componente para mostrar el filtro activo en la parte superior
 * @param {Object} props
 * @param {Object} props.filtros - Filtros actuales
 * @param {Function} props.onLimpiarFiltros - Función para limpiar filtros
 * @param {boolean} props.isMobile - Indicador si es móvil
 */
export default function FiltroActivo({ filtros, onLimpiarFiltros, isMobile = false }) {
  // Verificar si hay filtros activos
  const hayFiltros = filtros.compania || filtros.asesor || filtros.pdv || filtros.ciudad;
  
  if (!hayFiltros) return null;

  // Construir el texto del filtro activo
  const getFiltroTexto = () => {
    const filtrosActivos = [];
    if (filtros.compania) {
      filtrosActivos.push(`Compañía: ${filtros.compania}`);
    }
    if (filtros.asesor) {
      filtrosActivos.push(`Asesor: ${filtros.asesor}`);
    }
    if (filtros.pdv) {
      filtrosActivos.push(`PDV: ${filtros.pdv}`);
    }
    if (filtros.ciudad) {
      filtrosActivos.push(`Ciudad: ${filtros.ciudad}`);
    }
    return filtrosActivos.join(' | ');
  };

  return (
    <div style={{
      width: '100%',
      background: 'linear-gradient(135deg, #e30613, #a1000b)',
      borderRadius: 8,
      padding: isMobile ? '8px 12px' : '10px 16px',
      margin: '8px 0 16px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(227, 6, 19, 0.2)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path 
            d="M3 6h18M9 12h12M3 18h18" 
            stroke="#fff" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span style={{
          color: '#fff',
          fontSize: isMobile ? 12 : 14,
          fontWeight: 600,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          {getFiltroTexto()}
        </span>
      </div>
      
      <button
        onClick={onLimpiarFiltros}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          color: '#fff',
          fontSize: isMobile ? 10 : 12,
          fontWeight: 600,
          padding: isMobile ? '4px 8px' : '6px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path 
            d="M18 6L6 18M6 6l12 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        Limpiar
      </button>
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
