import React from 'react';

const KpiModal = ({ isOpen, onClose, selectedKpi, kpiPdvData, isLoading, isMobile }) => {
  if (!isOpen) return null;

  // Función para obtener el icono del KPI
  const getKpiIcon = (kpi) => {
    switch (kpi?.name?.toLowerCase()) {
      case 'volumen': return '📊';
      case 'precio': return '💰';
      case 'frecuencia': return '⚡';
      case 'cobertura': return '🎯';
      case 'profundidad': return '📈';
      default: return '📋';
    }
  };

  return (
    <div className="pdv-modal-overlay" onClick={onClose}>
      <div 
        className="pdv-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <button 
          className="pdv-modal-close"
          onClick={onClose}
        >
          ×
        </button>
        
        <div className="pdv-modal-title">
          <span style={{ fontSize: '20px', marginRight: '8px' }}>
            {getKpiIcon(selectedKpi)}
          </span>
          KPI: {selectedKpi?.label}
        </div>

        <div className="pdv-modal-body">
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? 40 : 60,
              color: '#666'
            }}>
              <div style={{
                fontSize: isMobile ? 48 : 64,
                marginBottom: 16,
                opacity: 0.3
              }}>
                ⏳
              </div>
              <div style={{
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Cargando datos del KPI...
              </div>
            </div>
          ) : kpiPdvData.length > 0 ? (
            <div>
              {/* Información del KPI */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px',
                  color: '#374151'
                }}>
                  <span style={{ 
                    fontSize: '16px', 
                    marginRight: '8px',
                    background: selectedKpi?.color || '#e30613',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    📊
                  </span>
                  <strong>Información del KPI</strong>
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  <div><strong>KPI:</strong> {selectedKpi?.label}</div>
                  <div><strong>Total PDVs:</strong> {kpiPdvData.length}</div>
                  <div><strong>Puntos Totales:</strong> 
                    <span style={{ 
                      color: selectedKpi?.color || '#e30613', 
                      fontWeight: '700',
                      marginLeft: '8px',
                      background: `${selectedKpi?.color || '#e30613'}20`,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {kpiPdvData.reduce((total, pdv) => total + (Number(pdv.puntos_totales) || 0), 0)} puntos
                    </span>
                  </div>
                </div>
              </div>

              <table className="pdv-modal-table">
              <thead>
                <tr className="pdv-modal-header-row">
                  <th className="pdv-modal-th pdv-modal-th-codigo">Código</th>
                  <th className="pdv-modal-th">Segmento</th>
                  <th className="pdv-modal-th pdv-modal-th-real">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {kpiPdvData.map((pdv, i) => (
                  <tr 
                    key={pdv.codigo} 
                    className={i % 2 === 0 ? 'pdv-modal-row-even' : 'pdv-modal-row-odd'}
                  >
                    <td className="pdv-modal-td pdv-modal-td-codigo">
                      {pdv.codigo}
                    </td>
                    <td className="pdv-modal-td">
                      {pdv.segmento || 'N/A'}
                    </td>
                    <td className="pdv-modal-td pdv-modal-td-real">
                      {pdv.puntos_totales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{
              marginTop: 16,
              padding: isMobile ? '12px 16px' : '16px 20px',
              background: '#f8f9fa',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? 12 : 14,
                color: '#666',
                fontWeight: 600
              }}>
                📈 Promedio: <span style={{ color: selectedKpi?.color, fontWeight: 700 }}>
                  {kpiPdvData.length > 0 ? 
                    (kpiPdvData.reduce((total, pdv) => total + (Number(pdv.puntos_totales) || 0), 0) / kpiPdvData.length).toFixed(1)
                    : 0
                  } puntos por PDV
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 40 : 60,
            color: '#666'
          }}>
            <div style={{
              fontSize: isMobile ? 48 : 64,
              marginBottom: 16,
              opacity: 0.3
            }}>
              📊
            </div>
            <div style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 600,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Sin datos disponibles
            </div>
            <div style={{
              fontSize: isMobile ? 12 : 14,
              color: '#888',
              textAlign: 'center'
            }}>
              No hay puntos registrados para este KPI
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default KpiModal;
