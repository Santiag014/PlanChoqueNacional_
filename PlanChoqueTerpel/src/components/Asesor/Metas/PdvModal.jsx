import React from 'react';

/**
 * Componente para el modal de detalle de PDVs
 */
const PdvModal = ({ isOpen, onClose, pdvData }) => {
  if (!isOpen) return null;

  // Validación defensiva para evitar errores
  const pdvDataSafe = Array.isArray(pdvData) ? pdvData : [];

  return (
    <div className="pdv-modal-overlay" onClick={onClose}>
      <div className="pdv-modal-content" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="pdv-modal-close"
          aria-label="Cerrar"
        >
          ×
        </button>
        
        <div className="pdv-modal-title">
          <span style={{ fontSize: '20px', marginRight: '8px' }}>🏪</span>
          Detalles PDV
        </div>
        
        <div className="pdv-modal-body">
          {pdvDataSafe.length > 0 ? (
            <>
              {/* Información resumen */}
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
                    background: '#e30613',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    📊
                  </span>
                  <strong>Información General</strong>
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  <div><strong>Total PDVs:</strong> {pdvDataSafe.length}</div>
                  <div><strong>Meta Total:</strong> 
                    <span style={{ 
                      color: '#dc2626', 
                      fontWeight: '700',
                      marginLeft: '8px',
                      background: '#dc262620',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {pdvDataSafe.reduce((total, pdv) => total + (Number(pdv.meta) || 0), 0)}
                    </span>
                  </div>
                  <div><strong>Real Total:</strong> 
                    <span style={{ 
                      color: '#16a34a', 
                      fontWeight: '700',
                      marginLeft: '8px',
                      background: '#16a34a20',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {pdvDataSafe.reduce((total, pdv) => total + (Number(pdv.real) || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              <table className="pdv-modal-table">
            <thead>
              <tr className="pdv-modal-header-row">
                <th className="pdv-modal-th pdv-modal-th-codigo">PDV</th>
                <th className="pdv-modal-th pdv-modal-th-meta">Meta</th>
                <th className="pdv-modal-th pdv-modal-th-real">Real</th>
                <th className="pdv-modal-th pdv-modal-th-porcentaje">%</th>
              </tr>
            </thead>
            <tbody>
              {pdvDataSafe.map((pdv, i) => {
                const porcentaje = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
                const colorPorcentaje = porcentaje >= 70 ? '#10b981' : '#6b7280';
                
                return (
                  <tr 
                    key={pdv.codigo || i} 
                    className={`pdv-modal-row ${i % 2 === 0 ? 'pdv-modal-row-even' : 'pdv-modal-row-odd'}`}
                  >
                    <td className="pdv-modal-td pdv-modal-td-codigo">{pdv.codigo || 'N/A'}</td>
                    <td className="pdv-modal-td pdv-modal-td-meta">{pdv.meta || 0}</td>
                    <td className="pdv-modal-td pdv-modal-td-real">{pdv.real || 0}</td>
                    <td 
                      className="pdv-modal-td pdv-modal-td-porcentaje"
                      style={{ color: colorPorcentaje }}
                    >
                      {porcentaje.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: '#6b7280'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.3
              }}>
                🏪
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Sin datos disponibles
              </div>
              <div style={{
                fontSize: '14px',
                color: '#888',
                textAlign: 'center'
              }}>
                No hay datos de PDV para mostrar
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdvModal;
