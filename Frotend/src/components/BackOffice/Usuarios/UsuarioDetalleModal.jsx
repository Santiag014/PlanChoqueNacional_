import React from 'react';

const UsuarioDetalleModal = ({ 
  isOpen, 
  onClose, 
  usuario, 
  onToggleEstado 
}) => {
  if (!isOpen || !usuario) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerNombreRol = (rolId) => {
    const roles = {
      1: 'Asesor',
      2: 'Mercadeo',
      3: 'Director',
      4: 'Coordinador',
      5: 'Mystery Shopper',
      6: 'BackOffice'
    };
    return roles[rolId] || 'Desconocido';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalles del Usuario</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div className="modal-body">
          <div className="usuario-detail-grid">
            <div className="detail-section">
              <h3>Información Personal</h3>
              <div className="detail-item">
                <label>ID del Usuario:</label>
                <span>{usuario.id}</span>
              </div>
              <div className="detail-item">
                <label>Nombre Completo:</label>
                <span>{usuario.name}</span>
              </div>
              <div className="detail-item">
                <label>Cédula:</label>
                <span>{usuario.cedula}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{usuario.email || 'No registrado'}</span>
              </div>
              <div className="detail-item">
                <label>Teléfono:</label>
                <span>{usuario.telefono || 'No registrado'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Información del Sistema</h3>
              <div className="detail-item">
                <label>Rol:</label>
                <span className="rol-badge">
                  {obtenerNombreRol(usuario.rol_id)}
                </span>
              </div>
              <div className="detail-item">
                <label>Estado:</label>
                <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="detail-item">
                <label>Es Promotor:</label>
                <span className={`promotor-badge ${usuario.IsPromotoria ? 'yes' : 'no'}`}>
                  {usuario.IsPromotoria ? 'Sí' : 'No'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Asignaciones</h3>
              <div className="detail-item">
                <label>Agente Comercial:</label>
                <span>{usuario.agente_comercial || 'No asignado'}</span>
              </div>
              <div className="detail-item">
                <label>Ciudad Asignada:</label>
                <span>{usuario.ciudad_nombre || 'No asignada'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Fechas Importantes</h3>
              <div className="detail-item">
                <label>Fecha de Creación:</label>
                <span>{formatearFecha(usuario.fecha_creacion)}</span>
              </div>
              <div className="detail-item">
                <label>Última Actualización:</label>
                <span>{formatearFecha(usuario.fecha_actualizacion)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button
              onClick={() => onToggleEstado(usuario.id, !usuario.activo)}
              className={`btn-modal ${usuario.activo ? 'btn-deactivate' : 'btn-activate'}`}
            >
              {usuario.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
            </button>
            <button
              onClick={onClose}
              className="btn-modal btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuarioDetalleModal;
