import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener la lista de asesores (users con rol = 1)
 * @returns {object} { asesores, loading, error, refetch }
 */
export function useAsesoresOT() {
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar asesores desde la API
  const fetchAsesores = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      console.log('useAsesoresOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useAsesoresOT: Consultando lista de asesores');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/ot/asesores`, {
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
        console.error('useAsesoresOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        console.error('useAsesoresOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        console.error('useAsesoresOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener los asesores');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.data)) {
        console.error('useAsesoresOT: Datos incorrectos - data no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      console.log('useAsesoresOT: Datos recibidos correctamente', 
        `${data.data.length} asesores encontrados`);
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = data.data.map(asesor => ({
        ...asesor,
        id: asesor.id || '',
        name: asesor.name || '',
        email: asesor.email || '',
        telefono: asesor.telefono || '',
        created_at: asesor.created_at || null,
        updated_at: asesor.updated_at || null
      }));

      setAsesores(cleanData);
      setLoading(false);

    } catch (err) {
      console.error('useAsesoresOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
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
