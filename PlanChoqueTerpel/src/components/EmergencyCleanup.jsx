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

  return (
    <button
      onClick={handleEmergencyCleanup}
      style={{
        position: 'fixed',
        top: 10,
        left: 10,
        background: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        fontSize: '11px',
        zIndex: 9999,
        cursor: 'pointer',
        borderRadius: '4px'
      }}
      title="Limpiar toda la sesión (solo desarrollo)"
    >
      🧹 Limpiar Sesión
    </button>
  );
}
