import React from 'react';

export default function RegistrosTable({ registros, onVerDetalles, isMobile }) {
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getKpiClass = (kpi) => {
    switch (kpi?.toUpperCase()) {
      case 'VOLUMEN': return 'kpi-volumen';
      case 'PRECIO': return 'kpi-precio';
      case 'FRECUENCIA': return 'kpi-frecuencia';
      case 'COBERTURA': return 'kpi-cobertura';
      case 'PROFUNDIDAD': return 'kpi-profundidad';
      default: return 'kpi-volumen';
    }
  };

  const getKpiNombreCompleto = (kpi) => {
    switch (kpi?.toUpperCase()) {
      case 'VOLUMEN': return 'Volumen';
      case 'PRECIO': return 'Precio';
      case 'FRECUENCIA': return 'Frecuencia';
      case 'COBERTURA': return 'Cobertura';
      case 'PROFUNDIDAD': return 'Profundidad';
      default: return kpi || 'N/A';
    }
  };

  if (registros.length === 0) {
    return (
      <div className="no-registros">
        <div className="no-registros-icon">📋</div>
        <h3>No se encontraron registros</h3>
        <p>Prueba ajustando los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="registros-table-container">
      <div className="table-wrapper">
        <table className="registros-table">
          <thead>
            <tr>
              <th className="codigo-header">Código PDV</th>
              <th className="fecha-header">Fecha</th>
              <th className="kpi-header">KPI</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro, index) => (
              <tr 
                key={registro.id}
                onClick={() => onVerDetalles(registro)}
                className="registro-row"
                title="Clic para ver detalles"
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <span className="codigo-highlight">
                    {registro.codigo_pdv}
                  </span>
                </td>
                <td>
                  <span className="fecha-principal">
                    {formatearFecha(registro.fecha_registro)}
                  </span>
                </td>
                <td>
                  <span className={`kpi-badge ${getKpiClass(registro.tipo_kpi)}`}>
                    {getKpiNombreCompleto(registro.tipo_kpi)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
