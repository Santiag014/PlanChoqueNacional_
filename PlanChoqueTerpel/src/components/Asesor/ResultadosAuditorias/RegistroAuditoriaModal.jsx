import React, { useEffect, useState } from 'react';

export default function RegistroAuditoriaModal({ isOpen, onClose, datos, loading, isMobile }) {
  console.log('🔍 Modal recibió datos:', datos);
  console.log('🔍 Modal isOpen:', isOpen);
  console.log('🔍 Productos en modal:', datos?.productos);
  console.log('🔍 Tipo de datos productos:', typeof datos?.productos);
  console.log('🔍 Es array productos?:', Array.isArray(datos?.productos));
  console.log('🔍 Tipo acción:', datos?.tipo_accion);
  console.log('🔍 Tipo acción uppercase:', datos?.tipo_accion?.toUpperCase());
  
  // Los datos vienen directamente del componente padre - no necesitamos estado local
  const detalles = datos;
  
  // Estado para el lightbox de imágenes
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Efecto para manejar el escape key y prevenir scroll del body
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Prevenir scroll del body cuando el modal está abierto
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Early return para mejorar el rendimiento
  if (!isOpen) {
    return null;
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  // Función para obtener clase del estado
  const getEstadoClass = (estado) => {
    if (!estado) return 'estado-pendiente';
    
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('aprobado') || estadoLower.includes('validado') || estadoLower.includes('confirmado')) {
      return 'estado-aprobado';
    } else if (estadoLower.includes('rechazado') || estadoLower.includes('error') || estadoLower.includes('fallido')) {
      return 'estado-rechazado';
    } else if (estadoLower.includes('pendiente') || estadoLower.includes('revision') || estadoLower.includes('proceso')) {
      return 'estado-pendiente';
    }
    return 'estado-pendiente';
  };

  // Función para preparar URL de foto
  const prepararUrlFoto = (rutaFoto) => {
    if (!rutaFoto || typeof rutaFoto !== 'string') {
      return null;
    }
    
    // Si ya es una URL completa, devolverla tal como está
    if (rutaFoto.startsWith('http://') || rutaFoto.startsWith('https://')) {
      return rutaFoto;
    }
    
    // Si es una ruta relativa, construir la URL completa
    // Para archivos locales de Vite, usar el puerto de desarrollo
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // En desarrollo, usar la URL de Vite directamente
      const cleanPath = rutaFoto.startsWith('/') ? rutaFoto : `/${rutaFoto}`;
      return `${window.location.protocol}//${window.location.host}${cleanPath}`;
    } else {
      // En producción, usar la URL base del servidor
      const cleanPath = rutaFoto.startsWith('/') ? rutaFoto : `/${rutaFoto}`;
      return `${window.location.origin}${cleanPath}`;
    }
  };

  // Funciones para el lightbox
  const abrirLightbox = (imagenUrl, titulo = '') => {
    setLightboxImage({ url: imagenUrl, titulo });
    setLightboxOpen(true);
  };

  const cerrarLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="title-content">
              <h2>Detalles de Auditoria</h2>
              <small>
                PDV {detalles?.codigo || '-'} - {detalles?.tipo_accion || '-'}
              </small>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Contenido del modal */}
        <div className="modal-body">
          {!detalles ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando detalles de auditoria...</p>
            </div>
          ) : (
            <>
              {/* Información principal */}
              <div className="info-cards-container">
                {/* Tarjeta PDV */}
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">🏪</span>
                    <h4>Información del PDV Auditado</h4>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <label>Código:</label>
                      <span className="codigo-value">{detalles?.codigo || '-'}</span>
                    </div>
                    <div className="info-row">
                      <label>Nombre:</label>
                      <span>{detalles?.descripcion || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Dirección:</label>
                      <span>{detalles?.direccion || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Segmento:</label>
                      <span>{detalles?.segmento || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Auditoria */}
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">🔍</span>
                    <h4>Detalles de Auditoria</h4>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <label>Fecha de Auditoria:</label>
                      <span>{formatearFecha(detalles?.fecha_registro)}</span>
                    </div>
                    <div className="info-row">
                      <label>Tipo de Auditoria:</label>
                      <span className="tipo-badge">{detalles?.tipo_accion || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Estado Mystery Shopper:</label>
                      <span className={`estado-badge ${getEstadoClass(detalles?.estado)}`}>
                        {detalles?.estado || 'En Revisión'}
                      </span>
                    </div>
                    <div className="info-row">
                      <label>Hallazgos:</label>
                      <span className={`estado-badge ${detalles?.hallazgo !== 'Ninguno' ? 'estado-rechazado' : 'estado-aprobado'}`}>
                        {detalles?.hallazgo || 'Ninguno'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {detalles?.observacion && detalles.observacion.trim() && (
                <div className="info-card observaciones-card">
                  <div className="card-header">
                    <span className="card-icon">💬</span>
                    <h4>Observaciones de Auditoria</h4>
                  </div>
                  <div className="card-content">
                    <div className="observacion-text">
                      {detalles.observacion}
                    </div>
                  </div>
                </div>
              )}

              {/* Fotos de la auditoria */}
              {detalles?.fotos && Array.isArray(detalles.fotos) && detalles.fotos.length > 0 && (
                <div className="info-card fotos-card">
                  <div className="card-header">
                    <span className="card-icon">📷</span>
                    <h4>Evidencias Fotográficas de Auditoria</h4>
                  </div>
                  <div className="card-content">
                    <div className="fotos-grid">
                      {detalles.fotos.map((foto, index) => {
                        const urlFoto = prepararUrlFoto(foto.ruta_archivo);
                        const keyFoto = `foto-${index}-${foto.ruta_archivo?.split('/').pop() || index}`;
                        
                        return (
                          <div key={keyFoto} className="foto-item">
                            {urlFoto ? (
                              <>
                                <img 
                                  src={urlFoto} 
                                  alt={`Evidencia auditoria ${index + 1}`}
                                  onClick={() => window.open(urlFoto, '_blank')}
                                  onError={(e) => {
                                    console.log('Error cargando imagen:', urlFoto);
                                    e.target.style.display = 'none';
                                    const errorDiv = e.target.parentNode.querySelector('.foto-error');
                                    if (errorDiv) {
                                      errorDiv.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="foto-error" style={{display: 'none'}}>
                                  <span>📷</span>
                                  <p>Error al cargar imagen</p>
                                </div>
                              </>
                            ) : (
                              <div className="foto-error" style={{display: 'flex'}}>
                                <span>📷</span>
                                <p>Imagen no disponible</p>
                              </div>
                            )}
                            {foto.tipo && (
                              <div className="foto-tipo">
                                {foto.tipo.replace('_', ' ').toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TABLA DE RESPALDO - Siempre mostrar productos si existen */}
              {detalles?.productos && Array.isArray(detalles.productos) && detalles.productos.length > 0 && (
                <div className="info-card productos-card">
                  <div className="card-header">
                    <span className="card-icon">📦</span>
                    <h4>Productos Auditados ({detalles.productos.length})</h4>
                  </div>
                  <div className="card-content">
                    <div className="productos-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Presentación</th>
                            <th>Precio Real</th>
                            <th>Precio Sugerido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalles.productos.map((producto, index) => {
                            const precioReal = Number(producto.precio_real || 0);
                            const precioSugerido = Number(producto.precio_sugerido || 0);
                            const esCorrecto = precioReal === precioSugerido;
                            
                            return (
                              <tr key={`producto-${index}`}>
                                <td>{producto.referencia || 'N/A'}</td>
                                <td>{producto.presentacion || 'N/A'}</td>
                                <td className="precio-real">
                                  ${precioReal.toLocaleString('es-CO')}
                                </td>
                                <td className="precio-esperado">
                                  ${precioSugerido.toLocaleString('es-CO')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del modal */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
