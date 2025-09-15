import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { API_URL } from '../../config.js';

export const useResultadosAuditorias = (userId) => {
  const [registrosAuditorias, setRegistrosAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authenticatedFetch } = useAuthContext();

  const cargarRegistrosAuditorias = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let response;
      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        // Usar el nuevo endpoint específico para auditorias
        response = await authenticatedFetch(`${API_URL}/api/asesor/resultados-auditorias/${userId}`);
      } catch (authError) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = `${API_URL}/api/asesor/resultados-auditorias/${userId}`.startsWith('http') 
          ? `${API_URL}/api/asesor/resultados-auditorias/${userId}` 
          : `${API_URL}/api/asesor/resultados-auditorias/${userId}`;
        
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!response) {
        throw new Error('No se pudo realizar la petición');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      //console.log('Respuesta completa de Auditorias API:', data);
      
      if (data.success) {
        const registrosData = data.data || [];
        //console.log('📊 DATOS AUDITORIAS RECIBIDOS:', registrosData);

        setRegistrosAuditorias(registrosData);
      } else {
        throw new Error(data.message || 'Error al obtener registros de auditorias');
      }
    } catch (error) {
      //console.error('Error cargando registros de auditorias:', error);
      setError(error.message);
      setRegistrosAuditorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistrosAuditorias();
  }, [userId]);

  return {
    registrosAuditorias,
    loading,
    error,
    refetch: cargarRegistrosAuditorias
  };
};

export default useResultadosAuditorias;
