import React, { useEffect } from 'react';

export default function RegistroModal({ isOpen, onClose, registro, loading, isMobile }) {
  // Efecto para manejar el escape key y prevenir scroll del body
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getKpiIcon = (kpi) => {
    switch (kpi?.toUpperCase()) {
      case 'VOLUMEN': return '📊';
      case 'PRECIO': return '💰';  
      case 'FRECUENCIA': return '⚡';
      default: return '📋';
    }
  };

  const getKpiColor = (kpi) => {
    switch (kpi?.toUpperCase()) {
      case 'VOLUMEN': return '#2196F3';
      case 'PRECIO': return '#4CAF50';
      case 'FRECUENCIA': return '#FF9800';
      default: return '#757575';
    }
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

  const renderTablaProductos = () => {
    if (!registro?.detalles?.productos || registro.detalles.productos.length === 0) {
      return (
        <div className="no-productos">
          <div className="no-productos-icon">📦</div>
          <p>No hay productos registrados para este registro</p>
        </div>
      );
    }

    const tipoKpi = registro.tipo_kpi?.toLowerCase();

    return (
      <div className="tabla-productos-modal">
        <table className="productos-table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Presentación</th>
              {tipoKpi === 'precio' && <th>Precio</th>}
              {tipoKpi === 'volumen' && <th>Cantidad</th>}
              {tipoKpi === 'volumen' && <th>Galones</th>}
            </tr>
          </thead>
          <tbody>
            {registro.detalles.productos.map((producto, index) => (
              <tr key={index}>
                <td className="referencia-cell">{producto.referencia}</td>
                <td className="presentacion-cell">{producto.presentacion}</td>
                {tipoKpi === 'precio' && (
                  <td className="precio-cell">
                    ${Number(producto.precio || 0).toLocaleString('es-CO')}
                  </td>
                )}
                {tipoKpi === 'volumen' && (
                  <>
                    <td className="cantidad-cell">{producto.cantidad || 0}</td>
                    <td className="cantidad-cell">{producto.volumen || 0}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${isMobile ? 'mobile' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal - mantener estilo actual */}
        <div className="modal-header">
          <div className="modal-title-section">
            <span className="modal-icon">📋</span>
            <div>
              <h2>Detalles del Registro</h2>
              <span className="modal-subtitle">
                PDV {registro?.codigo_pdv} - {registro?.tipo_kpi}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Contenido del modal */}
        <div className="modal-body">
          {loading ? (
            <div className="loading-detalles">
              <div className="loading-spinner"></div>
              <p>Cargando detalles...</p>
            </div>
          ) : (
            <>
              {/* Información básica organizada en tarjetas */}
              <div className="info-cards-container">
                {/* Tarjeta PDV */}
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">🏪</span>
                    <h4>Información del PDV</h4>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <label>Código:</label>
                      <span className="codigo-value">{registro?.codigo_pdv}</span>
                    </div>
                    <div className="info-row">
                      <label>Nombre:</label>
                      <span>{registro?.nombre_pdv || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Dirección:</label>
                      <span>{registro?.detalles?.pdv?.direccion || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Registro */}
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">📊</span>
                    <h4>Información del Registro</h4>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <label>Agente:</label>
                      <span className="agente-value">{registro?.nombre_agente || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Tipo KPI:</label>
                      <span className={`kpi-badge ${getKpiClass(registro?.tipo_kpi)}`}>
                        {registro?.tipo_kpi}
                      </span>
                    </div>
                    <div className="info-row">
                      <label>Fecha:</label>
                      <span className="fecha-value">{formatearFecha(registro?.fecha_registro)}</span>
                    </div>
                    {registro?.galonaje && (
                      <div className="info-row">
                        <label>Galonaje:</label>
                        <span className="galonaje-value">{registro.galonaje} galones</span>
                      </div>
                    )}
                    {registro?.puntos_kpi && (
                      <div className="info-row">
                        <label>Puntos:</label>
                        <span className="puntos-badge">{registro.puntos_kpi} puntos</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de productos */}
              {registro?.tipo_kpi?.toLowerCase() !== 'frecuencia' && (
                <div className="productos-section">
                  <div className="section-header">
                    <span className="section-icon">📦</span>
                    <h3>Productos Registrados</h3>
                  </div>
                  {renderTablaProductos()}
                </div>
              )}

              {/* Foto */}
              {registro?.foto_evidencia && (
                <div className="foto-section">
                  <div className="section-header">
                    <span className="section-icon">📷</span>
                    <h3>Evidencia Fotográfica</h3>
                  </div>
                  <div className="foto-container">
                    <img 
                      src={`/${registro.foto_evidencia}`} 
                      alt="Evidencia del registro"
                      className="evidencia-foto"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="foto-error" style={{display: 'none'}}>
                      <span className="error-icon">❌</span>
                      <p>No se pudo cargar la imagen</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del modal */}
        <div className="modal-footer">
          <button className="volver-btn" onClick={onClose}>
            <span className="btn-icon">←</span>
            <span>Volver</span>
          </button>
        </div>
      </div>
    </div>
  );
}
