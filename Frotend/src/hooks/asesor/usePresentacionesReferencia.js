import { useState, useCallback } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener las presentaciones disponibles para una referencia específica
 * desde la base de datos, incluyendo los factores de conversión de galonaje
 */
export const usePresentacionesReferencia = () => {
  const [presentaciones, setPresentaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const consultarPresentaciones = useCallback(async (referenciaDescripcion) => {
    if (!referenciaDescripcion) {
      setPresentaciones([]);
      setError(null);
      return { success: false, error: 'Referencia requerida' };
    }

    setLoading(true);
    setError(null);

    try {
      //console.log('🔍 Consultando presentaciones para referencia:', referenciaDescripcion);
      
      const response = await fetch(
        `${API_URL}/api/asesor/presentaciones-referencia/${encodeURIComponent(referenciaDescripcion)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      //console.log('📋 Respuesta del servidor:', data);

      if (data.success) {
        setPresentaciones(data.data || []);
        return {
          success: true,
          data: data.data || [],
          total: data.total_presentaciones || 0
        };
      } else {
        setError(data.error || 'Error desconocido');
        setPresentaciones([]);
        return {
          success: false,
          error: data.error || 'Error al consultar presentaciones'
        };
      }

    } catch (error) {
      //console.error('❌ Error al consultar presentaciones:', error);
      setError(error.message);
      setPresentaciones([]);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene el factor de conversión de galonaje para una presentación específica
   */
  const obtenerConversionGalonaje = useCallback((presentacion) => {
    const presentacionEncontrada = presentaciones.find(
      p => p.presentacion === presentacion
    );
    return presentacionEncontrada?.conversion_galonaje || 0;
  }, [presentaciones]);

  /**
   * Calcula los galones basado en el número de cajas y la presentación
   * Redondea a máximo 2 decimales
   */
  const calcularGalones = useCallback((numeroCajas, presentacion) => {
    const cajas = parseFloat(numeroCajas) || 0;
    const factor = obtenerConversionGalonaje(presentacion);
    const galones = cajas * factor;
    
    // Redondear a 2 decimales máximo
    return Math.round(galones * 100) / 100;
  }, [obtenerConversionGalonaje]);

  return {
    presentaciones,
    loading,
    error,
    consultarPresentaciones,
    obtenerConversionGalonaje,
    calcularGalones
  };
};
