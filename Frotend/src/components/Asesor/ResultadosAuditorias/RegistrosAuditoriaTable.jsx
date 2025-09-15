import React from 'react';

export default function RegistrosAuditoriaTable({ auditorias, onSeleccionarAuditoria, isMobile }) {
  console.log('🔍 RegistrosAuditoriaTable recibió:', auditorias);
  console.log('🔍 Tipo de auditorias:', typeof auditorias);
  console.log('🔍 Es array?:', Array.isArray(auditorias));
  console.log('🔍 Longitud:', auditorias?.length);
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
  const getActividadNombre = (auditoria) => {
    return auditoria.tipo_accion ? auditoria.tipo_accion.toUpperCase() : '';
  };

  const getActividadClass = (auditoria) => {
    const actividad = getActividadNombre(auditoria);
    return actividad === 'IMPLEMENTACION' ? 'actividad-implementacion' : 'actividad-visita';
  };

  if (!auditorias || !Array.isArray(auditorias) || auditorias.length === 0) {
    console.log('🔍 No hay auditorias para mostrar:', auditorias);
    return (
      <div className="no-registros">
        <div className="no-registros-icon">🔍</div>
        <h3>No se encontraron auditorias</h3>
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
              <th className="fecha-header">Fecha Auditoria</th>
              <th className="tipo-header">Tipo Auditoria</th>
            </tr>
          </thead>
          <tbody>
            {auditorias.map((auditoria, index) => {
              console.log(`🔍 Procesando auditoria ${index}:`, auditoria);
              
              return (
                <tr 
                  key={auditoria.id}
                  onClick={() => onSeleccionarAuditoria(auditoria)}
                  className="registro-row"
                  title="Clic para ver detalles de la auditoria"
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span className="codigo-highlight">
                      {auditoria.codigo || '-'}
                    </span>
                  </td>
                  <td>
                    <span className="fecha-principal">
                      {formatearFecha(auditoria.fecha_registro)}
                    </span>
                  </td>
                  <td>
                    <span className={`kpi-badge ${getActividadClass(auditoria)}`}> 
                      {getActividadNombre(auditoria)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
