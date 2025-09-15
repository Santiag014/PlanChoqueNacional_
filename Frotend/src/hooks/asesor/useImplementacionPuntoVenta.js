import { useState, useCallback, useRef } from 'react';
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
  
  // Ref para evitar consultas múltiples
  const consultaEnProgreso = useRef(false);
  const ultimoPdvConsultado = useRef(null);

  // Función para calcular implementaciones disponibles (memoizada)
  const calcularImplementacionesDisponibles = useCallback((data) => {
    if (!data) {
      setImplementacionesDisponibles([]);
      return;
    }

    const { totalReal, compras, estado_implementaciones, implementaciones_completadas } = data;
    const implementaciones = [];

    // console.log('🧮 Calculando implementaciones disponibles:', { 
    //   totalReal, 
    //   compras, 
    //   estado_implementaciones, 
    //   implementaciones_completadas 
    // });

    // Revisar cada compra (1 a 5) y ver si el galonaje real es suficiente
    for (let i = 1; i <= 5; i++) {
      const compraField = `compra_${i}`;
      const implementacionField = `implementacion_${i}`;
      const metaCompra = compras[compraField] || 0;
      const estaCompletada = estado_implementaciones?.[implementacionField] || false;

      if (metaCompra > 0) {
        let estatus = '';
        let habilitada = false;
        
        if (estaCompletada) {
          // Si ya está completada/implementada
          estatus = '✓ Implementada';
          habilitada = true; // Permitir ver la implementación completada
        } else if (totalReal >= metaCompra) {
          // Si tiene suficiente galonaje pero no está implementada
          estatus = '✓ Disponible';
          habilitada = true;
        } else {
          // Si no tiene suficiente galonaje
          const galonesRestantes = metaCompra - totalReal;
          estatus = `Faltan ${galonesRestantes} galones`;
          habilitada = false;
        }

        implementaciones.push({
          numero: i,
          meta: metaCompra,
          habilitada,
          completada: estaCompletada,
          estatus,
          descripcion: `Implementación ${i} (Meta: ${metaCompra} galones) - ${estatus}`
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

    // Evitar consultas duplicadas
    if (consultaEnProgreso.current) {
      //console.warn('⚠️ Consulta ya en progreso, saltando...');
      return;
    }

    // Si ya consultamos este PDV, no volver a consultar
    if (ultimoPdvConsultado.current === pdvId) {
      //console.log('✅ Datos ya disponibles para PDV:', pdvId);
      return;
    }

    //console.log('🔍 Consultando galonaje para PDV:', pdvId);
    consultaEnProgreso.current = true;
    ultimoPdvConsultado.current = pdvId;
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
      ultimoPdvConsultado.current = null; // Reset en caso de error
      throw error;
    } finally {
      setLoadingGalonaje(false);
      consultaEnProgreso.current = false;
    }
  }, [pdvId, calcularImplementacionesDisponibles]);

  // Función para limpiar datos (memoizada)
  const limpiarDatos = useCallback(() => {
    setGalonajeData(null);
    setImplementacionesDisponibles([]);
    setError(null);
    consultaEnProgreso.current = false;
    ultimoPdvConsultado.current = null;
    //console.log('🧹 Datos limpiados');
  }, []);

  // Función para refrescar datos (memoizada)
  const refrescarGalonaje = useCallback(async () => {
    if (pdvId && pdvId !== 'N/A') {
      // Forzar nueva consulta limpiando la cache
      ultimoPdvConsultado.current = null;
      setGalonajeData(null);
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
