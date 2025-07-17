import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener métricas de profundidad filtradas por id_agente del usuario logueado
 * @param {object} filtros - Filtros opcionales (asesor_id, pdv_id)
 * @returns {object} { profundidad, loading, error, refetch }
 */
export function useProfundidadMercadeo(filtros = {}) {
  const [profundidad, setProfundidad] = useState({
    pdvs: [],
    data: [],
    puntos: 0,
    meta: 0,
    real: 0,
    porcentajeCumplimiento: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar métricas de profundidad desde la API
  const fetchProfundidad = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('useProfundidadMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useProfundidadMercadeo: Consultando métricas de profundidad');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor_id) params.append('asesor_id', filtros.asesor_id);
      if (filtros.pdv_id) params.append('pdv_id', filtros.pdv_id);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/mercadeo/profundidad${queryString ? `?${queryString}` : ''}`;
      
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
        console.error('useProfundidadMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      console.log('useProfundidadMercadeo: Respuesta recibida:', data);

      if (!response.ok) {
        console.error('useProfundidadMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar métricas de profundidad.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success) {
        console.error('useProfundidadMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Estructurar datos como los espera el componente (igual que OT)
      const profundidadData = {
        pdvs: data.pdvs || data.data || [],
        data: data.pdvs || data.data || [],
        puntos: data.puntos || 0,
        meta: data.meta || 0,
        real: data.real || 0,
        porcentajeCumplimiento: data.porcentajeCumplimiento || 0
      };

      console.log('useProfundidadMercadeo: Métricas de profundidad cargadas exitosamente:', profundidadData);
      setProfundidad(profundidadData);
      setLoading(false);

    } catch (err) {
      console.error('useProfundidadMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchProfundidad();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchProfundidad();
  }, [filtros.asesor_id, filtros.pdv_id]);

  return {
    profundidad,
    loading,
    error,
    refetch
  };
}
