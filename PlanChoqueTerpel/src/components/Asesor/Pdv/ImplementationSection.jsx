import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../../styles/Asesor/asesor-seccion-implementacion.css';

/**
 * Componente simple para la sección de Implementación
 * Solo muestra la tabla con inputs para registro
 */
const ImplementationSection = ({ 
  kpiTransition, 
  fecha, 
  setFecha, 
  foto, 
  setFoto, 
  enviarReporte, 
  isSubmitting, // <-- del hook useReportSubmission
  submitSuccess, // <-- del hook useReportSubmission
  userId,
  pdvCode,
  acumulados,
  onSuccess // NUEVA PROP
}) => {
  // Eliminado showSuccessModal, ahora el modal se maneja en la página padre
  const [submitError, setSubmitError] = useState(null);
  // Envío con modal bonito
  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const params = {
        pdv_id: pdvCode,
        user_id: userId,
        fecha,
        productos: productos,
        fotos: {
          factura: fotoFactura,
          implementacion: fotoImplementacion
        }
      };
      const result = await enviarReporte(params);
      if (result && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setSubmitError(error.message || 'Error al enviar el registro');
    }
  };
  const [productos, setProductos] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [marcas, setMarcas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [marcaIndex, setMarcaIndex] = useState(0);
  const [referencias, setReferencias] = useState([]);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState(null);
  
  // Estados para las fotos principales (fuera del popup)
  const [fotoFactura, setFotoFactura] = useState([]);
  const [fotoImplementacion, setFotoImplementacion] = useState([]);
  
  const [formProducto, setFormProducto] = useState({
    presentacion: '',
    numeroCajas: '',
    pvpReal: '',
    pvpSugerido: ''
  });

  // Estado para mostrar el popup de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Efecto para manejar el scroll del body
  useEffect(() => {
    if (showPopup) {
      document.body.classList.add('popup-open');
    } else {
      document.body.classList.remove('popup-open');
    }
    
    // Cleanup al desmontar el componente
    return () => {
      document.body.classList.remove('popup-open');
    };
  }, [showPopup]);

  const formatearCOP = (valor) => {
  if (!valor) return '';
  const num = Number(valor.toString().replace(/\D/g, ''));
  if (!num) return '';
  return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

  // Cargar marcas al abrir el popup
  const cargarMarcas = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/marcas');
      const data = await response.json();
      setMarcas(data);
      
      // Preseleccionar la marca "Oiltec"
      const oiltecMarca = data.find(marca => 
        marca.descripcion.toLowerCase().includes('oiltec') || 
        marca.nombre?.toLowerCase().includes('oiltec')
      );
      
      if (oiltecMarca) {
        setMarcaSeleccionada(oiltecMarca);
        setMarcaIndex(data.findIndex(m => m.id === oiltecMarca.id));
        cargarReferencias(oiltecMarca.id);
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  };

  // Cargar referencias según la marca seleccionada
  const cargarReferencias = async (marcaId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/referencias?marca_id=${marcaId}`);
      const data = await response.json();
      if (data.success) {
        setReferencias(data.data);
      }
    } catch (error) {
      console.error('Error al cargar referencias:', error);
    }
  };

  // Función para agregar una foto de factura individual
  const handleAgregarFotoFactura = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFactura(prev => [...prev, file]);
      e.target.value = ''; // Limpiar el input
    }
  };

  // Función para agregar una foto de implementación individual
  const handleAgregarFotoImplementacion = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoImplementacion(prev => [...prev, file]);
      e.target.value = ''; // Limpiar el input
    }
  };

  // Función para eliminar una foto específica
  const handleEliminarFoto = (tipo, index) => {
    if (tipo === 'factura') {
      setFotoFactura(prev => prev.filter((_, i) => i !== index));
    } else if (tipo === 'implementacion') {
      setFotoImplementacion(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleOpenPopup = () => {
    setShowPopup(true);
    cargarMarcas();
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setMarcaSeleccionada(null);
    setMarcaIndex(0);
    setReferenciaSeleccionada(null);
    setReferencias([]);
    setFormProducto({
      presentacion: '',
      numeroCajas: '',
      pvpReal: ''
    });
  };

  const handleMarcaClick = (marca) => {
    setMarcaSeleccionada(marca);
    setMarcaIndex(marcas.findIndex(m => m.id === marca.id));
    cargarReferencias(marca.id);
    setReferenciaSeleccionada(null);
  };

  const handleMarcaAnterior = () => {
    if (marcas.length > 0) {
      const newIndex = marcaIndex > 0 ? marcaIndex - 1 : marcas.length - 1;
      setMarcaIndex(newIndex);
      const nuevaMarca = marcas[newIndex];
      setMarcaSeleccionada(nuevaMarca);
      cargarReferencias(nuevaMarca.id);
      setReferenciaSeleccionada(null);
    }
  };

  const handleMarcaSiguiente = () => {
    if (marcas.length > 0) {
      const newIndex = marcaIndex < marcas.length - 1 ? marcaIndex + 1 : 0;
      setMarcaIndex(newIndex);
      const nuevaMarca = marcas[newIndex];
      setMarcaSeleccionada(nuevaMarca);
      cargarReferencias(nuevaMarca.id);
      setReferenciaSeleccionada(null);
    }
  };

  const handleReferenciaClick = (referencia) => {
    setReferenciaSeleccionada(referencia);
  };

  const cajas = parseFloat(formProducto.numeroCajas) || 0;
    let galones = 0;
    if (formProducto.presentacion === 'Galón') galones = cajas * 4;
    else if (formProducto.presentacion === 'Cuarto') galones = cajas * 3;
    else if (formProducto.presentacion === 'Litro') galones = cajas * 3.17;
    else if (formProducto.presentacion === 'Pinta') galones = cajas * 3;
    else if (formProducto.presentacion === 'Tambor') galones = cajas * 55;

  const handleAgregarProducto = () => {
    // Permitir agregar si hay referencia, presentación y (número de cajas > 0 o ambos precios llenos)
    const cajas = parseFloat(formProducto.numeroCajas) || 0;
    const tieneCajas = cajas > 0;
    const tienePrecios = formProducto.pvpReal && formProducto.pvpSugerido;
    if (
      referenciaSeleccionada &&
      formProducto.presentacion &&
      (tieneCajas || tienePrecios)
    ) {
      let galones = 0;
      if (formProducto.presentacion === 'Galón') galones = cajas * 4;
      else if (formProducto.presentacion === 'Cuarto') galones = cajas * 3;
      else if (formProducto.presentacion === 'Litro') galones = cajas * 3.17;
      else if (formProducto.presentacion === 'Pinta') galones = cajas * 3;
      else if (formProducto.presentacion === 'Tambor') galones = cajas * 55;
      const nuevoProducto = {
        id: Date.now(),
        marca: marcaSeleccionada.descripcion,
        referencia: referenciaSeleccionada.descripcion,
        presentacion: formProducto.presentacion,
        numeroCajas: cajas,
        pvpReal: formProducto.pvpReal ? parseFloat(formProducto.pvpReal) : '',
        volumenGalones: galones,
        pvpSugerido: formProducto.pvpSugerido ? parseFloat(formProducto.pvpSugerido) : ''
      };
      setProductos([...productos, nuevoProducto]);
      handleClosePopup();
    }
  };

  const handleEliminarProducto = (id) => {
    const producto = productos.find(p => p.id === id);
    setProductToDelete(producto);
    setShowDeleteConfirm(true);
  };

  const handleCargarRegistro = async () => {
    try {
      console.log('Datos a enviar:', {
      pdv_id: pdvCode,
      fecha,
      productos,
      fotos: {
        factura: fotoFactura,
        implementacion: fotoImplementacion
      },
      user_id: userId
    });
    const respuesta = await enviarReporte({
      pdv_id: pdvCode,
      fecha,
      productos,
      fotos: {
        factura: fotoFactura,
        implementacion: fotoImplementacion
      },
      user_id: userId
    });
      console.log('Datos a enviar:', respuesta);
      //console.log('Respuesta de la API:', respuesta);
    } catch (error) {
      console.error('Error al cargar el registro:', error);
    }
  };


  // Modal para mostrar detalles de acumulados, fotos y productos
  const [showAcumuladosModal, setShowAcumuladosModal] = useState(false);
  const handleMostrarAcumulados = () => setShowAcumuladosModal(true);
  const handleCerrarAcumuladosModal = () => setShowAcumuladosModal(false);

  return (
    <div className={`implementation-section ${kpiTransition ? 'kpi-transition' : ''}`}>
      {/* Tabla de productos */}
      <div className="implementation-table-container">
        {/* <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 8 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginLeft: 8 }}
            onClick={handleMostrarAcumulados}
          >
            Ver Detalles Registro
          </button>
        </div> */}
      {/* Modal de detalles de registro acumulado */}
      {showAcumuladosModal && createPortal(
        <div className="modal-overlay" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={handleCerrarAcumuladosModal}>
          <div className="modal-content" style={{background:'#fff',padding:24,borderRadius:12,maxWidth:500,width:'95vw',maxHeight:'90vh',overflowY:'auto',position:'relative'}} onClick={e=>e.stopPropagation()}>
            <button style={{position:'absolute',top:8,right:12,fontSize:22,border:'none',background:'none',cursor:'pointer'}} onClick={handleCerrarAcumuladosModal}>×</button>
            <h2 style={{marginTop:0}}>Detalle del Registro</h2>
            <div style={{marginBottom:12}}>
              <strong>Punto de Venta Seleccionado:</strong> {pdvCode ? pdvCode : <span style={{color:'#888'}}>No seleccionado</span>}
            </div>
            <div style={{marginBottom:12}}>
              <strong>Fecha:</strong> {fecha || <span style={{color:'#888'}}>No seleccionada</span>}
            </div>
            <h4 style={{marginBottom:4}}>Productos (acumulados):</h4>
            {acumulados && acumulados.length > 0 ? (
              <table style={{width:'100%',fontSize:13,marginBottom:12,borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#f5f5f5'}}>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>ID</th>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>Nombre</th>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>Presentación</th>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>Galones</th>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>N° Cajas</th>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>Precio Venta</th>
                    <th style={{padding:'4px 6px',border:'1px solid #eee'}}>Precio Sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {acumulados.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.id}</td>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.nombre || item.referencia || '-'}</td>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.presentacion || '-'}</td>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.galones !== undefined ? item.galones : (item.volumenGalones !== undefined ? item.volumenGalones : '-')}</td>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.cantidad !== undefined ? item.cantidad : (item.numeroCajas !== undefined ? item.numeroCajas : '-')}</td>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.precio !== undefined ? item.precio : (item.pvpReal !== undefined ? item.pvpReal : '-')}</td>
                      <td style={{padding:'4px 6px',border:'1px solid #eee'}}>{item.pvpSugerido !== undefined ? item.pvpSugerido : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={{color:'#888',marginBottom:12}}>[Sin productos acumulados]</div>}
            <h4 style={{marginBottom:4}}>Fotos Factura:</h4>
            {fotoFactura && fotoFactura.length > 0 ? (
              <ul style={{marginTop:0}}>
                {fotoFactura.map((foto, idx) => (
                  <li key={idx}>{foto.name}</li>
                ))}
              </ul>
            ) : <div style={{color:'#888'}}>No hay fotos de factura</div>}
            <h4 style={{marginBottom:4}}>Fotos Implementación:</h4>
            {fotoImplementacion && fotoImplementacion.length > 0 ? (
              <ul style={{marginTop:0}}>
                {fotoImplementacion.map((foto, idx) => (
                  <li key={idx}>{foto.name}</li>
                ))}
              </ul>
            ) : <div style={{color:'#888'}}>No hay fotos de implementación</div>}
            <h4 style={{marginBottom:4}}>Productos en tabla (array a enviar):</h4>
            {productos && productos.length > 0 ? (
              <pre style={{background:'#f5f5f5',padding:8,borderRadius:6,overflowX:'auto',fontSize:12,marginBottom:12}}>{JSON.stringify(productos, null, 2)}</pre>
            ) : <div style={{color:'#888'}}>No hay productos en tabla</div>}
          </div>
        </div>,
        document.body
      )}
        <div className="table-responsive">
          <table className="implementation-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Presentación</th>
                <th>N° Cajas</th>
                <th>Volumen (glns)</th>
                <th>PVP Sugerido</th>
                <th>PVP Real</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="no-data-message">
                      <i className="icon-box">📦</i>
                      <p>No hay productos cargados</p>
                      <small>Haz clic en "Agregar Producto" para comenzar</small>
                    </div>
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id} onClick={() => handleEliminarProducto(producto.id)} style={{cursor: 'pointer'}} title="Haz clic para eliminar">
                    <td>{producto.referencia}</td>
                    <td>{producto.presentacion}</td>
                    <td>{producto.numeroCajas}</td>
                    <td className="volume-cell">{producto.volumenGalones}</td>
                    <td className="price-cell">{typeof producto.pvpSugerido === 'number' && !isNaN(producto.pvpSugerido) ? `$${producto.pvpSugerido.toFixed(2)}` : ''}</td>
                    <td>{typeof producto.pvpReal === 'number' && !isNaN(producto.pvpReal) ? `$${producto.pvpReal.toFixed(2)}` : ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Botón agregar producto debajo de la tabla */}
        <div className="add-product-container">
          <button className="btn-add-product" onClick={handleOpenPopup}>
            <span className="btn-icon">+</span>
            <span className="btn-text">Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Inputs de fecha y fotos */}
      <div className="implementation-inputs">
        <div className="implementation-inputs-grid">
          {/* Fecha */}
          <div className="pdv-row-fecha">
            <label className="pdv-label" htmlFor="fecha-input-implementation">FECHA</label>
            <div className="relative flex-1">
              <input
                id="fecha-input-implementation"
                className="pdv-input-date ta-center"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
              <span className="date-icon cursor-pointer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
                  <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                  <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                  <rect x="3" y="9" width="18" height="2" fill="#fff"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Foto Factura */}
          <div className="pdv-row-foto">
            <label className="pdv-label pdv-label-multiline" htmlFor="foto-factura-single">
              FOTO<br/>FACTURA
            </label>
            <div className="foto-upload-container">
              <input
                type="file"
                accept="image/*"
                id="foto-factura-single"
                className="display-none"
                onChange={handleAgregarFotoFactura}
              />
              
              <button
                type="button"
                className="foto-btn-simple"
                onClick={() => document.getElementById('foto-factura-single').click()}
              >
                📷 Adjuntar foto
              </button>
              
              {/* Lista de fotos seleccionadas */}
              {fotoFactura.length > 0 && (
                <div className="fotos-seleccionadas">
                  <div className="fotos-count">
                    {fotoFactura.length} foto{fotoFactura.length !== 1 ? 's' : ''} seleccionada{fotoFactura.length !== 1 ? 's' : ''}
                  </div>
                  <div className="fotos-list">
                    {fotoFactura.map((foto, index) => (
                      <div key={index} className="foto-item">
                        <span className="foto-name">{foto.name}</span>
                        <button
                          type="button"
                          className="foto-remove"
                          onClick={() => handleEliminarFoto('factura', index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Foto Implementación */}
          <div className="pdv-row-foto">
            <label className="pdv-label pdv-label-multiline" htmlFor="foto-implementacion-single">
              FOTO<br/>IMPLEMENTACIÓN
            </label>
            <div className="foto-upload-container">
              <input
                type="file"
                accept="image/*"
                id="foto-implementacion-single"
                className="display-none"
                onChange={handleAgregarFotoImplementacion}
              />
              
              <button
                type="button"
                className="foto-btn-simple"
                onClick={() => document.getElementById('foto-implementacion-single').click()}
              >
                📷 Adjuntar foto
              </button>
              
              {/* Lista de fotos seleccionadas */}
              {fotoImplementacion.length > 0 && (
                <div className="fotos-seleccionadas">
                  <div className="fotos-count">
                    {fotoImplementacion.length} foto{fotoImplementacion.length !== 1 ? 's' : ''} seleccionada{fotoImplementacion.length !== 1 ? 's' : ''}
                  </div>
                  <div className="fotos-list">
                    {fotoImplementacion.map((foto, index) => (
                      <div key={index} className="foto-item">
                        <span className="foto-name">{foto.name}</span>
                        <button
                          type="button"
                          className="foto-remove"
                          onClick={() => handleEliminarFoto('implementacion', index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de envío */}
      <div className="implementation-actions">
        <button
          className="btn-cargar-registro"
          onClick={handleSubmit}
          disabled={isSubmitting || !fecha || productos.length === 0}
        >
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 50 50" style={{ marginRight: 8 }}>
                <circle cx="25" cy="25" r="20" fill="none" stroke="#27ae60" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
              Enviando...
            </span>
          ) : (
            'CARGAR REGISTRO'
          )}
        </button>
      </div>

      {/* Popup de pantalla completa para agregar productos - Renderizado en el body */}
      {showPopup && createPortal(
        <div className="pdv-popup-overlay" onClick={handleClosePopup}>
          <div className="pdv-popup-container" onClick={(e) => e.stopPropagation()}>
            {/* Header rojo del popup */}
            <div className="pdv-popup-header-modern">
              <h2>PRODUCTOS</h2>
              <button className="pdv-popup-close-modern" onClick={handleClosePopup}>×</button>
            </div>
            
            <div className="pdv-popup-content">
              
              {/* Selector de marcas horizontal */}
              <div className="marca-selector">
                <button 
                  className="carousel-nav-btn prev"
                  onClick={handleMarcaAnterior}
                  disabled={marcas.length === 0}
                >
                  ◀
                </button>
                <div className="marca-actual">
                  {marcaSeleccionada ? marcaSeleccionada.descripcion : 'Selecciona una Marca'}
                </div>
                <button 
                  className="carousel-nav-btn next"
                  onClick={handleMarcaSiguiente}
                  disabled={marcas.length === 0}
                >
                  ▶
                </button>
              </div>

              {/* Carrusel de referencias */}
              <div className="referencias-section">
                <div className="referencias-carousel-container">
                  {marcaSeleccionada && referencias.length > 0 ? (
                    <div className="referencias-scroll">
                      {referencias.map((referencia) => (
                        <div 
                          key={referencia.id}
                          className={`referencia-card ${referenciaSeleccionada?.id === referencia.id ? 'selected' : ''}`}
                          onClick={() => handleReferenciaClick(referencia)}
                        >
                          <div className="referencia-image">
                            <img 
                              src={`/storage/img_productos_carrusel/${referencia.descripcion}.png`}
                              alt={referencia.descripcion}
                              onError={(e) => {
                                e.target.src = '/storage/img_productos_carrusel/default.png';
                              }}
                            />
                          </div>
                          <div className="referencia-label">
                            {referencia.descripcion}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{textAlign:'center',color:'#888',margin:'16px 0'}}>Selecciona una marca para ver referencias</div>
                  )}
                </div>
              </div>

              {/* Formulario de producto */}
              {referenciaSeleccionada && (
                <div className="product-form">
                  <div className="form-row">
                    <label>Presentación: <span className="required">*</span></label>
                    <select 
                      value={formProducto.presentacion}
                      onChange={(e) => setFormProducto({...formProducto, presentacion: e.target.value})}
                      className="form-input-modern"
                      required
                    >
                      <option value="">Seleccionar presentación</option>
                      {(() => {
                        const marca = marcaSeleccionada?.descripcion?.toLowerCase() || '';
                        if (marca.includes('oiltec')) {
                          return [
                            <option key="Galón" value="Galón">Galón</option>,
                            <option key="Cuarto" value="Cuarto">Cuarto</option>,
                            <option key="Tambor" value="Tambor">Tambor</option>
                          ];
                        } else if (marca.includes('celebrity') || marca.includes('celerity')) {
                          return [
                            <option key="Litro" value="Litro">Litro</option>,
                            <option key="Pinta" value="Pinta">Pinta</option>,
                            <option key="Tambor" value="Tambor">Galón</option> 
                          ];
                        } else {
                          return [];
                        }
                      })()}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Número de Cajas: <span className="optional">(Obligatorio si no hay precios)</span></label>
                    <input
                      type="number"
                      value={formProducto.numeroCajas}
                      onChange={(e) => setFormProducto({...formProducto, numeroCajas: e.target.value})}
                      className="form-input-modern"
                      min="0"
                      placeholder="Ingrese número de cajas"
                    />
                  </div>
                  <div className="form-row">
                    <label>PRECIO DE VENTA SUGERIDO UND: <span className="optional">(Obligatorio si no hay cajas)</span></label>
                    <input
                      type="text"
                      value={formatearCOP(formProducto.pvpSugerido)}
                      onChange={(e) => {
                        // Solo números
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setFormProducto({...formProducto, pvpSugerido: raw});
                      }}
                      className="form-input-modern"
                      placeholder="$"
                    />
                  </div>
                  <div className="form-row">
                    <label>PRECIO DE VENTA REAL UND: <span className="optional">(Obligatorio si no hay cajas)</span></label>
                    <input
                      type="text"
                      value={formatearCOP(formProducto.pvpReal)}
                      onChange={(e) => {
                        // Solo números
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setFormProducto({...formProducto, pvpReal: raw});
                      }}
                      className="form-input-modern"
                      placeholder="$"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="pdv-actions">
              <button className="btn-secondary" onClick={handleClosePopup}>
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleAgregarProducto}
                disabled={
                  !referenciaSeleccionada ||
                  !formProducto.presentacion ||
                  (
                    !(parseFloat(formProducto.numeroCajas) > 0) &&
                    !(formProducto.pvpReal && formProducto.pvpSugerido)
                  )
                }
              >
                Agregar Producto
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Popup de confirmación para eliminar */}
      {showDeleteConfirm && createPortal(
        <div className="delete-confirm-overlay" onClick={cancelarEliminar}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <h3>Confirmar Eliminación</h3>
            </div>
            <div className="delete-confirm-content">
              <p>¿Estás seguro de que deseas eliminar este registro?</p>
              {productToDelete && (
                <div className="product-details">
                  <strong>{productToDelete.referencia}</strong><br/>
                  <small>{productToDelete.presentacion} - {productToDelete.numeroCajas} cajas</small>
                </div>
              )}
            </div>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={cancelarEliminar}>
                Cancelar
              </button>
              <button className="btn-confirm-delete" onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal de éxito bonito ahora se maneja en la página padre */}
      {/* Modal de error */}
      {submitError && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Error</h3>
            <p>{submitError}</p>
            <button className="btn-confirm" onClick={() => setSubmitError(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};


export default ImplementationSection;