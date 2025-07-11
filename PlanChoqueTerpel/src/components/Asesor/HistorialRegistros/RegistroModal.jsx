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
      case 'PRECIO_VOLUMEN': return '💰📊';
      case 'FRECUENCIA': return '⚡';
      default: return '📋';
    }
  };

  const getKpiColor = (kpi) => {
    switch (kpi?.toUpperCase()) {
      case 'VOLUMEN': return '#2196F3';
      case 'PRECIO': return '#4CAF50';
      case 'PRECIO_VOLUMEN': return '#FF5722';
      case 'FRECUENCIA': return '#FF9800';
      default: return '#757575';
    }
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

  // Función para obtener clase del estado
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

  // Función para obtener texto del estado
  const getEstadoTexto = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'aprobado':
      case 'approved':
        return 'APROBADO';
      case 'rechazado':
      case 'rejected':
        return 'RECHAZADO';
      case 'pendiente':
      case 'pending':
      default:
        return 'PENDIENTE';
    }
  };

  // Función para renderizar información específica por KPI
  const renderInfoKPI = () => {
    const tipoKpi = registro?.tipo_kpi?.toLowerCase();
    
    switch (tipoKpi) {
      case 'volumen':
        return (
          <>
            {registro?.detalles?.volumen_total && (
              <div className="info-row">
                <label>Volumen Total:</label>
                <span className="volumen-value">{registro.detalles.volumen_total} unidades</span>
              </div>
            )}
            {registro?.detalles?.cumplimiento_general && (
              <div className="info-row">
                <label>Cumplimiento:</label>
                <span className="cumplimiento-value">{registro.detalles.cumplimiento_general}</span>
              </div>
            )}
            {/* Estado para todos los KPIs */}
            {registro?.estado && (
              <div className="info-row">
                <label>Estado:</label>
                <span className={`estado-badge ${getEstadoClass(registro.estado)}`}>
                  {getEstadoTexto(registro.estado)}
                </span>
              </div>
            )}
          </>
        );
      
      case 'precio':
        return (
          <>
            {/* Estado para todos los KPIs */}
            {registro?.estado && (
              <div className="info-row">
                <label>Estado:</label>
                <span className={`estado-badge ${getEstadoClass(registro.estado)}`}>
                  {getEstadoTexto(registro.estado)}
                </span>
              </div>
            )}
            {/* Estado Mystery Shopper solo para KPIs de precio */}
            {registro?.detalles?.estado_mystery_shopper && (
              <div className="info-row">
                <label>Estado Mystery Shopper:</label>
                <span className={`estado-badge ${getEstadoClass(registro.detalles.estado_mystery_shopper)}`}>
                  {getEstadoTexto(registro.detalles.estado_mystery_shopper)}
                </span>
              </div>
            )}
          </>
        );

      case 'precio_volumen':
        return (
          <>
            {registro?.detalles?.volumen_total && (
              <div className="info-row">
                <label>Volumen Total:</label>
                <span className="volumen-value">{registro.detalles.volumen_total} unidades</span>
              </div>
            )}
            {registro?.detalles?.cumplimiento_volumen && (
              <div className="info-row">
                <label>Cumplimiento Volumen:</label>
                <span className="cumplimiento-value">{registro.detalles.cumplimiento_volumen}</span>
              </div>
            )}
            {/* Estado para todos los KPIs */}
            {registro?.estado && (
              <div className="info-row">
                <label>Estado:</label>
                <span className={`estado-badge ${getEstadoClass(registro.estado)}`}>
                  {getEstadoTexto(registro.estado)}
                </span>
              </div>
            )}
            {/* Estado Mystery Shopper solo para KPIs de precio */}
            {registro?.detalles?.estado_mystery_shopper && (
              <div className="info-row">
                <label>Estado Mystery Shopper:</label>
                <span className={`estado-badge ${getEstadoClass(registro.detalles.estado_mystery_shopper)}`}>
                  {getEstadoTexto(registro.detalles.estado_mystery_shopper)}
                </span>
              </div>
            )}
          </>
        );
      
      case 'frecuencia':
        return (
          <>
            {/* Estado para todos los KPIs */}
            {registro?.estado && (
              <div className="info-row">
                <label>Estado:</label>
                <span className={`estado-badge ${getEstadoClass(registro.estado)}`}>
                  {getEstadoTexto(registro.estado)}
                </span>
              </div>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  // Función para renderizar fotos según KPI
  const renderFotos = () => {
    const tipoKpi = registro?.tipo_kpi?.toLowerCase();
    
    // Foto de seguimiento (siempre presente)
    const fotoSeguimiento = '/storage/img_productos_carrusel/img_login.png';
    
    if (tipoKpi === 'precio_volumen') {
      // PRECIO_VOLUMEN: foto POP + foto factura + foto seguimiento
      return (
        <>
          <div className="foto-section">
            <div className="section-header">
              <span className="section-icon">💰</span>
              <h3>Foto POP (Implementación)</h3>
            </div>
            <div className="foto-container">
              <img 
                src={registro?.detalles?.foto_pop || fotoSeguimiento}
                alt="Foto de implementación POP"
                className="evidencia-foto"
                onError={(e) => {
                  e.target.src = fotoSeguimiento;
                }}
              />
            </div>
          </div>
          
          <div className="foto-section">
            <div className="section-header">
              <span className="section-icon">📋</span>
              <h3>Foto Factura</h3>
            </div>
            <div className="foto-container">
              <img 
                src={registro?.detalles?.foto_factura || fotoSeguimiento}
                alt="Foto de factura"
                className="evidencia-foto"
                onError={(e) => {
                  e.target.src = fotoSeguimiento;
                }}
              />
            </div>
          </div>
        </>
      );
    } else if (tipoKpi === 'precio') {
      // PRECIO: solo foto POP
      return (
        <div className="foto-section">
          <div className="section-header">
            <span className="section-icon">💰</span>
            <h3>Foto POP (Implementación)</h3>
          </div>
          <div className="foto-container">
            <img 
              src={registro?.detalles?.foto_pop || registro?.detalles?.foto || fotoSeguimiento}
              alt="Foto de implementación POP"
              className="evidencia-foto"
              onError={(e) => {
                e.target.src = fotoSeguimiento;
              }}
            />
          </div>
          <div className="foto-info">
            <small>Evidencia de la implementación de material POP y validación de precios</small>
          </div>
        </div>
      );
    } else if (tipoKpi === 'volumen') {
      // VOLUMEN: múltiples fotos de evidencia
      const fotosFactura = registro?.detalles?.fotos_factura || [
        registro?.detalles?.foto_factura || registro?.detalles?.foto || fotoSeguimiento
      ];
      
      return (
        <div className="foto-section">
          <div className="section-header">
            <span className="section-icon">📋</span>
            <h3>Fotos de Evidencia ({fotosFactura.length})</h3>
          </div>
          {fotosFactura.map((foto, index) => (
            <div key={index} className="foto-container" style={{ marginBottom: '16px' }}>
              <img 
                src={foto}
                alt={`Foto de evidencia ${index + 1}`}
                className="evidencia-foto"
                onError={(e) => {
                  e.target.src = fotoSeguimiento;
                }}
              />
              <div className="foto-info">
                <small>Evidencia de productos registrados - Foto {index + 1}</small>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (tipoKpi === 'frecuencia') {
      // FRECUENCIA: foto de evidencia
      return (
        <div className="foto-section">
          <div className="section-header">
            <span className="section-icon">�</span>
            <h3>Foto de Evidencia</h3>
          </div>
          <div className="foto-container">
            <img 
              src={registro?.detalles?.foto_evidencia || registro?.detalles?.foto || fotoSeguimiento}
              alt="Foto de evidencia de visita"
              className="evidencia-foto"
              onError={(e) => {
                e.target.src = fotoSeguimiento;
              }}
            />
          </div>
          <div className="foto-info">
            <small>Evidencia de la visita al PDV</small>
          </div>
        </div>
      );
    }
    
    // Default: foto genérica
    return (
      <div className="foto-section">
        <div className="section-header">
          <span className="section-icon">📸</span>
          <h3>Evidencia Fotográfica</h3>
        </div>
        <div className="foto-container">
          <img 
            src={registro?.detalles?.foto || fotoSeguimiento}
            alt="Evidencia del registro"
            className="evidencia-foto"
            onError={(e) => {
              e.target.src = fotoSeguimiento;
            }}
          />
        </div>
      </div>
    );
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
              {(tipoKpi === 'precio' || tipoKpi === 'precio_volumen') && <th>Precio Sugerido</th>}
              {(tipoKpi === 'precio' || tipoKpi === 'precio_volumen') && <th>Precio</th>}
              {(tipoKpi === 'volumen' || tipoKpi === 'precio_volumen') && <th>Nº Cajas</th>}
              {(tipoKpi === 'volumen' || tipoKpi === 'precio_volumen') && <th>Galones</th>}
            </tr>
          </thead>
          <tbody>
            {registro.detalles.productos.map((producto, index) => (
              <tr key={index}>
                <td className="referencia-cell">{producto.referencia}</td>
                <td className="presentacion-cell">{producto.presentacion}</td>
                
                {(tipoKpi === 'precio' || tipoKpi === 'precio_volumen') && (
                  <>
                    <td className="precio-cell">
                      ${Number(producto.precio_sugerido || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="precio-cell">
                      ${Number(producto.precio_implementado || producto.precio || 0).toLocaleString('es-CO')}
                    </td>
                  </>
                )}
                
                {(tipoKpi === 'volumen' || tipoKpi === 'precio_volumen') && (
                  <>
                    <td className="cantidad-cell">{producto.cajas || producto.cantidad || 0}</td>
                    <td className="cantidad-cell">{producto.galones || producto.volumen || 0}</td>
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
                    <span className="card-icon"></span>
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
                      <span>{registro?.detalles?.pdv_info?.direccion || registro?.direccion_pdv || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Registro */}
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon"></span>
                    <h4>Información del Registro</h4>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <label>Agente:</label>
                      <span className="agente-value">{registro?.nombre_agente || 'N/A'}</span>
                    </div>
                    {/* Etiquetas de KPI específicas */}
                    <div className="info-row">
                      <label>KPI:</label>
                      <div className="kpi-badges-container">
                        {registro?.tipo_kpi?.toLowerCase() === 'precio_volumen' ? (
                          <>
                            <span className="kpi-badge kpi-precio">PRECIO</span>
                            <span className="kpi-badge kpi-volumen">VOLUMEN</span>
                          </>
                        ) : registro?.tipo_kpi?.toLowerCase() === 'precio' ? (
                          <span className="kpi-badge kpi-precio">PRECIO</span>
                        ) : registro?.tipo_kpi?.toLowerCase() === 'volumen' ? (
                          <span className="kpi-badge kpi-volumen">VOLUMEN</span>
                        ) : registro?.tipo_kpi?.toLowerCase() === 'frecuencia' ? (
                          <span className="kpi-badge kpi-frecuencia">FRECUENCIA</span>
                        ) : (
                          <span className="kpi-badge">N/A</span>
                        )}
                      </div>
                    </div>
                    <div className="info-row">
                      <label>Fecha:</label>
                      <span className="fecha-value">{formatearFecha(registro?.fecha_registro)}</span>
                    </div>
                    {/* Información específica por KPI */}
                    {renderInfoKPI()}
                  </div>
                </div>

                {/* Tarjeta Observaciones */}
                {(registro?.observaciones || registro?.detalles?.observaciones) && (
                  <div className="info-card">
                    <div className="card-header">
                      <span className="card-icon">📝</span>
                      <h4>Observaciones</h4>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <span>{registro?.observaciones || registro?.detalles?.observaciones}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de productos */}
              {registro?.tipo_kpi?.toLowerCase() !== 'frecuencia' && (
                <div className="productos-section">
                  <div className="section-header">
                    <span className="section-icon"></span>
                    <h3>Productos Registrados</h3>
                  </div>
                  {renderTablaProductos()}
                </div>
              )}

              {/* Fotos según KPI */}
              {renderFotos()}
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
