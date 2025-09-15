import { useState } from 'react';
import { CONFIG } from '../../config.js';

/**
 * Hook personalizado para manejar el envío de reportes
 * @param {number} userId - ID del usuario
 * @returns {Object} Estados y funciones para el envío de reportes
 */
export const useReportSubmission = (userId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Construir reporte final
  const construirReporteFinal = (codigoPDV, correspondeA, kpiSeleccionado, fecha, foto, acumulados) => {
    return {
      user_id: userId,
      codigo_pdv: codigoPDV,
      nombre_pdv: correspondeA,
      kpi_tipo: kpiSeleccionado,
      fecha: fecha,
      foto_evidencia: foto,
      productos: acumulados.map(item => ({
        producto_id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal
      })),
      total: acumulados.reduce((sum, item) => sum + item.subtotal, 0),
      fecha_creacion: new Date().toISOString()
    };
  };

  // Enviar reporte al servidor
  const enviarReporte = async (params) => {
    //console.log('Params completos al inicio:', params);  // <-- imprime siempre
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let payload;
      let isFormData = false;

      // VISITA SIMPLE
      if (params.visitaSimple) {
        if (!params.pdv_id || !params.fecha || !params.numero_visita) {
          setSubmitError('Faltan campos obligatorios para la visita');
          alert('Error: Faltan campos obligatorios para la visita');
          setIsSubmitting(false);
          return false;
        }

        // Función para comprimir imágenes (reutilizada)
        const compressImage = (file, maxSizeMB = 2, maxWidthOrHeight = 1920) => {
          return new Promise((resolve) => {
            if (!file || file.size <= maxSizeMB * 1024 * 1024) {
              resolve(file); // Si es pequeño o no existe, no comprimir
              return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
              // Calcular nuevas dimensiones
              let { width, height } = img;
              if (width > height) {
                if (width > maxWidthOrHeight) {
                  height = (height * maxWidthOrHeight) / width;
                  width = maxWidthOrHeight;
                }
              } else {
                if (height > maxWidthOrHeight) {
                  width = (width * maxWidthOrHeight) / height;
                  height = maxWidthOrHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;

              // Dibujar imagen redimensionada
              ctx.drawImage(img, 0, 0, width, height);

              // Convertir a blob con calidad reducida
              canvas.toBlob(
                (blob) => {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  //console.log(`📷 Imagen visita simple comprimida: ${file.name} ${(file.size/1024/1024).toFixed(2)}MB -> ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
                  resolve(compressedFile);
                },
                'image/jpeg',
                0.8 // Calidad 80%
              );
            };

            img.src = URL.createObjectURL(file);
          });
        };

        payload = new FormData();
        payload.append('pdv_id', params.pdv_id);
        payload.append('user_id', userId);
        payload.append('fecha', params.fecha);
        payload.append('numero_visita', params.numero_visita);
        
        if (params.foto_seguimiento) {
          const compressedPhoto = await compressImage(params.foto_seguimiento);
          payload.append('foto_seguimiento', compressedPhoto);
        }
        isFormData = true;
        
      } else {
        // Validación mejorada para registro completo
        //console.log('Params recibidos:', params); // debug

        // pdv_id puede ser string o número, pero debe existir y no estar vacío
        if (params.pdv_id === undefined || params.pdv_id === null || String(params.pdv_id).trim() === '') {
          setSubmitError('Falta el Punto de venta');
          alert('Error: Falta el Punto de venta');
          setIsSubmitting(false);
          return false;
        }

        // fecha debe ser string no vacía
        if (typeof params.fecha !== 'string' || params.fecha.trim() === '') {
          setSubmitError('Falta la fecha');
          alert('Error: Falta la fecha');
          setIsSubmitting(false);
          return false;
        }

        // productos debe ser array con al menos un elemento
        if (!Array.isArray(params.productos) || params.productos.length === 0) {
          setSubmitError('Debe agregar al menos un producto');
          alert('Error: Debe agregar al menos un producto');
          setIsSubmitting(false);
          return false;
        }

        // fotos debe ser objeto que contenga las claves necesarias
        if (
          !params.fotos ||
          typeof params.fotos !== 'object' ||
          !('factura' in params.fotos) 
        ) {
          setSubmitError('Debe adjuntar fotos válidas');
          alert('Error: Debe adjuntar fotos válidas');
          setIsSubmitting(false);
          return false;
        }

        // Preparar FormData
        payload = new FormData();
        payload.append('pdv_id', params.pdv_id);
        payload.append('fecha', params.fecha);
        payload.append('user_id', userId);
        payload.append('productos', JSON.stringify(params.productos));
        payload.append('fotos', JSON.stringify(params.fotos));

        // Adjuntar archivos de fotos reales si existen
        // Función para comprimir imágenes grandes (especialmente en móviles)
        const compressImage = (file, maxSizeMB = 2, maxWidthOrHeight = 1920) => {
          return new Promise((resolve) => {
            // En producción, comprimir más agresivamente
            const isProduction = !import.meta.env.DEV;
            const productionMaxSize = isProduction ? 1 : maxSizeMB; // 1MB en producción, 2MB en desarrollo
            const productionMaxDimension = isProduction ? 1280 : maxWidthOrHeight; // 1280px en producción
            
            if (file.size <= productionMaxSize * 1024 * 1024) {
              resolve(file); // Si es pequeño, no comprimir
              return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
              // Calcular nuevas dimensiones
              let { width, height } = img;
              if (width > height) {
                if (width > productionMaxDimension) {
                  height = (height * productionMaxDimension) / width;
                  width = productionMaxDimension;
                }
              } else {
                if (height > productionMaxDimension) {
                  width = (width * productionMaxDimension) / height;
                  height = productionMaxDimension;
                }
              }

              canvas.width = width;
              canvas.height = height;

              // Dibujar imagen redimensionada
              ctx.drawImage(img, 0, 0, width, height);

              // Convertir a blob con calidad reducida (más agresiva en producción)
              const quality = isProduction ? 0.6 : 0.8; // 60% en producción, 80% en desarrollo
              canvas.toBlob(
                (blob) => {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  //console.log(`📷 Imagen comprimida (${isProduction ? 'PROD' : 'DEV'}): ${file.name} ${(file.size/1024/1024).toFixed(2)}MB -> ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
                  resolve(compressedFile);
                },
                'image/jpeg',
                quality
              );
            };

            img.src = URL.createObjectURL(file);
          });
        };

        // Procesar fotos de factura
        const facturaFiles = params.fotos?.factura || [];
        //console.log('🔍 DEBUG: Fotos de factura a procesar:', {
        //  length: facturaFiles.length,
        //  files: facturaFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
        //});

        for (let idx = 0; idx < facturaFiles.length; idx++) {
          const file = facturaFiles[idx];
          if (file) {
            const compressedFile = await compressImage(file);
            const fieldName = `factura_${idx}`;
            payload.append(fieldName, compressedFile);
            // console.log(`📤 DEBUG: Agregando foto ${idx + 1} como "${fieldName}":`, {
            //   originalName: file.name,
            //   compressedSize: compressedFile.size,
            //   type: compressedFile.type
            // });
          }
        }

        // Procesar fotos de implementación
        const implementacionFiles = params.fotos?.implementacion || [];
        for (let idx = 0; idx < implementacionFiles.length; idx++) {
          const file = implementacionFiles[idx];
          if (file) {
            const compressedFile = await compressImage(file);
            payload.append(`implementacion_${idx}`, compressedFile);
          }
        }

        isFormData = true;

        // Depuración: mostrar contenido del FormData
        // console.log('📋 DEBUG: Contenido completo del FormData a enviar:');
        // let formDataCount = 0;
        // for (let pair of payload.entries()) {
        //   formDataCount++;
        //   if (pair[1] instanceof File) {
        //     console.log(`FormData[${formDataCount}]:`, pair[0], '-> File:', {
        //       name: pair[1].name,
        //       size: pair[1].size,
        //       type: pair[1].type
        //     });
        //   } else {
        //     console.log(`FormData[${formDataCount}]:`, pair[0], '->', pair[1]);
        //   }
        // }
        // console.log(`📊 DEBUG: Total de elementos en FormData: ${formDataCount}`);
      }

      // Enviar a la API con timeout extendido para móviles
      const controller = new AbortController();
      // Timeout más largo en producción debido a la latencia de red
      const isProduction = !import.meta.env.DEV;
      const timeoutDuration = isProduction ? 300000 : 120000; // 5 min producción, 2 min desarrollo
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      // Log detallado para debug en producción
      // console.log('🌐 Enviando a:', `${CONFIG.API_URL}/api/cargar-registro-pdv`);
      // console.log('🔒 Entorno:', import.meta.env.MODE);
      // console.log('⏱️ Timeout configurado:', timeoutDuration / 1000, 'segundos');
      // console.log('🌍 Hostname:', window.location.hostname);
      // console.log('📱 User Agent:', navigator.userAgent);

      const response = await fetch(`${CONFIG.API_URL}/api/cargar-registro-pdv`, {
        method: 'POST',
        headers: {
          // NO incluir Content-Type para FormData - el navegador lo maneja automáticamente
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // console.log('📡 Response status:', response.status);
      // console.log('📡 Response ok:', response.ok);

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        // No alert, el modal se maneja en el componente
        return true;
      } else {
        throw new Error(result.message || 'Error al enviar el reporte');
      }

    } catch (error) {
      // console.error('Error al enviar reporte:', error);
      // console.error('Error name:', error.name);
      // console.error('Error message:', error.message);
      // console.error('Error stack:', error.stack);
      
      // Manejo específico de errores para móviles y producción
      let errorMessage = 'Error desconocido';
      
      if (error.name === 'AbortError') {
        errorMessage = 'La carga se canceló por timeout. La conexión móvil puede ser lenta, intente de nuevo.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Problema de red o servidor no disponible.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Error de red. Intente conectarse a WiFi.';
      } else if (error.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
        errorMessage = 'Error de certificado SSL. Problema de seguridad en la conexión.';
      } else if (error.message.includes('ERR_NETWORK_CHANGED')) {
        errorMessage = 'La red cambió durante la carga. Intente de nuevo.';
      } else if (error.message.includes('413') || error.message.includes('too large')) {
        errorMessage = 'Los archivos son muy grandes. Las fotos se comprimieron pero aún son grandes.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Error de permisos. Problema de configuración del servidor.';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      // Log adicional para debug en producción
      // console.error('🚨 Detalles del error completo:', {
      //   name: error.name,
      //   message: error.message,
      //   stack: error.stack,
      //   userAgent: navigator.userAgent,
      //   url: window.location.href,
      //   apiUrl: CONFIG.API_URL,
      //   timestamp: new Date().toISOString(),
      //   connection: navigator.connection ? {
      //     effectiveType: navigator.connection.effectiveType,
      //     downlink: navigator.connection.downlink,
      //     rtt: navigator.connection.rtt
      //   } : 'No disponible'
      // });
      
      setSubmitError(errorMessage);
      alert(`❌ Error al enviar el reporte:\n${errorMessage}\n\nDetalles técnicos: ${error.name}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear estado
  const resetearEstado = () => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Validar campos antes de enviar
  const validarCampos = (codigoPDV, correspondeA, kpiSeleccionado, fecha, acumulados) => {
    const errores = [];

    if (!codigoPDV) errores.push('Código PDV es obligatorio');
    if (!correspondeA) errores.push('Nombre PDV es obligatorio');
    if (!kpiSeleccionado) errores.push('KPI es obligatorio');
    if (!fecha) errores.push('Fecha es obligatoria');

    if ((kpiSeleccionado === 'Volumen' || kpiSeleccionado === 'Precio') && acumulados.length === 0) {
      errores.push('Debe seleccionar al menos un producto para este KPI');
    }

    return errores;
  };

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    construirReporteFinal,
    enviarReporte,
    resetearEstado,
    validarCampos
  };
};
