import React, { useEffect, useState } from 'react';

export default function RegistroModal({ isOpen, onClose, registro, loading, isMobile }) {
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
    
    // Si no hay objeto productos, intentamos reconstruir desde campos separados
    if (datos?.referencias) {
      console.log("Reconstruyendo productos desde campos separados");
      console.log("Referencias:", datos.referencias);
      console.log("Presentaciones:", datos.presentaciones);
      console.log("Cantidades:", datos.cantidades_cajas);
      console.log("Galones:", datos.galonajes);
      console.log("Precios reales:", datos.precios_reales);
      console.log("Precios sugeridos:", datos.precios_sugeridos);
      
      const refs = datos.referencias.split(',').map(r => r.trim()).filter(r => r);
      const presentaciones = (datos.presentaciones || '').split(',').map(p => p.trim());
      const preciosReales = (datos.precios_reales || '').split(',').map(p => p.trim());
      const preciosSugeridos = (datos.precios_sugeridos || '').split(',').map(p => p.trim());
      const cantidades = (datos.cantidades_cajas || '').split(',').map(c => c.trim());
      const galones = (datos.galonajes || '').split(',').map(g => g.trim());
      const marcas = (datos.marcas || '').split(',').map(m => m.trim());
      
      // Crear un Set para evitar duplicados basados en referencia_id
      const productosUnicos = new Map();
      
      refs.forEach((ref, idx) => {
        if (ref && !productosUnicos.has(ref)) {
          productosUnicos.set(ref, {
            referencia_id: ref,
            presentacion: presentaciones[idx] || '',
            precio_real: preciosReales[idx] || '',
            precio_sugerido: preciosSugeridos[idx] || '',
            cantidad_cajas: cantidades[idx] || '',
            conversion_galonaje: galones[idx] || '',
            marca: marcas[idx] || '',
          });
        }
      });
      
      const productos = Array.from(productosUnicos.values());
      console.log("Productos reconstruidos sin duplicados:", productos);
      return productos;
    }
    
    return [];
  })();

  // Función para obtener URL completa de la foto
  const getFullUrl = (rutaFoto) => {
    if (!rutaFoto) return '/storage/img_productos_carrusel/img_login.png';
    if (rutaFoto.startsWith('http')) return rutaFoto;
    return `${window.location.origin}${rutaFoto.startsWith('/') ? '' : '/'}${rutaFoto}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">📋</span>
            <div className="title-content">
              <h2>Detalles del Registro</h2>
              <small>
                PDV {datos.codigo || '-'} - {datos.tipo_accion || '-'}
              </small>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Contenido del modal */}
        <div className="modal-body">
          {loading || !detalles ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando detalles...</p>
            </div>
          ) : (
            <>
              {/* Información principal */}
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
                      <span className="codigo-value">{datos.codigo || '-'}</span>
                    </div>
                    <div className="info-row">
                      <label>Nombre:</label>
                      <span>{datos.descripcion || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <label>Dirección:</label>
                      <span>{datos.direccion || 'N/A'}</span>
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
                      <span className="agente-value">{datos.nombre_usuario || datos.name || 'N/A'}</span>
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
                      <span className={`estado-badge ${getEstadoClass(datos.estado)}`}>
                        {datos.estado || 'N/A'}
                      </span>
                    </div>
                    {/* <div className="info-row">
                      <label>Estado Agente:</label>
                      <span className={`estado-badge ${getEstadoClass(datos.estado_agente)}`}>
                        {datos.estado_agente || 'N/A'}
                      </span>
                    </div> */}
                    <div className="info-row">
                      <label>Fecha:</label>
                      <span className="fecha-value">{formatearFecha(datos.fecha_registro)}</span>
                    </div>
                    {/* Observaciones dentro de la tarjeta de registro - SIEMPRE MOSTRAR */}
                    <div className="info-row">
                      <label>Observaciones:</label>
                      <span className="observacion-text">
                        {datos.observacion || 'Sin observaciones'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Información del Agente */}
                {datos.agente && (
                  <div className="info-card">
                    <div className="card-header">
                      <span className="card-icon">👤</span>
                      <h4>Información del Agente</h4>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <label>Nombre:</label>
                        <span>{datos.agente.nombre || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <label>Descripción:</label>
                        <span>{datos.agente.descripcion || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <label>Email:</label>
                        <span>{datos.agente.email || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <label>Teléfono:</label>
                        <span>{datos.agente.telefono || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tarjeta Resumen */}
                {datos.resumen && (
                  <div className="info-card">
                    <div className="card-header">
                      <span className="card-icon">📊</span>
                      <h4>Resumen</h4>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <label>Total Cajas:</label>
                        <span>{datos.resumen.total_cajas || 0}</span>
                      </div>
                      <div className="info-row">
                        <label>Total Galones:</label>
                        <span>{datos.resumen.total_galones || 0}</span>
                      </div>
                      <div className="info-row">
                        <label>Valor Total:</label>
                        <span>${(datos.resumen.valor_total_implementado || 0).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de productos */}
              {productosReconstruidos.length > 0 && (
                <div className="productos-section">
                  <div className="section-header">
                    <span className="section-icon">🛒</span>
                    <h3>Productos Registrados</h3>
                  </div>
                  <div className="tabla-productos-modal" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                    <table className="productos-table" style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th>Referencia</th>
                          <th>Presentación</th>
                          {/* Mostrar columnas de precio para KPI de precio o volumen/precio */}
                          {(() => {
                            const tipoKpi = datos.tipo_kpi?.toLowerCase();
                            console.log("🔍 DEBUG - Tipo KPI para columnas:", tipoKpi);
                            console.log("🔍 DEBUG - Condición precio:", (tipoKpi === 'precio' || tipoKpi === 'volumen / precio'));
                            console.log("🔍 DEBUG - Condición volumen:", (tipoKpi === 'volumen' || tipoKpi === 'volumen / precio'));
                            
                            const mostrarPrecio = (tipoKpi === 'precio' || tipoKpi === 'volumen / precio');
                            const mostrarVolumen = (tipoKpi === 'volumen' || tipoKpi === 'volumen / precio');
                            
                            return (
                              <>
                                {mostrarPrecio && <th>Precio Sugerido</th>}
                                {mostrarPrecio && <th>Precio Real</th>}
                                {mostrarVolumen && <th>Cantidad Cajas</th>}
                                {mostrarVolumen && <th>Galonajes</th>}
                              </>
                            );
                          })()}
                        </tr>
                      </thead>
                      <tbody>
                        {productosReconstruidos.map((producto, index) => {
                          const tipoKpi = datos.tipo_kpi?.toLowerCase();
                          const mostrarPrecio = (tipoKpi === 'precio' || tipoKpi === 'volumen / precio');
                          const mostrarVolumen = (tipoKpi === 'volumen' || tipoKpi === 'volumen / precio');
                          
                          console.log(`🔍 DEBUG - Fila ${index + 1}:`, {
                            tipoKpi,
                            mostrarPrecio,
                            mostrarVolumen,
                            producto
                          });
                          
                          return (
                            <tr key={index}>
                              <td className="referencia-cell">{producto.referencia_id}</td>
                              <td className="presentacion-cell">{producto.presentacion}</td>
                              
                              {/* Mostrar datos de precio para KPI de precio o volumen/precio */}
                              {mostrarPrecio && (
                                <>
                                  <td className="precio-cell">
                                    ${Number(producto.precio_sugerido || 0).toLocaleString('es-CO')}
                                  </td>
                                  <td className="precio-cell">
                                    ${Number(producto.precio_real || 0).toLocaleString('es-CO')}
                                  </td>
                                </>
                              )}
                              
                              {/* Mostrar datos de volumen para KPI de volumen o volumen/precio */}
                              {mostrarVolumen && (
                                <>
                                  <td className="cantidad-cell">{producto.cantidad_cajas || 0}</td>
                                  <td className="cantidad-cell">{producto.conversion_galonaje || 0}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sección de fotos */}
              {(() => {
                console.log("Procesando fotos - datos completos:", datos);
                console.log("fotos_factura:", datos.fotos_factura);
                console.log("fotos_pop:", datos.fotos_pop);
                console.log("fotos_seguimiento:", datos.fotos_seguimiento);
                
                const fotosFactura = datos.fotos_factura ? 
                  [...new Set(datos.fotos_factura.split(',').map(f => f.trim()).filter(f => f && f !== 'null'))] : [];
                const fotosPop = datos.fotos_pop ? 
                  [...new Set(datos.fotos_pop.split(',').map(f => f.trim()).filter(f => f && f !== 'null'))] : [];
                const fotosSeguimiento = datos.fotos_seguimiento ? 
                  [...new Set(datos.fotos_seguimiento.split(',').map(f => f.trim()).filter(f => f && f !== 'null'))] : [];
                
                console.log("Fotos procesadas - Factura:", fotosFactura);
                console.log("Fotos procesadas - POP:", fotosPop);
                console.log("Fotos procesadas - Seguimiento:", fotosSeguimiento);
                
                const tipoKpi = datos.tipo_kpi?.toLowerCase();
                const tipoAccion = datos.tipo_accion?.toLowerCase();
                
                console.log("Tipo KPI:", tipoKpi);
                console.log("Tipo Acción:", tipoAccion);
                
                const fotoDefault = '/storage/img_productos_carrusel/img_login.png';

                if (tipoKpi === 'volumen / precio') {
                  return (
                    <div className="fotos-evidencia">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">💰</span>
                          <h3>Foto POP (Implementación)</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {fotosPop.length > 0 ? fotosPop.map((foto, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(foto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(foto)}
                                alt={`Foto POP ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = fotoDefault; }}
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
                          {fotosFactura.length > 0 ? fotosFactura.map((foto, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(foto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(foto)}
                                alt={`Foto Factura ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = fotoDefault; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                      </div>
                    </div>
                  );
                } else if (tipoKpi === 'precio') {
                  return (
                    <div className="fotos-evidencia">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">💰</span>
                          <h3>Foto POP (Implementación)</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {fotosPop.length > 0 ? fotosPop.map((foto, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(foto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(foto)}
                                alt={`Foto POP ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = fotoDefault; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                        <div className="foto-info">
                          <small>Evidencia de la implementación de material POP y validación de precios</small>
                        </div>
                      </div>
                    </div>
                  );
                } else if (tipoKpi === 'volumen') {
                  return (
                    <div className="fotos-evidencia">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">📋</span>
                          <h3>Foto Factura</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {fotosFactura.length > 0 ? fotosFactura.map((foto, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(foto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(foto)}
                                alt={`Foto Factura ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = fotoDefault; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                      </div>
                    </div>
                  );
                } else if (tipoKpi === 'frecuencia') {
                  return (
                    <div className="fotos-evidencia">
                      <div className="foto-section">
                        <div className="section-header">
                          <span className="section-icon">📸</span>
                          <h3>Foto Seguimiento</h3>
                        </div>
                        <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                          {fotosSeguimiento.length > 0 ? fotosSeguimiento.map((foto, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(foto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver imagen en tamaño completo"
                              style={{ display: 'inline-block' }}
                            >
                              <img
                                src={getFullUrl(foto)}
                                alt={`Foto Seguimiento ${idx + 1}`}
                                style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                onError={e => { e.target.src = fotoDefault; }}
                              />
                            </a>
                          )) : <span style={{ color: '#bbb' }}>Sin imagen</span>}
                        </div>
                        <div className="foto-info">
                          <small>Evidencia de la visita de seguimiento</small>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Mostrar todas las fotos disponibles si no hay tipo específico
                if (fotosFactura.length > 0 || fotosPop.length > 0 || fotosSeguimiento.length > 0) {
                  return (
                    <div className="fotos-evidencia">
                      {fotosPop.length > 0 && (
                        <div className="foto-section">
                          <div className="section-header">
                            <span className="section-icon">💰</span>
                            <h3>Foto POP</h3>
                          </div>
                          <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                            {fotosPop.map((foto, idx) => (
                              <a
                                key={idx}
                                href={getFullUrl(foto)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver imagen en tamaño completo"
                                style={{ display: 'inline-block' }}
                              >
                                <img
                                  src={getFullUrl(foto)}
                                  alt={`Foto POP ${idx + 1}`}
                                  style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                  onError={e => { e.target.src = fotoDefault; }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {fotosFactura.length > 0 && (
                        <div className="foto-section">
                          <div className="section-header">
                            <span className="section-icon">📋</span>
                            <h3>Foto Factura</h3>
                          </div>
                          <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                            {fotosFactura.map((foto, idx) => (
                              <a
                                key={idx}
                                href={getFullUrl(foto)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver imagen en tamaño completo"
                                style={{ display: 'inline-block' }}
                              >
                                <img
                                  src={getFullUrl(foto)}
                                  alt={`Foto Factura ${idx + 1}`}
                                  style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                  onError={e => { e.target.src = fotoDefault; }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {fotosSeguimiento.length > 0 && (
                        <div className="foto-section">
                          <div className="section-header">
                            <span className="section-icon">📸</span>
                            <h3>Foto Seguimiento</h3>
                          </div>
                          <div className="fotos-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
                            {fotosSeguimiento.map((foto, idx) => (
                              <a
                                key={idx}
                                href={getFullUrl(foto)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver imagen en tamaño completo"
                                style={{ display: 'inline-block' }}
                              >
                                <img
                                  src={getFullUrl(foto)}
                                  alt={`Foto Seguimiento ${idx + 1}`}
                                  style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                                  onError={e => { e.target.src = fotoDefault; }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
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