import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { API_URL } from '../../config.js';

export function useHistorialRegistrosBackOffice() {
  const { authenticatedFetch, user } = useAuthContext();
  const [registros, setRegistros] = useState([]);
  const [registroDetalle, setRegistroDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);

  // OPTIMIZACIÓN: Cargar solo datos básicos para la tabla
  const cargarRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        // NUEVA URL OPTIMIZADA - Solo datos básicos para la tabla
        response = await authenticatedFetch(`${API_URL}/api/backoffice/registros-tabla`);
      } catch (authError) {
        // Fallback: usar fetch manual con token de localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const fullUrl = `${API_URL}/api/backoffice/registros-tabla`.startsWith('http')
          ? `${API_URL}/api/backoffice/registros-tabla`
          : `${API_URL}/api/backoffice/registros-tabla`;

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
        console.log(`✅ OPTIMIZACIÓN: ${registrosData.length} registros cargados SIN datos pesados`);
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

  // NUEVA FUNCIÓN: Cargar detalles completos de un registro específico
  const cargarDetalleRegistro = async (registroId) => {
    try {
      setLoadingDetalle(true);
      
      let response;
      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        // NUEVA URL PARA DETALLES ESPECÍFICOS
        response = await authenticatedFetch(`${API_URL}/api/backoffice/registro-detalle/${registroId}`);
      } catch (authError) {
        // Fallback: usar fetch manual con token de localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const fullUrl = `${API_URL}/api/backoffice/registro-detalle/${registroId}`;
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
        setRegistroDetalle(data.data);
        console.log(`✅ DETALLE: Registro ${registroId} cargado con todos los datos pesados`);
        return data.data;
      } else {
        throw new Error(data.message || 'Error al cargar el detalle del registro');
      }
    } catch (err) {
      console.error('Error al cargar detalle del registro:', err);
      throw err;
    } finally {
      setLoadingDetalle(false);
    }
  };

  const actualizarEstadoRegistro = async (registroId, estado, comentario = null) => {
    try {
      let response;
      const body = {
        estado: estado,
        comentarios: comentario
      };

      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        response = await authenticatedFetch(`${API_URL}/api/backoffice/registro/${registroId}/estado`, {
          method: 'PUT',
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
        
        const fullUrl = `${API_URL}/api/backoffice/registro/${registroId}/estado`.startsWith('http') 
          ? `${API_URL}/api/backoffice/registro/${registroId}/estado` 
          : `${window.location.origin}/api/backoffice/registro/${registroId}/estado`;
        
        response = await fetch(fullUrl, {
          method: 'PUT',
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

  // Cargar registros al montar el componente y configurar auto-actualización
  useEffect(() => {
    if (user) {
      cargarRegistros();
      
      // Configurar auto-actualización cada 5 minutos (300,000 ms)
      console.log('BackOffice: Configurando auto-actualización cada 5 minutos');
      const interval = setInterval(() => {
        console.log('BackOffice: Ejecutando auto-actualización...');
        cargarRegistros();
      }, 300000); // 5 minutos

      // Cleanup: limpiar el intervalo cuando el componente se desmonte
      return () => {
        console.log('BackOffice: Limpiando intervalo de auto-actualización');
        clearInterval(interval);
      };
    }
  }, [user, authenticatedFetch]);

  return {
    registros,
    registroDetalle,
    loading,
    loadingDetalle,
    error,
    cargarRegistros,
    cargarDetalleRegistro,
    actualizarEstadoRegistro
  };
}
