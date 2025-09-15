import React, { useState } from 'react';
import { construirUrlImagen, abrirImagenEnNuevaPestana } from '../../../utils/imageUtils';

export default function RegistroDetalleModal({
  isOpen,
  onClose,
  registro,
  onAprobar,
  onRechazar
}) {
  const [comentario, setComentario] = useState('');
  const [accionSeleccionada, setAccionSeleccionada] = useState('');

  if (!isOpen || !registro) return null;

  // Debug temporal para ver qué campos de fecha están disponibles
  //console.log('🔍 DEBUG Modal - Registro completo:', registro);
  // console.log('📅 DEBUG Modal - Campos de fecha:', {
  //   created_at: registro.created_at,
  //   fecha_creacion: registro.fecha_creacion,
  //   fecha_registro: registro.fecha_registro,
  //   fecha: registro.fecha,
  //   fechaCreacionCalculada: registro.created_at || registro.fecha_creacion,
  //   todasLasLlaves: Object.keys(registro)
  // });

  const handleAprobar = () => {
    if (onAprobar) {
      onAprobar(registro.id, comentario);
      setComentario('');
      setAccionSeleccionada('');
      onClose();
    }
  };

  const handleRechazar = () => {
    if (onRechazar) {
      onRechazar(registro.id, comentario);
      setComentario('');
      setAccionSeleccionada('');
      onClose();
    }
  };

  const handleClose = () => {
    setComentario('');
    setAccionSeleccionada('');
    onClose();
  };

  const formatearFecha = (fecha) => {
    if (!fecha || fecha === null || fecha === undefined || fecha === '' || fecha === 'null') return 'No disponible';
    try {
      // Parsear la fecha de manera consistente
      let fechaObj;
      
      // Si la fecha tiene formato ISO (con T), extraer solo la parte de fecha
      if (typeof fecha === 'string' && fecha.includes('T')) {
        const fechaSolo = fecha.split('T')[0];
        fechaObj = new Date(fechaSolo + 'T12:00:00.000Z'); // Forzar mediodia UTC para evitar problemas timezone
      } else if (typeof fecha === 'string' && fecha.includes(' ')) {
        const fechaSolo = fecha.split(' ')[0];
        fechaObj = new Date(fechaSolo + 'T12:00:00.000Z'); // Forzar mediodia UTC para evitar problemas timezone
      } else {
        fechaObj = new Date(fecha);
      }
      
      if (isNaN(fechaObj.getTime())) return 'No disponible';
      
      return fechaObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Bogota' // Forzar timezone de Colombia
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'No disponible';
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return 'backoffice-estado-pendiente';
    
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower.includes('aprobado') || estadoLower.includes('validado') || estadoLower.includes('approved')) {
      return 'backoffice-estado-aprobado';
    }
    if (estadoLower.includes('rechazado') || estadoLower.includes('rejected')) {
      return 'backoffice-estado-rechazado';
    }
    if (estadoLower.includes('revision') || estadoLower.includes('revisión')) {
      return 'backoffice-estado-revision';
    }
    return 'backoffice-estado-pendiente';
  };

  const renderKPIBadges = (tipoKpi) => {
    if (!tipoKpi) return null;
    
    const kpis = tipoKpi.split('/').map(kpi => kpi.trim().toUpperCase());
    
    return (
      <div className="backoffice-kpi-badges-container">
        {kpis.map((kpi, index) => (
          <span
            key={index}
            className={`backoffice-kpi-badge ${
              kpi.includes('PRECIO') ? 'backoffice-kpi-precio' :
              kpi.includes('VOLUMEN') ? 'backoffice-kpi-volumen' :
              'backoffice-kpi-frecuencia'
            }`}
          >
            {kpi}
          </span>
        ))}
      </div>
    );
  };

  // Procesar productos similar a Mercadeo
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
      ) : []
  };

  return (
    <div className="backoffice-modal-overlay" onClick={handleClose}>
      <div className="backoffice-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="backoffice-modal-header">
          <h3>Detalle del Registro - BackOffice</h3>
          <button className="backoffice-close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="backoffice-modal-body">
          <div className="backoffice-info-cards-container">
            {/* Información del Registro */}
            <div className="backoffice-info-card">
              <div className="backoffice-card-header">
                <span className="backoffice-card-icon">📋</span>
                <h4>Información del Registro</h4>
              </div>
              <div className="backoffice-card-content">
                <div className="backoffice-info-row">
                  <label>ID:</label>
                  <span className="backoffice-codigo-value">{registro.id}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Código PDV:</label>
                  <span className="backoffice-codigo-value">{registro.codigo}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Fecha de Actividad:</label>
                  <span className="backoffice-fecha-value">{formatearFecha(registro.fecha || registro.fecha_registro)}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Fecha de Creación:</label>
                  <span className="backoffice-fecha-value">
                    {formatearFecha(registro.created_at || registro.fecha_creacion)}
                  </span>
                </div>
                <div className="backoffice-info-row">
                  <label>Tipo de Actividad:</label>
                  <span>{registro.tipo_accion || registro.actividad || 'No especificado'}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>KPI:</label>
                  {renderKPIBadges(registro.tipo_kpi)}
                </div>
              </div>
            </div>

            {/* Información del Asesor */}
            <div className="backoffice-info-card">
              <div className="backoffice-card-header">
                <span className="backoffice-card-icon">👤</span>
                <h4>Información del Asesor</h4>
              </div>
              <div className="backoffice-card-content">
                <div className="backoffice-info-row">
                  <label>Nombre:</label>
                  <span className="backoffice-asesor-value">{registro.name}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Documento:</label>
                  <span>{registro.cedula}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Estado Agente:</label>
                  <span className={`backoffice-estado-badge ${getEstadoClass(registro.estado_agente)}`}>
                    {registro.estado_agente || 'Pendiente'}
                  </span>
                </div>
                <div className="backoffice-info-row">
                  <label>Estado BackOffice:</label>
                  <span className={`backoffice-estado-badge ${getEstadoClass(registro.estado_backoffice)}`}>
                    {registro.estado_backoffice || 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Información del Punto de Venta */}
            <div className="backoffice-info-card">
              <div className="backoffice-card-header">
                <span className="backoffice-card-icon">🏪</span>
                <h4>Punto de Venta</h4>
              </div>
              <div className="backoffice-card-content">
                <div className="backoffice-info-row">
                  <label>NIT:</label>
                  <span>{registro.nit}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Nombre:</label>
                  <span>{registro.nombre_pdv}</span>
                </div>
                <div className="backoffice-info-row">
                  <label>Dirección:</label>
                  <span>{registro.direccion}</span>
                </div>
              </div>
            </div>

            {/* Observaciones - Siempre mostrar */}
            <div className="backoffice-info-card">
              <div className="backoffice-card-header">
                <span className="backoffice-card-icon">📝</span>
                <h4>Observaciones</h4>
              </div>
              <div className="backoffice-card-content">
                <div className="backoffice-observaciones-container">
                  <div className="backoffice-observacion-item">
                    <label><strong>Observaciones BackOffice:</strong></label>
                    <div className="backoffice-observacion-text">
                      {registro.observacion_asesor || 'No hay observaciones de BackOffice'}
                    </div>
                  </div>
                  <div className="backoffice-observacion-item">
                    <label><strong>Observaciones Agente:</strong></label>
                    <div className="backoffice-observacion-text">
                      {registro.observacion_agente || 'No hay observaciones del Agente'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos Implementados - Solo para actividades que no sean Visita ni Implementación */}
            {registro.tipo_accion !== 'Visita' && registro.tipo_accion !== 'Implementación' && (
              <div className="backoffice-info-card">
                <div className="backoffice-card-header">
                  <span className="backoffice-card-icon">📦</span>
                  <h4>Productos Registrados</h4>
                </div>
                <div className="backoffice-card-content">
                  {productos.length > 0 ? (
                    <div className="backoffice-productos-tabla-container">
                      <table className="backoffice-productos-tabla">
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
                              <td className="backoffice-producto-referencia">{producto.referencia}</td>
                              <td>{producto.presentacion}</td>
                              <td className="backoffice-producto-cantidad">{producto.cantidad}</td>
                              <td className="backoffice-producto-galonaje">{producto.galonaje}</td>
                              <td className="backoffice-producto-precio">${parseFloat(producto.precioSugerido || 0).toLocaleString()}</td>
                              <td className="backoffice-producto-precio">${parseFloat(producto.precioReal || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="backoffice-no-productos">
                      <div className="backoffice-no-productos-icon">📦</div>
                      <p>No hay productos registrados para esta actividad</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información específica de Implementación */}
            {registro.tipo_accion === 'Implementación' && (
              <div className="backoffice-info-card">
                <div className="backoffice-card-header">
                  <span className="backoffice-card-icon">🔧</span>
                  <h4>Información de Implementación</h4>
                </div>
                <div className="backoffice-card-content">
                  <div className="backoffice-info-row">
                    <label>Número de Implementación:</label>
                    <span className="backoffice-implementacion-value">
                      {registro.nro_implementacion || 'No asignado'}
                    </span>
                  </div>
                  <div className="backoffice-info-row">
                    <label>¿Aceptó Implementación?:</label>
                    <span className={`backoffice-acepto-badge ${
                      registro.acepto_implementacion === 'Si' ? 'backoffice-acepto-si' : 
                      registro.acepto_implementacion === 'No' ? 'backoffice-acepto-no' : 
                      'backoffice-acepto-pendiente'
                    }`}>
                      {registro.acepto_implementacion || 'Pendiente'}
                    </span>
                  </div>
                  {registro.observacion_implementacion && (
                    <div className="backoffice-info-row">
                      <label>Observaciones de Implementación:</label>
                      <span className="backoffice-observacion-implementacion">
                        {registro.observacion_implementacion}
                      </span>
                    </div>
                  )}
                  
                  {/* Tabla de productos implementados específicos */}
                  {(registro.productos_implementados && registro.productos_implementados.trim() && registro.productos_implementados !== 'null') ? (
                    <div className="backoffice-productos-implementacion">
                      <h5>📋 Productos Implementados:</h5>
                      <div className="backoffice-tabla-productos-implementacion">
                        <table className="backoffice-productos-implementacion-tabla">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Cantidad</th>
                              <th>Foto Evidencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registro.productos_implementados.split(',').map((producto, index) => {
                              const numeros = registro.nros_productos ? registro.nros_productos.split(',') : [];
                              const fotosEvidencia = registro.fotos_evidencia ? registro.fotos_evidencia.split(',') : [];
                              const fotoEvidencia = fotosEvidencia[index] ? fotosEvidencia[index].trim() : null;
                              
                              return (
                                <tr key={index}>
                                  <td className="backoffice-producto-nombre-tabla">
                                    {producto.trim()}
                                  </td>
                                  <td className="backoffice-producto-cantidad-tabla">
                                    <span className="backoffice-cantidad-badge">
                                      {numeros[index] || '0'}
                                    </span>
                                  </td>
                                  <td className="backoffice-producto-foto-tabla">
                                    {fotoEvidencia ? (
                                      <div className="backoffice-foto-evidencia-mini">
                                        <img 
                                          src={construirUrlImagen(fotoEvidencia)} 
                                          alt={`Evidencia ${producto.trim()}`}
                                          className="backoffice-foto-mini-preview"
                                          onClick={() => abrirImagenEnNuevaPestana(fotoEvidencia)}
                                          onError={(e) => {
                                            console.error(`Error al cargar evidencia mini: ${construirUrlImagen(fotoEvidencia)}`);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                        <div className="backoffice-foto-mini-error" style={{display: 'none'}}>
                                          <span>📷</span>
                                          <small>Sin foto</small>
                                        </div>
                                        <div className="backoffice-foto-mini-overlay">
                                          <button 
                                            className="backoffice-foto-mini-btn"
                                            onClick={() => abrirImagenEnNuevaPestana(fotoEvidencia)}
                                            title="Ver imagen completa"
                                          >
                                            🔍
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="backoffice-sin-foto-evidencia">
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
                  ) : (
                    <div className="backoffice-no-productos-implementacion">
                      <div className="backoffice-no-productos-icon">📦</div>
                      <p>No hay productos específicos de implementación registrados</p>
                      <small style={{color: '#666', fontSize: '12px'}}>
                        Debug: productos_implementados = "{registro.productos_implementados}"
                      </small>
                    </div>
                  )}

                  {/* Foto de remisión */}
                  {registro.foto_remision && (
                    <div className="backoffice-foto-remision-container">
                      <h5>📄 Foto de Remisión:</h5>
                      <div className="backoffice-foto-remision">
                        <img 
                          src={construirUrlImagen(registro.foto_remision)} 
                          alt="Remisión de implementación"
                          className="backoffice-foto-preview"
                          onClick={() => abrirImagenEnNuevaPestana(registro.foto_remision)}
                          onError={(e) => {
                            console.error(`Error al cargar remisión: ${construirUrlImagen(registro.foto_remision)}`);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="backoffice-foto-error" style={{display: 'none'}}>
                          <span>📄</span>
                          <small>Error al cargar remisión</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Registro Fotográfico - Solo para tipos que no sean Implementación */}
            {registro.tipo_accion !== 'Implementación' && (
              <div className="backoffice-info-card">
                <div className="backoffice-card-header">
                  <span className="backoffice-card-icon">📸</span>
                  <h4>Registro Fotográfico</h4>
                </div>
                <div className="backoffice-card-content">
                  <div className="backoffice-fotos-container">
                    <div className="backoffice-fotos-descripcion">
                      <p>Haz clic en las imágenes para verlas en tamaño completo en una nueva pestaña.</p>
                    </div>
                  
                  {fotos.facturas.length > 0 && (
                    <div className="backoffice-foto-categoria">
                      <h4>📋 Facturas ({fotos.facturas.length})</h4>
                      <div className="backoffice-fotos-grid">
                        {fotos.facturas.map((foto, index) => {
                          const urlCompleta = construirUrlImagen(foto);
                          return (
                            <div key={index} className="backoffice-foto-item">
                              <img 
                                src={urlCompleta} 
                                alt={`Factura ${index + 1}`}
                                className="backoffice-foto-preview"
                                onClick={() => abrirImagenEnNuevaPestana(foto)}
                                onError={(e) => {
                                  console.error(`Error al cargar imagen: ${urlCompleta}`);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="backoffice-foto-error" style={{display: 'none'}}>
                                <span>�</span>
                                <small>Error al cargar imagen</small>
                                <small style={{fontSize: '10px', opacity: 0.7}}>
                                  {urlCompleta}
                                </small>
                              </div>
                              <div className="backoffice-foto-overlay">
                                <button 
                                  className="backoffice-foto-btn"
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
                    <div className="backoffice-foto-categoria">
                      <h4>🎯 Material POP ({fotos.pop.length})</h4>
                      <div className="backoffice-fotos-grid">
                        {fotos.pop.map((foto, index) => {
                          const urlCompleta = construirUrlImagen(foto);
                          return (
                            <div key={index} className="backoffice-foto-item">
                              <img 
                                src={urlCompleta} 
                                alt={`POP ${index + 1}`}
                                className="backoffice-foto-preview"
                                onClick={() => abrirImagenEnNuevaPestana(foto)}
                                onError={(e) => {
                                  console.error(`Error al cargar imagen: ${urlCompleta}`);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="backoffice-foto-error" style={{display: 'none'}}>
                                <span>🎯</span>
                                <small>Error al cargar imagen</small>
                                <small style={{fontSize: '10px', opacity: 0.7}}>
                                  {urlCompleta}
                                </small>
                              </div>
                              <div className="backoffice-foto-overlay">
                                <button 
                                  className="backoffice-foto-btn"
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
                  
                  {fotos.seguimiento.length > 0 && (
                    <div className="backoffice-foto-categoria">
                      <h4>
                        {registro.IsSeguimiento === '1' || registro.IsSeguimiento === 1 ? 
                          `📈 Seguimiento (${fotos.seguimiento.length})` : 
                          `🎯 Material POP (${fotos.seguimiento.length})`
                        }
                      </h4>
                      <div className="backoffice-fotos-grid">
                        {fotos.seguimiento.map((foto, index) => {
                          const urlCompleta = construirUrlImagen(foto);
                          const tipoFoto = registro.IsSeguimiento === '1' || registro.IsSeguimiento === 1 ? 'Seguimiento' : 'POP';
                          const iconoError = registro.IsSeguimiento === '1' || registro.IsSeguimiento === 1 ? '📈' : '🎯';
                          
                          return (
                            <div key={index} className="backoffice-foto-item">
                              <img 
                                src={urlCompleta} 
                                alt={`${tipoFoto} ${index + 1}`}
                                className="backoffice-foto-preview"
                                onClick={() => abrirImagenEnNuevaPestana(foto)}
                                onError={(e) => {
                                  console.error(`Error al cargar imagen: ${urlCompleta}`);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="backoffice-foto-error" style={{display: 'none'}}>
                                <span>{iconoError}</span>
                                <small>Error al cargar imagen</small>
                                <small style={{fontSize: '10px', opacity: 0.7}}>
                                  {urlCompleta}
                                </small>
                              </div>
                              <div className="backoffice-foto-overlay">
                                <button 
                                  className="backoffice-foto-btn"
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

                  {fotos.facturas.length === 0 && fotos.pop.length === 0 && fotos.seguimiento.length === 0 && (
                    <div className="backoffice-no-fotos">
                      <div className="backoffice-no-fotos-icon">📷</div>
                      <p>No hay fotografías registradas para esta implementación</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        <div className="backoffice-modal-footer">
          <div className="backoffice-comentario-section">
            <label htmlFor="comentario">Comentario para la acción:</label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe un comentario sobre esta acción..."
              className="backoffice-comentario-textarea"
              rows="3"
            />
          </div>
          
          <div className="backoffice-action-buttons">
            <button
              className="backoffice-btn backoffice-btn-secondary"
              onClick={handleClose}
            >
              Cerrar
            </button>
            <button
              className="backoffice-btn backoffice-btn-danger"
              onClick={handleRechazar}
              disabled={!comentario.trim()}
            >
              Rechazar
            </button>
            <button
              className="backoffice-btn backoffice-btn-success"
              onClick={handleAprobar}
              disabled={!comentario.trim()}
            >
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
