import React from 'react';

export default function EmergencyLogout() {
  const handleEmergencyLogout = () => {
    // Limpiar completamente todo
    localStorage.clear();
    sessionStorage.clear();
    // Recargar la página
    window.location.href = '/';
  };

  // Solo mostrarlo en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={handleEmergencyLogout}
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'red',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        fontSize: '12px',
        zIndex: 9999,
        cursor: 'pointer'
      }}
      title="Logout de emergencia (solo desarrollo)"
    >
      Emergency Logout
    </button>
  );
}
