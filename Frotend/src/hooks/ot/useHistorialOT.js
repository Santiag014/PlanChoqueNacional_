import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener el historial de registros global de Organización Terpel
 * @returns {object} { historial, loading, error, refetch }
 */
export function useHistorialOT() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar historial desde la API
  const fetchHistorial = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //console.log('useHistorialOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('useHistorialOT: Consultando historial de registros');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/ot/historial-registros`, {
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
        //console.error('useHistorialOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useHistorialOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useHistorialOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener el historial');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.data)) {
        //console.error('useHistorialOT: Datos incorrectos - data no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      //console.log('useHistorialOT: Datos recibidos correctamente', 
      //  `${data.data.length} registros encontrados`);

      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = data.data.map(registro => ({
        ...registro,
        id: registro.id || '',
        codigo: registro.codigo || '',
        fecha_registro: registro.fecha_registro || null,
        tipo_accion: registro.tipo_accion || '',
        estado_id: registro.estado_id || 0,
        estado_agente_id: registro.estado_agente_id || 0,
        nombre_asesor: registro.nombre_asesor || '',
        email_asesor: registro.email_asesor || ''
      }));

      setHistorial(cleanData);
      setLoading(false);

    } catch (err) {
      //console.error('useHistorialOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
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
    refetch
  };
}
