import React from 'react';

/**
 * Componente para la gráfica de barras de metas vs real
 */
const MetasChart = ({ pdvMetas, pdvMetasError, isMobile, onOpenModal }) => {
  const barMaxHeight = isMobile ? 80 : 160;
  const maxMeta = Math.max(...pdvMetas.map(p => p.meta), 1);

  if (pdvMetasError) {
    return (
      <div className="metas-chart-container">
        <div className="metas-chart-header">
          <span className="metas-chart-title">REGISTROS PDVs</span>
        </div>
        <div className="metas-chart-spacer" />
        <div className="metas-chart-error">
          {pdvMetasError}
        </div>
      </div>
    );
  }

  if (pdvMetas.length === 0) {
    return (
      <div className="metas-chart-container">
        <div className="metas-chart-header">
          <span className="metas-chart-title">REGISTROS PDVs</span>
        </div>
        <div className="metas-chart-spacer" />
        <div className="metas-chart-loading">
          Cargando gráfica de metas...
        </div>
      </div>
    );
  }

  return (
    <div className="metas-chart-container">
      {/* Franja roja superior */}
      <div className="metas-chart-header">
        <span className="metas-chart-title">REGISTROS PDVs</span>
      </div>
      
      <div className="metas-chart-spacer" />
      
      {/* Leyenda superior para colores */}
      <div className="metas-chart-legend">
        <div className="legend-item">
          <span className="legend-color legend-meta" />
          <span className="legend-text">Meta</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-real" />
          <span className="legend-text legend-real-text">Real</span>
        </div>
      </div>
      
      <div
        className="metas-chart-svg-container"
        onClick={onOpenModal}
        title="Ver tabla de todos los PDV"
      >
        <svg
          width={Math.max(220, pdvMetas.length * 60)}
          height={barMaxHeight + 40}
          className="metas-chart-svg"
        >
          {/* Ejes */}
          <line x1="40" y1={20} x2="40" y2={barMaxHeight + 20} stroke="#b0b0b0" />
          <line x1="40" y1={barMaxHeight + 20} x2={Math.max(200, pdvMetas.length * 60)} y2={barMaxHeight + 20} stroke="#b0b0b0" />
          
          {/* Barras */}
          {pdvMetas.map((pdv, i) => {
            const metaH = pdv.meta > 0 ? Math.round((pdv.meta / maxMeta) * barMaxHeight) : 0;
            const realH = pdv.real > 0 ? Math.round((pdv.real / maxMeta) * barMaxHeight) : 0;
            
            return (
              <g key={pdv.codigo}>
                {/* Meta */}
                <rect
                  x={50 + i * 50}
                  y={barMaxHeight + 20 - metaH}
                  width={18}
                  height={metaH}
                  fill="#b0b0b0"
                  rx={3}
                />
                {/* Real */}
                <rect
                  x={50 + i * 50 + 20}
                  y={barMaxHeight + 20 - realH}
                  width={18}
                  height={realH}
                  fill="#e30613"
                  rx={3}
                />
                {/* Etiqueta */}
                <text
                  x={50 + i * 50 + 9}
                  y={barMaxHeight + 35}
                  textAnchor="middle"
                  fontSize={isMobile ? "10" : "13"}
                  fill="#a1000b"
                  fontWeight="bold"
                >
                  {pdv.codigo}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="metas-chart-hint">
        Haz clic en la gráfica para ver la tabla completa de PDV
      </div>
    </div>
  );
};

export default MetasChart;
