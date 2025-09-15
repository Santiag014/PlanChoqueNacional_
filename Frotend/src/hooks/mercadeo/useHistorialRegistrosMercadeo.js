import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { API_URL } from '../../config.js';

export function useHistorialRegistrosMercadeo() {
  const { authenticatedFetch, user } = useAuthContext();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarRegistros = async (filtros = {}) => {
    if (!user?.agente_id) {
      setError('Usuario no tiene agente asignado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Construir query string con los filtros
      const params = new URLSearchParams();
      if (filtros.busquedaCodigo && filtros.busquedaCodigo.trim()) {
        params.append('busquedaCodigo', filtros.busquedaCodigo.trim());
      }
      if (filtros.busquedaCedula && filtros.busquedaCedula.trim()) {
        params.append('busquedaCedula', filtros.busquedaCedula.trim());
      }
      if (filtros.busquedaId && filtros.busquedaId.trim()) {
        params.append('busquedaId', filtros.busquedaId.trim());
      }
      if (filtros.fechaActividad && filtros.fechaActividad.trim()) {
        params.append('fechaActividad', filtros.fechaActividad.trim());
      }
      if (filtros.fechaCreacion && filtros.fechaCreacion.trim()) {
        params.append('fechaCreacion', filtros.fechaCreacion.trim());
      }
      if (filtros.filtroKPI && filtros.filtroKPI !== 'TODOS') {
        params.append('filtroKPI', filtros.filtroKPI);
      }
      if (filtros.filtroActividad && filtros.filtroActividad !== 'TODAS') {
        params.append('filtroActividad', filtros.filtroActividad);
      }
      if (filtros.filtroEstadoBackoffice && filtros.filtroEstadoBackoffice !== 'TODOS') {
        params.append('filtroEstadoBackoffice', filtros.filtroEstadoBackoffice);
      }
      if (filtros.filtroEstadoAgente && filtros.filtroEstadoAgente !== 'TODOS') {
        params.append('filtroEstadoAgente', filtros.filtroEstadoAgente);
      }
      
      const queryString = params.toString();
      const url = `${API_URL}/api/mercadeo/historial-registros-mercadeo${queryString ? `?${queryString}` : ''}`;
      
      let response;
      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        response = await authenticatedFetch(url);
      } catch (authError) {
        // Fallback: usar fetch manual con token de localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
        
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
        response = await authenticatedFetch(`${API_URL}/api/mercadeo/actualizar-estado-registro/${registroId}`, {
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

  // Cargar registros al montar el componente y configurar auto-actualización
  useEffect(() => {
    if (user?.agente_id) {
      // Cargar inmediatamente
      cargarRegistros();
      
      // Configurar auto-actualización cada 5 minutos (300,000 ms)
      const intervalId = setInterval(() => {
        // console.log('🔄 Auto-actualizando registros de mercadeo cada 5 minutos...');
        cargarRegistros();
      }, 5 * 60 * 1000); // 5 minutos
      
      // Limpiar interval cuando el componente se desmonte o las dependencias cambien
      return () => {
        clearInterval(intervalId);
        // console.log('🔄 Interval de auto-actualización limpiado');
      };
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
