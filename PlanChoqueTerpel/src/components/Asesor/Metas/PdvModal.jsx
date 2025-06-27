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
        
        <h3 className="pdv-modal-title">Detalle de todos los PDV</h3>
        
        {pdvDataSafe.length > 0 ? (
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
        ) : (
          <div className="pdv-modal-no-data">
            <p>No hay datos de PDV disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdvModal;
