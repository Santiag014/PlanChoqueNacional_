import React, { useState } from 'react';
import '../../../styles/Mercadeo/registro-detalle-modal.css';
import { construirUrlImagen, abrirImagenEnNuevaPestana } from '../../../utils/imageUtils';

export default function RegistroDetalleModal({ 
  registro, 
  isOpen, 
  onClose, 
  onAprobar, 
  onRechazar 
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [accion, setAccion] = useState('');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccionClick = (tipoAccion) => {
    setAccion(tipoAccion);
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accion || !comentario.trim()) return;

    setLoading(true);
    
    try {
      if (accion === 'aprobar') {
        await onAprobar(registro.id, comentario);
      } else if (accion === 'rechazar') {
        await onRechazar(registro.id, comentario);
      }
      handleClose();
    } catch (error) {
      console.error('Error al procesar la acción:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAccion('');
    setComentario('');
    setMostrarFormulario(false);
    onClose();
  };

  if (!isOpen || !registro) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      // Si la fecha viene como string de solo fecha (YYYY-MM-DD), la parseamos directamente
      let fechaObj;
      if (typeof fecha === 'string' && fecha.includes('T')) {
        // Es un datetime completo, extraemos solo la parte de la fecha
        fechaObj = new Date(fecha.split('T')[0] + 'T12:00:00.000Z');
      } else if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Es solo fecha en formato YYYY-MM-DD
        fechaObj = new Date(fecha + 'T12:00:00.000Z');
      } else {
        // Otro formato, intentamos parsearlo directamente
        fechaObj = new Date(fecha);
      }
      
      // Verificamos que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida recibida:', fecha);
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Valor recibido:', fecha);
      return 'Fecha inválida';
    }
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      // Para fechas con hora, esperamos un datetime completo
      const fechaObj = new Date(fecha);
      
      // Verificamos que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha y hora inválida recibida:', fecha);
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Bogota' // Ajusta según tu zona horaria
      });
    } catch (error) {
      console.error('Error formateando fecha y hora:', error, 'Valor recibido:', fecha);
      return 'Fecha inválida';
    }
  };

  // Procesar productos
  const productos = [];
  if (registro.referencias) {
    const referencias = registro.referencias.split(',');
    const presentaciones = registro.presentaciones ? registro.presentaciones.split(',') : [];
    const cantidades = registro.cantidades_cajas ? registro.cantidades_cajas.split(',') : [];
    const galonajes = registro.galonajes ? registro.galonajes.split(',') : [];
    const preciosSugeridos = registro.precios_sugeridos ? registro.precios_sugeridos.split(',') : [];
    const preciosReales = registro.precios_reales ? registro.precios_reales.split(',') : [];

    for (let i = 0; i < referencias.length; i++) {
      if (referencias[i] && referencias[i].trim()) {
        productos.push({
          referencia: referencias[i].trim(),
          presentacion: presentaciones[i] || 'N/A',
          cantidad: cantidades[i] || '0',
          galonaje: galonajes[i] || '0',
          precioSugerido: preciosSugeridos[i] || '0',
          precioReal: preciosReales[i] || '0'
        });
      }
    }
  }

  // Debug: Mostrar información de productos en consola
  console.log('Datos del registro:', {
    referencias: registro.referencias,
    presentaciones: registro.presentaciones,
    cantidades_cajas: registro.cantidades_cajas,
    galonajes: registro.galonajes,
    precios_sugeridos: registro.precios_sugeridos,
    precios_reales: registro.precios_reales,
    productos_procesados: productos
  });

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

  // Procesar fotos - Eliminar duplicados
  const eliminarDuplicados = (array) => {
    return [...new Set(array)];
  };

  const fotos = {
    facturas: registro.fotos_factura ? 
      eliminarDuplicados(
        registro.fotos_factura.split(',')
          .filter(f => f && f.trim() && f.trim() !== 'null')
          .map(f => limpiarRutaFoto(f.trim()))
      ) : [],
    pop: registro.fotos_pop ? 
      eliminarDuplicados(
        registro.fotos_pop.split(',')
          .filter(f => f && f.trim() && f.trim() !== 'null')
          .map(f => limpiarRutaFoto(f.trim()))
      ) : [],
    seguimiento: registro.fotos_seguimiento ? 
      eliminarDuplicados(
        registro.fotos_seguimiento.split(',')
          .filter(f => f && f.trim() && f.trim() !== 'null')
          .map(f => limpiarRutaFoto(f.trim()))
      ) : [],
    remision: registro.foto_remision ? 
      eliminarDuplicados(
        registro.foto_remision.split(',')
          .filter(f => f && f.trim() && f.trim() !== 'null')
          .map(f => limpiarRutaFoto(f.trim()))
      ) : [],
    evidencia: registro.fotos_evidencia ? 
      eliminarDuplicados(
        registro.fotos_evidencia.split(',')
          .filter(f => f && f.trim() && f.trim() !== 'null')
          .map(f => limpiarRutaFoto(f.trim()))
      ) : []
  };

  // Procesar productos de implementación
  const productosImplementacion = [];
  if (registro.productos_implementados && registro.nros_productos) {
    const productos = registro.productos_implementados.split(',');
    const numeros = registro.nros_productos.split(',');
    
    for (let i = 0; i < productos.length; i++) {
      if (productos[i] && productos[i].trim()) {
        productosImplementacion.push({
          producto: productos[i].trim(),
          numero: numeros[i] || '1'
        });
      }
    }
  }

  // Debug: Mostrar información de fotos en consola
  console.log('Datos de fotos:', {
    fotos_factura_original: registro.fotos_factura,
    fotos_pop_original: registro.fotos_pop,
    fotos_seguimiento_original: registro.fotos_seguimiento,
    fotos_procesadas: fotos
  });

  return (
    <div className="mercadeo_modal-overlay" onClick={handleClose}>
      <div className="mercadeo_modal-content mercadeo_modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalles del Registro</h2>
          <button className="btn-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="registro-info">
            {/* Información del Asesor */}
            <div className="info-section">
              <h3>Información del Asesor</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nombre:</label>
                  <span className="info-value">{registro.name}</span>
                </div>
                <div className="info-item">
                  <label>Documento:</label>
                  <span className="info-value">{registro.documento}</span>
                </div>
                <div className="info-item">
                  <label>Fecha de Registro:</label>
                  <span className="info-value">{formatearFecha(registro.fecha_registro || registro.fecha)}</span>
                </div>
                <div className="info-item">
                  <label>Fecha de Creación:</label>
                  <span className="info-value">{formatearFechaHora(registro.created_at)}</span>
                </div>
                <div className="info-item">
                  <label>ID Registro</label>
                  <span className="info-value">{registro.id}</span>
                </div>
              </div>
            </div>

            {/* Punto de Venta */}
            <div className="info-section">
              <h3>Punto de Venta</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nombre:</label>
                  <span className="info-value">{registro.descripcion}</span>
                </div>
                <div className="info-item">
                  <label>Código:</label>
                  <span className="info-value codigo-destaque">{registro.codigo}</span>
                </div>
                <div className="info-item">
                  <label>Dirección:</label>
                  <span className="info-value">{registro.direccion}</span>
                </div>
              </div>
            </div>

            {/* Actividad */}
            <div className="info-section">
              <h3>Actividad</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Tipo de Acción:</label>
                  <span className="info-value">{registro.tipo_accion}</span>
                </div>
                <div className="info-item">
                  <label>KPI:</label>
                  <div className="kpi-badges-container">
                    {(() => {
                      const kpi = (registro.tipo_kpi || '').toLowerCase();
                      if (kpi === 'volumen / precio' || kpi === 'precio / volumen') {
                        return (
                          <>
                            <span className="mercadeo_kpi-badge kpi-precio">PRECIO</span>
                            <span className="mercadeo_kpi-badge kpi-volumen">VOLUMEN</span>
                          </>
                        );
                      } else if (kpi === 'precio') {
                        return <span className="mercadeo_kpi-badge kpi-precio">PRECIO</span>;
                      } else if (kpi === 'volumen') {
                        return <span className="mercadeo_kpi-badge kpi-volumen">VOLUMEN</span>;
                      } else if (kpi === 'frecuencia') {
                        return <span className="mercadeo_kpi-badge kpi-frecuencia">FRECUENCIA</span>;
                      } else if (kpi) {
                        return <span className="mercadeo_kpi-badge kpi-otros">{kpi.toUpperCase()}</span>;
                      } else {
                        return <span className="mercadeo_kpi-badge kpi-na">N/A</span>;
                      }
                    })()}
                  </div>
                </div>
                <div className="info-item">
                  <label>Estado Agente:</label>
                  <span className={`mercadeo_estado-badge ${registro.estado_agente?.toLowerCase() || 'pendiente'}`}>
                    {registro.estado_agente || 'PENDIENTE'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Estado BackOffice:</label>
                  <span className={`mercadeo_estado-badge ${registro.estado_backoffice?.toLowerCase() || 'pendiente'}`}>
                    {registro.estado_backoffice || 'PENDIENTE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="info-section">
              <h3>Productos Implementados</h3>
              {productos.length > 0 ? (
                <div className="productos-tabla-container">
                  <table className="productos-tabla">
                    <thead>
                      <tr>
                        <th>Referencia</th>
                        <th>Presentación</th>
                        <th>Cantidad (Cajas)</th>
                        <th>Galonaje</th>
                        <th>Precio Sugerido</th>
                        <th>Precio Real</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((producto, index) => (
                        <tr key={index}>
                          <td className="producto-referencia">{producto.referencia}</td>
                          <td>{producto.presentacion}</td>
                          <td className="producto-cantidad">{producto.cantidad}</td>
                          <td className="producto-galonaje">{producto.galonaje}</td>
                          <td className="producto-precio">${parseFloat(producto.precioSugerido).toLocaleString()}</td>
                          <td className="producto-precio">${parseFloat(producto.precioReal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-productos">
                  <div className="no-productos-icon">📦</div>
                  <p>No hay productos registrados para esta implementación</p>
                </div>
              )}
            </div>

            {/* Sección específica de Implementación */}
            {registro.tipo_accion === 'Implementación' && (
              <div className="info-section implementacion-section">
                <h3>🛠️ Información de Implementación</h3>
                
                <div className="info-grid">
                  <div className="info-item">
                    <label>Número de Implementación:</label>
                    <span className="info-value">{registro.nro_implementacion || 'No asignado'}</span>
                  </div>
                  <div className="info-item">
                    <label>¿Acepta Implementación?:</label>
                    <span className={`implementacion-badge ${registro.acepto_implementacion?.toLowerCase()}`}>
                      {registro.acepto_implementacion || 'Pendiente'}
                    </span>
                  </div>
                </div>

                {registro.observacion_implementacion && (
                  <div className="observacion-implementacion">
                    <h4>Observación de Implementación:</h4>
                    <div className="observacion-contenido">
                      <p>{registro.observacion_implementacion}</p>
                    </div>
                  </div>
                )}

                {productosImplementacion.length > 0 && (
                  <div className="productos-implementacion">
                    <h4>📦 Productos Implementados:</h4>
                    <div className="productos-impl-tabla-container">
                      <table className="productos-impl-tabla">
                        <thead>
                          <tr>
                            <th>PRODUCTO</th>
                            <th>CANTIDAD</th>
                            <th>FOTO EVIDENCIA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosImplementacion.map((item, index) => {
                            // Obtener la foto de evidencia correspondiente a este producto
                            const fotoEvidencia = fotos.evidencia[index] || null;
                            
                            return (
                              <tr key={index}>
                                <td className="producto-impl-nombre">{item.producto}</td>
                                <td className="producto-impl-cantidad">
                                  <span className="cantidad-badge">{item.numero}</span>
                                </td>
                                <td className="producto-impl-foto">
                                  {fotoEvidencia ? (
                                    <div className="foto-evidencia-mini">
                                      <img 
                                        src={construirUrlImagen(fotoEvidencia)} 
                                        alt={`Evidencia ${item.producto}`}
                                        className="foto-evidencia-preview"
                                        onClick={() => abrirImagenEnNuevaPestana(fotoEvidencia)}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="foto-error-mini" style={{display: 'none'}}>
                                        <span>📷</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="no-foto-evidencia">
                                      <span>📷</span>
                                      <small>Sin evidencia</small>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Registro Fotográfico */}
            <div className="info-section">
              <h3>Registro Fotográfico</h3>
              <div className="fotos-container">
                <div className="fotos-descripcion">
                  <p>Haz clic en las imágenes para verlas en tamaño completo en una nueva pestaña.</p>
                </div>
                
                {fotos.facturas.length > 0 && (
                  <div className="foto-categoria">
                    <h4>📋 Facturas ({fotos.facturas.length})</h4>
                    <div className="fotos-grid">
                      {fotos.facturas.map((foto, index) => {
                        const urlCompleta = construirUrlImagen(foto);
                        return (
                          <div key={index} className="foto-item_mercadeo">
                            <img 
                              src={urlCompleta} 
                              alt={`Factura ${index + 1}`}
                              className="foto-preview"
                              onClick={() => abrirImagenEnNuevaPestana(foto)}
                              onError={(e) => {
                                console.error(`Error al cargar imagen: ${urlCompleta}`);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="foto-error" style={{display: 'none'}}>
                              <span>📄</span>
                              <small>Error al cargar imagen</small>
                              <small style={{fontSize: '10px', opacity: 0.7}}>
                                {urlCompleta}
                              </small>
                            </div>
                            <div className="foto-overlay">
                              <button 
                                className="foto-btn"
                                onClick={() => abrirImagenEnNuevaPestana(foto)}
                                title="Ver imagen completa"
                              >
                                🔍 Ver completa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {fotos.pop.length > 0 && (
                  <div className="foto-categoria">
                    <h4>🎯 Material POP ({fotos.pop.length})</h4>
                    <div className="fotos-grid">
                      {fotos.pop.map((foto, index) => {
                        const urlCompleta = construirUrlImagen(foto);
                        return (
                          <div key={index} className="foto-item_mercadeo">
                            <img 
                              src={urlCompleta} 
                              alt={`POP ${index + 1}`}
                              className="foto-preview"
                              onClick={() => abrirImagenEnNuevaPestana(foto)}
                              onError={(e) => {
                                console.error(`Error al cargar imagen: ${urlCompleta}`);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="foto-error" style={{display: 'none'}}>
                              <span>🎯</span>
                              <small>Error al cargar imagen</small>
                              <small style={{fontSize: '10px', opacity: 0.7}}>
                                {urlCompleta}
                              </small>
                            </div>
                            <div className="foto-overlay">
                              <button 
                                className="foto-btn"
                                onClick={() => abrirImagenEnNuevaPestana(foto)}
                                title="Ver imagen completa"
                              >
                                🔍 Ver completa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Para Implementación: mostrar fotos de remisión y evidencia */}
                {registro.tipo_accion === 'Implementación' && (
                  <>
                    {fotos.remision.length > 0 && (
                      <div className="foto-categoria foto-remision-section">
                        <h4>📦 Foto de Remisión:</h4>
                        <div className="fotos-grid fotos-grid-remision">
                          {fotos.remision.map((foto, index) => {
                            const urlCompleta = construirUrlImagen(foto);
                            return (
                              <div key={index} className="foto-item_mercadeo foto-remision-item">
                                <img 
                                  src={urlCompleta} 
                                  alt={`Remisión ${index + 1}`}
                                  className="foto-preview foto-remision-preview"
                                  onClick={() => abrirImagenEnNuevaPestana(foto)}
                                  onError={(e) => {
                                    console.error(`Error al cargar imagen: ${urlCompleta}`);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="foto-error" style={{display: 'none'}}>
                                  <span>📦</span>
                                  <small>Error al cargar imagen</small>
                                  <small style={{fontSize: '10px', opacity: 0.7}}>
                                    {urlCompleta}
                                  </small>
                                </div>
                                <div className="foto-overlay">
                                  <button 
                                    className="foto-btn"
                                    onClick={() => abrirImagenEnNuevaPestana(foto)}
                                    title="Ver imagen completa"
                                  >
                                    🔍 Ver completa
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {fotos.evidencia.length > 0 && (
                      <div className="foto-categoria">
                        <h4>� Evidencia de Implementación ({fotos.evidencia.length})</h4>
                        <div className="fotos-grid">
                          {fotos.evidencia.map((foto, index) => {
                            const urlCompleta = construirUrlImagen(foto);
                            return (
                              <div key={index} className="foto-item_mercadeo">
                                <img 
                                  src={urlCompleta} 
                                  alt={`Evidencia ${index + 1}`}
                                  className="foto-preview"
                                  onClick={() => abrirImagenEnNuevaPestana(foto)}
                                  onError={(e) => {
                                    console.error(`Error al cargar imagen: ${urlCompleta}`);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="foto-error" style={{display: 'none'}}>
                                  <span>🔍</span>
                                  <small>Error al cargar imagen</small>
                                  <small style={{fontSize: '10px', opacity: 0.7}}>
                                    {urlCompleta}
                                  </small>
                                </div>
                                <div className="foto-overlay">
                                  <button 
                                    className="foto-btn"
                                    onClick={() => abrirImagenEnNuevaPestana(foto)}
                                    title="Ver imagen completa"
                                  >
                                    🔍 Ver completa
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Para otros tipos de acción: mostrar fotos de seguimiento */}
                {registro.tipo_accion !== 'Implementación' && fotos.seguimiento.length > 0 && (
                  <div className="foto-categoria">
                    <h4>�📈 Seguimiento ({fotos.seguimiento.length})</h4>
                    <div className="fotos-grid">
                      {fotos.seguimiento.map((foto, index) => {
                        const urlCompleta = construirUrlImagen(foto);
                        return (
                          <div key={index} className="foto-item_mercadeo">
                            <img 
                              src={urlCompleta} 
                              alt={`Seguimiento ${index + 1}`}
                              className="foto-preview"
                              onClick={() => abrirImagenEnNuevaPestana(foto)}
                              onError={(e) => {
                                console.error(`Error al cargar imagen: ${urlCompleta}`);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="foto-error" style={{display: 'none'}}>
                              <span>📈</span>
                              <small>Error al cargar imagen</small>
                              <small style={{fontSize: '10px', opacity: 0.7}}>
                                {urlCompleta}
                              </small>
                            </div>
                            <div className="foto-overlay">
                              <button 
                                className="foto-btn"
                                onClick={() => abrirImagenEnNuevaPestana(foto)}
                                title="Ver imagen completa"
                              >
                                🔍 Ver completa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Mensaje cuando no hay fotos */}
                {(() => {
                  const isImplementacion = registro.tipo_accion === 'Implementación';
                  const hasAnyPhotos = fotos.facturas.length > 0 || 
                                       fotos.pop.length > 0 || 
                                       (isImplementacion ? (fotos.remision.length > 0 || fotos.evidencia.length > 0) : fotos.seguimiento.length > 0);
                  
                  if (!hasAnyPhotos) {
                    return (
                      <div className="no-fotos">
                        <span className="no-fotos-icon">📷</span>
                        <p>No hay fotografías registradas para esta {isImplementacion ? 'implementación' : 'actividad'}</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Observaciones */}
            <div className="info-section">
              <h3>📝 Observaciones</h3>
              
              {/* Observaciones del Agente */}
              <div className="sub-observaciones">
                <h4 className="sub-titulo">Observaciones | Agente Comercial</h4>
                <div className="observacion-contenido observacion-agente">
                  <p>
                    {(registro.observaciones_agente || registro.observaciones || registro.observacion_agente || registro.comentario_agente) 
                      ? (registro.observaciones_agente || registro.observaciones || registro.observacion_agente || registro.comentario_agente)
                      : "No hay observaciones del agente registradas para esta implementación"
                    }
                  </p>
                </div>
              </div>              {/* Observaciones de BackOffice */}
              <div className="sub-observaciones">
                <h4 className="sub-titulo">Observaciones | BackOffice</h4>
                <div className="observacion-contenido observacion-backoffice">
                  <p>
                    {(registro.observacion || registro.observacion_backoffice || registro.comentario_backoffice) 
                      ? (registro.observacion || registro.observacion_backoffice || registro.comentario_backoffice)
                      : "No hay observaciones de BackOffice registradas para esta implementación"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones de Aprobación/Rechazo */}
            <div className="info-section">
              <h3>⚙️ Acciones</h3>
              {/* <div className="acciones-info">
                <p className="acciones-description">
                  Como usuario de BackOffice, puedes modificar el estado de este registro sin importar su estado actual.
                </p>
              </div> */}
              {!mostrarFormulario ? (
                <div className="acciones-principales">
                  <button 
                    className="mercadeo_btn btn-success btn-accion-principal"
                    onClick={() => handleAccionClick('aprobar')}
                  >
                    ✓ Aprobar Registro
                  </button>
                  <button 
                    className="mercadeo_btn btn-danger btn-accion-principal"
                    onClick={() => handleAccionClick('rechazar')}
                  >
                    ✗ Rechazar Registro
                  </button>
                </div>
              ) : (
                  <form onSubmit={handleSubmit} className="accion-form">
                    <div className="accion-seleccionada">
                      <span className={`accion-badge ${accion}`}>
                        {accion === 'aprobar' ? '✓ Aprobar' : '✗ Rechazar'}
                      </span>
                    </div>
                    
                    <div className="form-group_mercadeo">
                      <label>Comentario:</label>
                      <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder={`Ingrese el motivo para ${accion === 'aprobar' ? 'aprobar' : 'rechazar'} este registro...`}
                        required
                        rows="4"
                        className="comentario-textarea"
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button
                        type="button"
                        className="mercadeo_btn btn-secondary"
                        onClick={() => setMostrarFormulario(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`btn ${accion === 'aprobar' ? 'btn-success' : 'btn-danger'}`}
                        disabled={!comentario.trim() || loading}
                      >
                        {loading ? 'Procesando...' : 
                         accion === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
