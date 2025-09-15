import { useState, useCallback } from 'react';
import { API_URL } from '../../config.js';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Hook para consultar el precio sugerido de una referencia
 */
export const usePrecioSugerido = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, user } = useAuthContext(); // Obtener token del contexto

  /**
   * Consulta el precio sugerido para una referencia específica
   * @param {string} referenciaDescripcion - Descripción/nombre de la referencia
   * @param {string} presentacion - Presentación del producto (Galón, Cuarto, etc.)
   * @returns {Promise<Object>} - Objeto con el precio sugerido y otros datos
   */
  const consultarPrecioSugerido = useCallback(async (referenciaDescripcion, presentacion) => {
    if (!referenciaDescripcion || !presentacion) {
      //console.warn('❌ consultarPrecioSugerido: referenciaDescripcion y presentacion son requeridos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // console.log('🔍 Consultando precio sugerido:', { referenciaDescripcion, presentacion });
      // console.log('🔑 Token disponible:', !!token, 'Usuario:', user?.email);
      
      // Construir la URL con parámetros de ruta según tu endpoint
      // /precio-sugerido/:referencia/:presentacion  
      const url = `${API_URL}/api/asesor/precio-sugerido/${encodeURIComponent(referenciaDescripcion)}/${encodeURIComponent(presentacion)}`;
      //console.log('🌐 URL de consulta:', url);

      // Obtener token de diferentes fuentes
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      //console.log('🔐 Token utilizado:', authToken ? 'Token presente' : 'Sin token');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Agregar token con la estructura correcta
          'Authorization': `Bearer ${authToken}`
        }
      });

      //console.log('📡 Respuesta HTTP:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error de respuesta:', errorText);
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      
      //console.log('✅ Precio sugerido obtenido:', responseData);
      
      // Adaptar la respuesta según tu estructura de backend
      if (responseData.success && responseData.data) {
        return {
          precio_sugerido: responseData.data.precio_sugerido || 0,
          referencia: responseData.data.referencia,
          presentacion: responseData.data.presentacion,
          descripcion: responseData.data.referencia,
          success: true
        };
      } else {
        throw new Error(responseData.message || 'No se encontró precio sugerido');
      }

    } catch (err) {
      const errorMessage = err.message || 'Error al consultar precio sugerido';
      //console.error('❌ Error consultando precio sugerido:', err);
      setError(errorMessage);
      
      return {
        precio_sugerido: 0,
        error: errorMessage,
        success: false
      };
    } finally {
      setLoading(false);
    }
  }, [token, user]); // Agregar dependencias del contexto

  /**
   * Limpiar el estado de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    consultarPrecioSugerido,
    loading,
    error,
    clearError
  };
};

export default usePrecioSugerido;
