import React, { useEffect, useState } from 'react';

export default function RegistroModal({ isOpen, onClose, registro, loading, isMobile, onAprobar, onRechazar }) {
  // Estado para los detalles - ya no necesitamos fetch
  const [detalles, setDetalles] = useState(null);

  // Actualizar detalles cuando cambie el registro
  useEffect(() => {
    if (isOpen && registro) {
      // Usar directamente los datos del registro
      setDetalles(registro);
    } else if (!isOpen) {
      // Limpiar detalles al cerrar el modal
      setDetalles(null);
    }
  }, [isOpen, registro]);

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

  // Usar los detalles frescos si existen, si no, usar el registro original
  const datos = detalles || registro || {};
  
  // LOG PRINCIPAL PARA DEPURAR
  console.log("🚀 DATOS COMPLETOS DEL MODAL:", datos);
  console.log("🔍 TIPO_KPI EXACTO:", `'${datos.tipo_kpi}'`);
  console.log("🔍 TIPO_KPI LOWERCASE:", `'${datos.tipo_kpi?.toLowerCase()}'`);
  console.log("🔍 TIPO_ACCION:", `'${datos.tipo_accion}'`);
  console.log("🔍 OBSERVACION:", `'${datos.observacion}'`);
  console.log("🔍 OBSERVACION TIPO:", typeof datos.observacion);

  // Reconstruir productos usando los datos completos
  const productosReconstruidos = (() => {
    console.log("Datos para reconstruir productos:", datos);

    // Primero intentamos usar el objeto productos si existe
    if (datos?.productos && Array.isArray(datos.productos) && datos.productos.length > 0) {
      console.log("Usando productos del objeto datos:", datos.productos);
      return datos.productos;
    }

    // Si no hay productos en el objeto, usar los campos concatenados
    if (datos?.referencias) {
      const referencias = datos.referencias ? datos.referencias.split(',') : [];
      const presentaciones = datos.presentaciones ? datos.presentaciones.split(',') : [];
      const cantidades = datos.cantidades_cajas ? datos.cantidades_cajas.split(',') : [];
      const galonajes = datos.galonajes ? datos.galonajes.split(',') : [];
      const precios_sugeridos = datos.precios_sugeridos ? datos.precios_sugeridos.split(',') : [];
      const precios_reales = datos.precios_reales ? datos.precios_reales.split(',') : [];

      console.log("Reconstruyendo productos desde campos concatenados:", {
        referencias: referencias.length,
        presentaciones: presentaciones.length,
        cantidades: cantidades.length,
        galonajes: galonajes.length,
        precios_sugeridos: precios_sugeridos.length,
        precios_reales: precios_reales.length
      });

      return referencias.map((ref, index) => ({
        referencia: ref,
        presentacion: presentaciones[index] || '',
        cantidad_cajas: cantidades[index] || '',
        galonaje: galonajes[index] || '',
        precio_sugerido: precios_sugeridos[index] || '',
        precio_real: precios_reales[index] || ''
      }));
    }

    console.log("No hay productos para mostrar");
    return [];
  })();

  // Función para limpiar las rutas de las fotos
  const limpiarRutaFoto = (rutaFoto) => {
    if (!rutaFoto) return '';
    
    let rutaLimpia = rutaFoto.trim();
    
    // Remover múltiples "/storage/" del inicio si existen
    while (rutaLimpia.startsWith('/storage/')) {
      rutaLimpia = rutaLimpia.replace('/storage/', '');
    }
    
    // Remover múltiples "storage/" del inicio si existen
    while (rutaLimpia.startsWith('storage/')) {
      rutaLimpia = rutaLimpia.replace('storage/', '');
    }
    
    return rutaLimpia;
  };

  // Reconstruir fotos categorizadas
  const fotosReconstruidas = (() => {
    const fotos = {
      facturas: [],
      pop: [],
      seguimiento: []
    };

    // Procesar fotos de facturas
    if (datos?.fotos_factura) {
      const fotosFacturaArray = datos.fotos_factura.split(',')
        .filter(f => f && f.trim() && f !== 'null')
        .map(f => limpiarRutaFoto(f.trim()));
      fotos.facturas = fotosFacturaArray;
    }

    // Procesar fotos de POP
    if (datos?.fotos_pop) {
      const fotosPopArray = datos.fotos_pop.split(',')
        .filter(f => f && f.trim() && f !== 'null')
        .map(f => limpiarRutaFoto(f.trim()));
      fotos.pop = fotosPopArray;
    }

    // Procesar fotos de seguimiento
    if (datos?.fotos_seguimiento) {
      const fotosSeguimientoArray = datos.fotos_seguimiento.split(',')
        .filter(f => f && f.trim() && f !== 'null')
        .map(f => limpiarRutaFoto(f.trim()));
      fotos.seguimiento = fotosSeguimientoArray;
    }

    return fotos;
  })();

  console.log("Productos reconstruidos:", productosReconstruidos);
  console.log("Fotos reconstruidas:", fotosReconstruidas);

  const handleAprobar = () => {
    if (onAprobar) {
      onAprobar(datos.id);
    }
  };

  const handleRechazar = () => {
    if (onRechazar) {
      onRechazar(datos.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalles del Registro</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading-message">
              <span>Cargando detalles...</span>
            </div>
          ) : (
            <div className="info-cards-container">
              {/* Tarjeta Punto de Venta */}
              <div className="info-card">
                <div className="card-header">
                  <span className="card-icon">🏪</span>
                  <h4>Información del Punto de Venta</h4>
                </div>
                <div className="card-content">
                  <div className="info-row">
                    <label>Código:</label>
                    <span className="codigo-value">{datos.codigo}</span>
                  </div>
                  <div className="info-row">
                    <label>Nombre:</label>
                    <span>{datos.descripcion}</span>
                  </div>
                  <div className="info-row">
                    <label>Dirección:</label>
                    <span>{datos.direccion}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta Asesor */}
              <div className="info-card">
                <div className="card-header">
                  <span className="card-icon">👤</span>
                  <h4>Información del Asesor</h4>
                </div>
                <div className="card-content">
                  <div className="info-row">
                    <label>Nombre:</label>
                    <span className="asesor-value">{datos.name || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <label>Cédula:</label>
                    <span>{datos.cedula || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <label>KPI:</label>
                    <div className="kpi-badges-container">
                      {(() => {
                        // Buscar el KPI basado en los valores del endpoint
                        const kpi = (datos.tipo_kpi || '').toLowerCase();
                        if (kpi === 'volumen / precio') {
                          return <><span className="kpi-badge kpi-precio">PRECIO</span><span className="kpi-badge kpi-volumen">VOLUMEN</span></>;
                        } else if (kpi === 'precio') {
                          return <span className="kpi-badge kpi-precio">PRECIO</span>;
                        } else if (kpi === 'volumen') {
                          return <span className="kpi-badge kpi-volumen">VOLUMEN</span>;
                        } else if (kpi === 'frecuencia') {
                          return <span className="kpi-badge kpi-frecuencia">FRECUENCIA</span>;
                        } else if (kpi) {
                          return <span className="kpi-badge">{kpi.toUpperCase()}</span>;
                        } else {
                          return <span className="kpi-badge">N/A</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="info-row">
                    <label>Actividad:</label>
                    <span>{datos.tipo_accion || '-'}</span>
                  </div>
                  <div className="info-row">
                    <label>Estado:</label>
                    <span className={`mercadeo_estado-badge ${getEstadoClass(datos.estado)}`}>
                      {datos.estado || 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <label>Fecha:</label>
                    <span className="fecha-value">{formatearFecha(datos.fecha_registro)}</span>
                  </div>
                  <div className="info-row">
                    <label>Observaciones:</label>
                    <span className="observacion-text">
                      {datos.observacion || 'Sin observaciones'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta Productos */}
              {productosReconstruidos.length > 0 && (
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">📦</span>
                    <h4>Productos Implementados</h4>
                  </div>
                  <div className="card-content">
                    <div className="productos-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Referencia</th>
                            <th>Presentación</th>
                            <th>Cajas</th>
                            <th>Galonaje</th>
                            <th>Precio Sugerido</th>
                            <th>Precio Real</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosReconstruidos.map((producto, index) => (
                            <tr key={index}>
                              <td>{producto.referencia}</td>
                              <td>{producto.presentacion}</td>
                              <td>{producto.cantidad_cajas}</td>
                              <td>{producto.galonaje}</td>
                              <td>{producto.precio_sugerido ? `$${parseInt(producto.precio_sugerido).toLocaleString()}` : '-'}</td>
                              <td>{producto.precio_real ? `$${parseInt(producto.precio_real).toLocaleString()}` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjeta Fotografías */}
              {(fotosReconstruidas.facturas.length > 0 || fotosReconstruidas.pop.length > 0 || fotosReconstruidas.seguimiento.length > 0) && (
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">📸</span>
                    <h4>Evidencia Fotográfica</h4>
                  </div>
                  <div className="card-content">
                    <div className="fotos-container">
                      {/* Fotos de Facturas */}
                      {fotosReconstruidas.facturas.length > 0 && (
                        <div className="foto-categoria">
                          <h4>📋 Facturas</h4>
                          <div className="fotos-grid">
                            {fotosReconstruidas.facturas.map((foto, index) => (
                              <div key={index} className="foto-item_mercadeo">
                                <img 
                                  src={`/storage/${foto}`} 
                                  alt={`Factura ${index + 1}`}
                                  className="foto-img"
                                  onClick={() => window.open(`/storage/${foto}`, '_blank')}
                                  onError={(e) => {
                                    console.error(`Error al cargar imagen: /storage/${foto}`);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="foto-error" style={{display: 'none'}}>
                                  <span>📄</span>
                                  <small>Error al cargar imagen</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fotos de POP */}
                      {fotosReconstruidas.pop.length > 0 && (
                        <div className="foto-categoria">
                          <h4>🎯 Material POP</h4>
                          <div className="fotos-grid">
                            {fotosReconstruidas.pop.map((foto, index) => (
                              <div key={index} className="foto-item_mercadeo">
                                <img 
                                  src={`/storage/${foto}`} 
                                  alt={`POP ${index + 1}`}
                                  className="foto-img"
                                  onClick={() => window.open(`/storage/${foto}`, '_blank')}
                                  onError={(e) => {
                                    console.error(`Error al cargar imagen: /storage/${foto}`);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="foto-error" style={{display: 'none'}}>
                                  <span>🎯</span>
                                  <small>Error al cargar imagen</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fotos de Seguimiento */}
                      {fotosReconstruidas.seguimiento.length > 0 && (
                        <div className="foto-categoria">
                          <h4>📈 Seguimiento</h4>
                          <div className="fotos-grid">
                            {fotosReconstruidas.seguimiento.map((foto, index) => (
                              <div key={index} className="foto-item_mercadeo">
                                <img 
                                  src={`/storage/${foto}`} 
                                  alt={`Seguimiento ${index + 1}`}
                                  className="foto-img"
                                  onClick={() => window.open(`/storage/${foto}`, '_blank')}
                                  onError={(e) => {
                                    console.error(`Error al cargar imagen: /storage/${foto}`);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="foto-error" style={{display: 'none'}}>
                                  <span>📈</span>
                                  <small>Error al cargar imagen</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <div className="action-buttons">
            <button 
              className="mercadeo_btn btn-success" 
              onClick={handleAprobar}
              disabled={loading}
            >
              <span className="icon">✓</span>
              Aprobar
            </button>
            <button 
              className="mercadeo_btn btn-danger" 
              onClick={handleRechazar}
              disabled={loading}
            >
              <span className="icon">✗</span>
              Rechazar
            </button>
          </div>
          <button className="mercadeo_btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
