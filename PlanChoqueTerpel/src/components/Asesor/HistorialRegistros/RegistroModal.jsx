import React from 'react';

export default function RegistroModal({ isOpen, onClose, registro, loading, isMobile }) {
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

  const renderTablaProductos = () => {
    if (!registro?.detalles?.productos || registro.detalles.productos.length === 0) {
      return <p>No hay productos registrados</p>;
    }

    const tipoKpi = registro.tipo_kpi?.toLowerCase();

    return (
      <div className="tabla-productos">
        <div className="tabla-header">
          <div className="header-cell">Referencia</div>
          <div className="header-cell">Presentación</div>
          {tipoKpi === 'precio' && <div className="header-cell">Precio</div>}
          {tipoKpi === 'volumen' && <div className="header-cell">Volumen</div>}
        </div>
        <div className="tabla-body">
          {registro.detalles.productos.map((producto, index) => (
            <div key={index} className="tabla-row">
              <div className="tabla-cell">{producto.referencia}</div>
              <div className="tabla-cell">{producto.presentacion}</div>
              {tipoKpi === 'precio' && (
                <div className="tabla-cell precio">
                  ${Number(producto.precio).toLocaleString()}
                </div>
              )}
              {tipoKpi === 'volumen' && (
                <div className="tabla-cell volumen">
                  {producto.volumen} L
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${isMobile ? 'mobile' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="modal-header">
          <h2>Detalles del Registro</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
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
              {/* Información básica */}
              <div className="info-basica">
                <div className="info-row">
                  <label>Código PDV:</label>
                  <span className="codigo-value">{registro?.codigo_pdv}</span>
                </div>
                <div className="info-row">
                  <label>Corresponde a:</label>
                  <span>{registro?.nombre_pdv || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Tipo KPI:</label>
                  <span className={`kpi-badge ${registro?.tipo_kpi?.toLowerCase()}`}>
                    {registro?.tipo_kpi}
                  </span>
                </div>
                <div className="info-row">
                  <label>Fecha del registro:</label>
                  <span>{formatearFecha(registro?.fecha_registro)}</span>
                </div>
              </div>

              {/* Tabla de productos (solo si no es frecuencia) */}
              {registro?.tipo_kpi?.toLowerCase() !== 'frecuencia' && (
                <div className="productos-section">
                  <h3>Productos Registrados</h3>
                  {renderTablaProductos()}
                </div>
              )}

              {/* Foto del registro */}
              {registro?.detalles?.foto && (
                <div className="foto-section">
                  <h3>Evidencia Fotográfica</h3>
                  <div className="foto-container">
                    <img 
                      src={registro.detalles.foto} 
                      alt="Evidencia del registro"
                      className="evidencia-foto"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del modal */}
        <div className="modal-footer">
          <button className="volver-btn" onClick={onClose}>
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  );
}
