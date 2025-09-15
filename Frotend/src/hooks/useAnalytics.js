import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackPageView, 
  trackUser, 
  trackConversion, 
  trackAppError, 
  trackAuthEvent,
  trackEvent
} from '../utils/analytics/analytics';
import * as events from '../utils/analytics/events';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Rastrear cambios de página automáticamente
    const pageTitle = document.title || 'Página sin título';
    const pageUrl = window.location.href;
    
    // Agregar un pequeño delay para asegurar que el título esté actualizado
    setTimeout(() => {
      trackPageView(pageUrl, document.title || pageTitle);
    }, 100);
  }, [location]);

  // Funciones principales de analytics
  return {
    // Funciones básicas
    trackEvent,
    trackPageView,
    trackUser,
    trackConversion,
    trackAppError,
    trackAuthEvent,
    
    // Eventos específicos de la aplicación
    ...events,
    
    // Funciones de conveniencia (mantener compatibilidad)
    trackError: (errorMessage, errorType = 'general') => trackAppError(errorType, errorMessage),
    trackApiCall: (endpoint, method, success = true, responseTime = null) => {
      events.trackApiCall(endpoint, method, success, responseTime);
    }
  };
};
