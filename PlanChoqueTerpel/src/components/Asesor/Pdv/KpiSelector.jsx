import React from 'react';

/**
 * Componente para seleccionar KPI
 */
const KpiSelector = ({ kpis, kpiSeleccionado, puedeSeleccionarKPI, handleSeleccionarKPI }) => {
  return (
    <div className="kpi-section">
      <div className="kpi-label">KPI A REGISTRAR</div>
      <div className="kpi-options">
        {kpis.map(kpi => {
          const puedeSeleccionar = puedeSeleccionarKPI();
          return (
            <button
              key={kpi}
              className={`kpi-btn${kpiSeleccionado === kpi ? ' active' : ''}${!puedeSeleccionar ? ' disabled' : ''}`}
              onClick={() => handleSeleccionarKPI(kpi, puedeSeleccionarKPI)}
              type="button"
              disabled={!puedeSeleccionar}
              title={!puedeSeleccionar ? 'Primero debe ingresar un código de PDV válido' : ''}
            >
              {kpi}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KpiSelector;
