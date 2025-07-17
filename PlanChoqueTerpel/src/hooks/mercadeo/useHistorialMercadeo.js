import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener historial de registros filtrado por id_agente del usuario logueado
 * @returns {object} { historial, loading, error, refetch }
 */
export function useHistorialMercadeo() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar historial desde la API
  const fetchHistorial = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('useHistorialMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useHistorialMercadeo: Consultando historial de registros');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/mercadeo/historial-registros`, {
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
        console.error('useHistorialMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      console.log('useHistorialMercadeo: Respuesta recibida:', data);

      if (!response.ok) {
        console.error('useHistorialMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar historial de registros.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success || !Array.isArray(data.data)) {
        console.error('useHistorialMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      console.log('useHistorialMercadeo: Historial cargado exitosamente:', data.data);
      setHistorial(data.data);
      setLoading(false);

    } catch (err) {
      console.error('useHistorialMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para obtener detalles de un registro específico
  const getRegistroDetalles = async (registroId) => {
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    try {
      const response = await fetch(`${API_URL}/api/mercadeo/registro-detalles/${registroId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener detalles del registro');
      }

      return data.data;
    } catch (err) {
      console.error('useHistorialMercadeo: Error obteniendo detalles:', err);
      throw err;
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchHistorial();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchHistorial();
  }, []);

  return {
    historial,
    loading,
    error,
    refetch,
    getRegistroDetalles
  };
}
