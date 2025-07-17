import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener la lista de puntos de venta filtrada por id_agente del usuario logueado
 * @returns {object} { puntosVenta, loading, error, refetch }
 */
export function usePuntosVentaMercadeo() {
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar puntos de venta desde la API
  const fetchPuntosVenta = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('usePuntosVentaMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('usePuntosVentaMercadeo: Consultando lista de puntos de venta');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/mercadeo/puntos-venta`, {
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
        console.error('usePuntosVentaMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      console.log('usePuntosVentaMercadeo: Respuesta recibida:', data);

      if (!response.ok) {
        console.error('usePuntosVentaMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar la lista de puntos de venta.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success || !Array.isArray(data.data)) {
        console.error('usePuntosVentaMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Mapear los datos para que tengan la estructura esperada
      const puntosVentaData = data.data.map(pdv => ({
        ...pdv,
        nombre: pdv.descripcion || pdv.nombre, // Asegurar que tenga 'nombre'
        asesor_id: pdv.user_id || pdv.asesor_id // Asegurar compatibilidad
      }));

      console.log('usePuntosVentaMercadeo: Puntos de venta cargados exitosamente:', puntosVentaData);
      setPuntosVenta(puntosVentaData);
      setLoading(false);

    } catch (err) {
      console.error('usePuntosVentaMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchPuntosVenta();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPuntosVenta();
  }, []);

  return {
    puntosVenta,
    loading,
    error,
    refetch
  };
}
