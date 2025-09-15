/**
 * @fileoverview Componente para mostrar alertas de seguridad
 * 
 * Muestra notificaciones cuando se detectan intentos de acceso no autorizado
 * o violaciones de seguridad en el sistema.
 * 
 * @author Plan Choque Terpel Team - Seguridad
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';

/**
 * Hook para manejar alertas de seguridad
 */
export const useSecurityAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'warning', duration = 5000) => {
    const id = Date.now() + Math.random();
    const alert = {
      id,
      message,
      type,
      timestamp: new Date()
    };
    
    setAlerts(prev => [...prev, alert]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeAlert(id);
    }, duration);
    
    // Log de seguridad
    console.warn(`🔒 ALERTA DE SEGURIDAD [${type.toUpperCase()}]: ${message}`);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const logUnauthorizedAccess = (attemptedRoute, userRole, requiredRole) => {
    const message = `Intento de acceso no autorizado detectado: Rol ${userRole} intentó acceder a ${attemptedRoute} (requiere ${requiredRole})`;
    addAlert(message, 'error', 8000);
    
    // Enviar al servidor para logging (opcional)
    try {
      fetch('/api/security/log-unauthorized-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: attemptedRoute,
          userRole,
          requiredRole,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      }).catch(() => {}); // Ignorar errores para no afectar la UX
    } catch (error) {
      // Ignorar errores de logging
    }
  };

  return {
    alerts,
    addAlert,
    removeAlert,
    logUnauthorizedAccess
  };
};

/**
 * Componente para mostrar alertas de seguridad
 */
export default function SecurityAlerts({ alerts, onRemove }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="security-alerts-container">
      {alerts.map(alert => (
        <SecurityAlert 
          key={alert.id}
          alert={alert}
          onClose={() => onRemove(alert.id)}
        />
      ))}
    </div>
  );
}

/**
 * Componente individual de alerta de seguridad
 */
function SecurityAlert({ alert, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Delay para animación
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '🔒';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
        return '#17a2b8';
      default:
        return '#e30613';
    }
  };

  return (
    <div 
      className={`security-alert ${alert.type} ${isVisible ? 'visible' : 'hidden'}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        backgroundColor: 'white',
        border: `2px solid ${getAlertColor(alert.type)}`,
        borderRadius: '8px',
        padding: '15px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '400px',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>
          {getAlertIcon(alert.type)}
        </span>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: getAlertColor(alert.type),
            marginBottom: '5px',
            fontSize: '14px'
          }}>
            ALERTA DE SEGURIDAD
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            color: '#333',
            lineHeight: '1.4',
            marginBottom: '8px'
          }}>
            {alert.message}
          </div>
          
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            borderTop: '1px solid #eee',
            paddingTop: '5px'
          }}>
            {alert.timestamp.toLocaleTimeString()}
          </div>
        </div>
        
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#999',
            padding: '0',
            lineHeight: '1',
            flexShrink: 0
          }}
          title="Cerrar alerta"
        >
          ×
        </button>
      </div>
    </div>
  );
}
