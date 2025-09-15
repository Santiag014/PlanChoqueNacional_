import React from 'react';

const UsuariosTable = ({ 
  usuarios, 
  isMobile
}) => {
  
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoClass = (activo) => {
    if (activo === 1 || activo === true) {
      return 'backoffice-estado-aprobado';
    } else {
      return 'backoffice-estado-rechazado';
    }
  };

  const getRolBadgeClass = (rolId) => {
    switch(rolId?.toString()) {
      case '1': return 'rol-badge asesor';
      case '2': return 'rol-badge mercadeo';
      case '3': return 'rol-badge director';
      case '4': return 'rol-badge coordinador';
      case '5': return 'rol-badge mystery';
      case '6': return 'rol-badge backoffice';
      default: return 'rol-badge';
    }
  };

  const getRolNombre = (rolId) => {
    switch(rolId?.toString()) {
      case '1': return 'ASESOR';
      case '2': return 'MERCADEO';
      case '3': return 'DIRECTOR';
      case '4': return 'COORDINADOR';
      case '5': return 'MYSTERY SHOPPER';
      case '6': return 'BACKOFFICE';
      default: return 'N/A';
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="backoffice-empty-state">
        <div className="backoffice-empty-icon">👥</div>
        <h3>No hay usuarios</h3>
        <p>No se encontraron usuarios con los filtros aplicados</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="usuarios-mobile-container">
        {usuarios.map((usuario, index) => (
          <div key={index} className="usuario-mobile-card">
            <div className="usuario-mobile-header">
              <div className="usuario-info">
                <h4 className="usuario-name">{usuario.name}</h4>
                <span className="usuario-cedula">Cédula: {usuario.documento || usuario.cedula}</span>
                <span className={`usuario-estado-badge ${getEstadoClass(usuario.activo)}`}>
                  {(usuario.activo === 1 || usuario.activo === true) ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </div>
            
            <div className="usuario-mobile-details">
              <div className="detail-row">
                <span className="detail-label">Rol:</span>
                <span className={getRolBadgeClass(usuario.rol_id)}>
                  {getRolNombre(usuario.rol_id)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Agente:</span>
                <span className="detail-value">{usuario.descripcion || usuario.agente_comercial || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{usuario.email || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ciudad:</span>
                <span className="detail-value">{usuario.ciudad_nombre || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Promotor:</span>
                <span className={`promotor-badge ${(usuario.IsPromotoria === 1 || usuario.IsPromotoria === true) ? 'yes' : 'no'}`}>
                  {(usuario.IsPromotoria === 1 || usuario.IsPromotoria === true) ? 'SÍ' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="backoffice-registros-table-container">
      <div className="backoffice-table-wrapper">
        <table className="backoffice-registros-table">
          <colgroup>
            <col style={{ width: '12%', minWidth: '120px' }} />
            <col style={{ width: '16%', minWidth: '160px' }} />
            <col style={{ width: '16%', minWidth: '160px' }} />
            <col style={{ width: '20%', minWidth: '200px' }} />
            <col style={{ width: '12%', minWidth: '120px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: '12%', minWidth: '120px' }}>Rol</th>
              <th style={{ width: '16%', minWidth: '160px' }}>Usuario</th>
              <th style={{ width: '16%', minWidth: '160px' }}>Agente Comercial</th>
              <th style={{ width: '20%', minWidth: '200px' }}>Email</th>
              <th style={{ width: '12%', minWidth: '120px' }}>Ciudad</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const nombreUsuario = usuario.name || 'N/A';
              const cedulaUsuario = usuario.documento || usuario.cedula || 'N/A';
              const agenteComercial = usuario.agente_comercial;
              const emailUsuario = usuario.email || 'N/A';
              const ciudadUsuario = usuario.ciudad || 'N/A';
              const rol_usuario = usuario.descripcion;
              
              return (
                <tr key={usuario.id || usuario.documento} 
                    className="backoffice-tabla-fila-clickeable">

                  {/* Rol */}
                  <td style={{ width: '16%', minWidth: '160px' }}>
                    <div className="backoffice-asesor-cell">
                      <span className="backoffice-asesor-name">{rol_usuario}</span>
                    </div>
                  </td>

                  {/* Usuario */}
                  <td style={{ width: '16%', minWidth: '160px' }}>
                    <div className="backoffice-asesor-cell">
                      <span className="backoffice-asesor-name">{nombreUsuario}</span>
                      <span className="backoffice-asesor-documento">{cedulaUsuario}</span>
                    </div>
                  </td>

                  {/* Agente Comercial */}
                  <td style={{ width: '16%', minWidth: '160px' }}>
                    <div className="backoffice-agente-cell">
                      <span className="backoffice-agente-name">{agenteComercial}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ width: '20%', minWidth: '200px' }}>
                    <div className="backoffice-email-cell">
                      <span className="backoffice-email-text">{emailUsuario}</span>
                    </div>
                  </td>

                  {/* Ciudad */}
                  <td style={{ width: '12%', minWidth: '120px' }}>
                    <span className="backoffice-fecha-cell">{ciudadUsuario}</span>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsuariosTable;
