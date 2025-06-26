import React from 'react';

export default function RegistrosTable({ registros, onVerDetalles, isMobile }) {
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (registros.length === 0) {
    return (
      <div className="no-registros">
        <p>No se encontraron registros con los filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className="registros-table-container">
      <div className="table-header">
        <div className="header-cell codigo">Código PDV</div>
        <div className="header-cell agente">Agente Comercial</div>
        <div className="header-cell fecha">Fecha</div>
        <div className="header-cell tipo">Tipo KPI</div>
        <div className="header-cell acciones">Acciones</div>
      </div>

      <div className="table-body">
        {registros.map((registro) => (
          <div key={registro.id} className="table-row">
            <div className="table-cell codigo">
              <span className="codigo-highlight">{registro.codigo_pdv}</span>
            </div>
            <div className="table-cell agente">
              {registro.nombre_agente || 'N/A'}
            </div>
            <div className="table-cell fecha">
              {formatearFecha(registro.fecha_registro)}
            </div>
            <div className="table-cell tipo">
              <span 
                className={`kpi-badge ${registro.tipo_kpi?.toLowerCase()}`}
              >
                {registro.tipo_kpi || 'N/A'}
              </span>
            </div>
            <div className="table-cell acciones">
              <button
                className="detalles-btn"
                onClick={() => onVerDetalles(registro)}
              >
                Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
