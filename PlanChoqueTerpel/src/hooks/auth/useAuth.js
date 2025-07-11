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

        // console.log('Verificando autenticación:', { 
        //   hasToken: !!storedToken, 
        //   hasUser: !!storedUser 
        // });

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          if (storedToken) {
            // Verificar si el token sigue siendo válido
            const isValid = await verifyToken(storedToken);
            
            if (isValid) {
              setToken(storedToken);
              //console.log('Token válido, usuario autenticado:', userData);
            } else {
              // Token inválido, pero mantener usuario si está guardado
              //console.log('Token inválido, pero usuario presente');
              setToken(null);
            }
          } else {
            // No hay token pero hay usuario - asumir autenticado (para compatibilidad)
            //console.log('Usuario sin token, asumiendo autenticado para compatibilidad');
            setToken('legacy_auth'); // Token ficticio para indicar autenticación
          }
        } else {
          // No hay datos de usuario
          logout();
        }
      } catch (error) {
        //console.error('Error verificando token:', error);
        // En caso de error, verificar si al menos hay usuario
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setToken('legacy_auth');
            //console.log('Error en verificación, pero usuario válido encontrado');
          } catch {
            logout();
          }
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthToken();
  }, []);

  // Función para verificar si el token es válido
  const verifyToken = async (tokenToVerify) => {
    // Si es el token legacy, asumir válido
    if (tokenToVerify === 'legacy_auth') {
      return true;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error verificando token:', error);
      // En caso de error en la verificación, asumir válido para desarrollo
      console.log('Asumiendo token válido para desarrollo');
      return true;
    }
  };

  // Función de login
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // Usar la ruta correcta de login que ya existe en tu aplicación
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        const { token: newToken, user: userData } = data;
        
        // Normalizar la estructura del usuario
        const normalizedUser = {
          ...userData,
          tipo: userData.tipo || (
            userData.rol === 1 ? 'ASESOR' : 
            userData.rol === 2 ? 'MYSTERY_SHOPPER' : 
            userData.rol === 3 ? 'MERCADEO_AC' :
            userData.rol === 4 ? 'DIRECTOR' :
            userData.rol === 5 ? 'ORGANIZACION_TERPEL' :
            userData.rol_id === 1 ? 'ASESOR' :
            userData.rol_id === 2 ? 'MYSTERY_SHOPPER' :
            userData.rol_id === 3 ? 'MERCADEO_AC' :
            userData.rol_id === 4 ? 'DIRECTOR' :
            userData.rol_id === 5 ? 'ORGANIZACION_TERPEL' :
            'ASESOR'
          ),
          rol: userData.rol || userData.rol_id || userData.tipo
        };
        
        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (newToken) {
          localStorage.setItem('authToken', newToken);
          setToken(newToken);
        } else {
          // Si no hay token, usar token legacy para compatibilidad
          setToken('legacy_auth');
        }
        
        // Actualizar estado
        setUser(normalizedUser);
        
        return { success: true, user: normalizedUser };
      } else {
        throw new Error(data.message || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout mejorada
  const logout = useCallback(() => {
    //console.log('Ejecutando logout completo...');
    
    // Limpiar localStorage completamente
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('sessionData');
    localStorage.removeItem('userData');
    
    // Limpiar sessionStorage completamente
    sessionStorage.clear();
    
    // Limpiar cookies si las hay (para tokens de sesión)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Limpiar estado del hook
    setToken(null);
    setUser(null);
    setError(null);
    
    //console.log('Logout completo - toda la sesión limpiada');
  }, []);

  // Función para verificar si el usuario tiene el rol necesario
  // *** PROTECCIÓN COMPLETAMENTE DESACTIVADA PARA DESARROLLO ***
  const hasRole = (requiredRole) => {
    // Solo verificar autenticación básica
    if (!user) {
      return false;
    }
    
    // MODO DESARROLLO: Permitir acceso total
    // console.log('🔓 DESARROLLO: Acceso permitido a todas las rutas');
    return true;
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

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    // Si el token expiró, hacer logout
    if (response.status === 401) {
      //console.log('Token expirado, haciendo logout automático');
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