import React from 'react';

const PdvDetalleModal = ({ 
  isOpen, 
  onClose, 
  pdv, 
  onToggleEstado 
}) => {
  if (!isOpen || !pdv) return null;

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

  const formatearCoordenadas = (lat, lng) => {
    if (!lat || !lng) return 'No disponibles';
    return `${lat}, ${lng}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalles del Punto de Venta</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div className="modal-body">
          <div className="pdv-detail-grid">
            <div className="detail-section">
              <h3>Información Básica</h3>
              <div className="detail-item">
                <label>ID del PDV:</label>
                <span>{pdv.id}</span>
              </div>
              <div className="detail-item">
                <label>Código PDV:</label>
                <span className="codigo-highlight">{pdv.codigo}</span>
              </div>
              <div className="detail-item">
                <label>Nombre del Establecimiento:</label>
                <span>{pdv.nombre}</span>
              </div>
              <div className="detail-item">
                <label>NIT:</label>
                <span>{pdv.nit || 'No registrado'}</span>
              </div>
              <div className="detail-item">
                <label>Dirección:</label>
                <span>{pdv.direccion || 'No registrada'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Información de Contacto</h3>
              <div className="detail-item">
                <label>Teléfono:</label>
                <span>{pdv.telefono || 'No registrado'}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{pdv.email || 'No registrado'}</span>
              </div>
              <div className="detail-item">
                <label>Coordenadas GPS:</label>
                <span>{formatearCoordenadas(pdv.latitud, pdv.longitud)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Asignaciones</h3>
              <div className="detail-item">
                <label>Agente Comercial:</label>
                <span>{pdv.agente_comercial || 'No asignado'}</span>
              </div>
              <div className="detail-item">
                <label>Ciudad del PDV:</label>
                <span>{pdv.ciudad || 'No asignada'}</span>
              </div>
              <div className="detail-item">
                <label>Estado:</label>
                <span className={`estado-badge ${pdv.activo ? 'activo' : 'inactivo'}`}>
                  {pdv.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Estadísticas de Registros</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <label>Total de Registros:</label>
                  <span className="stat-number">{pdv.total_registros || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Registros Aprobados:</label>
                  <span className="stat-number success">{pdv.registros_aprobados || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Registros Rechazados:</label>
                  <span className="stat-number error">{pdv.registros_rechazados || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Registros Pendientes:</label>
                  <span className="stat-number warning">{pdv.registros_pendientes || 0}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Fechas Importantes</h3>
              <div className="detail-item">
                <label>Fecha de Creación:</label>
                <span>{formatearFecha(pdv.fecha_creacion)}</span>
              </div>
              <div className="detail-item">
                <label>Última Actualización:</label>
                <span>{formatearFecha(pdv.fecha_actualizacion)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button
              onClick={() => onToggleEstado(pdv.id, !pdv.activo)}
              className={`btn-modal ${pdv.activo ? 'btn-deactivate' : 'btn-activate'}`}
            >
              {pdv.activo ? 'Desactivar PDV' : 'Activar PDV'}
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

export default PdvDetalleModal;
