import React from 'react';

/**
 * Componente para mostrar las tarjetas de KPIs con diseño mejorado
 */
const KpisContainer = ({ kpiData, onOpenModal, isMobile }) => {
  return (
    <div className="kpis-container">
      {/* Franja roja superior */}
      <div className="kpis-header">
        <span className="kpis-title">KPI's</span>
      </div>
      
      {/* Espacio para la franja */}
      <div className="kpis-spacer" />

      {/* Grid de KPIs */}
      <div className="kpis-grid">
        {kpiData.map((kpi) => (
          <div 
            key={kpi.id}
            className={`kpi-card kpi-${kpi.name}`}
            onClick={() => onOpenModal(kpi)}
            title={`Ver detalles de ${kpi.label} - ${kpi.puntos} puntos`}
          >
            <div className="kpi-points">{kpi.puntos}</div>
            <div className="kpi-points-label">pts</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpisContainer;
