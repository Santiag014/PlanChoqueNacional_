import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de profundidad del asesor
 * @param {string|number} userId - ID del usuario asesor
 * @returns {object} { profundidad, loading, error, refetch }
 */
export function useProfundidadAsesor(userId) {
  const [profundidad, setProfundidad] = useState({
    pdvs: [],
    totalAsignados: 0,
    totalConProfundidad: 0,
    porcentaje: 0,
    puntosProfundidad: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar datos de profundidad desde la API
  const fetchProfundidad = async () => {
    if (!userId) {
      console.log('useProfundidadAsesor: No se ha definido el usuario.');
      setLoading(false);
      setError('No se ha definido el usuario.');
      return;
    }

    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      console.log('useProfundidadAsesor: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`useProfundidadAsesor: Consultando profundidad para usuario ${userId}`);
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/asesor/profundidad/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Procesar la respuesta
      const responseText = await response.text();
      console.log('useProfundidadAsesor: Respuesta recibida', responseText);
      
      // Intentar parsear la respuesta como JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('useProfundidadAsesor: Error al parsear la respuesta como JSON:', parseError);
        setError(`Error al procesar la respuesta del servidor: ${parseError.message}`);
        setLoading(false);
        return;
      }

      // Validar la respuesta
      if (!response.ok) {
        console.error('useProfundidadAsesor: Error en la respuesta:', data);
        setError(data.message || `Error ${response.status} al obtener datos de profundidad`);
        setLoading(false);
        return;
      }
      
      // Actualizar estado con los datos
      if (data.success) {
        setProfundidad({
          pdvs: data.pdvs || [],
          totalAsignados: data.totalAsignados || 0,
          totalConProfundidad: data.totalConProfundidad || 0,
          porcentaje: data.porcentaje || 0,
          puntosProfundidad: data.puntosProfundidad || 0
        });
        setLoading(false);
        setError(null);
      } else {
        console.error('useProfundidadAsesor: Respuesta con error:', data);
        setError(data.message || 'Error al obtener datos de profundidad');
        setLoading(false);
      }

    } catch (error) {
      console.error('useProfundidadAsesor: Error en la consulta:', error);
      setError('Error de conexión al consultar profundidad: ' + error.message);
      setLoading(false);
    }
  };

  // Efecto para cargar datos al inicializar o cambiar el userId
  useEffect(() => {
    if (userId) {
      fetchProfundidad();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return {
    profundidad,
    loading,
    error,
    refetch: fetchProfundidad
  };
}
