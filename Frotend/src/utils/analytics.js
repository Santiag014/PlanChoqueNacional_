// Configuración de Google Analytics
export const GA_TRACKING_ID = 'G-ZNM1T6KZMP';

// Variable para verificar si GA está inicializado
let gaInitialized = false;

// Inicializar Google Analytics
export const initGA = () => {
  // Verificar si ya está cargado
  if (gaInitialized || window.gtag) {
    //console.log('✅ Google Analytics ya está inicializado');
    return;
  }

  try {
    // Cargar el script de Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    script.onload = () => {
      //console.log('✅ Script de Google Analytics cargado correctamente');
    };
    script.onerror = () => {
      //console.error('❌ Error al cargar el script de Google Analytics');
    };
    document.head.appendChild(script);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false // Controlar manualmente el envío de page views
    });

    gaInitialized = true;
    //console.log('✅ Google Analytics inicializado correctamente con ID:', GA_TRACKING_ID);
  } catch (error) {
    //console.error('❌ Error al inicializar Google Analytics:', error);
  }
};

// Función para rastrear eventos
export const trackEvent = (action, category, label = null, value = null) => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        timestamp: new Date().toISOString()
      });
      //console.log(`📊 Evento rastreado: ${action} - ${category}${label ? ` - ${label}` : ''}`);
    } catch (error) {
      //console.error('❌ Error al rastrear evento:', error);
    }
  } else {
    //console.warn('⚠️ Google Analytics no está disponible para rastrear evento:', action);
  }
};

// Función para rastrear páginas
export const trackPageView = (url, title) => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('config', GA_TRACKING_ID, {
        page_title: title,
        page_location: url,
        timestamp: new Date().toISOString()
      });
      //console.log(`📄 Página rastreada: ${title} - ${url}`);
    } catch (error) {
      console.error('❌ Error al rastrear página:', error);
    }
  } else {
    //console.warn('⚠️ Google Analytics no está disponible para rastrear página:', url);
  }
};

// Función para rastrear usuarios autenticados
export const trackUser = (userId, userRole) => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('config', GA_TRACKING_ID, {
        user_id: userId,
        custom_map: {
          custom_dimension_1: userRole
        }
      });
      //console.log(`👤 Usuario rastreado: ${userId} - ${userRole}`);
    } catch (error) {
      //console.error('❌ Error al rastrear usuario:', error);
    }
  } else {
    //console.warn('⚠️ Google Analytics no está disponible para rastrear usuario');
  }
};

// Función para rastrear conversiones
export const trackConversion = (conversionType, value = null) => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'conversion', {
        send_to: GA_TRACKING_ID,
        event_category: 'conversion',
        event_label: conversionType,
        value: value,
        timestamp: new Date().toISOString()
      });
      //console.log(`🎯 Conversión rastreada: ${conversionType}${value ? ` - Valor: ${value}` : ''}`);
    } catch (error) {
      //console.error('❌ Error al rastrear conversión:', error);
    }
  } else {
    //console.warn('⚠️ Google Analytics no está disponible para rastrear conversión');
  }
};

// Función para rastrear errores específicos de la aplicación
export const trackAppError = (errorType, errorMessage, errorStack = null) => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'exception', {
        description: `${errorType}: ${errorMessage}`,
        fatal: false,
        custom_parameters: {
          error_stack: errorStack,
          timestamp: new Date().toISOString()
        }
      });
      //console.log(`🚨 Error de aplicación rastreado: ${errorType} - ${errorMessage}`);
    } catch (error) {
      //console.error('❌ Error al rastrear error de aplicación:', error);
    }
  }
};

// Función para rastrear eventos de autenticación
export const trackAuthEvent = (eventType, userRole = null, success = true) => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventType, {
        event_category: 'authentication',
        event_label: userRole,
        success: success,
        timestamp: new Date().toISOString()
      });
      //console.log(`🔐 Evento de autenticación rastreado: ${eventType} - ${success ? 'Exitoso' : 'Fallido'}`);
    } catch (error) {
      //console.error('❌ Error al rastrear evento de autenticación:', error);
    }
  }
};
