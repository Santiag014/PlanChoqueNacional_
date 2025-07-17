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
      case 'PRECIO_VOLUMEN': return 'kpi-precio-volumen';
      case 'FRECUENCIA': return 'kpi-frecuencia';
      case 'COBERTURA': return 'kpi-cobertura';
      case 'PROFUNDIDAD': return 'kpi-profundidad';
      default: return 'kpi-volumen';
    }
  };

  // Ahora la actividad se toma directamente de tipo_accion
  const getActividadNombre = (registro) => {
    return registro.tipo_accion ? registro.tipo_accion.toUpperCase() : '';
  };

  const getActividadClass = (registro) => {
    const actividad = getActividadNombre(registro);
    return actividad === 'IMPLEMENTACION' ? 'actividad-implementacion' : 'actividad-visita';
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
              <th className="codigo-header">Código</th>
              <th className="fecha-header">Fecha</th>
              <th className="kpi-header">Actividad</th>
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
                    {registro.codigo || '-'}
                  </span>
                </td>
                <td>
                  <span className="fecha-principal">
                    {formatearFecha(registro.fecha_registro)}
                  </span>
                </td>
                <td>
                  <span className={`kpi-badge ${getActividadClass(registro)}`}> 
                    {getActividadNombre(registro)}
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