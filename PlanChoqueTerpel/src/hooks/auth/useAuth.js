import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../config';

/**
 * Hook base para manejar la autenticación por token
 * Este hook maneja el estado de autenticación y las operaciones relacionadas
 */
export const useAuthBase = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay un token válido al cargar
  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Verificar si el token sigue siendo válido
          const isValid = await verifyToken(storedToken);
          
          if (isValid) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token inválido, limpiar localStorage
            logout();
          }
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthToken();
  }, []);

  // Función para verificar si el token es válido
  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  };

  // Función de login
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        const { token: newToken, user: userData } = data;
        
        // Guardar en localStorage
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Actualizar estado
        setToken(newToken);
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        throw new Error(data.message || 'Error de autenticación');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Función para verificar si el usuario tiene el rol necesario
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Si requiredRole es un array, verificar si el usuario tiene alguno de esos roles
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.tipo);
    }
    
    return user.tipo === requiredRole;
  };

  // Función para verificar si está autenticado
  const isAuthenticated = () => {
    return !!(token && user);
  };

  // Función para obtener headers con autorización
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Función para hacer requests autenticados
  const authenticatedFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    // Si el token expiró, hacer logout
    if (response.status === 401) {
      logout();
      throw new Error('Sesión expirada');
    }

    return response;
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    hasRole,
    isAuthenticated,
    getAuthHeaders,
    authenticatedFetch,
    verifyToken
  };
};

// Exportar directamente el hook base como useAuth
export const useAuth = useAuthBase;