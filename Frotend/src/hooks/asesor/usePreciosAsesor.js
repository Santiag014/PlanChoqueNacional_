import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de precios del asesor
 * @param {string|number} userId - ID del usuario asesor
 * @returns {object} { precios, loading, error, refetch }
 */
export function usePreciosAsesor(userId) {
  const [precios, setPrecios] = useState({
    pdvs: [],
    totalAsignados: 0,
    totalConCobertura: 0,  // META: PDVs con cobertura
    totalAceptados: 0,     // REAL: PDVs con mystery aceptado
    totalReportados: 0,    // Mantener compatibilidad legacy
    porcentaje: 0,
    puntosPrecios: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar precios desde la API
  const fetchPrecios = async () => {
    if (!userId) {
      //console.log('usePreciosAsesor: No se ha definido el usuario.');
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
      //console.log('usePreciosAsesor: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log(`usePreciosAsesor: Consultando precios para usuario ${userId}`);
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/asesor/precios/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Procesar la respuesta
      const responseText = await response.text();
      //console.log('usePreciosAsesor: Respuesta recibida', responseText);
      
      // Intentar parsear la respuesta como JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        //console.error('usePreciosAsesor: Error al parsear la respuesta como JSON:', parseError);
        setError(`Error al procesar la respuesta del servidor: ${parseError.message}`);
        setLoading(false);
        return;
      }

      // Validar la respuesta
      if (!response.ok) {
        //console.error('usePreciosAsesor: Error en la respuesta:', data);
        setError(data.message || `Error ${response.status} al obtener datos de precios`);
        setLoading(false);
        return;
      }
      
      // Actualizar estado con los datos
      if (data.success) {
        setPrecios({
          pdvs: data.pdvs || [],
          totalAsignados: data.totalAsignados || 0,
          totalConCobertura: data.totalConCobertura || 0,  // META: PDVs con cobertura
          totalAceptados: data.totalAceptados || 0,        // REAL: PDVs con mystery aceptado
          totalReportados: data.totalAceptados || 0,       // Mantener compatibilidad legacy
          porcentaje: data.porcentaje || 0,
          puntosPrecios: data.puntosPrecios || 0
        });
        setLoading(false);
        setError(null);
      } else {
        //console.error('usePreciosAsesor: Respuesta con error:', data);
        setError(data.message || 'Error al obtener datos de precios');
        setLoading(false);
      }

    } catch (error) {
      //console.error('usePreciosAsesor: Error en la consulta:', error);
      setError('Error de conexión al consultar precios: ' + error.message);
      setLoading(false);
    }
  };

  // Efecto para cargar datos al inicializar o cambiar el userId
  useEffect(() => {
    if (userId) {
      fetchPrecios();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return {
    precios,
    loading,
    error,
    refetch: fetchPrecios
  };
}
