import React, { createContext, useContext, useEffect } from 'react';
import { initGA } from '../utils/analytics/analytics';
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const analytics = useAnalytics();

  useEffect(() => {
    // Asegurar que Analytics esté inicializado
    initGA();
    
    // Configurar manejo global de errores para analytics
    const handleError = (event) => {
      analytics.trackJavaScriptError(
        event.error?.message || 'Error desconocido',
        event.error?.filename || 'archivo desconocido',
        event.error?.lineno || 0
      );
    };

    const handleUnhandledRejection = (event) => {
      analytics.trackJavaScriptError(
        event.reason?.message || 'Promise rechazada',
        'promise',
        0
      );
    };

    // Agregar listeners de error globales
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext debe usarse dentro de AnalyticsProvider');
  }
  return context;
};
