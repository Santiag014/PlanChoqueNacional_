import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../../config';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Hook optimizado para gestionar usuarios desde BackOffice
 * @returns {Object} Estado y funciones para gestionar usuarios
 */
export function useUsuariosBackOffice() {
  const { authenticatedFetch } = useAuthContext();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 100
  });

  /**
   * Cargar usuarios con paginación optimizada
   */
  const cargarUsuarios = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('BackOffice: Cargando usuarios optimizado...', { page, filters });
      
      // OPTIMIZACIÓN: Construir query params para filtros en servidor
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '100', // Cargar 100 en lugar de todos
        ...filters
      });
      
      const response = await authenticatedFetch(`${API_URL}/api/backoffice/usuarios?${queryParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('BackOffice Usuarios - Error en petición:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log('BackOffice: Usuarios cargados exitosamente:', {
          total: data.pagination?.totalRecords || data.data.length,
          page: data.pagination?.currentPage || 1,
          optimized: data.performance?.optimized || false
        });
        
        setUsuarios(data.data);
        
        // OPTIMIZACIÓN: Manejar paginación si está disponible
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error('BackOffice: Respuesta inválida:', data);
        throw new Error(data.message || 'Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError(error.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  /**
   * Actualizar estado de un usuario (activo/inactivo)
   * @param {number} usuarioId - ID del usuario
   * @param {boolean} activo - Nuevo estado activo
   * @returns {Promise<Object>} Resultado de la operación
   */
  const actualizarEstadoUsuario = useCallback(async (usuarioId, activo) => {
    try {
      console.log('BackOffice: Actualizando estado usuario:', { usuarioId, activo });
      
      const response = await authenticatedFetch(`${API_URL}/api/backoffice/usuario/${usuarioId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BackOffice Usuarios - Error al actualizar estado:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('BackOffice: Estado de usuario actualizado exitosamente');
        
        // OPTIMIZACIÓN: Actualizar estado local sin recargar todo
        setUsuarios(prevUsuarios => 
          prevUsuarios.map(usuario => 
            usuario.id === usuarioId 
              ? { ...usuario, activo: activo ? 1 : 0 }
              : usuario
          )
        );
        
        return data;
      } else {
        throw new Error(data.message || 'Error al actualizar estado del usuario');
      }
      
    } catch (error) {
      console.error('Error al actualizar estado del usuario:', error);
      throw error;
    }
  }, [authenticatedFetch]);

  /**
   * OPTIMIZACIÓN: Cargar usuarios solo una vez al montar
   * Eliminamos la auto-actualización que causaba lentitud
   */
  useEffect(() => {
    cargarUsuarios();
    
    // ELIMINADO: Auto-actualización que causaba lentitud
    // console.log('BackOffice Usuarios: Auto-actualización deshabilitada para mejor rendimiento');
  }, [cargarUsuarios]);

  // OPTIMIZACIÓN: Memoizar datos derivados
  const estadisticas = useMemo(() => {
    return {
      total: usuarios.length,
      activos: usuarios.filter(u => u.activo === 1 || u.activo === true).length,
      inactivos: usuarios.filter(u => u.activo === 0 || u.activo === false).length,
      asesores: usuarios.filter(u => u.rol_id === 1).length,
      mercadeo: usuarios.filter(u => u.rol_id === 2).length,
      directores: usuarios.filter(u => u.rol_id === 3).length,
      promotores: usuarios.filter(u => u.IsPromotoria === 1 || u.IsPromotoria === true).length
    };
  }, [usuarios]);

  return {
    usuarios,
    loading,
    error,
    pagination,
    estadisticas,
    cargarUsuarios,
    actualizarEstadoUsuario
  };
}
