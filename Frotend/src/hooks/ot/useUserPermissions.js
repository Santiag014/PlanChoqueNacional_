import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Hook simplificado para obtener permisos de usuario desde el backend
 * Reemplaza el filtrado manual del frontend
 * 
 * @returns {object} { userPermissions, loading, error, refetch }
 */
export function useUserPermissions() {
  const { user, authenticatedFetch } = useAuthContext();
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserPermissions = async () => {
    if (!user?.id) {
      setUserPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/ot/user-permissions');
      
      if (response.success) {
        setUserPermissions(response.data);
      } else {
        setError(response.message || 'Error al obtener permisos');
      }

    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError('Error de conexión al obtener permisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [user?.id]);

  return {
    userPermissions,
    loading,
    error,
    refetch: fetchUserPermissions
  };
}

/**
 * Hook de compatibilidad para transición gradual
 * Mantiene la misma interfaz que el hook anterior pero sin filtrado manual
 * 
 * @deprecated Usar useUserPermissions en su lugar
 */
export function useOTUserPermissions() {
  const { userPermissions, loading, error } = useUserPermissions();

  // Devolver estructura compatible con el hook anterior
  return {
    userRestrictions: userPermissions?.hasRestrictions ? {
      companias: [], // Ya no se usa, el filtrado se hace en backend
      description: `Usuario con restricciones a ${userPermissions.allowedAgents?.length || 0} agentes`
    } : null,
    shouldFilterData: userPermissions?.hasRestrictions || false,
    // Funciones legacy que ya no hacen filtrado real
    getFilteredCompanies: (data) => data,
    getFilteredAsesores: (data) => data,
    getFilteredPDVs: (data) => data,
    // Nuevos datos del backend
    userPermissions,
    loading,
    error
  };
}
