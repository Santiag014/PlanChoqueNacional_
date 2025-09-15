import { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Hook para gestionar puntos de venta desde BackOffice
 * @returns {Object} Estado y funciones para gestionar PDVs
 */
export function usePuntosVentaBackOffice() {
  const { authenticatedFetch } = useAuthContext();
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar todos los puntos de venta del sistema
   */
  const cargarPuntosVenta = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('BackOffice: Cargando puntos de venta...');
      
      const response = await authenticatedFetch(`${API_URL}/api/backoffice/puntos-venta`);
      
      if (!response.ok) {
        // Información de debugging detallada
        const errorText = await response.text();
        const fullUrl = `${API_URL}/api/backoffice/puntos-venta`.startsWith('http')
          ? `${API_URL}/api/backoffice/puntos-venta`
          : `${window.location.origin}/api/backoffice/puntos-venta`;
        
        console.error('BackOffice PDVs - Error en petición:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          response: errorText
        });
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log('BackOffice: Puntos de venta cargados exitosamente:', data.data.length);
        setPuntosVenta(data.data);
      } else {
        console.error('BackOffice: Respuesta inválida:', data);
        throw new Error(data.message || 'Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('Error al cargar puntos de venta:', error);
      setError(error.message);
      setPuntosVenta([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar estado de un punto de venta (activo/inactivo)
   * @param {number} pdvId - ID del punto de venta
   * @param {boolean} activo - Nuevo estado activo
   * @returns {Promise<Object>} Resultado de la operación
   */
  const actualizarEstadoPdv = async (pdvId, activo) => {
    try {
      console.log('BackOffice: Actualizando estado PDV:', { pdvId, activo });
      
      const response = await authenticatedFetch(`${API_URL}/api/backoffice/punto-venta/${pdvId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const fullUrl = `${API_URL}/api/backoffice/punto-venta/${pdvId}/estado`.startsWith('http') 
          ? `${API_URL}/api/backoffice/punto-venta/${pdvId}/estado` 
          : `${window.location.origin}/api/backoffice/punto-venta/${pdvId}/estado`;
        
        console.error('BackOffice PDVs - Error al actualizar estado:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          response: errorText
        });
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('BackOffice: Estado de PDV actualizado exitosamente');
        return data;
      } else {
        throw new Error(data.message || 'Error al actualizar estado del punto de venta');
      }
      
    } catch (error) {
      console.error('Error al actualizar estado del PDV:', error);
      throw error;
    }
  };

  /**
   * Cargar puntos de venta automáticamente al montar el componente
   */
  useEffect(() => {
    cargarPuntosVenta();
    
    // Auto-actualización cada 10 minutos
    console.log('BackOffice PDVs: Configurando auto-actualización cada 10 minutos');
    const interval = setInterval(() => {
      console.log('BackOffice PDVs: Ejecutando auto-actualización...');
      cargarPuntosVenta();
    }, 10 * 60 * 1000);

    return () => {
      console.log('BackOffice PDVs: Limpiando intervalo de auto-actualización');
      clearInterval(interval);
    };
  }, []);

  return {
    puntosVenta,
    loading,
    error,
    cargarPuntosVenta,
    actualizarEstadoPdv
  };
}
