import { useState } from 'react';
import { API_URL } from '../../config.js';

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
      const payload = new FormData();
      payload.append('pdv_id', params.pdv_id);
      payload.append('user_id', userId);
      payload.append('fecha', params.fecha);
      payload.append('foto_seguimiento', params.foto_seguimiento);
      // Enviar a la API
      const response = await fetch(`${API_URL}/api/cargar-registros-visita`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: payload
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSubmitSuccess(true);
        // No alert, el modal se maneja en el componente
        return true;
      } else {
        throw new Error(result.message || 'Error al enviar la visita');
      }
    } catch (error) {
      setSubmitError(error.message);
      alert(`❌ Error al enviar la visita:\n${error.message || 'Error desconocido'}`);
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
