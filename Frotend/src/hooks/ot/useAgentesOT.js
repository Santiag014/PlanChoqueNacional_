import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener la lista de agentes para OT
 * Los datos ya vienen filtrados desde el backend según permisos del usuario
 * @returns {object} { agentes, loading, error, refetch }
 */
export function useAgentesOT() {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar agentes desde la API
  const fetchAgentes = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //console.log('useAgentesOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('useAgentesOT: Consultando lista de agentes comerciales');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/ot/agentes-comerciales`, {
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
        //console.error('useAgentesOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useAgentesOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useAgentesOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener los agentes');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.data)) {
        //console.error('useAgentesOT: Datos incorrectos - data no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      //console.log('useAgentesOT: Datos recibidos correctamente', 
      //  `${data.data.length} agentes encontrados (ya filtrados desde backend)`);

      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = data.data.map(agente => ({
        ...agente,
        id: agente.id || '',
        descripcion: agente.descripcion || '',
        nombre: agente.nombre || '',
        email: agente.email || '',
        telefono: agente.telefono || '',
        created_at: agente.created_at || null,
        updated_at: agente.updated_at || null
      }));

      // Los datos ya vienen filtrados desde el backend
      setAgentes(cleanData);
      setLoading(false);

    } catch (err) {
      //console.error('useAgentesOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchAgentes();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAgentes();
  }, []);

  return {
    agentes,
    loading,
    error,
    refetch
  };
}
