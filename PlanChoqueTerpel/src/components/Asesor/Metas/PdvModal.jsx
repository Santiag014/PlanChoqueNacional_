import React from 'react';

/**
 * Componente para el modal de detalle de PDVs
 */
const PdvModal = ({ isOpen, onClose, pdvMetas }) => {
  if (!isOpen) return null;

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
            {pdvMetas.map((pdv, i) => {
              const porcentaje = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
              const colorPorcentaje = porcentaje >= 70 ? '#1bb934' : '#e30613';
              
              return (
                <tr 
                  key={pdv.codigo} 
                  className={`pdv-modal-row ${i % 2 === 0 ? 'pdv-modal-row-even' : 'pdv-modal-row-odd'}`}
                >
                  <td className="pdv-modal-td pdv-modal-td-codigo">{pdv.codigo}</td>
                  <td className="pdv-modal-td pdv-modal-td-meta">{pdv.meta}</td>
                  <td className="pdv-modal-td pdv-modal-td-real">{pdv.real}</td>
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
      </div>
    </div>
  );
};

export default PdvModal;
