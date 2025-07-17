import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

export function useHistorialRegistrosMercadeo() {
  const { authenticatedFetch, user } = useAuthContext();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarRegistros = async () => {
    if (!user?.agente_id) {
      setError('Usuario no tiene agente asignado');
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
        response = await authenticatedFetch('/api/mercadeo/historial-registros-mercadeo');
      } catch (authError) {
        // Fallback: usar fetch manual con token de localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = `/api/mercadeo/historial-registros-mercadeo`.startsWith('http') 
          ? `/api/mercadeo/historial-registros-mercadeo` 
          : `${window.location.origin}/api/mercadeo/historial-registros-mercadeo`;
        
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
      
      if (data.success) {
        const registrosData = data.data || [];
        setRegistros(registrosData);
        setError(null);
      } else {
        throw new Error(data.message || 'Error al cargar los registros');
      }
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError(`Error al cargar registros: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoRegistro = async (registroId, estadoAgenteId, comentario = null) => {
    try {
      let response;
      const body = {
        estado_agente_id: estadoAgenteId,
        comentario: comentario
      };

      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        response = await authenticatedFetch(`/api/mercadeo/actualizar-estado-registro/${registroId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      } catch (authError) {
        // Fallback: usar fetch manual con token de localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = `/api/mercadeo/actualizar-estado-registro/${registroId}`.startsWith('http') 
          ? `/api/mercadeo/actualizar-estado-registro/${registroId}` 
          : `${window.location.origin}/api/mercadeo/actualizar-estado-registro/${registroId}`;
        
        response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
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
      
      if (data.success) {
        // Recargar registros para reflejar el cambio
        await cargarRegistros();
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Error al actualizar estado del registro');
      }
    } catch (err) {
      console.error('Error actualizando estado del registro:', err);
      return { success: false, message: err.message };
    }
  };

  // Cargar registros al montar el componente
  useEffect(() => {
    if (user?.agente_id) {
      cargarRegistros();
    }
  }, [user?.agente_id, authenticatedFetch]);

  return {
    registros,
    loading,
    error,
    cargarRegistros,
    actualizarEstadoRegistro
  };
}
