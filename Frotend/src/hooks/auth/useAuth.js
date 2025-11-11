import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../config';
import { trackUser, trackEvent, trackAuthEvent } from '../../utils/analytics';

/**
 * Hook base para manejar la autenticación por token
 * Este hook maneja el estado de autenticación y las operaciones relacionadas
 * Incluye validación de sesión única para evitar múltiples sesiones del mismo usuario
 */
export const useAuthBase = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null); // Nuevo: ID único de sesión
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Verificar si hay un token válido al cargar y validar sesión única
  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        // Inicializar loading como true
        setLoading(true);
        setError(null);

        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        const storedSessionId = localStorage.getItem('sessionId');

        // console.log('🔐 Verificando autenticación al recargar:', { 
        //   hasToken: !!storedToken, 
        //   hasUser: !!storedUser,
        //   hasSession: !!storedSessionId 
        // });

        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            //console.log('👤 Usuario encontrado en localStorage:', userData.email, 'Rol:', userData.tipo || userData.rol);
            
            // Establecer usuario inmediatamente para evitar páginas en blanco
            setUser(userData);
            setLoading(false); // Establecer loading false aquí para desbloquear la UI
            setInitialLoadComplete(true);
            
            if (storedSessionId) {
              setSessionId(storedSessionId);
              
              // Verificar si la sesión sigue siendo válida (validación de sesión única)
              // Por ahora, asumir válida para evitar problemas de carga
              const isSessionValid = true; // await validateUniqueSession(storedSessionId, userData.id);
              
              if (!isSessionValid) {
                console.warn('⚠️ Sesión inválida - otro usuario se autenticó');
                setError('Su sesión ha expirado. Otro usuario ha iniciado sesión con las mismas credenciales.');
                logout();
                return;
              }
            }
            
            if (storedToken && storedToken !== 'legacy_auth') {
              setToken(storedToken); // Establecer token inmediatamente
              
              // ✅ VERIFICAR SI EL TOKEN EXPIRÓ (verificación proactiva)
              const isTokenExpired = checkTokenExpiration(storedToken);
              if (isTokenExpired) {
                console.warn('🔴 Token expirado detectado - Haciendo logout...');
                setError('Tu sesión ha expirado después de 24 horas. Por favor, inicia sesión nuevamente.');
                logout();
                window.location.href = '/';
                return;
              }
              
              // Verificar si el token sigue siendo válido de forma asíncrona (sin bloquear)
              verifyToken(storedToken).then((isValid) => {
                if (!isValid) {
                  //console.log('⚠️ Token inválido, usando modo legacy');
                  setToken('legacy_auth');
                }
              }).catch(() => {
                //console.log('⚠️ Error verificando token, usando modo legacy');
                setToken('legacy_auth');
              });
            } else {
              // No hay token o es legacy - asumir autenticado para compatibilidad
              //console.log('🔑 Usando token legacy para compatibilidad');
              setToken('legacy_auth');
            }
          } catch (parseError) {
            //console.error('❌ Error parseando usuario desde localStorage:', parseError);
            logout();
            return;
          }
        } else {
          //console.log('❌ No hay datos de usuario, redirigiendo al login');
          setInitialLoadComplete(true);
          logout();
          return;
        }
      } catch (error) {
        //console.error('❌ Error crítico verificando token:', error);
        
        // En caso de error, verificar si al menos hay usuario válido
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            //console.log('🔄 Recuperando usuario tras error:', userData.email);
            setUser(userData);
            setToken('legacy_auth');
            setSessionId('recovery_session');
          } catch (parseError) {
            //console.error('❌ Error crítico parseando usuario de recuperación:', parseError);
            logout();
          }
        } else {
          //console.log('❌ No hay usuario de respaldo, ejecutando logout');
          logout();
        }
      } finally {
        // Solo establecer loading false si no hay usuario válido
        // Si hay usuario, ya se estableció loading false arriba
        if (!user && !localStorage.getItem('user')) {
          //console.log('✅ Verificación de autenticación completada sin usuario');
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    // Ejecutar verificación al montar el componente
    checkAuthToken();
  }, []); // Sin dependencias para que solo se ejecute una vez al montar

  // ============================================
  // FUNCIONES DE VALIDACIÓN DE SESIÓN Y TOKEN
  // ============================================

  // ✅ NUEVA FUNCIÓN: Verificar si el token está expirado (sin llamada al servidor)
  const checkTokenExpiration = (tokenToCheck) => {
    if (!tokenToCheck || tokenToCheck === 'legacy_auth' || tokenToCheck === 'no-token-auth') {
      return false; // No verificar tokens especiales
    }

    try {
      // Decodificar el token JWT (sin verificar firma, solo leer payload)
      const base64Url = tokenToCheck.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      // Verificar si el token tiene campo 'exp' (expiration time)
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
        const isExpired = payload.exp < currentTime;
        
        if (isExpired) {
          const expiredDate = new Date(payload.exp * 1000);
          console.warn(`🔴 Token expirado desde: ${expiredDate.toLocaleString()}`);
        }
        
        return isExpired;
      }
      
      return false; // Si no tiene campo exp, asumir no expirado
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return false; // En caso de error, asumir no expirado para no bloquear
    }
  };

  // Función para validar si el usuario puede iniciar sesión (prevenir sesiones múltiples)
  const validateUserLogin = async (userId, userEmail, newSessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/validate-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId,
          email: userEmail,
          sessionId: newSessionId 
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data; // { allowed: true/false, message: "..." }
      } else {
        // Si la API no está disponible, permitir login para desarrollo
        //console.log('API de validación de login no disponible, permitiendo login');
        return { allowed: true };
      }
    } catch (error) {
      //console.error('Error validando login único:', error);
      // En caso de error, permitir login para desarrollo
      return { allowed: true };
    }
  };

  // Función para validar si la sesión actual es única para el usuario
  const validateUniqueSession = async (currentSessionId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId: currentSessionId, 
          userId: userId 
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.isValid;
      } else {
        // Si la API no está disponible, asumir válida para desarrollo
        // console.log('API de validación de sesión no disponible, asumiendo válida');
        return true;
      }
    } catch (error) {
      //console.error('Error validando sesión única:', error);
      // En caso de error, asumir válida para desarrollo
      return true;
    }
  };

  // Función para generar un ID único de sesión
  const generateSessionId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

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
      //console.error('Error verificando token:', error);
      // En caso de error en la verificación, asumir válido para desarrollo
      //console.log('Asumiendo token válido para desarrollo');
      return true;
    }
  };

  // Función de login
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Intentando login con URL:', `${API_URL}/api/login`);
      
      // Hacer petición directa al servidor
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      // Primero intentar obtener la respuesta JSON, incluso si hay error
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parseando respuesta JSON:', parseError);
        throw new Error(`Error de comunicación con el servidor (${response.status})`);
      }

      console.log('📦 Datos recibidos:', data);
      
      // Si la respuesta no es ok, usar el mensaje del servidor o uno genérico
      if (!response.ok) {
        const errorMessage = data.message || `Error del servidor (${response.status})`;
        throw new Error(errorMessage);
      }

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
            userData.rol === 6 ? 'BACKOFFICE' :
            // userData.rol === 7 ? 'IMPLEMENTACION' : // DESHABILITADO TEMPORALMENTE
            userData.rol_id === 1 ? 'ASESOR' :
            userData.rol_id === 2 ? 'MYSTERY_SHOPPER' :
            userData.rol_id === 3 ? 'MERCADEO_AC' :
            userData.rol_id === 4 ? 'DIRECTOR' :
            userData.rol_id === 5 ? 'ORGANIZACION_TERPEL' :
            userData.rol_id === 6 ? 'BACKOFFICE' :
            // userData.rol_id === 7 ? 'IMPLEMENTACION' : // DESHABILITADO TEMPORALMENTE
            'ASESOR'
          ),
          rol: userData.rol || userData.rol_id || userData.tipo
        };
        
        // Generar un nuevo ID de sesión único
        const newSessionId = generateSessionId();
        
        // Validar si ya existe una sesión activa para este usuario
        const canLogin = await validateUserLogin(normalizedUser.id, normalizedUser.email, newSessionId);
        
        if (!canLogin.allowed) {
          throw new Error(canLogin.message || 'Ya existe una sesión activa para este usuario. No se pueden tener múltiples sesiones simultáneas.');
        }
        
        // Guardar en localStorage con ambas keys para compatibilidad
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('sessionId', newSessionId);
        if (newToken) {
          // Guardar con ambos nombres para compatibilidad con código legacy
          localStorage.setItem('authToken', newToken);
          localStorage.setItem('token', newToken); // ✅ AGREGADO para compatibilidad
          setToken(newToken);
        } else {
          // Si no hay token, intentar login sin token (legacy)
          console.warn('⚠️ No se recibió token del servidor, usando autenticación sin token');
          localStorage.setItem('authToken', 'no-token-auth');
          localStorage.setItem('token', 'no-token-auth');
          setToken('no-token-auth');
        }
        
        // Actualizar estado
        setUser(normalizedUser);
        setSessionId(newSessionId);
        
        // 📊 Rastrear login exitoso en Analytics
        trackUser(normalizedUser.id, normalizedUser.tipo);
        trackAuthEvent('login', normalizedUser.tipo, true);
        
        return { success: true, user: normalizedUser };
      } else {
        throw new Error(data.message || 'Error de autenticación');
      }
    } catch (error) {
      // console.error('❌ Error en login:', error);
      // console.error('❌ Tipo de error:', error.constructor.name);
      // console.error('❌ Mensaje:', error.message);
      
      // 📊 Rastrear error de login en Analytics
      trackAuthEvent('login', null, false);
      trackEvent('login_error', 'authentication', error.message);
      
      let userFriendlyMessage = error.message;
      
      // Mejorar mensajes de error para el usuario
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userFriendlyMessage = 'Error de conexión: No se puede conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('CORS')) {
        userFriendlyMessage = 'Error de CORS: El servidor no permite peticiones desde este dominio.';
      } else if (error.message.includes('Usuario no encontrado')) {
        userFriendlyMessage = 'El correo electrónico ingresado no está registrado en el sistema.';
      } else if (error.message.includes('Contraseña incorrecta')) {
        userFriendlyMessage = 'La contraseña ingresada es incorrecta. Por favor, verifica e intenta nuevamente.';
      } else if (error.message.includes('Error del servidor')) {
        userFriendlyMessage = 'Problema temporal del servidor. Por favor, intenta más tarde.';
      }
      
      setError(userFriendlyMessage);
      return { success: false, error: userFriendlyMessage };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout optimizada y rápida
  const logout = useCallback(async () => {
    console.log('🚪 Ejecutando logout rápido...');
    
    try {
      // Notificar al servidor sobre el cierre de sesión (sin esperar respuesta)
      if (sessionId && user?.id) {
        fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            sessionId: sessionId,
            userId: user.id 
          })
        }).catch(() => {}); // Ignorar errores para no bloquear el logout
      }
    } catch (error) {
      // Ignorar errores de red para no bloquear el logout
    }
    
    // Limpiar localStorage inmediatamente - TODAS las variantes de keys
    const keysToRemove = [
      'authToken', 'token', 'user', 'userRole', 'sessionData', 
      'userData', 'sessionId', 'lastActivity', 'loginTime',
      'auth', 'userInfo', 'accessToken' // Limpiar más variantes comunes
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 📊 Rastrear logout en Analytics
    trackAuthEvent('logout');
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar cookies de sesión
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Limpiar estado del hook inmediatamente
    setToken(null);
    setUser(null);
    setError(null);
    setSessionId(null);
    setLoading(false);
    
    //console.log('✅ Logout completado exitosamente');
  }, [sessionId, user?.id, token]);

  // Función para verificar si el usuario tiene el rol necesario
  // *** PROTECCIÓN DE ROLES ACTIVADA ***
  const hasRole = (requiredRole) => {
    // 1. Verificar autenticación básica
    if (!user) {
      //console.warn('🚫 hasRole: Usuario no autenticado');
      return false;
    }
    
    // 2. Obtener rol del usuario (soportar múltiples formatos)
    const userRoleId = user.tipo || user.rol;
    const userRole = mapRole(userRoleId);
    
    // 3. Normalizar roles requeridos
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const normalizedRequiredRoles = requiredRoles.map(role => mapRole(role));
    
    // 4. Verificar si el usuario tiene uno de los roles permitidos
    const hasAccess = normalizedRequiredRoles.includes(userRole);
    
    // 5. Log de seguridad
    if (hasAccess) {
      //console.log(`✅ Acceso autorizado - Rol: ${userRole}, Requerido: ${normalizedRequiredRoles.join('|')}`);
    } else {
      //console.warn(`� Acceso DENEGADO - Rol actual: ${userRole}, Requerido: ${normalizedRequiredRoles.join('|')}`);
    }
    
    return hasAccess;
  };

  // Función auxiliar para mapear roles
  const mapRole = (roleValue) => {
    const roleMapping = {
      // IDs numéricos a nombres
      1: 'asesor',
      2: 'misteryshopper', 
      3: 'mercadeo_ac',
      4: 'director',
      5: 'ot',
      6: 'backoffice',
      // Strings directos
      'asesor': 'asesor',
      'misteryshopper': 'misteryshopper',
      'mercadeo_ac': 'mercadeo_ac',
      'director': 'director',
      'ot': 'ot',
      'backoffice': 'backoffice',
      // Variaciones comunes
      'ASESOR': 'asesor',
      'MYSTERY_SHOPPER': 'misteryshopper',
      'MERCADEO_AC': 'mercadeo_ac',
      'DIRECTOR': 'director',
      'ORGANIZACION_TERPEL': 'ot',
      'BACKOFFICE': 'backoffice',
      'BackOffice': 'backoffice'
    };
    
    return roleMapping[roleValue] || String(roleValue).toLowerCase();
  };

  // Función para verificar si está autenticado
  const isAuthenticated = () => {
    // Durante la carga inicial, verificar si hay datos de usuario en localStorage
    if (loading) {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      
      // Si hay datos guardados, asumir temporalmente autenticado durante la carga
      if (storedUser && (storedToken || localStorage.getItem('sessionId'))) {
        try {
          const userData = JSON.parse(storedUser);
          return !!(userData && userData.id);
        } catch {
          return false;
        }
      }
      return false;
    }
    
    // Verificar tanto token como usuario
    const hasValidToken = token && token !== null;
    const hasValidUser = user && user.id;
    
    const authenticated = !!(hasValidToken && hasValidUser);
    
    // Log para debugging
    if (process.env.NODE_ENV === 'development') {
      // console.log('🔐 isAuthenticated check:', {
      //   loading,
      //   hasToken: hasValidToken,
      //   hasUser: hasValidUser,
      //   userId: user?.id,
      //   userEmail: user?.email,
      //   authenticated
      // });
    }
    
    return authenticated;
  };

  // Función para obtener headers con autorización
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Función para hacer requests autenticados con reintentos automáticos
  const authenticatedFetch = async (url, options = {}, retries = 2) => {
    // Verificar token antes de hacer request
    if (!token || token === 'legacy_auth') {
      console.warn('⚠️ Token no válido, intentando recuperar de localStorage...');
      const storedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No hay token de autenticación válido');
      }
      // Actualizar token en el estado
      setToken(storedToken);
    }

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    
    // Obtener token más reciente
    const currentToken = token !== 'legacy_auth' ? token : 
                        localStorage.getItem('authToken') || 
                        localStorage.getItem('token');

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          ...options.headers
        },
        timeout: 30000 // 30 segundos de timeout
      });

      // ✅ MANEJO MEJORADO: Verificar si el token expiró
      if (response.status === 401 || response.status === 403) {
        // Intentar obtener el JSON de error para ver el código
        try {
          const errorData = await response.json();
          
          // ✅ Si el token expiró, hacer logout y redirigir
          if (errorData.code === 'TOKEN_EXPIRED' || 
              errorData.code === 'TOKEN_INVALID' || 
              errorData.code === 'TOKEN_MISSING') {
            
            console.warn('🔴 Token expirado o inválido - Redirigiendo al login...');
            
            // Hacer logout limpio
            await logout();
            
            // ✅ REDIRIGIR A LA PÁGINA DE LOGIN
            window.location.href = '/';
            
            throw new Error(errorData.message || 'Sesión expirada. Redirigiendo al login...');
          }
        } catch (jsonError) {
          // Si no se puede parsear el JSON, asumir error de autenticación
          console.error('❌ Error de autenticación (401/403)');
          await logout();
          window.location.href = '/';
          throw new Error('Sesión expirada o token inválido');
        }
      }

      return response;
    } catch (error) {
      // Reintentar si es un error de red y quedan reintentos
      if (retries > 0 && (
        error.name === 'TypeError' || 
        error.message.includes('fetch') ||
        error.message.includes('network')
      )) {
        console.warn(`⚠️ Error de red, reintentando... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s antes de reintentar
        return authenticatedFetch(url, options, retries - 1);
      }
      
      throw error;
    }
  };

  return {
    user,
    token,
    loading,
    error,
    sessionId, // Nuevo: incluir ID de sesión
    login,
    logout,
    hasRole,
    isAuthenticated,
    getAuthHeaders,
    authenticatedFetch,
    verifyToken,
    validateUniqueSession // Nuevo: función para validar sesión única
  };
};

// Exportar directamente el hook base como useAuth
export const useAuth = useAuthBase;