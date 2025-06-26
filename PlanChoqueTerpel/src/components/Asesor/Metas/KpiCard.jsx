import React from 'react';

/**
 * Componente para mostrar el KPI principal de puntos de venta
 */
const KpiCard = ({ kpiDashboard, kpiDashboardError, isMobile }) => {
  return (
    <div className="kpi-main-card">
      {/* Franja roja superior con clip-path */}
      <div className="kpi-card-header">
        <span className="kpi-card-title">PUNTOS DE VENTA</span>
      </div>
      
      {/* Espacio para la franja */}
      <div className="kpi-card-spacer" />
      
      {kpiDashboardError ? (
        <div className="kpi-card-error">
          {kpiDashboardError}
        </div>
      ) : kpiDashboard ? (
        <div className="kpi-card-value">
          {kpiDashboard.totalPDVs}
        </div>
      ) : (
        <div className="kpi-card-loading">
          Cargando KPI...
        </div>
      )}
    </div>
  );
};

export default KpiCard;
