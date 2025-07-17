import React from 'react';

export default function RegistrosTable({ 
  registros, 
  onVerDetalle, 
  onAprobar, 
  onRechazar, 
  isMobile 
}) {
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'aprobado':
      case 'approved':
        return 'estado-aprobado';
      case 'rechazado':
      case 'rejected':
        return 'estado-rechazado';
      case 'pendiente':
      case 'pending':
      default:
        return 'estado-pendiente';
    }
  };

  if (registros.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No hay registros</h3>
        <p>No se encontraron registros con los filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className="mercadeo_registros-table-container">
      <div className="table-wrapper">
        <table className="mercadeo_registros-table">
          <colgroup>
            <col style={{ width: '15%', minWidth: '180px' }} />
            <col style={{ width: '18%', minWidth: '200px' }} />
            <col style={{ width: '25%', minWidth: '250px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '140px' }} />
            <col style={{ width: '13%', minWidth: '160px' }} />
            <col style={{ width: '10%', minWidth: '130px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: '15%', minWidth: '180px' }}>Asesor</th>
              <th style={{ width: '18%', minWidth: '200px' }}>Punto de Venta</th>
              <th style={{ width: '25%', minWidth: '250px' }}>Dirección</th>
              <th style={{ width: '12%', minWidth: '120px' }}>Fecha</th>
              <th style={{ width: '12%', minWidth: '140px' }}>Actividad</th>
              <th style={{ width: '13%', minWidth: '160px' }}>KPI</th>
              <th style={{ width: '10%', minWidth: '130px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => {
              // Debug para ver la estructura de cada registro
              console.log("Estructura del registro:", JSON.stringify(registro));
              
              // Ajustando basado en la imagen compartida
              const nombreAsesor = registro.nombre_asesor || registro.asesor_nombre || registro.name;
              const cedulaAsesor = registro.id_asesor || registro.asesor_cedula || registro.cedula;
              
              const nombrePdv = registro.nombre_pdv || registro.pdv_nombre || registro.descripcion;
              const codigoPdv = registro.id_pdv || registro.pdv_codigo || registro.codigo;
              
              const direccion = registro.direccion || registro.pdv_direccion;
              const fecha = formatearFecha(registro.fecha || registro.fecha_registro);
              const actividad = registro.actividad || registro.tipo_accion;
              
              return (
                <tr key={registro.id} 
                    onClick={() => onVerDetalle(registro)} 
                    className="tabla-fila-clickeable">
                  <td style={{ width: '15%', minWidth: '180px' }}>
                    <div className="asesor-cell">
                      <span className="asesor-name">{nombreAsesor}</span>
                      <span className="asesor-documento">{cedulaAsesor}</span>
                    </div>
                  </td>
                  <td style={{ width: '18%', minWidth: '200px' }}>
                    <div className="pdv-cell">
                      <span className="pdv-name">{nombrePdv}</span>
                      <span className="pdv-codigo">{codigoPdv}</span>
                    </div>
                  </td>
                  <td style={{ width: '25%', minWidth: '250px' }}>
                    <div className="direccion-cell">
                      <span className="direccion-text">{direccion}</span>
                    </div>
                  </td>
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className="fecha-cell">{fecha}</span>
                  </td>
                  <td style={{ width: '12%', minWidth: '140px' }}>
                    <span className="actividad-cell">{actividad}</span>
                  </td>
                  <td style={{ width: '13%', minWidth: '160px' }}>
                    <div className="mercadeo_kpi-cell">
                      {(() => {
                        const kpi = (registro.kpi || registro.tipo_kpi || '').toLowerCase();
                        if (kpi === 'volumen / precio' || kpi === 'precio_volumen') {
                          return (
                            <div className="mercadeo_kpi-badges">
                              <span className="mercadeo_kpi-badge mercadeo_kpi-precio">PRECIO</span>
                              <span className="mercadeo_kpi-badge mercadeo_kpi-volumen">VOLUMEN</span>
                            </div>
                          );
                        } else if (kpi === 'precio') {
                          return <span className="mercadeo_kpi-badge mercadeo_kpi-precio">PRECIO</span>;
                        } else if (kpi === 'volumen') {
                          return <span className="mercadeo_kpi-badge mercadeo_kpi-volumen">VOLUMEN</span>;
                        } else if (kpi === 'frecuencia') {
                          return <span className="mercadeo_kpi-badge mercadeo_kpi-frecuencia">FRECUENCIA</span>;
                        } else if (kpi) {
                          return <span className="mercadeo_kpi-badge">{kpi.toUpperCase()}</span>;
                        } else {
                          return <span className="mercadeo_kpi-badge">N/A</span>;
                        }
                      })()}
                    </div>
                  </td>
                  <td style={{ width: '10%', minWidth: '130px' }}>
                    <span className={`mercadeo_estado-badge ${getEstadoClass(registro.estado)}`}>
                      {registro.estado || 'PENDIENTE'}
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
