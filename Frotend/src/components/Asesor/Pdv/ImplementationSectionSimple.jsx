import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../config.js';
import '../../../styles/Asesor/asesor-seccion-implementacion.css';

/**
 * Componente simplificado para la sección de Implementación con validación PDV
 */
const ImplementationSectionSimple = ({ 
  kpiTransition, 
  fecha, 
  setFecha, 
  foto, 
  setFoto, 
  enviarReporte, 
  isSubmitting,
  submitSuccess,
  userId,
  pdvCode,
  acumulados,
  onSuccess
}) => {
  // Estados para validación de PDV
  const [inputPdvCode, setInputPdvCode] = useState('');
  const [pdvInfo, setPdvInfo] = useState(null);
  const [isPdvValid, setIsPdvValid] = useState(false);
  const [isValidatingPdv, setIsValidatingPdv] = useState(false);
  const [pdvError, setPdvError] = useState('');

  // Estados para fotos
  const [fotoFactura, setFotoFactura] = useState([]);
  const [fotoNotification, setFotoNotification] = useState({ show: false, message: '', tipo: '' });

  // Estados para productos
  const [productos, setProductos] = useState([]);

  // Estados para errores
  const [submitError, setSubmitError] = useState(null);

  // Función para validar código PDV
  const validarCodigoPdv = async (codigo) => {
    if (!codigo || codigo.trim() === '') {
      setPdvError('');
      setIsPdvValid(false);
      setPdvInfo(null);
      return;
    }

    setIsValidatingPdv(true);
    setPdvError('');

    try {
      const response = await fetch(`${API_URL}/api/pdvs`);
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        const pdvEncontrado = data.find(pdv => 
          pdv.codigo && pdv.codigo.toLowerCase() === codigo.toLowerCase()
        );

        if (pdvEncontrado) {
          setPdvInfo(pdvEncontrado);
          setIsPdvValid(true);
          setPdvError('');
          console.log('✅ PDV válido encontrado:', pdvEncontrado);
        } else {
          setPdvInfo(null);
          setIsPdvValid(false);
          setPdvError('Código de PDV no encontrado');
        }
      } else {
        setPdvError('Error al consultar los puntos de venta');
        setIsPdvValid(false);
      }
    } catch (error) {
      console.error('Error al validar PDV:', error);
      setPdvError('Error de conexión al validar el PDV');
      setIsPdvValid(false);
    } finally {
      setIsValidatingPdv(false);
    }
  };

  // Manejar cambio en el input del código PDV
  const handlePdvCodeChange = (e) => {
    const value = e.target.value;
    setInputPdvCode(value);
    
    clearTimeout(window.pdvValidationTimeout);
    window.pdvValidationTimeout = setTimeout(() => {
      validarCodigoPdv(value);
    }, 500);
  };

  // Función para agregar fotos de factura
  const handleAgregarFotoFactura = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      const validImages = filesArray.filter(file => file.type.startsWith('image/'));
      
      if (validImages.length > 0) {
        const nuevaListaFotos = [...fotoFactura, ...validImages];
        setFotoFactura(nuevaListaFotos);
        
        if (setFoto && typeof setFoto === 'function') {
          setFoto(nuevaListaFotos);
        }
        
        const mensaje = validImages.length === 1 
          ? `Foto agregada: ${validImages[0].name}`
          : `${validImages.length} fotos agregadas`;
          
        setFotoNotification({ show: true, message: mensaje, tipo: 'factura' });
        setTimeout(() => {
          setFotoNotification({ show: false, message: '', tipo: '' });
        }, 3000);
        
        e.target.value = '';
      }
    }
  };

  // Función para eliminar foto
  const handleEliminarFoto = (index) => {
    const nuevaListaFotos = fotoFactura.filter((_, i) => i !== index);
    setFotoFactura(nuevaListaFotos);
    
    if (setFoto && typeof setFoto === 'function') {
      setFoto(nuevaListaFotos);
    }
  };

  // Función para enviar registro
  const handleSubmit = async () => {
    setSubmitError(null);
    
    if (!fecha) {
      setSubmitError('Debe seleccionar una fecha');
      return;
    }
    
    if (productos.length === 0) {
      setSubmitError('Debe agregar al menos un producto');
      return;
    }
    
    if (fotoFactura.length === 0) {
      setSubmitError('Debe adjuntar al menos una foto de factura');
      return;
    }

    try {
      const params = {
        pdv_id: pdvInfo.codigo,
        user_id: userId,
        fecha,
        productos: productos,
        fotos: { factura: fotoFactura }
      };
      
      const result = await enviarReporte(params);
      if (result && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setSubmitError(error.message || 'Error al enviar el registro');
    }
  };

  return (
    <div className={`implementation-section ${kpiTransition ? 'kpi-transition' : ''}`}>
      {/* Notificación flotante */}
      {fotoNotification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#27ae60',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: '600',
          animation: 'slideDown 0.3s ease-out'
        }}>
          ✅ {fotoNotification.message}
        </div>
      )}

      {/* SECCIÓN DE VALIDACIÓN PDV */}
      {!isPdvValid && (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #e30613',
          margin: '20px 0'
        }}>
          <h3 style={{ color: '#e30613', marginBottom: '20px' }}>
            🏪 Verificación del Punto de Venta
          </h3>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Por favor, ingrese el código del PDV para continuar
          </p>
          
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Ej: L21"
              value={inputPdvCode}
              onChange={handlePdvCodeChange}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: `2px solid ${pdvError ? '#dc3545' : '#e30613'}`,
                borderRadius: '8px',
                textAlign: 'center',
                textTransform: 'uppercase',
                marginBottom: '10px',
                outline: 'none'
              }}
              disabled={isValidatingPdv}
            />
            
            {isValidatingPdv && (
              <p style={{ color: '#007bff', fontSize: '14px' }}>
                🔍 Validando código...
              </p>
            )}
            
            {pdvError && (
              <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '10px' }}>
                ❌ {pdvError}
              </p>
            )}
            
            {pdvInfo && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                padding: '15px',
                marginTop: '15px',
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#155724', margin: '0 0 10px 0' }}>
                  ✅ PDV Encontrado
                </h4>
                <p style={{ margin: '5px 0', color: '#155724' }}>
                  <strong>Código:</strong> {pdvInfo.codigo}
                </p>
                <p style={{ margin: '5px 0', color: '#155724' }}>
                  <strong>Descripción:</strong> {pdvInfo.descripcion || 'Sin descripción'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN PRINCIPAL */}
      {isPdvValid && (
        <>
          {/* Información del PDV */}
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#155724', margin: '0 0 10px 0' }}>
              🏪 PDV: {pdvInfo?.codigo} - {pdvInfo?.descripcion}
            </h4>
            <button
              onClick={() => {
                setIsPdvValid(false);
                setInputPdvCode('');
                setPdvInfo(null);
                setPdvError('');
              }}
              style={{
                background: 'none',
                border: '1px solid #155724',
                color: '#155724',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄 Cambiar PDV
            </button>
          </div>

          {/* Campo de fecha */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#333'
            }}>
              📅 FECHA:
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{
                padding: '12px',
                border: '2px solid #e30613',
                borderRadius: '8px',
                fontSize: '16px',
                width: '200px'
              }}
            />
          </div>

          {/* Sección de fotos */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#333'
            }}>
              📷 FOTO FACTURA:
            </label>
            
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              //accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const maxSize = 8 * 1024 * 1024; // 8MB 

                const validFiles = files.filter(file => file.size <= maxSize);

                if (validFiles.length !== files.length) {
                  alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
                }

                // Llamar al handler con los archivos válidos
                if (validFiles.length > 0) {
                  const fakeEvent = { target: { files: validFiles } };
                  handleAgregarFotoFactura(fakeEvent);
                }
              }}
              style={{
                padding: '8px',
                border: '2px dashed #007bff',
                borderRadius: '8px',
                width: '100%',
                backgroundColor: '#f8f9ff'
              }}
            />
            
            {/* Lista de fotos seleccionadas */}
            {fotoFactura.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontWeight: '600', color: '#e30613' }}>
                  {fotoFactura.length} foto{fotoFactura.length !== 1 ? 's' : ''} seleccionada{fotoFactura.length !== 1 ? 's' : ''}
                </p>
                {fotoFactura.map((foto, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    marginBottom: '5px'
                  }}>
                    <span>{foto.name}</span>
                    <button
                      onClick={() => handleEliminarFoto(index)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón de agregar producto */}
          <div style={{ marginBottom: '20px' }}>
            <button
              style={{
                backgroundColor: '#e30613',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
              onClick={() => {
                // Por ahora solo agregamos un producto de ejemplo
                const nuevoProducto = {
                  id: Date.now(),
                  referencia: 'Ejemplo',
                  presentacion: '1L',
                  numeroCajas: 1,
                  volumenGalones: 0.26,
                  pvpSugerido: 15000,
                  pvpReal: 15000
                };
                setProductos([...productos, nuevoProducto]);
              }}
            >
              ➕ Agregar Producto
            </button>
          </div>

          {/* Tabla de productos */}
          {productos.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>Productos agregados:</h4>
              {productos.map((producto, index) => (
                <div key={producto.id} style={{
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    {producto.referencia} - {producto.presentacion} - {producto.numeroCajas} cajas
                  </span>
                  <button
                    onClick={() => {
                      setProductos(productos.filter(p => p.id !== producto.id));
                    }}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error de envío */}
          {submitError && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              ❌ {submitError}
            </div>
          )}

          {/* Botón de envío */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !fecha || productos.length === 0 || fotoFactura.length === 0}
            style={{
              backgroundColor: isSubmitting || !fecha || productos.length === 0 || fotoFactura.length === 0 
                ? '#6c757d' : '#e30613',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: isSubmitting || !fecha || productos.length === 0 || fotoFactura.length === 0 
                ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              width: '100%'
            }}
          >
            {isSubmitting ? '⏳ Enviando...' : '🚀 CARGAR REGISTRO'}
          </button>
        </>
      )}
    </div>
  );
};

export default ImplementationSectionSimple;
