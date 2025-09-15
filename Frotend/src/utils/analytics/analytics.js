import { ANALYTICS_CONFIG, isAnalyticsEnabled } from './config.js';

// Variable para verificar si GA está inicializado
let gaInitialized = false;

// Función para log con formato consistente
const analyticsLog = (type, message, data = null) => {
  if (ANALYTICS_CONFIG.DEBUG) {
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: '📊'
    };
    console.log(`${emoji[type]} [Analytics] ${message}`, data || '');
  }
};

// Inicializar Google Analytics
export const initGA = () => {
  // Verificar si analytics está habilitado
  if (!isAnalyticsEnabled()) {
    analyticsLog('warning', 'Analytics deshabilitado en desarrollo');
    return;
  }

  // Verificar si ya está cargado
  if (gaInitialized || window.gtag) {
    analyticsLog('info', 'Google Analytics ya está inicializado');
    return;
  }

  try {
    // Cargar el script de Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA_TRACKING_ID}`;
    script.onload = () => {
      analyticsLog('success', 'Script de Google Analytics cargado correctamente');
    };
    script.onerror = () => {
      analyticsLog('error', 'Error al cargar el script de Google Analytics');
    };
    document.head.appendChild(script);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', ANALYTICS_CONFIG.GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false, // Controlar manualmente el envío de page views
      debug_mode: ANALYTICS_CONFIG.DEBUG
    });

    gaInitialized = true;
    analyticsLog('success', `Google Analytics inicializado con ID: ${ANALYTICS_CONFIG.GA_TRACKING_ID}`);
  } catch (error) {
    analyticsLog('error', 'Error al inicializar Google Analytics', error);
  }
};

// Función para verificar si gtag está disponible
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && window.gtag && isAnalyticsEnabled();
};

// Función para rastrear páginas
export const trackPageView = (url, title) => {
  if (isGtagAvailable()) {
    try {
      window.gtag('config', ANALYTICS_CONFIG.GA_TRACKING_ID, {
        page_title: title,
        page_location: url,
        timestamp: new Date().toISOString()
      });
      analyticsLog('info', `Página rastreada: ${title} - ${url}`);
    } catch (error) {
      analyticsLog('error', 'Error al rastrear página', error);
    }
  }
};

// Función para rastrear eventos
export const trackEvent = (action, category, label = null, value = null) => {
  if (isGtagAvailable()) {
    try {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        timestamp: new Date().toISOString()
      });
      analyticsLog('info', `Evento rastreado: ${action} - ${category}${label ? ` - ${label}` : ''}`);
    } catch (error) {
      analyticsLog('error', 'Error al rastrear evento', error);
    }
  }
};

// Función para rastrear usuarios autenticados
export const trackUser = (userId, userRole, zone = null) => {
  if (isGtagAvailable()) {
    try {
      const customParams = {
        user_id: userId,
        custom_map: {}
      };
      
      customParams.custom_map[ANALYTICS_CONFIG.CUSTOM_DIMENSIONS.USER_ROLE] = userRole;
      
      if (zone) {
        customParams.custom_map[ANALYTICS_CONFIG.CUSTOM_DIMENSIONS.USER_ZONE] = zone;
      }

      window.gtag('config', ANALYTICS_CONFIG.GA_TRACKING_ID, customParams);
      analyticsLog('info', `Usuario rastreado: ${userId} - ${userRole}${zone ? ` - ${zone}` : ''}`);
    } catch (error) {
      analyticsLog('error', 'Error al rastrear usuario', error);
    }
  }
};

// Función para rastrear conversiones
export const trackConversion = (conversionType, value = null) => {
  if (isGtagAvailable()) {
    try {
      window.gtag('event', 'conversion', {
        send_to: ANALYTICS_CONFIG.GA_TRACKING_ID,
        event_category: 'conversion',
        event_label: conversionType,
        value: value,
        currency: ANALYTICS_CONFIG.ECOMMERCE.CURRENCY,
        timestamp: new Date().toISOString()
      });
      analyticsLog('info', `Conversión rastreada: ${conversionType}${value ? ` - Valor: ${value}` : ''}`);
    } catch (error) {
      analyticsLog('error', 'Error al rastrear conversión', error);
    }
  }
};

// Función para rastrear errores específicos de la aplicación
export const trackAppError = (errorType, errorMessage, errorStack = null) => {
  if (isGtagAvailable()) {
    try {
      window.gtag('event', 'exception', {
        description: `${errorType}: ${errorMessage}`,
        fatal: false,
        custom_parameters: {
          error_stack: errorStack,
          timestamp: new Date().toISOString()
        }
      });
      analyticsLog('error', `Error de aplicación rastreado: ${errorType} - ${errorMessage}`);
    } catch (error) {
      analyticsLog('error', 'Error al rastrear error de aplicación', error);
    }
  }
};

// Función para rastrear eventos de autenticación
export const trackAuthEvent = (eventType, userRole = null, success = true) => {
  if (isGtagAvailable()) {
    try {
      window.gtag('event', eventType, {
        event_category: 'authentication',
        event_label: userRole,
        success: success,
        timestamp: new Date().toISOString()
      });
      analyticsLog('info', `Evento de autenticación rastreado: ${eventType} - ${success ? 'Exitoso' : 'Fallido'}`);
    } catch (error) {
      analyticsLog('error', 'Error al rastrear evento de autenticación', error);
    }
  }
};
