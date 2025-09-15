// Configuración simple y directa de la API
//export const API_URL = 'https://api.plandelamejorenergia.com';

// Función para detectar si estamos accediendo desde un dispositivo móvil en la red local
const getLocalIP = () => {
  const hostname = window.location.hostname;
  // Si estamos accediendo por IP (no localhost), usar esa IP para la API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return hostname;
  }
  return 'localhost';
};

export const API_URL = import.meta.env.DEV ? `http://${getLocalIP()}:3001` : 'https://api.plandelamejorenergia.com';

// Configuración de URLs para diferentes entornos
export const getApiConfig = () => {
  const isDev = import.meta.env.DEV;
  const localIP = getLocalIP();
  
  if (isDev) {
    return {
      API_URL: `http://${localIP}:3001`,
      STORAGE_BASE_URL: `http://${localIP}:3001/uploads`,
      WEB_URL: `http://${localIP}:5173`
    };
  } else {
    return {
      API_URL: 'https://api.plandelamejorenergia.com',
      STORAGE_BASE_URL: 'https://api.plandelamejorenergia.com/uploads',
      WEB_URL: 'https://plandelamejorenergia.com'
    };
  }
};

// Configuración actual
export const CONFIG = getApiConfig();

// Configuración de la aplicación
export const APP_CONFIG = {
  API_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};