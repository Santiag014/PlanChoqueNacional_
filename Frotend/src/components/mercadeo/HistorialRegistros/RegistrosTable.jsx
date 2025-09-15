import React from 'react';

export default function RegistrosTable({ 
  registros, 
  onVerDetalle, 
  onAprobar, 
  onRechazar, 
  isMobile 
}) {
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      // Si la fecha viene como string de solo fecha (YYYY-MM-DD), la parseamos directamente
      let fechaObj;
      if (typeof fecha === 'string' && fecha.includes('T')) {
        // Es un datetime completo, extraemos solo la parte de la fecha
        fechaObj = new Date(fecha.split('T')[0] + 'T12:00:00.000Z');
      } else if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Es solo fecha en formato YYYY-MM-DD
        fechaObj = new Date(fecha + 'T12:00:00.000Z');
      } else {
        // Otro formato, intentamos parsearlo directamente
        fechaObj = new Date(fecha);
      }
      
      // Verificamos que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida recibida:', fecha);
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Valor recibido:', fecha);
      return 'Fecha inválida';
    }
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      // Para fechas con hora, esperamos un datetime completo
      const fechaObj = new Date(fecha);
      
      // Verificamos que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha y hora inválida recibida:', fecha);
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Bogota' // Ajusta según tu zona horaria
      });
    } catch (error) {
      console.error('Error formateando fecha y hora:', error, 'Valor recibido:', fecha);
      return 'Fecha inválida';
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return 'estado-pendiente';
    
    const estadoLower = estado.toLowerCase().trim();
    
    if (estadoLower.includes('aprobado') || estadoLower.includes('approved') || estadoLower.includes('validado')) {
      return 'estado-aprobado';
    } else if (estadoLower.includes('rechazado') || estadoLower.includes('rejected')) {
      return 'estado-rechazado';
    } else if (estadoLower.includes('revisión') || estadoLower.includes('revision')) {
      return 'estado-revision';
    } else if (estadoLower.includes('pendiente') || estadoLower.includes('pending')) {
      return 'estado-pendiente';
    } else {
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
            <col style={{ width: '8%', minWidth: '80px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '160px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '14%', minWidth: '140px' }} />
            <col style={{ width: '18%', minWidth: '180px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: '8%', minWidth: '80px' }}>ID</th>
              <th style={{ width: '12%', minWidth: '120px' }}>Estado BackOffice</th>
              <th style={{ width: '12%', minWidth: '120px' }}>Estado Agente</th>
              <th style={{ width: '12%', minWidth: '160px' }}>Actividad</th>
              <th style={{ width: '12%', minWidth: '120px' }}>Fecha Factura</th>
              <th style={{ width: '12%', minWidth: '120px' }}>Fecha Creación</th>
              <th style={{ width: '14%', minWidth: '140px' }}>Asesor</th>
              <th style={{ width: '18%', minWidth: '180px' }}>Punto de Venta</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => {
              // Debug para ver la estructura de cada registro
              //console.log("Estructura del registro:", JSON.stringify(registro));
              
              // Ajustando basado en la imagen compartida
              const nombreAsesor = registro.nombre_asesor || registro.asesor_nombre || registro.name;
              const cedulaAsesor = registro.id_asesor || registro.asesor_cedula || registro.cedula;
              
              const nombrePdv = registro.nombre_pdv || registro.pdv_nombre || registro.descripcion;
              const codigoPdv = registro.id_pdv || registro.pdv_codigo || registro.codigo;
              
              const direccion = registro.direccion || registro.pdv_direccion;
              const fecha = registro.fecha || registro.fecha_registro;
              const fechaCreacion = registro.created_at;
              const actividad = registro.actividad || registro.tipo_accion;
              
              return (
                <tr key={registro.id} 
                    onClick={() => onVerDetalle(registro)} 
                    className="tabla-fila-clickeable">
                  <td style={{ width: '8%', minWidth: '80px' }}>
                    <div className="id-cell">
                      {registro.id}
                    </div>
                  </td>
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className={`mercadeo_estado-badge ${getEstadoClass(registro.estado_backoffice)}`}>
                      {registro.estado_backoffice || 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className={`mercadeo_estado-badge ${getEstadoClass(registro.estado_agente)}`}>
                      {registro.estado_agente || 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{ width: '12%', minWidth: '160px' }}>
                    <span className="actividad-cell">{actividad}</span>
                  </td>
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className="fecha-cell">{formatearFecha(fecha)}</span>
                  </td>
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className="fecha-creacion-cell">{formatearFechaHora(fechaCreacion)}</span>
                  </td>
                  <td style={{ width: '14%', minWidth: '140px' }}>
                    <div className="asesor-cell">
                      <span className="asesor-name">{nombreAsesor}</span>
                      <span className="asesor-documento">{cedulaAsesor}</span>
                    </div>
                  </td>
                  <td style={{ width: '18%', minWidth: '180px' }}>
                    <div className="pdv-cell">
                      <span className="pdv-name">{nombrePdv}</span>
                      <span className="pdv-codigo">{codigoPdv}</span>
                    </div>
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
