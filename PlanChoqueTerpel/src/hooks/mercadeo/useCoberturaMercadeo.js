import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Ho  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchCobertura();
  }, [filtros.asesor_id, filtros.pdv_id]);

  return {
    cobertura,
    loading,
    error,
    refetch: fetchCobertura
  };
}ner métricas de cobertura filtradas por id_agente del usuario logueado
 * @param {object} filtros - Filtros opcionales (asesor_id, pdv_id)
 * @returns {object} { cobertura, loading, error, refetch }
 */
export function useCoberturaMercadeo(filtros = {}) {
  const [cobertura, setCobertura] = useState({
    pdvs: [],
    data: [],
    puntos: 0,
    meta: 0,
    real: 0,
    porcentajeCumplimiento: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar métricas de cobertura desde la API
  const fetchCobertura = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('useCoberturaMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useCoberturaMercadeo: Consultando métricas de cobertura');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor_id) params.append('asesor_id', filtros.asesor_id);
      if (filtros.pdv_id) params.append('pdv_id', filtros.pdv_id);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/mercadeo/cobertura${queryString ? `?${queryString}` : ''}`;
      
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
        console.error('useCoberturaMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      console.log('useCoberturaMercadeo: Respuesta recibida:', data);

      if (!response.ok) {
        console.error('useCoberturaMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar métricas de cobertura.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success) {
        console.error('useCoberturaMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Estructurar datos como los espera el componente (igual que OT)
      const coberturaData = {
        pdvs: data.pdvs || data.data || [],
        data: data.pdvs || data.data || [],
        puntos: data.puntos || 0,
        meta: data.meta || 0,
        real: data.real || 0,
        porcentajeCumplimiento: data.porcentajeCumplimiento || 0
      };

      console.log('useCoberturaMercadeo: Métricas de cobertura cargadas exitosamente:', coberturaData);
      setCobertura(coberturaData);
      setLoading(false);

    } catch (err) {
      console.error('useCoberturaMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchCobertura();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchCobertura();
  }, [filtros.asesor_id, filtros.pdv_id]);

  return {
    cobertura,
    loading,
    error,
    refetch
  };
}
