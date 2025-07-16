import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener la lista de puntos de venta para OT
 * @returns {object} { pdvs, loading, error, refetch }
 */
export function usePuntosVentaOT() {
  const [pdvs, setPdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar puntos de venta desde la API
  const fetchPdvs = async () => {
    // Verificar autenticación
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      console.log('usePuntosVentaOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('usePuntosVentaOT: Consultando puntos de venta');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/ot/puntos-venta`, {
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
        console.error('usePuntosVentaOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        console.error('usePuntosVentaOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        console.error('usePuntosVentaOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener puntos de venta');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.data)) {
        console.error('usePuntosVentaOT: Datos incorrectos - data no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      console.log('usePuntosVentaOT: Datos recibidos correctamente', 
        `${data.data.length} puntos de venta`);
      
      setPdvs(data.data);
      setLoading(false);
    } catch (err) {
      console.error('usePuntosVentaOT: Error de excepción', err);
      setError(`Error de red o del servidor: ${err.message}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchPdvs();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPdvs();
  }, []);

  return {
    pdvs,
    loading,
    error,
    refetch
  };
}
