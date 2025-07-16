import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de profundidad globales de Organización Terpel
 * @returns {object} { profundidad, loading, error, refetch }
 */
export function useProfundidadOT() {
  const [profundidad, setProfundidad] = useState({
    pdvs: [],
    totalAsignados: 0,
    totalConProfundidad: 0,
    puntosProfundidad: 0,
    porcentaje: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar profundidad desde la API
  const fetchProfundidad = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      console.log('useProfundidadOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useProfundidadOT: Consultando profundidad global');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/ot/profundidad`, {
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
        console.error('useProfundidadOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        console.error('useProfundidadOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        console.error('useProfundidadOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener la profundidad');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        console.error('useProfundidadOT: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      console.log('useProfundidadOT: Datos recibidos correctamente', 
        `${data.pdvs.length} PDVs, ${data.totalConProfundidad}/${data.totalAsignados} con profundidad`);
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = {
        pdvs: Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
          ...pdv,
          codigo: pdv.codigo || '',
          nombre: pdv.nombre || '',
          direccion: pdv.direccion || '',
          estado: pdv.estado || 'NO REGISTRADO',
          puntos: pdv.puntos || 0,
          asesor_nombre: pdv.asesor_nombre || '',
          asesor_email: pdv.asesor_email || ''
        })) : [],
        totalAsignados: data.totalAsignados || 0,
        totalConProfundidad: data.totalConProfundidad || 0,
        puntosProfundidad: data.puntosProfundidad || 0,
        porcentaje: data.porcentaje || 0
      };

      setProfundidad(cleanData);
      setLoading(false);

    } catch (err) {
      console.error('useProfundidadOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchProfundidad();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchProfundidad();
  }, []);

  return {
    profundidad,
    loading,
    error,
    refetch
  };
}
