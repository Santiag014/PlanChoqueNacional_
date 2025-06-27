import React from 'react';

/**
 * Componente para mostrar las tarjetas de KPIs con diseño mejorado
 */
const KpisContainer = ({ kpiData, onOpenModal, isMobile }) => {
  // Validación defensiva para evitar errores de .map()
  const kpiDataSafe = Array.isArray(kpiData) ? kpiData : [];

  return (
    <div className="kpis-container">
      {/* Franja menos llamativa */}
      <div className="kpis-header">
        <span className="kpis-title">KPI's</span>
      </div>
      
      {/* Espacio para la franja */}
      <div className="kpis-spacer" />

      {/* Grid de KPIs */}
      <div className="kpis-grid">
        {kpiDataSafe.length > 0 ? (
          kpiDataSafe.map((kpi) => (
            <div 
              key={kpi.id}
              className={`kpi-card kpi-${kpi.name}`}
              onClick={() => onOpenModal(kpi)}
              title={`Ver detalles de ${kpi.label} - ${kpi.puntos} puntos`}
            >
              <div className="kpi-points">{kpi.puntos || 0}</div>
              <div className="kpi-points-label">pts</div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          ))
        ) : (
          <div className="kpi-no-data">
            <p>No hay datos de KPIs disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpisContainer;
