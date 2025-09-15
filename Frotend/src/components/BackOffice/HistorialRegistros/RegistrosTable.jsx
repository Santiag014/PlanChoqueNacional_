import React, { memo } from 'react';

// OPTIMIZACIÓN: Componente memoizado para evitar re-renders innecesarios
const BackOfficeRegistrosTable = memo(({ 
  registros, 
  onVerDetalle, 
  onAprobar, 
  onRechazar, 
  isMobile 
}) => {
  // OPTIMIZACIÓN: Función para formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      // Parsear la fecha de manera consistente
      let fechaObj;
      
      // Si la fecha tiene formato ISO (con T), extraer solo la parte de fecha
      if (typeof fecha === 'string' && fecha.includes('T')) {
        const fechaSolo = fecha.split('T')[0];
        fechaObj = new Date(fechaSolo + 'T12:00:00.000Z'); // Forzar mediodia UTC para evitar problemas timezone
      } else if (typeof fecha === 'string' && fecha.includes(' ')) {
        const fechaSolo = fecha.split(' ')[0];
        fechaObj = new Date(fechaSolo + 'T12:00:00.000Z'); // Forzar mediodia UTC para evitar problemas timezone
      } else {
        fechaObj = new Date(fecha);
      }
      
      if (isNaN(fechaObj.getTime())) return 'N/A';
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Bogota' // Forzar timezone de Colombia
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'N/A';
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return 'backoffice-estado-pendiente';
    
    const estadoLower = estado.toLowerCase().trim();
    
    if (estadoLower.includes('aprobado') || estadoLower.includes('approved') || estadoLower.includes('validado')) {
      return 'backoffice-estado-aprobado';
    } else if (estadoLower.includes('rechazado') || estadoLower.includes('rejected')) {
      return 'backoffice-estado-rechazado';
    } else if (estadoLower.includes('revisión') || estadoLower.includes('revision')) {
      return 'backoffice-estado-revision';
    } else if (estadoLower.includes('pendiente') || estadoLower.includes('pending')) {
      return 'backoffice-estado-pendiente';
    } else {
      return 'backoffice-estado-pendiente';
    }
  };

  if (registros.length === 0) {
    return (
      <div className="backoffice-empty-state">
        <div className="backoffice-empty-icon">📋</div>
        <h3>No hay registros</h3>
        <p>No se encontraron registros con los filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className="backoffice-registros-table-container">
      <div className="backoffice-table-wrapper">
        <table className="backoffice-registros-table">
          <colgroup>
            <col style={{ width: '8%', minWidth: '80px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '160px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '14%', minWidth: '140px' }} />
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
              <th style={{ width: '14%', minWidth: '140px' }}>Agente</th>
              <th style={{ width: '14%', minWidth: '140px' }}>Asesor</th>
              <th style={{ width: '18%', minWidth: '180px' }}>Punto de Venta</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => {
              // Debug para ver la estructura de cada registro
              //console.log("BackOffice - Estructura del registro:", JSON.stringify(registro));
              
              // Ajustando basado en la respuesta del API
              const nombreAsesor = registro.nombre_asesor || registro.asesor_nombre || registro.name;
              const cedulaAsesor = registro.id_asesor || registro.asesor_cedula || registro.cedula;
              
              const nombrePdv = registro.nombre_pdv || registro.pdv_nombre || registro.descripcion;
              const codigoPdv = registro.id_pdv || registro.pdv_codigo || registro.codigo;
              
              const direccion = registro.direccion || registro.pdv_direccion;
              const fecha = registro.fecha || registro.fecha_registro;
              const fechaCreacion = registro.created_at || registro.fecha_creacion;
              const actividad = registro.actividad || registro.tipo_accion;
              
              return (
                <tr key={registro.id} 
                    onClick={() => onVerDetalle(registro)} 
                    className="backoffice-tabla-fila-clickeable">
                  
                  {/* ID */}
                  <td style={{ width: '8%', minWidth: '80px' }}>
                    <span className="backoffice-id-cell">{registro.id}</span>
                  </td>

                  {/* Estado BackOffice */}
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className={`backoffice-estado-badge ${getEstadoClass(registro.estado_backoffice)}`}>
                      {registro.estado_backoffice || 'PENDIENTE'}
                    </span>
                  </td>

                  {/* Estado Agente */}
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className={`backoffice-estado-badge ${getEstadoClass(registro.estado_agente)}`}>
                      {registro.estado_agente || 'PENDIENTE'}
                    </span>
                  </td>

                  {/* Actividad Registro */}
                  <td style={{ width: '12%', minWidth: '160px' }}>
                    <span className={`backoffice-actividad ${actividad}`}>
                      {actividad || 'PENDIENTE'}
                    </span>
                  </td>

                  {/* Fecha Factura */}
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className="backoffice-fecha-cell">{formatearFecha(fecha)}</span>
                  </td>

                  {/* Fecha Creación */}
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className="backoffice-fecha-creacion-cell">{formatearFecha(fechaCreacion)}</span>
                  </td>

                  {/* Agente Comercial */}
                  <td style={{ width: '14%', minWidth: '140px' }}>
                    <div className="backoffice-agente-cell">
                      <span className="backoffice-agente-name">{registro.agente_comercial || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Asesor */}
                  <td style={{ width: '14%', minWidth: '140px' }}>
                    <div className="backoffice-asesor-cell">
                      <span className="backoffice-asesor-name">{nombreAsesor}</span>
                      <span className="backoffice-asesor-documento">{cedulaAsesor}</span>
                    </div>
                  </td>

                  {/* Punto de Venta */}
                  <td style={{ width: '18%', minWidth: '180px' }}>
                    <div className="backoffice-pdv-cell">
                      <span className="backoffice-pdv-name">{nombrePdv}</span>
                      <span className="backoffice-pdv-codigo">{codigoPdv}</span>
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
});

// OPTIMIZACIÓN: Nombre del componente para debugging
BackOfficeRegistrosTable.displayName = 'BackOfficeRegistrosTable';

export default BackOfficeRegistrosTable;
