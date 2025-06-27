import React from 'react';

/**
 * Componente para mostrar el KPI principal de puntos de venta
 */
const KpiCard = ({ title, value, isLoading, error, isMobile }) => {
  return (
    <div className="kpi-main-card">
      {/* Franja superior con clip-path */}
      <div className="kpi-card-header">
        <span className="kpi-card-title">{title || "PUNTOS DE VENTA"}</span>
      </div>
      
      {/* Espacio para la franja */}
      <div className="kpi-card-spacer" />
      
      {error ? (
        <div className="kpi-card-error">
          {error}
        </div>
      ) : isLoading ? (
        <div className="kpi-card-loading">
          Cargando KPI...
        </div>
      ) : (
        <div className="kpi-card-value">
          {value || 0}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
