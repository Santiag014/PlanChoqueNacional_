import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_URL } from '../../../config.js';
import { usePrecioSugerido } from '../../../hooks/shared';
import { usePresentacionesReferencia } from '../../../hooks/asesor';
import PriceNotification from '../../shared/PriceNotification';
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
    
    // Validaciones previas con mensajes específicos
    if (!fecha) {
      setSubmitError('Debe seleccionar una fecha');
      return;
    }
    
    if (productos.length === 0) {
      setSubmitError('Debe agregar al menos un producto');
      return;
    }
    
    if (fotoFactura.length === 0 && (!foto || foto.length === 0)) {
      setSubmitError('Debe adjuntar al menos una foto de factura válida');
      return;
    }
    
    console.log('🚀 DEBUG: Iniciando envío con datos:', {
      fecha,
      productos: productos.length,
      fotos: fotoFactura.length,
      pdvCode,
      userId
    });
    
    try {
      const params = {
        pdv_id: pdvCode,
        user_id: userId,
        fecha,
        productos: productos,
        fotos: {
          factura: fotoFactura
          // Solo fotos de factura según solicitud
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
  // Solo fotos de factura según solicitud del usuario
  // const [fotoImplementacion, setFotoImplementacion] = useState([]);
  
  // Estado para notificación flotante de foto agregada
  const [fotoNotification, setFotoNotification] = useState({ show: false, message: '', tipo: '' });

  // Sincronizar estado local con props del padre
  useEffect(() => {
    // console.log('🔄 DEBUG: Sincronizando fotos con props del padre:', {
    //   propsPhoto: foto,
    //   localFotoFactura: fotoFactura.length,
    //   timestamp: new Date().toISOString()
    // });
    
    // Sincronizar siempre con el estado del padre si existe y es diferente
    if (foto && foto.length > 0) {
      const fotosParecen = JSON.stringify(foto) !== JSON.stringify(fotoFactura);
      if (fotosParecen) {
        //console.log('🔄 DEBUG: Sincronizando con fotos del padre porque son diferentes');
        setFotoFactura(foto);
      }
    }
  }, [foto]);

  // Función para obtener las fotos a mostrar (priorizar estado padre)
  const getFotosParaMostrar = () => {
    // Si hay fotos en el estado del padre, usarlas, sino usar las locales
    return (foto && foto.length > 0) ? foto : fotoFactura;
  };

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
        // Buscar el PDV por código
        const pdvEncontrado = data.find(pdv => 
          pdv.codigo && pdv.codigo.toLowerCase() === codigo.toLowerCase()
        );

        if (pdvEncontrado) {
          setPdvInfo(pdvEncontrado);
          setIsPdvValid(true);
          setPdvError('');
          //console.log('✅ PDV válido encontrado:', pdvEncontrado);
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
      //console.error('Error al validar PDV:', error);
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
    
    // Validar después de un pequeño delay para evitar muchas consultas
    clearTimeout(window.pdvValidationTimeout);
    window.pdvValidationTimeout = setTimeout(() => {
      validarCodigoPdv(value);
    }, 500);
  };
  
  const [formProducto, setFormProducto] = useState({
    presentacion: '',
    numeroCajas: '',
    pvpReal: '',
    pvpSugerido: '',
    tieneComentarios: false,
    comentarioVenta: ''
  });

  // Estado para mostrar el popup de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Hook para consulta de precios sugeridos
  const { consultarPrecioSugerido, loading: loadingPrecio, error: errorPrecio } = usePrecioSugerido();

  // Hook para obtener presentaciones disponibles desde la BD
  const { 
    presentaciones: presentacionesDisponibles, 
    loading: loadingPresentaciones, 
    error: errorPresentaciones,
    consultarPresentaciones,
    calcularGalones
  } = usePresentacionesReferencia();

  // Estado para la notificación de precio actualizado
  const [showPriceNotification, setShowPriceNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);

  // Hook para debug de fotos
  useEffect(() => {
    // console.log('📸 DEBUG: Estado de fotos actualizado:', {
    //   fotoFactura: fotoFactura.map(f => ({ name: f.name, size: f.size, type: f.type })),
    //   totalFotos: fotoFactura.length,
    //   timestamp: new Date().toISOString()
    // });
  }, [fotoFactura]);

  // Estado para detectar tipo de dispositivo
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window;
      setIsDesktop(!isMobile && !hasTouch);
      
        // console.log('🖥️ DEBUG: Información del dispositivo:', {
        //   isMobile,
        //   hasTouch,
        //   isDesktop: !isMobile && !hasTouch,
        //   userAgent: navigator.userAgent,
        //   platform: navigator.platform
        // });
    };
    
    checkDevice();
  }, []);

  // Hook para debug de validaciones del botón
  useEffect(() => {
    // Usar las fotos del padre si están disponibles, sino usar las locales
    const fotosActuales = (foto && foto.length > 0) ? foto : fotoFactura;
    
    // console.log('🔍 DEBUG: Estado de validaciones cambió:', {
    //   fecha: !!fecha,
    //   productosLength: productos.length,
    //   fotoFacturaLength: fotoFactura.length,
    //   fotosPropsLength: foto ? foto.length : 0,
    //   fotosActualesLength: fotosActuales.length,
    //   isSubmitting,
    //   buttonDisabled: isSubmitting || !fecha || productos.length === 0 || fotosActuales.length === 0,
    //   timestamp: new Date().toISOString()
    // });
  }, [fecha, productos.length, fotoFactura.length, foto, isSubmitting]);

  // Efecto para consultar precio automáticamente cuando se selecciona referencia y presentación
  useEffect(() => {
      // console.log('🔍 useEffect ejecutado - Estados actuales:', {
      //   referenciaSeleccionada: referenciaSeleccionada ? {
      //     id: referenciaSeleccionada.id,
      //     descripcion: referenciaSeleccionada.descripcion
      //   } : null,
      //   presentacion: formProducto.presentacion,
      //   precioReal: formProducto.pvpReal,
      //   condicionesCompletas: !!(referenciaSeleccionada && formProducto.presentacion && formProducto.pvpReal)
      // });

    const consultarPrecioAutomatico = async () => {
      // Solo consultar si tiene: referencia + presentación + precio real digitado
      if (referenciaSeleccionada && formProducto.presentacion && formProducto.pvpReal) {
        // console.log('🔄 Consultando precio automáticamente para:', {
        //   referencia: referenciaSeleccionada.descripcion,
        //   presentacion: formProducto.presentacion,
        //   precioReal: formProducto.pvpReal
        // });

        const resultado = await consultarPrecioSugerido(
          referenciaSeleccionada.descripcion, // Usar descripción en lugar de ID
          formProducto.presentacion
        );

        //console.log('📋 Resultado de la consulta:', resultado);

        if (resultado && resultado.success && resultado.precio_sugerido) {
          // Actualizar el precio sugerido automáticamente
          setFormProducto(prev => ({
            ...prev,
            pvpSugerido: resultado.precio_sugerido?.toString() || ''
          }));
          
          // Mostrar notificación de éxito
          setNotificationData({
            precio: resultado.precio_sugerido,
            referencia: referenciaSeleccionada.descripcion,
            presentacion: formProducto.presentacion
          });
          setShowPriceNotification(true);
          
          //console.log('✅ Precio sugerido actualizado:', resultado.precio_sugerido);
        } else {
          //console.warn('⚠️ No se pudo obtener precio sugerido:', resultado?.error);
          // Limpiar el precio si hay error
          setFormProducto(prev => ({
            ...prev,
            pvpSugerido: ''
          }));
        }
      } else {
        // console.log('❌ Faltan datos para consultar precio:', {
        //   tieneReferencia: !!referenciaSeleccionada,
        //   tienePresentacion: !!formProducto.presentacion,
        //   tienePrecioReal: !!formProducto.pvpReal
        // });
        
        // Limpiar precio sugerido si faltan condiciones
        if (formProducto.pvpSugerido) {
          setFormProducto(prev => ({
            ...prev,
            pvpSugerido: ''
          }));
        }
      }
    };

    consultarPrecioAutomatico();
  }, [referenciaSeleccionada, formProducto.presentacion, formProducto.pvpReal, consultarPrecioSugerido]);

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
      const response = await fetch(`${API_URL}/api/marcas`);
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
      //console.error('Error al cargar marcas:', error);
    }
  };

  // Cargar referencias según la marca seleccionada
  const cargarReferencias = async (marcaId) => {
    try {
      const response = await fetch(`${API_URL}/api/referencias?marca_id=${marcaId}`);
      const data = await response.json();
      if (data.success) {
        setReferencias(data.data);
      }
    } catch (error) {
      //console.error('Error al cargar referencias:', error);
    }
  };

  // Función para agregar una foto de factura individual
  const handleAgregarFotoFactura = (e) => {
    // console.log('📷 DEBUG: handleAgregarFotoFactura ejecutado');
    // console.log('📱 DEBUG: Información del dispositivo:', {
    //   userAgent: navigator.userAgent,
    //   isMobile: /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    //   isTouch: 'ontouchstart' in window,
    //   platform: navigator.platform
    // });
    
    const files = e.target.files;
    // console.log('📁 DEBUG: Files object:', files);
    // console.log('📊 DEBUG: Número de archivos seleccionados:', files?.length || 0);
    
    if (files && files.length > 0) {
      // Convertir FileList a Array
      const filesArray = Array.from(files);
      // console.log('📷 DEBUG: Archivos seleccionados:', filesArray.map(f => ({
      //   name: f.name,
      //   size: f.size,
      //   type: f.type
      // })));
      
      // Filtrar solo imágenes válidas
      const validImages = filesArray.filter(file => {
        const isValid = file.type.startsWith('image/');
        if (!isValid) {
          //console.warn('⚠️ DEBUG: Archivo no válido ignorado:', file.name, file.type);
        }
        return isValid;
      });
      
      if (validImages.length > 0) {
        // Agregar todas las imágenes válidas al array existente
        const nuevaListaFotos = [...fotoFactura, ...validImages];
        
        // Actualizar estado local
        setFotoFactura(nuevaListaFotos);
        
        // Actualizar estado del componente padre si existe la función setFoto
        if (setFoto && typeof setFoto === 'function') {
          setFoto(nuevaListaFotos);
          //console.log('📤 DEBUG: Actualizando fotos en componente padre');
        }

        //console.log('📋 DEBUG: Lista actualizada de fotos factura:', nuevaListaFotos.map(f => f.name));
        //console.log('🔢 DEBUG: Cantidad total de fotos:', nuevaListaFotos.length);

        e.target.value = ''; // Limpiar el input
        
        // Mostrar notificación flotante
        const mensaje = validImages.length === 1 
          ? `Foto de factura agregada: ${validImages[0].name}`
          : `${validImages.length} fotos de factura agregadas`;
          
        setFotoNotification({
          show: true,
          message: mensaje,
          tipo: 'factura'
        });
        
        // Ocultar notificación después de 3 segundos
        setTimeout(() => {
          setFotoNotification({ show: false, message: '', tipo: '' });
        }, 3000);
        
        // Log adicional para debug
        setTimeout(() => {
          //console.log('⏰ DEBUG: Estado después de 100ms:', {
          //  fotoFacturaLength: fotoFactura.length + validImages.length,
          //  timestamp: new Date().toISOString()
          //});
        }, 100);
      } else {
        //console.error('❌ DEBUG: No se seleccionaron archivos de imagen válidos');
        alert('Por favor selecciona solo archivos de imagen (JPG, PNG, WEBP, etc.)');
      }
    } else {
      //console.log('❌ DEBUG: No se seleccionó ningún archivo para factura');
    }
  };

  // Función para eliminar una foto específica (solo factura)
  const handleEliminarFoto = (tipo, index) => {
    if (tipo === 'factura') {
      // Usar la lista de fotos que se está mostrando actualmente
      const fotosActuales = getFotosParaMostrar();
      const fotoEliminada = fotosActuales[index];
      //console.log('🗑️ DEBUG: Eliminando foto de factura:', fotoEliminada?.name);
      
      const nuevaListaFotos = fotosActuales.filter((_, i) => i !== index);
      
      // Actualizar ambos estados
      setFotoFactura(nuevaListaFotos);
      
      // Actualizar estado del componente padre si existe la función setFoto
      if (setFoto && typeof setFoto === 'function') {
        setFoto(nuevaListaFotos);
        //console.log('📤 DEBUG: Actualizando fotos en componente padre después de eliminar');
      }
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
      pvpReal: '',
      pvpSugerido: '', // Limpiar también el precio sugerido
      tieneComentarios: false,
      comentarioVenta: ''
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

  const handleReferenciaClick = async (referencia) => {
      //console.log('🎯 Referencia seleccionada:', referencia.descripcion);
    setReferenciaSeleccionada(referencia);
    
    // Limpiar el formulario al cambiar de referencia
    setFormProducto({
      presentacion: '',
      numeroCajas: '',
      pvpReal: '',
      pvpSugerido: ''
    });
    
    // Consultar las presentaciones disponibles para esta referencia
    //console.log('🔍 Consultando presentaciones para:', referencia.descripcion);
    await consultarPresentaciones(referencia.descripcion);
  };

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
      // Usar el cálculo dinámico desde la BD en lugar de hardcodeado
      const galones = calcularGalones(cajas, formProducto.presentacion);
      
      console.log('Debug comentarios:', {
        tieneComentarios: formProducto.tieneComentarios,
        comentarioVenta: formProducto.comentarioVenta,
        comentarioTrim: formProducto.comentarioVenta?.trim(),
        comentarioLength: formProducto.comentarioVenta?.length,
        finalTieneComentarios: formProducto.tieneComentarios && formProducto.comentarioVenta && formProducto.comentarioVenta.trim() !== ''
      });
      
      const nuevoProducto = {
        id: Date.now(),
        marca: marcaSeleccionada.descripcion,
        referencia: referenciaSeleccionada.descripcion,
        presentacion: formProducto.presentacion,
        numeroCajas: cajas,
        pvpReal: formProducto.pvpReal ? parseFloat(formProducto.pvpReal) : '',
        volumenGalones: galones,
        pvpSugerido: formProducto.pvpSugerido ? parseFloat(formProducto.pvpSugerido) : '',
        // Solo guardar el comentario si existe y no está vacío
        comentarioVenta: formProducto.comentarioVenta && formProducto.comentarioVenta.trim() !== '' ? formProducto.comentarioVenta.trim() : null,
        // IMPORTANTE: Mantener el flag de tieneComentarios para el backend
        tieneComentarios: formProducto.tieneComentarios && formProducto.comentarioVenta && formProducto.comentarioVenta.trim() !== ''
      };
      
      console.log('Producto a agregar:', nuevoProducto);
      
      setProductos([...productos, nuevoProducto]);
      handleClosePopup();
    }
  };

  const handleEliminarProducto = (id) => {
    const producto = productos.find(p => p.id === id);
    setProductToDelete(producto);
    setShowDeleteConfirm(true);
  };

  // Función para confirmar eliminación
  const confirmarEliminar = () => {
    if (productToDelete) {
      setProductos(productos.filter(p => p.id !== productToDelete.id));
    }
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  // Función para cancelar eliminación
  const cancelarEliminar = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleCargarRegistro = async () => {
    try {
      const datosParaEnviar = {
        pdv_id: pdvCode,
        fecha,
        productos,
        fotos: {
          factura: fotoFactura
          // Solo fotos de factura según solicitud
        },
        user_id: userId
      };
      
      console.log('Datos a enviar:', datosParaEnviar);
      console.log('Productos con comentarios:', productos.map(p => ({
        id: p.id,
        marca: p.marca,
        referencia: p.referencia,
        comentarioVenta: p.comentarioVenta
      })));
      
      const respuesta = await enviarReporte(datosParaEnviar);
      //console.log('Datos a enviar:', respuesta);
      //console.log('Respuesta de la API:', respuesta);
    } catch (error) {
      //console.error('Error al cargar el registro:', error);
    }
  };


  // Modal para mostrar detalles de acumulados, fotos y productos
  const [showAcumuladosModal, setShowAcumuladosModal] = useState(false);
  const handleMostrarAcumulados = () => setShowAcumuladosModal(true);
  const handleCerrarAcumuladosModal = () => setShowAcumuladosModal(false);

  return (
    <div className={`implementation-section ${kpiTransition ? 'kpi-transition' : ''}`}>
      {/* Notificación flotante para fotos agregadas */}
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

      {/* Tabla de productos */}
      <div className="implementation-table-container">
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
                <th>Volumen (gal)</th>
                <th>Precio de Venta Sugerido</th>
                <th>Precio de Venta al Público</th>
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
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
                    <td className="volume-cell">
                      {typeof producto.volumenGalones === 'number' && !isNaN(producto.volumenGalones) 
                        ? producto.volumenGalones.toFixed(2) 
                        : producto.volumenGalones}
                    </td>
                    <td className="price-cell">{typeof producto.pvpSugerido === 'number' && !isNaN(producto.pvpSugerido) ? `$${producto.pvpSugerido.toFixed(2)}` : ''}</td>
                    <td>{typeof producto.pvpReal === 'number' && !isNaN(producto.pvpReal) ? `$${producto.pvpReal.toFixed(2)}` : ''}</td>
                    <td className="comments-cell" style={{textAlign: 'center'}}>
                      {producto.comentarioVenta && producto.comentarioVenta.trim() !== '' ? (
                        <span 
                          title={`Comentario: ${producto.comentarioVenta}`}
                          style={{
                            color: '#e30613',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'help'
                          }}
                        >
                          Si
                        </span>
                      ) : (
                        <span style={{color: '#999', fontSize: '12px'}}>No</span>
                      )}
                    </td>
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
            <label className="pdv-label" htmlFor="fecha-input-implementation">FECHA FACTURA</label>
            <div className="relative flex-1">
              <input
                id="fecha-input-implementation"
                className="pdv-input-date ta-center"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
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
                //accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/*"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                id="foto-factura-single"
                className="display-none"
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
                multiple={true}
                data-testid="foto-factura-input"
              />
              
              <button
                type="button"
                className="foto-btn-simple"
                onClick={() => {
                  const inputOculto = document.getElementById('foto-factura-single');
                  if (inputOculto) {
                    inputOculto.value = '';
                    inputOculto.click();
                  }
                }}
                data-testid="foto-factura-button"
              >
                📷 Adjuntar foto{getFotosParaMostrar().length !== 1 ? 's' : ''} de factura
              </button>
              
              {/* Lista de fotos seleccionadas */}
              {getFotosParaMostrar().length > 0 && (
                <div className="asesor-fotos-seleccionadas-implementacion">
                  <div className="asesor-fotos-count-implementacion">
                    {getFotosParaMostrar().length} foto{getFotosParaMostrar().length !== 1 ? 's' : ''} seleccionada{getFotosParaMostrar().length !== 1 ? 's' : ''}
                  </div>
                  <div className="asesor-fotos-list-implementacion">
                    {getFotosParaMostrar().map((fotoItem, index) => (
                      <div key={index} className="asesor-foto-item-implementacion">
                        <span className="asesor-foto-name-implementacion">{fotoItem.name}</span>
                        <button
                          type="button"
                          className="asesor-foto-remove-implementacion"
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
        </div>
      </div>

      {/* Botón de envío */}
      <div className="implementation-actions">
        <button
          className="btn-cargar-registro"
          onClick={() => {
            //console.log('🔴 DEBUG: Botón CARGAR REGISTRO presionado');
            
            // Usar las fotos del padre si están disponibles, sino usar las locales
            const fotosActuales = (foto && foto.length > 0) ? foto : fotoFactura;
            
            // console.log('🔴 DEBUG: Estado actual:', {
            //   fecha,
            //   productosLength: productos.length,
            //   fotoFacturaLength: fotoFactura.length,
            //   fotosPropsLength: foto ? foto.length : 0,
            //   fotosActualesLength: fotosActuales.length,
            //   isSubmitting,
            //   disabled: isSubmitting || !fecha || productos.length === 0 || fotosActuales.length === 0
            // });
            handleSubmit();
          }}
          disabled={isSubmitting || !fecha || productos.length === 0 || (fotoFactura.length === 0 && (!foto || foto.length === 0))}
          title={
            !fecha ? 'Debe seleccionar una fecha' :
            productos.length === 0 ? 'Debe agregar al menos un producto' :
            (fotoFactura.length === 0 && (!foto || foto.length === 0)) ? 'Debe adjuntar al menos una foto de factura' :
            'Cargar registro'
          }
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
                      onChange={(e) => {
                        //console.log('📦 Presentación cambiada a:', e.target.value);
                        //console.log('🏷️ Referencia actual:', referenciaSeleccionada?.descripcion);
                        setFormProducto({...formProducto, presentacion: e.target.value});
                        
                        // Limpiar precio anterior para forzar nueva consulta
                        if (e.target.value && referenciaSeleccionada) {
                          //console.log('🔄 Limpiando precio anterior para nueva consulta');
                          setFormProducto(prev => ({
                            ...prev, 
                            presentacion: e.target.value,
                            pvpSugerido: '' // Esto forzará el useEffect a ejecutarse
                          }));
                        }
                      }}
                      className="form-input-modern"
                      required
                      disabled={loadingPresentaciones}
                    >
                      <option value="">
                        {loadingPresentaciones ? 'Cargando presentaciones...' : 'Seleccionar presentación'}
                      </option>
                      {presentacionesDisponibles.map((presentacion, index) => (
                        <option key={index} value={presentacion.presentacion}>
                          {presentacion.presentacion}
                        </option>
                      ))}
                    </select>
                    {errorPresentaciones && (
                      <div style={{color: '#dc3545', fontSize: '12px', marginTop: '4px'}}>
                        Error: {errorPresentaciones}
                      </div>
                    )}
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
                    <label>
                      PRECIO DE VENTA SUGERIDO UND: 
                      <span className="optional">(Automático cuando ingrese precio real)</span>
                      {loadingPrecio && (
                        <span className="loading-indicator" style={{
                          marginLeft: '8px',
                          color: '#e30613',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          🔄 Consultando...
                        </span>
                      )}
                      {errorPrecio && (
                        <span className="error-indicator" style={{
                          marginLeft: '8px',
                          color: '#dc3545',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ⚠️ Error al consultar
                        </span>
                      )}
                      {formProducto.pvpSugerido && !loadingPrecio && !errorPrecio && (
                        <span className="success-indicator" style={{
                          marginLeft: '8px',
                          color: '#28a745',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ✅ Precio actualizado
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formProducto.pvpSugerido ? formatearCOP(formProducto.pvpSugerido) : (loadingPrecio ? "Consultando..." : "Digite precio real para consultar")}
                      readOnly={true}
                      disabled={true}
                      className={`form-input-modern readonly-input ${loadingPrecio ? 'loading' : ''} ${formProducto.pvpSugerido ? 'success' : ''}`}
                      placeholder={loadingPrecio ? "Consultando precio..." : "Primero digite precio real"}
                      style={{
                        backgroundColor: loadingPrecio ? '#f8f9fa' : (formProducto.pvpSugerido ? '#e8f5e8' : '#f5f5f5'),
                        borderColor: errorPrecio ? '#dc3545' : (formProducto.pvpSugerido ? '#28a745' : '#ccc'),
                        cursor: 'not-allowed',
                        color: formProducto.pvpSugerido ? '#2d5a2d' : '#666'
                      }}
                      title={formProducto.pvpSugerido ? 
                        `Precio sugerido obtenido automáticamente: ${formatearCOP(formProducto.pvpSugerido)}` : 
                        "Este precio se consulta automáticamente al seleccionar referencia, presentación y digitar precio real"}
                    />
                    {/* Botón manual para consultar precio (solo para debugging) */}
                    {referenciaSeleccionada && formProducto.presentacion && formProducto.pvpReal && !formProducto.pvpSugerido && !loadingPrecio && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <button
                          type="button"
                          onClick={async () => {
                            // console.log('🔄 Consulta manual iniciada');
                            // const resultado = await consultarPrecioSugerido(
                            //   referenciaSeleccionada.descripcion, 
                            //   formProducto.presentacion
                            // );
                            //console.log('📋 Resultado consulta manual:', resultado);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e30613',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Consultar Precio Manualmente
                        </button>
                      </div>
                    )}
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

                  {/* NUEVO: Checkbox para comentarios adicionales */}
                  <div className="form-row">
                    <div className="checkbox-container" style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <input
                        type="checkbox"
                        id="comentarios-checkbox"
                        checked={formProducto.tieneComentarios}
                        onChange={(e) => {
                          setFormProducto({
                            ...formProducto, 
                            tieneComentarios: e.target.checked,
                            // Si se desmarca, limpiar el comentario
                            comentarioVenta: e.target.checked ? formProducto.comentarioVenta : ''
                          });
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                      <label 
                        htmlFor="comentarios-checkbox" 
                        style={{
                          cursor: 'pointer',
                          userSelect: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#333'
                        }}
                      >
                        ¿Comentarios Adicionales?
                      </label>
                    </div>
                    
                    {/* Campo de comentarios - solo visible si el checkbox está marcado */}
                    {formProducto.tieneComentarios && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '6px',
                          fontSize: '13px',
                          color: '#666'
                        }}>
                          Comentario adicional:
                        </label>
                        <textarea
                          value={formProducto.comentarioVenta}
                          onChange={(e) => setFormProducto({
                            ...formProducto, 
                            comentarioVenta: e.target.value
                          })}
                          className="form-input-modern"
                          placeholder="Escriba aquí cualquier comentario adicional sobre este producto..."
                          rows="3"
                          maxLength="500"
                          style={{
                            resize: 'vertical',
                            minHeight: '60px',
                            lineHeight: '1.4'
                          }}
                        />
                        <div style={{
                          fontSize: '11px',
                          color: '#999',
                          textAlign: 'right',
                          marginTop: '4px'
                        }}>
                          {(formProducto.comentarioVenta || '').length}/500 caracteres
                        </div>
                      </div>
                    )}
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

      {/* Notificación de precio actualizado */}
      <PriceNotification
        show={showPriceNotification}
        precio={notificationData?.precio}
        referencia={notificationData?.referencia}
        presentacion={notificationData?.presentacion}
        onClose={() => setShowPriceNotification(false)}
      />
    </div>
  );
};


export default ImplementationSection;