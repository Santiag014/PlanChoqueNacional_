import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener la lista de asesores filtrada por id_agente del usuario logueado
 * @returns {object} { asesores, loading, error, refetch }
 */
export function useAsesoresMercadeo() {
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar asesores desde la API
  const fetchAsesores = async () => {
    // Verificar autenticación
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      console.log('useAsesoresMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useAsesoresMercadeo: Consultando lista de asesores');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/mercadeo/asesores`, {
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
        console.error('useAsesoresMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      console.log('useAsesoresMercadeo: Respuesta recibida:', data);
      console.log('useAsesoresMercadeo: data.success:', data.success);
      console.log('useAsesoresMercadeo: data.data length:', data.data?.length);
      console.log('useAsesoresMercadeo: data.data:', data.data);

      if (!response.ok) {
        console.error('useAsesoresMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar la lista de asesores.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success || !Array.isArray(data.data)) {
        console.error('useAsesoresMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Mapear los datos para asegurar que tengan la estructura esperada
      const asesoresData = data.data.map(asesor => ({
        ...asesor,
        codigo: asesor.codigo || `AS${asesor.id}`, // Generar código si no existe
        nombre: asesor.name || asesor.nombre        // Asegurar compatibilidad
      }));

      console.log('useAsesoresMercadeo: Asesores cargados exitosamente:', asesoresData);
      setAsesores(asesoresData);
      setLoading(false);

    } catch (err) {
      console.error('useAsesoresMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchAsesores();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAsesores();
  }, []);

  return {
    asesores,
    loading,
    error,
    refetch
  };
}
