import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener métricas de precios filtradas por id_agente del usuario logueado
 * @param {object} filtros - Filtros opcionales (asesor_id, pdv_id)
 * @returns {object} { precios, loading, error, refetch }
 */
export function usePreciosMercadeo(filtros = {}) {
  const [precios, setPrecios] = useState({
    pdvs: [],
    data: [],
    puntos: 0,
    meta: 0,
    real: 0,
    porcentajeCumplimiento: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar métricas de precios desde la API
  const fetchPrecios = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      //console.log('usePreciosMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('usePreciosMercadeo: Consultando métricas de precios');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor_id) params.append('asesor_id', filtros.asesor_id);
      if (filtros.pdv_id) params.append('pdv_id', filtros.pdv_id);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/mercadeo/precios${queryString ? `?${queryString}` : ''}`;
      
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
        //console.error('usePreciosMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      //console.log('usePreciosMercadeo: Respuesta recibida:', data);

      if (!response.ok) {
        //console.error('usePreciosMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar métricas de precios.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success) {
        //console.error('usePreciosMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Estructurar datos como los espera el componente (igual que OT)
      const preciosData = {
        pdvs: data.pdvs || data.data || [],
        data: data.pdvs || data.data || [],
        puntos: data.puntos || 0,
        meta: data.meta || 0,
        real: data.real || 0,
        porcentajeCumplimiento: data.porcentajeCumplimiento || 0
      };

      //console.log('usePreciosMercadeo: Métricas de precios cargadas exitosamente:', preciosData);
      setPrecios(preciosData);
      setLoading(false);

    } catch (err) {
      //console.error('usePreciosMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchPrecios();
  };

  // Cargar datos al montar el componente y cuando cambian los filtros
  useEffect(() => {
    fetchPrecios();
  }, [filtros.asesor_id, filtros.pdv_id]);

  return {
    precios,
    loading,
    error,
    refetch
  };
}
