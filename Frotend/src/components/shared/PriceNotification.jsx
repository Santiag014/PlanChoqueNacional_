import React, { useEffect, useState } from 'react';
import '../../styles/shared/price-notification.css';

/**
 * Componente de notificación para mostrar cuando se consulta exitosamente un precio
 */
const PriceNotification = ({ show, precio, referencia, presentacion, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-ocultar después de 3 segundos
      const timer = setTimeout(() => {
        setVisible(false);
        onClose && onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="price-notification">
      <div className="notification-content">
        <div className="notification-icon">
          ✅
        </div>
        <div className="notification-text">
          <strong>Precio actualizado automáticamente</strong>
          <p>
            {referencia} - {presentacion}
            <br />
            <span className="price-value">
              ${precio?.toLocaleString('es-CO')}
            </span>
          </p>
        </div>
        <button 
          className="notification-close"
          onClick={() => {
            setVisible(false);
            onClose && onClose();
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PriceNotification;
