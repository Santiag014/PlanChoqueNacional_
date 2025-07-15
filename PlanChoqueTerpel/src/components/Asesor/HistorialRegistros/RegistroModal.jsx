import React, { useEffect, useState } from 'react';

export default function RegistroModal({ isOpen, onClose, registro, loading, isMobile }) {
  // Estado para los detalles frescos
  const [detalles, setDetalles] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  // Fetch de detalles al abrir el modal y tener registro.id
  useEffect(() => {
    if (isOpen && registro?.id) {
      setLoadingDetalles(true);
      fetch(`/api/asesor/registro-detalles/${registro.id}`)
        .then(async res => {
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`La respuesta no es JSON. Respuesta: ${text.substring(0, 100)}`);
          }
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Error HTTP: ${res.status} - ${errorText}`);
          }
          return res.json();
        })
        .catch(err => {
          setDetalles(null);
          console.error('Error fetch detalles:', err);
        })
        .finally(() => setLoadingDetalles(false));
    } else {
      setDetalles(null);
    }
  }, [isOpen, registro?.id]);

  // Mostrar en consola el objeto registro cada vez que cambia
  useEffect(() => {
    if (isOpen && registro) {
      console.log('Registro recibido en el modal:', registro);
      if (registro.detalles) {
        console.log('Detalles del registro:', registro.detalles);
      }
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


  // Usar los detalles frescos si existen, si no, usar el registro original
  const datos = detalles || registro || {};

  // Reconstruir productos SOLO si detalles está presente y tiene referencias
  const productosReconstruidos = (() => {
    if (!detalles || !detalles.referencias) return [];
    const refs = detalles.referencias.split(',');
    const presentaciones = (detalles.presentaciones || '').split(',');
    const preciosReales = (detalles.precios_reales || '').split(',');
    const preciosSugeridos = (detalles.precios_sugeridos || '').split(',');
    const cantidades = (detalles.cantidades_cajas || '').split(',');
    const galones = (detalles.galones || '').split(',');
    return refs.map((ref, idx) => ({
      referencia: ref.trim(),
      presentacion: presentaciones[idx]?.trim() || '',
      precio_real: preciosReales[idx]?.trim() || '',
      precio_sugerido: preciosSugeridos[idx]?.trim() || '',
      cantidad: cantidades[idx]?.trim() || '',
      galones: galones[idx]?.trim() || '',
    }));
  })();

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
                PDV {datos.codigo_pdv || datos.codigo || '-'} - {datos.tipo_kpi || datos.tipo_accion || '-'}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Contenido del modal */}
        <div className="modal-body">
          {(loading || loadingDetalles) ? (
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
                      <span className="codigo-value">{datos.codigo || datos.codigo_pdv || '-'}</span>
                    </div>
                    <div className="info-row">
                      <label>Nombre:</label>
                      <span>{datos.nombre_pdv || datos.descripcion || datos.detalles?.nombre_pdv || datos.detalles?.descripcion || datos.detalles?.pdv_info?.nombre || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Dirección:</label>
                      <span>{datos.direccion_pdv || datos.direccion || datos.detalles?.direccion_pdv || datos.detalles?.direccion || datos.detalles?.pdv_info?.direccion || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Registro */}
                <div className="info-card">
                  <div className="card-header">
                    <span className="card-icon">🧑‍💼</span>
                    <h4>Información del Registro</h4>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <label>Agente:</label>
                      <span className="agente-value">{datos.nombre_agente || datos.name || datos.detalles?.agente || datos.detalles?.name || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>KPI:</label>
                      <div className="kpi-badges-container">
                        {(() => {
                          // Buscar el KPI en orden de prioridad
                          const kpi = (datos.detalles?.tipo_accion || '').toLowerCase();
                          if (kpi === 'precio_volumen' || kpi === 'volumen / precio') {
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
                      <span>{datos.tipo_accion || datos.detalles?.tipo_accion || '-'}</span>
                    </div>
                    <div className="info-row">
                      <label>Fecha:</label>
                      <span className="fecha-value">{formatearFecha(datos.fecha_registro)}</span>
                    </div>
                    {/* Estado del registro si existe */}
                    {datos.estado || datos.detalles?.estado ? (
                      <div className="info-row">
                        <label>Estado:</label>
                        <span className={`estado-badge ${getEstadoClass(datos.estado || datos.detalles?.estado)}`}>{getEstadoTexto(datos.estado || datos.detalles?.estado)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Tarjeta Observaciones */}
                {(datos.observaciones || datos.observacion || datos.detalles?.observaciones) && (
                  <div className="info-card">
                    <div className="card-header">
                      <span className="card-icon">📝</span>
                      <h4>Observaciones</h4>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <span>{datos.observaciones || datos.observacion || datos.detalles?.observaciones}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de productos según KPI */}
              {(detalles && ['IMPLEMENTACION', 'VOLUMEN / PRECIO', 'VOLUMEN', 'PRECIO'].includes((detalles.tipo_accion || '').toUpperCase())) && (
                <div className="productos-section productos-section-bonito">
                  <div className="section-header">
                    <span className="section-icon">🛒</span>
                    <h3>Productos Registrados</h3>
                  </div>
                  <div className="productos-lista">
                    {productosReconstruidos.length > 0 ? (
                      <div className="tabla-productos-modal">
                        <table className="productos-table">
                          <thead>
                            <tr>
                              <th>Referencia</th>
                              {/* Solo mostrar Presentación si existe algún valor */}
                              {productosReconstruidos.some(p => p.presentacion) && <th>Presentación</th>}
                              {/* Columnas para PRECIO */}
                              {(() => {
                                const tipo = (detalles.tipo_accion || '').toUpperCase();
                                if (tipo === 'PRECIO') {
                                  return <>
                                    <th>Precio Sugerido</th>
                                    <th>Precio Real</th>
                                  </>;
                                }
                                if (tipo === 'VOLUMEN') {
                                  return <>
                                    <th>Nº Cajas</th>
                                    <th>Galones</th>
                                  </>;
                                }
                                if (tipo === 'VOLUMEN / PRECIO' || tipo === 'PRECIO_VOLUMEN') {
                                  return <>
                                    <th>Precio Sugerido</th>
                                    <th>Precio Real</th>
                                    <th>Nº Cajas</th>
                                    <th>Galones</th>
                                  </>;
                                }
                                // IMPLEMENTACION: mostrar todo si hay datos
                                if (tipo === 'IMPLEMENTACION') {
                                  return <>
                                    <th>Precio Sugerido</th>
                                    <th>Precio Real</th>
                                    <th>Nº Cajas</th>
                                    <th>Galones</th>
                                  </>;
                                }
                                return null;
                              })()}
                            </tr>
                          </thead>
                          <tbody>
                            {productosReconstruidos.map((prod, idx) => {
                              const tipo = (detalles.tipo_accion || '').toUpperCase();
                              return (
                                <tr key={idx}>
                                  <td className="referencia-cell">{prod.referencia}</td>
                                  {productosReconstruidos.some(p => p.presentacion) && (
                                    <td className="presentacion-cell">{prod.presentacion}</td>
                                  )}
                                  {/* PRECIO */}
                                  {(tipo === 'PRECIO') && <>
                                    <td className="precio-cell">{prod.precio_sugerido ? `$${Number(prod.precio_sugerido).toLocaleString('es-CO')}` : '-'}</td>
                                    <td className="precio-cell">{prod.precio_real ? `$${Number(prod.precio_real).toLocaleString('es-CO')}` : '-'}</td>
                                  </>}
                                  {/* VOLUMEN */}
                                  {(tipo === 'VOLUMEN') && <>
                                    <td className="cantidad-cell">{prod.cantidad || '-'}</td>
                                    <td className="cantidad-cell">{prod.galones || '-'}</td>
                                  </>}
                                  {/* VOLUMEN / PRECIO o IMPLEMENTACION */}
                                  {(tipo === 'VOLUMEN / PRECIO' || tipo === 'PRECIO_VOLUMEN' || tipo === 'IMPLEMENTACION') && <>
                                    <td className="precio-cell">{prod.precio_sugerido ? `$${Number(prod.precio_sugerido).toLocaleString('es-CO')}` : '-'}</td>
                                    <td className="precio-cell">{prod.precio_real ? `$${Number(prod.precio_real).toLocaleString('es-CO')}` : '-'}</td>
                                    <td className="cantidad-cell">{prod.cantidad || '-'}</td>
                                    <td className="cantidad-cell">{prod.galones || '-'}</td>
                                  </>}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="no-productos">
                        <div className="no-productos-icon">📦</div>
                        <span>No hay productos registrados</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección de fotos en tabla */}
              {/* Sección de fotos grandes con scroll horizontal según KPI */}
              {(() => {
                const getFullUrl = (ruta) => {
                  if (!ruta) return '';
                  if (ruta.startsWith('http')) return ruta;
                  if (ruta.startsWith('/')) return window.location.origin + ruta;
                  return window.location.origin + '/' + ruta;
                };
                const getArr = (valor) => (valor ? valor.split(',').map(f => f.trim()).filter(f => !!f) : []);
                const arrPop = getArr(detalles?.foto_pop);
                const arrFactura = getArr(detalles?.foto_factura);
                const tipoKpi = (detalles?.tipo_accion || registro?.tipo_kpi || '').toLowerCase();

                if (tipoKpi === 'precio_volumen' || tipoKpi === 'volumen / precio') {
                  return (
                    <div className="fotos-evidencia-grande">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">💰</span>
                          <h3>Foto POP (Implementación)</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {arrPop.length > 0 ? arrPop.map((ruta, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(ruta)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(ruta)}
                                alt={`Foto POP ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = '/storage/img_productos_carrusel/img_login.png'; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                      </div>
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">📋</span>
                          <h3>Foto Factura</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {arrFactura.length > 0 ? arrFactura.map((ruta, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(ruta)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(ruta)}
                                alt={`Foto Factura ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = '/storage/img_productos_carrusel/img_login.png'; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (tipoKpi === 'volumen') {
                  return (
                    <div className="fotos-evidencia-grande">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">📋</span>
                          <h3>Foto Factura</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {arrFactura.length > 0 ? arrFactura.map((ruta, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(ruta)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(ruta)}
                                alt={`Foto Factura ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = '/storage/img_productos_carrusel/img_login.png'; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (tipoKpi === 'precio') {
                  return (
                    <div className="fotos-evidencia-grande">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">💰</span>
                          <h3>Foto POP (Implementación)</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {arrPop.length > 0 ? arrPop.map((ruta, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(ruta)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(ruta)}
                                alt={`Foto POP ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = '/storage/img_productos_carrusel/img_login.png'; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
