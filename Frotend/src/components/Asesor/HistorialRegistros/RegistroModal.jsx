import React, { useEffect, useState } from 'react';
import { construirUrlImagen, abrirImagenEnNuevaPestana } from '../../../utils/imageUtils';

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
      year: 'numeric'
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


  // Reconstruir productos usando los datos completos
  const productosReconstruidos = (() => {


    // Primero intentamos usar el objeto productos si existe
    if (datos?.productos && Array.isArray(datos.productos) && datos.productos.length > 0) {
      return datos.productos;
    }
    
    // Si no hay objeto productos, intentamos reconstruir desde campos separados
    if (datos?.referencias) {      const refs = datos.referencias.split(',').map(r => r.trim()).filter(r => r);
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

  // Función para obtener URL completa de la foto - ahora usa la utilidad
  const getFullUrl = (rutaFoto) => {
    const url = construirUrlImagen(rutaFoto);
    return url || '/storage/img_productos_carrusel/img_login.png';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isMobile ? 'mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="modal-header">
          <div className="modal-title">
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
              {/* Información principal - Diseño Mejorado */}
              <div className="info-cards-container-moderna">
                {/* Tarjeta PDV Moderna */}
                <div className="info-card-moderna pdv-card">
                  <div className="card-header-moderna">
                    <div className="card-icon-container">
                      <span className="card-icon-moderna">🏪</span>
                    </div>
                    <div className="card-title-section">
                      <h4>Información del PDV</h4>
                      <span className="card-subtitle">Datos del punto de venta</span>
                    </div>
                  </div>
                  <div className="card-content-moderna">
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">🏷️</span>
                        <span>Código</span>
                      </div>
                      <span className="codigo-value-moderna">{datos.codigo || '-'}</span>
                    </div>
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">🏢</span>
                        <span>Nombre</span>
                      </div>
                      <span className="info-value">{datos.descripcion || 'N/A'}</span>
                    </div>
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">📍</span>
                        <span>Dirección</span>
                      </div>
                      <span className="info-value direccion-text">{datos.direccion || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Registro Moderna */}
                <div className="info-card-moderna registro-card">
                  <div className="card-header-moderna">
                    <div className="card-icon-container">
                      <span className="card-icon-moderna">�</span>
                    </div>
                    <div className="card-title-section">
                      <h4>Información del Registro</h4>
                      <span className="card-subtitle">Detalles de la actividad</span>
                    </div>
                  </div>
                  <div className="card-content-moderna">
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">🧑‍💼</span>
                        <span>Agente</span>
                      </div>
                      <span className="agente-value-moderna">{datos.nombre_usuario || datos.name || 'N/A'}</span>
                    </div>
                    
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">📊</span>
                        <span>KPI</span>
                      </div>
                      <div className="kpi-badges-container-moderna">
                        {(() => {
                          const kpi = (datos.tipo_kpi || '').toLowerCase();
                          if (kpi === 'volumen / precio') {
                            return (
                              <div className="kpi-group">
                                <span className="kpi-badge-moderna kpi-precio">💰 PRECIO</span>
                                <span className="kpi-badge-moderna kpi-volumen">📦 VOLUMEN</span>
                              </div>
                            );
                          } else if (kpi === 'precio') {
                            return <span className="kpi-badge-moderna kpi-precio">💰 PRECIO</span>;
                          } else if (kpi === 'volumen') {
                            return <span className="kpi-badge-moderna kpi-volumen">📦 VOLUMEN</span>;
                          } else if (kpi === 'frecuencia') {
                            return <span className="kpi-badge-moderna kpi-frecuencia">📅 FRECUENCIA</span>;
                          } else if (kpi) {
                            return <span className="kpi-badge-moderna">{kpi.toUpperCase()}</span>;
                          } else {
                            return <span className="kpi-badge-moderna kpi-na">❓ N/A</span>;
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">⚡</span>
                        <span>Actividad</span>
                      </div>
                      <span className={`actividad-badge ${datos.tipo_accion?.toLowerCase().replace('ó', 'o')}`}>
                        {datos.tipo_accion === 'Implementación' ? '🔧 ' : datos.tipo_accion === 'Visita' ? '👁️ ' : '📋 '}
                        {datos.tipo_accion || '-'}
                      </span>
                    </div>
                    
                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">📅</span>
                        <span>Fecha Factura</span>
                      </div>
                      <span className="fecha-value-moderna">{datos.fecha_registro}</span>
                    </div>

                    <div className="info-row-moderna">
                      <div className="info-label">
                        <span className="label-icon">📅</span>
                        <span>Fecha Creacion</span>
                      </div>
                      <span className="fecha-value-moderna">{datos.created_at}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Estados */}
                <div className="info-card-moderna estados-card">
                  <div className="card-header-moderna">
                    <div className="card-icon-container">
                      <span className="card-icon-moderna">📊</span>
                    </div>
                    <div className="card-title-section">
                      <h4>Estados del Registro</h4>
                      <span className="card-subtitle">Validaciones y aprobaciones</span>
                    </div>
                  </div>
                  <div className="card-content-moderna">
                    <div className="estados-grid">
                      <div className="estado-item">
                        <div className="estado-label">
                          <span className="estado-icon">🏢</span>
                          <span>BackOffice</span>
                        </div>
                        <span className={`estado-badge-moderna ${getEstadoClass(datos.estado_backoffice)}`}>
                          {datos.estado_backoffice === 'Aceptado' ? '✅' : datos.estado_backoffice === 'Rechazado' ? '❌' : '⏳'}
                          {datos.estado_backoffice || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="estado-item">
                        <div className="estado-label">
                          <span className="estado-icon">👨‍💼</span>
                          <span>Agente</span>
                        </div>
                        <span className={`estado-badge-moderna ${getEstadoClass(datos.estado_agente)}`}>
                          {datos.estado_agente === 'Aceptado' ? '✅' : datos.estado_agente === 'Rechazado' ? '❌' : '⏳'}
                          {datos.estado_agente || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nueva Tarjeta Comentarios del Sistema */}
                <div className="info-card-moderna comentarios-sistema-card">
                  <div className="card-header-moderna">
                    <div className="card-icon-container">
                      <span className="card-icon-moderna">💭</span>
                    </div>
                    <div className="card-title-section">
                      <h4>Comentarios del Sistema</h4>
                      <span className="card-subtitle">Observaciones de BackOffice y Agente</span>
                    </div>
                  </div>
                  <div className="card-content-moderna">
                    <div className="comentarios-grid">
                      {/* Comentario BackOffice */}
                      <div className="comentario-item">
                        <div className="comentario-header">
                          <div className="comentario-label">
                            <span className="comentario-icon">🏢</span>
                            <span className="comentario-title">BackOffice</span>
                          </div>
                          <span className={`estado-mini-badge ${getEstadoClass(datos.estado_backoffice)}`}>
                            {datos.estado_backoffice || 'Sin estado'}
                          </span>
                        </div>
                        <div className="comentario-contenido">
                          {datos.observacion_backoffice || datos.comentario_backoffice ? (
                            <p className="comentario-texto">
                              📝 {datos.observacion_backoffice || datos.comentario_backoffice}
                            </p>
                          ) : (
                            <p className="comentario-vacio">
                              <span className="icono-vacio">📭</span>
                              Sin comentarios del BackOffice
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Comentario Agente */}
                      <div className="comentario-item">
                        <div className="comentario-header">
                          <div className="comentario-label">
                            <span className="comentario-icon">👨‍💼</span>
                            <span className="comentario-title">Agente Comercial</span>
                          </div>
                          <span className={`estado-mini-badge ${getEstadoClass(datos.estado_agente)}`}>
                            {datos.estado_agente || 'Sin estado'}
                          </span>
                        </div>
                        <div className="comentario-contenido">
                          {datos.observacion_agente || datos.comentario_agente ? (
                            <p className="comentario-texto">
                              📝 {datos.observacion_agente || datos.comentario_agente}
                            </p>
                          ) : (
                            <p className="comentario-vacio">
                              <span className="icono-vacio">📭</span>
                              Sin comentarios del Agente
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Observaciones */}
                {(datos.observacion_asesor || datos.observacion_agente) && (
                  <div className="info-card-moderna observaciones-card-completa">
                    <div className="card-header-moderna">
                      <div className="card-icon-container">
                        <span className="card-icon-moderna">💬</span>
                      </div>
                      <div className="card-title-section">
                        <h4>Observaciones</h4>
                        <span className="card-subtitle">Comentarios y notas</span>
                      </div>
                    </div>
                    <div className="card-content-moderna">
                      {datos.observacion_asesor && (
                        <div className="observacion-item asesor">
                          <div className="observacion-header">
                            <span className="observacion-tipo">👨‍💼 Observaciones del Asesor</span>
                          </div>
                          <div className="observacion-contenido">
                            {datos.observacion_asesor}
                          </div>
                        </div>
                      )}
                      
                      {datos.observacion_agente && (
                        <div className="observacion-item agente">
                          <div className="observacion-header">
                            <span className="observacion-tipo">🏢 Observaciones del Agente</span>
                          </div>
                          <div className="observacion-contenido">
                            {datos.observacion_agente}
                          </div>
                        </div>
                      )}
                      
                      {!datos.observacion_asesor && !datos.observacion_agente && (
                        <div className="sin-observaciones">
                          <span className="sin-obs-icon">📝</span>
                          <span>No hay observaciones registradas</span>
                        </div>
                      )}
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

              {/* Sección de Implementación - Diseño Mejorado */}
              {datos.tipo_accion?.toLowerCase() === 'implementación' && (
                <div className="implementacion-section-moderna">
                  {/* Header de la sección */}
                  <div className="implementacion-header">

                    <div className="implementacion-title">
                      <h3>Información de Implementación</h3>
                      <span className="implementacion-subtitle">Detalles del proceso de implementación</span>
                    </div>
                  </div>

                  {/* Grid de información principal */}
                  <div className="implementacion-grid">
                    {/* Card de estado */}
                    <div className="implementacion-card status-card">
                      <div className="card-header">
                        <span className="card-icon">📋</span>
                        <h4>¿Acepta Implementación?</h4>
                      </div>
                      <div className="card-body">
                        <div className="status-row">
                          <span className="status-label">Número:</span>
                          <span className="implementacion-numero">{datos.nro_implementacion || 'N/A'}</span>
                        </div>
                        <div className="status-row">
                          <span className="status-label">Estado:</span>
                          <span className={`implementacion-estado ${datos.acepto_implementacion?.toLowerCase() === 'si' ? 'aceptado' : 'rechazado'}`}>
                            {datos.acepto_implementacion === 'Si' ? '✅ Aceptado' : datos.acepto_implementacion === 'No' ? '❌ Rechazado' : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card de observaciones */}
                    <div className="implementacion-card observaciones-card">
                      <div className="card-header">
                        <span className="card-icon">💬</span>
                        <h4>Observaciones</h4>
                      </div>
                      <div className="card-body">
                        <div className="observaciones-contenido">
                          {datos.observacion_implementacion || 'Sin observaciones registradas'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Productos Implementados */}
                  {datos.productos_implementados && (
                    <div className="productos-implementados-section">
                      <div className="productos-header">
                        <span className="productos-icon">📦</span>
                        <h4>Productos Implementados</h4>
                      </div>
                      <div className="productos-grid">
                        {(() => {
                          const productos = datos.productos_implementados.split(',').map(p => p.trim()).filter(p => p);
                          const numeros = datos.nros_productos ? datos.nros_productos.split(',').map(n => n.trim()).filter(n => n) : [];
                          
                          return productos.map((producto, idx) => (
                            <div key={idx} className="producto-card">
                              <div className="producto-info">
                                <span className="producto-nombre">{producto}</span>
                                <span className="producto-codigo">#{idx + 1}</span>
                              </div>
                              {numeros[idx] && (
                                <div className="producto-cantidad-badge">
                                  <span>Cantidad: {numeros[idx]}</span>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Sección de Fotos */}
                  <div className="fotos-implementacion-section">
                    {/* Foto de Remisión */}
                    {datos.foto_remision && (
                      <div className="foto-card">
                        <div className="foto-card-header">
                          <span className="foto-icon">📄</span>
                          <h4>Foto de Remisión</h4>
                        </div>
                        <div className="foto-container">
                          <a
                            href={getFullUrl(datos.foto_remision)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="foto-link"
                          >
                            <img
                              src={getFullUrl(datos.foto_remision)}
                              alt="Foto de Remisión"
                              className="foto-preview"
                              onError={e => { e.target.src = '/storage/img_productos_carrusel/img_login.png'; }}
                            />
                            <div className="foto-overlay">
                              <span>👁️ Ver imagen completa</span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Fotos de Evidencia */}
                    {datos.fotos_evidencia && (
                      <div className="foto-card">
                        <div className="foto-card-header">
                          <span className="foto-icon">📸</span>
                          <h4>Fotos de Evidencia</h4>
                        </div>
                        <div className="evidencia-grid">
                          {datos.fotos_evidencia.split(',').map(f => f.trim()).filter(f => f && f !== 'null').map((foto, idx) => (
                            <a
                              key={idx}
                              href={getFullUrl(foto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="evidencia-link"
                            >
                              <img
                                src={getFullUrl(foto)}
                                alt={`Evidencia ${idx + 1}`}
                                className="evidencia-preview"
                                onError={e => { e.target.src = '/storage/img_productos_carrusel/img_login.png'; }}
                              />
                              <div className="evidencia-overlay">
                                <span>📷 {idx + 1}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección de fotos - Solo para actividades que NO son implementación */}
              {datos.tipo_accion?.toLowerCase() !== 'implementación' && (() => {
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
                      {/* <div className="foto-section">
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
                      </div> */}
                      
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