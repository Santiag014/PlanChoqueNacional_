// Configuración de Google Analytics
export const ANALYTICS_CONFIG = {
  // ID de seguimiento de Google Analytics
  GA_TRACKING_ID: 'G-ZNM1T6KZMP',
  
  // Configuración de desarrollo/producción
  DEBUG: import.meta.env.DEV,
  
  // Configuración de eventos personalizados
  CUSTOM_DIMENSIONS: {
    USER_ROLE: 'custom_dimension_1',
    USER_ZONE: 'custom_dimension_2',
    DEVICE_TYPE: 'custom_dimension_3'
  },
  
  // Configuración de conversiones
  CONVERSION_EVENTS: {
    FORM_SUBMIT: 'form_submission',
    DOWNLOAD: 'file_download',
    REGISTRATION: 'user_registration',
    LOGIN: 'user_login'
  },
  
  // Configuración de eCommerce (si aplica)
  ECOMMERCE: {
    CURRENCY: 'COP'
  }
};

// Verificar si estamos en desarrollo
export const isDevelopment = () => import.meta.env.DEV;

// Verificar si analytics está habilitado
export const isAnalyticsEnabled = () => {
  return !isDevelopment() || ANALYTICS_CONFIG.DEBUG;
};
