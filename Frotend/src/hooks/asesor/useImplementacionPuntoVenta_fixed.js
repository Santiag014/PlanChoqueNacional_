import { useState, useCallback } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para manejar las implementaciones de punto de venta
 * Gestiona la consulta de galonaje y el cálculo de implementaciones disponibles
 */
export const useImplementacionPuntoVenta = (pdvId, userId) => {
  const [galonajeData, setGalonajeData] = useState(null);
  const [implementacionesDisponibles, setImplementacionesDisponibles] = useState([]);
  const [loadingGalonaje, setLoadingGalonaje] = useState(false);
  const [error, setError] = useState(null);

  // Función para calcular implementaciones disponibles (memoizada)
  const calcularImplementacionesDisponibles = useCallback((data) => {
    if (!data) {
      setImplementacionesDisponibles([]);
      return;
    }

    const { totalReal, compras } = data;
    const implementaciones = [];

    //console.log('🧮 Calculando implementaciones disponibles:', { totalReal, compras });

    // Revisar cada compra (1 a 5) y ver si el galonaje real es suficiente
    for (let i = 1; i <= 5; i++) {
      const compraField = `compra_${i}`;
      const metaCompra = compras[compraField] || 0;

      if (metaCompra > 0 && totalReal >= metaCompra) {
        implementaciones.push({
          numero: i,
          meta: metaCompra,
          habilitada: true,
          descripcion: `Implementación ${i} (Meta: ${metaCompra} galones)`
        });
      } else if (metaCompra > 0) {
        const galonesRestantes = metaCompra - totalReal;
        implementaciones.push({
          numero: i,
          meta: metaCompra,
          habilitada: false,
          descripcion: `Implementación ${i} (Meta: ${metaCompra} galones - Faltan ${galonesRestantes} galones)`
        });
      }
    }

    //console.log('📋 Implementaciones calculadas:', implementaciones);
    setImplementacionesDisponibles(implementaciones);
  }, []);

  // Función para consultar el galonaje del PDV (memoizada)
  const consultarGalonaje = useCallback(async () => {
    if (!pdvId || pdvId === 'N/A') {
      //console.warn('No se puede consultar galonaje: PDV ID inválido', pdvId);
      return;
    }

    if (loadingGalonaje) {
      //console.warn('⚠️ Consulta ya en progreso, saltando...');
      return;
    }

    //console.log('🔍 Consultando galonaje para PDV:', pdvId);
    setLoadingGalonaje(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/asesor/galonaje-implementacion/${pdvId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      //console.log('🔍 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        //console.error('❌ Response error data:', errorData);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      //console.log('✅ Galonaje obtenido exitosamente:', data);
      
      setGalonajeData(data);
      calcularImplementacionesDisponibles(data);
      
      return data;

    } catch (error) {
      //console.error('❌ Error al consultar galonaje:', error);
      setError(error.message);
      setGalonajeData(null);
      setImplementacionesDisponibles([]);
      throw error;
    } finally {
      setLoadingGalonaje(false);
    }
  }, [pdvId, loadingGalonaje, calcularImplementacionesDisponibles]);

  // Función para limpiar datos (memoizada)
  const limpiarDatos = useCallback(() => {
    setGalonajeData(null);
    setImplementacionesDisponibles([]);
    setError(null);
  }, []);

  // Función para refrescar datos (memoizada)
  const refrescarGalonaje = useCallback(async () => {
    if (pdvId && pdvId !== 'N/A') {
      await consultarGalonaje();
    }
  }, [pdvId, consultarGalonaje]);

  return {
    // Datos
    galonajeData,
    implementacionesDisponibles,
    
    // Estados
    loadingGalonaje,
    error,
    
    // Funciones
    consultarGalonaje,
    calcularImplementacionesDisponibles,
    limpiarDatos,
    refrescarGalonaje
  };
};
