import React from 'react';

export default function EmergencyCleanup() {
  const handleEmergencyCleanup = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar completamente toda la sesión?')) {
      // Limpiar absolutamente todo
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpiar cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Limpiar cache
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (let name of names) {
            caches.delete(name);
          }
        });
      }
      
      // Recargar página
      window.location.href = '/';
    }
  };

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
}
