import React, { useState } from 'react';
import '../../../styles/Mercadeo/registro-detalle-modal.css';

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
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      ) : []
  };

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
                  <span className="info-value">{registro.cedula}</span>
                </div>
                <div className="info-item">
                  <label>Fecha de Registro:</label>
                  <span className="info-value">{formatearFecha(registro.fecha_registro)}</span>
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
                  <label>Estado Actual:</label>
                  <span className={`mercadeo_estado-badge ${registro.estado?.toLowerCase() || 'pendiente'}`}>
                    {registro.estado || 'PENDIENTE'}
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
                      {fotos.facturas.map((foto, index) => (
                        <div key={index} className="foto-item_mercadeo">
                          <img 
                            src={`/storage/${foto}`} 
                            alt={`Factura ${index + 1}`}
                            className="foto-preview"
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
                            <small style={{fontSize: '10px', opacity: 0.7}}>
                              /storage/{foto}
                            </small>
                          </div>
                          <div className="foto-overlay">
                            <button 
                              className="foto-btn"
                              onClick={() => window.open(`/storage/${foto}`, '_blank')}
                              title="Ver imagen completa"
                            >
                              🔍 Ver completa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {fotos.pop.length > 0 && (
                  <div className="foto-categoria">
                    <h4>🎯 Material POP ({fotos.pop.length})</h4>
                    <div className="fotos-grid">
                      {fotos.pop.map((foto, index) => (
                        <div key={index} className="foto-item_mercadeo">
                          <img 
                            src={`/storage/${foto}`} 
                            alt={`POP ${index + 1}`}
                            className="foto-preview"
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
                            <small style={{fontSize: '10px', opacity: 0.7}}>
                              /storage/{foto}
                            </small>
                          </div>
                          <div className="foto-overlay">
                            <button 
                              className="foto-btn"
                              onClick={() => window.open(`/storage/${foto}`, '_blank')}
                              title="Ver imagen completa"
                            >
                              🔍 Ver completa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {fotos.seguimiento.length > 0 && (
                  <div className="foto-categoria">
                    <h4>📈 Seguimiento ({fotos.seguimiento.length})</h4>
                    <div className="fotos-grid">
                      {fotos.seguimiento.map((foto, index) => (
                        <div key={index} className="foto-item_mercadeo">
                          <img 
                            src={`/storage/${foto}`} 
                            alt={`Seguimiento ${index + 1}`}
                            className="foto-preview"
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
                            <small style={{fontSize: '10px', opacity: 0.7}}>
                              /storage/{foto}
                            </small>
                          </div>
                          <div className="foto-overlay">
                            <button 
                              className="foto-btn"
                              onClick={() => window.open(`/storage/${foto}`, '_blank')}
                              title="Ver imagen completa"
                            >
                              🔍 Ver completa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {fotos.facturas.length === 0 && fotos.pop.length === 0 && fotos.seguimiento.length === 0 && (
                  <div className="no-fotos">
                    <span className="no-fotos-icon">📷</span>
                    <p>No hay fotografías registradas para esta implementación</p>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            {registro.observacion && (
              <div className="info-section">
                <h3>Observaciones</h3>
                <div className="observacion-contenido">
                  <p>{registro.observacion}</p>
                </div>
              </div>
            )}

            {/* Acciones de Aprobación/Rechazo */}
            {(registro.estado?.toLowerCase().includes('revisión') || 
              registro.estado?.toLowerCase().includes('revision') || 
              registro.estado?.toLowerCase().includes('pendiente')) && (
              <div className="info-section">
                <h3>Acciones</h3>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
