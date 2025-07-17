import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener métricas de volumen filtradas por id_agente del usuario logueado
 * @param {object} filtros - Filtros opcionales (asesor_id, pdv_id)
 * @returns {object} { volumen, loading, error, refetch }
 */
export function useVolumenMercadeo(filtros = {}) {
  const [volumen, setVolumen] = useState({
    pdvs: [],
    meta_volumen: 0,
    real_volumen: 0,
    puntos: 0,
    porcentajeCumplimiento: 0,
    segmentos: [],
    productos: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar métricas de volumen desde la API
  const fetchVolumen = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('useVolumenMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useVolumenMercadeo: Consultando métricas de volumen');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor_id) params.append('asesor_id', filtros.asesor_id);
      if (filtros.pdv_id) params.append('pdv_id', filtros.pdv_id);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/mercadeo/volumen${queryString ? `?${queryString}` : ''}`;
      
      // Realizar la petición
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Verificar tipo de contenido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('useVolumenMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      console.log('useVolumenMercadeo: Respuesta recibida:', data);
      
      console.log('=== DEBUG useVolumenMercadeo HOOK ===');
      console.log('API Response data.puntos:', data.puntos);
      console.log('API Response data.meta_volumen:', data.meta_volumen);
      console.log('API Response data.real_volumen:', data.real_volumen);
      console.log('API Response data.success:', data.success);
      console.log('====================================');

      if (!response.ok) {
        console.error('useVolumenMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar métricas de volumen.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success) {
        console.error('useVolumenMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Estructurar datos como los espera el componente
      const volumenData = {
        pdvs: data.pdvs || data.data || [],
        meta_volumen: data.meta_volumen || 0,
        real_volumen: data.real_volumen || 0,
        puntos: data.puntos || 0,
        porcentajeCumplimiento: data.porcentajeCumplimiento || 0,
        segmentos: data.segmentos || [],
        productos: data.productos || []
      };
      
      console.log('=== DEBUG volumenData ESTRUCTURADA ===');
      console.log('volumenData.puntos:', volumenData.puntos);
      console.log('volumenData.meta_volumen:', volumenData.meta_volumen);
      console.log('volumenData.real_volumen:', volumenData.real_volumen);
      console.log('======================================');
      
      console.log('useVolumenMercadeo: Métricas de volumen cargadas exitosamente:', volumenData);
      setVolumen(volumenData);
      setLoading(false);

    } catch (err) {
      console.error('useVolumenMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchVolumen();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchVolumen();
  }, [filtros.asesor_id, filtros.pdv_id]);

  return {
    volumen,
    loading,
    error,
    refetch
  };
}
