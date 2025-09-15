import React from 'react';
import '../../../styles/Asesor/asesor-tabla-responsive-extension.css';

export default function RegistrosTable({ registros, onVerDetalles, isMobile }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    
    try {
      const fechaObj = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        return '-';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '-';
    }
  };


  // const getKpiClass = (kpi) => {
  //   switch (kpi?.toUpperCase()) {
  //     case 'VOLUMEN': return 'kpi-volumen';
  //     case 'PRECIO': return 'kpi-precio';
  //     case 'PRECIO_VOLUMEN': return 'kpi-precio-volumen';
  //     case 'FRECUENCIA': return 'kpi-frecuencia';
  //     case 'COBERTURA': return 'kpi-cobertura';
  //     case 'PROFUNDIDAD': return 'kpi-profundidad';
  //     default: return 'kpi-volumen';
  //   }
  // };

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
    <div className="registros-table-container-responsive">
      <div className="table-wrapper-responsive">
        <div className="table-scroll-container">
          <table className="registros-table-responsive">
            <thead className="table-header-fixed">
              <tr>
                <th className="codigo-header-responsive">Código</th>
                <th className="fecha-header-responsive">Fecha</th>
                <th className="fecha-header-responsive">Fecha Creación</th>
                <th 
                className="actividad-header-responsive">Actividad</th>
                <th className="estado-header-responsive">Estado AC</th>
                <th className="estado-header-responsive">Estado Backoffice</th>
                <th className="pdv-header-responsive">PDV</th>
              </tr>
            </thead>
            <tbody className="table-body-scrollable">
              {registros.map((registro, index) => (
                <tr 
                  key={registro.id}
                  onClick={() => onVerDetalles(registro)}
                  className="registro-row-responsive"
                  title="Clic para ver detalles"
                >
                  <td className="codigo-cell-responsive">
                    <span className="codigo-highlight-responsive">
                      {registro.codigo || '-'}
                    </span>
                  </td>
                  <td className="fecha-cell-responsive">
                    <span className="fecha-principal-responsive">
                      {registro.fecha_registro}
                    </span>
                  </td>
                    <td className="fecha-cell-responsive">
                    <span className="fecha-principal-responsive">
                      {registro.created_at}
                    </span>
                  </td>
                  <td className="actividad-cell-responsive">
                    <span className={`actividad-badge-responsive ${getActividadClass(registro)}`}> 
                      {getActividadNombre(registro)}
                    </span>
                  </td>
                  <td className="estado-cell-responsive">
                    <span className="estado-badge-responsive">
                      {registro.estado_agente || 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="estado-cell-responsive">
                    <span className="estado-badge-responsive">
                      {registro.estado_backoffice || 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="pdv-cell-responsive">
                    <div className="pdv-info-responsive">
                      <span className="pdv-nombre-responsive">{registro.descripcion || '-'}</span>
                      <span className="pdv-direccion-responsive">{registro.direccion || '-'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}