import React from 'react';

// Componente simplificado para mostrar solo Total PDVs y Meta Violumn
const PuntosVentaTable = ({ 
  puntosVenta, 
  isMobile 
}) => {
  
  if (puntosVenta.length === 0) {
    return (
      <div className="backoffice-empty-state">
        <div className="backoffice-empty-icon">📋</div>
        <h3>No hay puntos de venta para mostrar</h3>
        <p>No se encontraron puntos de venta que coincidan con los filtros aplicados.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="puntos-venta-mobile-container">
        {puntosVenta.map((pdv, index) => (
          <div key={index} className="pdv-mobile-card">
            <div className="pdv-mobile-header">
              <div className="pdv-info">
                <h4>{pdv.nombre}</h4>
                <span className="pdv-codigo">Código: {pdv.codigo}</span>
              </div>
            </div>
            
            <div className="pdv-mobile-details">
              <div className="detail-row">
                <span className="detail-label">NIT:</span>
                <span className="detail-value">{pdv.nit || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Dirección:</span>
                <span className="detail-value">{pdv.direccion || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ciudad:</span>
                <span className="detail-value">{pdv.ciudad || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Agente Comercial:</span>
                <span className="detail-value">{pdv.descripcion || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Ordenar puntos de venta por nombre alfabéticamente
  const puntosVentaOrdenados = [...puntosVenta].sort((a, b) => 
    (a.nombre || '').localeCompare(b.nombre || '')
  );

  return (
    <div className="backoffice-registros-table-container">
      <div className="backoffice-table-wrapper">
        <table className="backoffice-registros-table">
          <colgroup>
            <col style={{ width: '10%', minWidth: '100px' }} />
            <col style={{ width: '25%', minWidth: '250px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '20%', minWidth: '200px' }} />
            <col style={{ width: '15%', minWidth: '150px' }} />
            <col style={{ width: '18%', minWidth: '180px' }} />
            <col style={{ width: '15%', minWidth: '150px' }} />
            <col style={{ width: '18%', minWidth: '180px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: '10%', minWidth: '100px' }}>Código</th>
              <th style={{ width: '25%', minWidth: '250px' }}>Nombre</th>
              <th style={{ width: '12%', minWidth: '120px' }}>NIT</th>
              <th style={{ width: '20%', minWidth: '200px' }}>Dirección</th>
              <th style={{ width: '15%', minWidth: '150px' }}>Ciudad</th>
              <th style={{ width: '18%', minWidth: '180px' }}>Agente Comercial</th>
              <th style={{ width: '15%', minWidth: '150px' }}>Asesor</th>
              <th style={{ width: '18%', minWidth: '180px' }}>CC Asesor</th>
            </tr>
          </thead>
          <tbody>
            {puntosVenta.map((pdv, index) => (
              <tr key={index} className="backoffice-tabla-fila-clickeable">
                <td style={{ width: '10%', minWidth: '100px' }}>
                  <span className="backoffice-id-cell">{pdv.codigo}</span>
                </td>
                <td style={{ width: '25%', minWidth: '250px' }}>
                  <div className="backoffice-pdv-cell">
                    <span className="backoffice-pdv-name">{pdv.descripcion}</span>
                  </div>
                </td>
                <td style={{ width: '12%', minWidth: '120px' }}>
                  <span className="backoffice-nit-cell">{pdv.nit || 'N/A'}</span>
                </td>
                <td style={{ width: '20%', minWidth: '200px' }}>
                  <span className="backoffice-direccion-cell">{pdv.direccion || 'N/A'}</span>
                </td>
                <td style={{ width: '15%', minWidth: '150px' }}>
                  <span className="backoffice-ciudad-cell">{pdv.ciudad || 'N/A'}</span>
                </td>
                <td style={{ width: '18%', minWidth: '180px' }}>
                  <div className="backoffice-agente-cell">
                    <span className="backoffice-agente-name">{pdv.agente_comercial || 'N/A'}</span>
                  </div>
                </td>
                <td style={{ width: '18%', minWidth: '180px' }}>
                  <div className="backoffice-agente-cell">
                    <span className="backoffice-agente-name">{pdv.name || 'N/A'}</span>
                  </div>
                </td>
                <td style={{ width: '18%', minWidth: '180px' }}>
                  <div className="backoffice-agente-cell">
                    <span className="backoffice-agente-name">{pdv.documento || 'N/A'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tabla simplificada - Solo Total PDVs y Meta Violumn - v2.0
export default PuntosVentaTable;
