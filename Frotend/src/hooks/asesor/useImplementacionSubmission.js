import { useState } from 'react';
import { CONFIG } from '../../config.js';

/**
 * Hook personalizado para manejar el envío de implementaciones
 * @param {number} userId - ID del usuario
 * @returns {Object} Estados y funciones para el envío de implementaciones
 */
export const useImplementacionSubmission = (userId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Enviar implementación al servidor
  const enviarImplementacion = async (params) => {
    // console.log('🎯 useImplementacionSubmission.enviarImplementacion iniciado');
    // console.log('🎯 Params recibidos:', params);
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Validación básica
      if (!params.pdv_id || !params.fecha || !params.tipo_implementacion) {
        setSubmitError('Faltan campos obligatorios para la implementación');
        alert('Error: Faltan campos obligatorios para la implementación');
        setIsSubmitting(false);
        return false;
      }

      // 🚨 RESTRICCIÓN 2: Comentarios OBLIGATORIOS
      if (!params.observaciones || !params.observaciones.trim()) {
        setSubmitError('Los comentarios son obligatorios para cargar la implementación');
        alert('⚠️ RESTRICCIÓN: Los comentarios son obligatorios. Por favor ingresa una observación antes de continuar.');
        setIsSubmitting(false);
        return false;
      }

      // Solo validar si desea activación cuando es obligatorio
      // Permitir envío tanto con SÍ como con NO
      if (params.desea_activacion && params.desea_activacion === 'NO' && (!params.observaciones || !params.observaciones.trim())) {
        // Solo mostrar advertencia pero permitir continuar
        //console.warn('⚠️ Se está enviando implementación rechazada sin observaciones');
      }

      // Función para comprimir imágenes
      const compressImage = (file, maxSizeMB = 2, maxWidthOrHeight = 1920) => {
        return new Promise((resolve) => {
          const isProduction = !import.meta.env.DEV;
          const productionMaxSize = isProduction ? 1 : maxSizeMB;
          const productionMaxDimension = isProduction ? 1280 : maxWidthOrHeight;
          
          if (file.size <= productionMaxSize * 1024 * 1024) {
            resolve(file);
            return;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
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
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              'image/jpeg',
              0.8
            );
          };
          
          img.src = URL.createObjectURL(file);
        });
      };

      // Crear FormData
      const formData = new FormData();
      formData.append('pdv_id', params.pdv_id);
      formData.append('user_id', userId);
      formData.append('fecha', params.fecha);
      formData.append('nro_implementacion', params.tipo_implementacion);
      // Manejar el estado de aceptación de la implementación
      const acepto = params.desea_activacion === 'SI' ? 'Si' : 
                    params.desea_activacion === 'NO' ? 'No' : '';
      formData.append('acepto_implementacion', acepto);
      formData.append('observacion_implementacion', params.observaciones || '');

      // Agregar foto de remisión si existe
      if (params.foto_remision) {
        const fotoRemisionComprimida = await compressImage(params.foto_remision);
        formData.append('fotoRemision', fotoRemisionComprimida);
        console.log(`📄 Foto de remisión agregada: ${params.foto_remision.name}`);
      }

      // Preparar productos y sus fotos solo si acepta la implementación
      const productos = [];
      let fotoImplementacionYaEnviada = false; // FLAG para evitar duplicados
      
      if (params.desea_activacion === 'SI' && params.productos_seleccionados && params.productos_seleccionados.length > 0) {
        for (const producto of params.productos_seleccionados) {
          productos.push({
            nombre: producto.nombre_producto || producto.nombre,
            cantidad: producto.cantidad || 0
          });
          
          // ENVIAR FOTO SOLO UNA VEZ (no por cada producto)
          if (!fotoImplementacionYaEnviada && params.fotos_implementacion && params.fotos_implementacion[producto.producto_id || producto.id]) {
            const fotoImplementacion = params.fotos_implementacion[producto.producto_id || producto.id];
            
            // 🚨 VALIDACIÓN: Verificar si es la misma foto que la remisión
            if (params.foto_remision && fotoImplementacion.name === params.foto_remision.name) {
              console.error('🛑 ERROR: Se está intentando usar la misma foto para implementación y remisión!');
              console.error(`Archivo: ${fotoImplementacion.name}`);
              throw new Error('No puedes usar la misma foto para la implementación y la remisión. Por favor selecciona fotos diferentes.');
            }
            
            const fotoProductoComprimida = await compressImage(fotoImplementacion);
            const fieldnameFoto = `foto_implementacion_${params.tipo_implementacion}`;
            formData.append(fieldnameFoto, fotoProductoComprimida);
            fotoImplementacionYaEnviada = true; // Marcar como enviada
            console.log(`📸 Foto de implementación enviada UNA VEZ con fieldname: "${fieldnameFoto}"`);
            console.log(`📸 Archivo: ${fotoImplementacion.name}`);
          }
        }
      }
      
      // Agregar productos como JSON
      formData.append('productos', JSON.stringify(productos));

      //   console.log('📤 Enviando implementación:', {
      //     pdv_id: params.pdv_id,
      //     user_id: userId,
      //     fecha: params.fecha,
      //     nro_implementacion: params.tipo_implementacion,
      //     acepto_implementacion: acepto,
      //     tiene_observaciones: params.observaciones ? 'Si' : 'No',
      //     tiene_foto_remision: params.foto_remision ? 'Si' : 'No',
      //     productos_count: productos.length,
      //     endpoint: `${CONFIG.API_URL}/api/cargar-registros-implementacion`
      // });

      // Realizar petición al nuevo endpoint
      const response = await fetch(`${CONFIG.API_URL}/api/cargar-registros-implementacion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar implementación');
      }

      if (data.success) {
        //console.log('✅ Implementación enviada exitosamente:', data);
        setSubmitSuccess(true);
        return true;
      } else {
        throw new Error(data.message || 'Error desconocido al enviar implementación');
      }

    } catch (error) {
      //console.error('❌ Error al enviar implementación:', error);
      setSubmitError(error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    enviarImplementacion,
    setSubmitError,
    setSubmitSuccess
  };
};

export default useImplementacionSubmission;
