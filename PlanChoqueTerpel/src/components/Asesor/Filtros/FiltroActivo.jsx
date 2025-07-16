import React from 'react';

/**
 * Componente para mostrar el filtro activo en la parte superior
 * @param {Object} props
 * @param {Object} props.filtros - Filtros actuales
 * @param {Function} props.onLimpiarFiltros - Función para limpiar filtros
 * @param {boolean} props.isMobile - Indicador si es móvil
 * @param {Function} props.onDownloadAllKPIs - Función para descargar todos los KPIs
 * @param {Function} props.onDownloadHistorial - Función para descargar historial
 * @param {boolean} props.loadingDownload - Indicador de carga de descarga
 */
export default function FiltroActivo({ 
  filtros, 
  onLimpiarFiltros, 
  isMobile = false, 
  onDownloadAllKPIs, 
  onDownloadHistorial, 
  loadingDownload = false 
}) {
  // Verificar si hay filtros activos
  const hayFiltros = filtros.compania || filtros.asesor || filtros.pdv || filtros.ciudad;

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
    <>
      {/* Filtro Activo - Solo se muestra si hay filtros */}
      {hayFiltros && (
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
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0
          }}>
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
                gap: 4
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
          </div>
        </div>
      )}
      
      {/* Botones de Descarga - Siempre visibles */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        borderRadius: 8,
        padding: isMobile ? '12px' : '16px',
        marginBottom: '16px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        overflowX: 'auto',
        minHeight: 'fit-content'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          minWidth: 'fit-content'
        }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <span style={{
            fontSize: isMobile ? 14 : 16,
            fontWeight: 600,
            color: '#495057',
            whiteSpace: 'nowrap'
          }}>
            Descargar Reportes
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: 10,
          flexShrink: 0,
          minWidth: 'fit-content',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onDownloadAllKPIs}
            disabled={loadingDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: isMobile ? '8px 12px' : '10px 16px',
              background: loadingDownload ? 'linear-gradient(135deg, #cccccc, #999999)' : 'linear-gradient(135deg, #00a651, #008a44)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loadingDownload ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              minWidth: isMobile ? 110 : 130,
              justifyContent: 'center',
              boxShadow: loadingDownload ? 'none' : '0 2px 4px rgba(0, 166, 81, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loadingDownload) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 166, 81, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingDownload) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 166, 81, 0.2)';
              }
            }}
          >
            {loadingDownload ? (
              <div style={{
                width: 12,
                height: 12,
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <span style={{ fontSize: 14 }}>📊</span>
            )}
            Todos los KPIs
          </button>
          
          <button
            onClick={onDownloadHistorial}
            disabled={loadingDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: isMobile ? '8px 12px' : '10px 16px',
              background: loadingDownload ? 'linear-gradient(135deg, #cccccc, #999999)' : 'linear-gradient(135deg, #f39c12, #e67e22)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loadingDownload ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              minWidth: isMobile ? 110 : 130,
              justifyContent: 'center',
              boxShadow: loadingDownload ? 'none' : '0 2px 4px rgba(243, 156, 18, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loadingDownload) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(243, 156, 18, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingDownload) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(243, 156, 18, 0.2)';
              }
            }}
          >
            {loadingDownload ? (
              <div style={{
                width: 12,
                height: 12,
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <span style={{ fontSize: 14 }}>📋</span>
            )}
            Historial Visitas
          </button>
        </div>
      </div>
      
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
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Estilos para el scroll horizontal */
        div::-webkit-scrollbar {
          height: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #e30613, #a1000b);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #a1000b, #e30613);
        }
        
        /* Para Firefox */
        div {
          scrollbar-width: thin;
          scrollbar-color: #e30613 rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
}
