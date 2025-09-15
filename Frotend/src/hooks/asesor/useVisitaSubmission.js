import { useState } from 'react';
import { CONFIG } from '../../config.js';

/**
 * Hook personalizado para manejar el envío de reportes de VISITA
 * @param {number} userId - ID del usuario
 * @returns {Object} Estados y funciones para el envío de visitas
 */
export const useVisitaSubmission = (userId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Enviar visita al servidor
  const enviarVisita = async (params) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      // Validación básica
      if (!params.pdv_id || !params.fecha || !params.foto_seguimiento) {
        setSubmitError('Faltan campos obligatorios para la visita');
        alert('Error: Faltan campos obligatorios para la visita');
        setIsSubmitting(false);
        return false;
      }
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
                //console.log(`📷 Imagen visita comprimida (${isProduction ? 'PROD' : 'DEV'}): ${file.name} ${(file.size/1024/1024).toFixed(2)}MB -> ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          };

          img.src = URL.createObjectURL(file);
        });
      };

      // Comprimir la foto de seguimiento si es necesario
      const compressedPhoto = await compressImage(params.foto_seguimiento);

      const payload = new FormData();
      payload.append('pdv_id', params.pdv_id);
      payload.append('user_id', userId);
      payload.append('fecha', params.fecha);
      payload.append('foto_seguimiento', compressedPhoto);
      payload.append('is_seguimiento', params.is_seguimiento || 0);
      
      // console.log('🔄 Enviando visita con IsSeguimiento:', params.is_seguimiento);
      // console.log('🔄 Valor final en FormData:', params.is_seguimiento || 0);
      // console.log('🔄 Tipo de dato:', typeof (params.is_seguimiento || 0));
      
      // Enviar a la API con timeout extendido para móviles
      const controller = new AbortController();
      // Timeout más largo en producción debido a la latencia de red
      const isProduction = !import.meta.env.DEV;
      const timeoutDuration = isProduction ? 300000 : 120000; // 5 min producción, 2 min desarrollo
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      // console.log('🌐 Enviando visita a:', `${CONFIG.API_URL}/api/cargar-registros-visita`);
      // console.log('⏱️ Timeout configurado:', timeoutDuration / 1000, 'segundos');
      // console.log('🔒 Entorno:', import.meta.env.MODE);

      const response = await fetch(`${CONFIG.API_URL}/api/cargar-registros-visita`, {
        method: 'POST',
        headers: {
          // NO incluir Content-Type para FormData - el navegador lo maneja automáticamente
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      if (response.ok && result.success) {
        setSubmitSuccess(true);
        // No alert, el modal se maneja en el componente
        return true;
      } else {
        throw new Error(result.message || 'Error al enviar la visita');
      }
    } catch (error) {
      //console.error('Error al enviar visita:', error);

      // Manejo específico de errores para móviles
      let errorMessage = 'Error desconocido';
      
      if (error.name === 'AbortError') {
        errorMessage = 'La carga se canceló por timeout. La conexión móvil puede ser lenta, intente de nuevo.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifique su internet y reintente.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Error de red. Intente conectarse a WiFi.';
      } else if (error.message.includes('413') || error.message.includes('too large')) {
        errorMessage = 'La foto es muy grande. Se comprimió pero aún es grande.';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      setSubmitError(errorMessage);
      alert(`❌ Error al enviar la visita:\n${errorMessage}`);
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

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    enviarVisita,
    resetearEstado
  };
};
