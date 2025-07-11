import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../../styles/Asesor/confirmation-modal.css';

/**
 * Modal de confirmación reutilizable para confirmar el envío de reportes
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {function} onConfirm - Función para confirmar la acción (opcional, se puede omitir)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje de confirmación
 * @param {boolean} isLoading - Si está procesando la acción
 */
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar envío", 
  message = "¿Estás seguro de que deseas cargar este reporte?",
  isLoading = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body cuando el modal está abierto
      document.body.classList.add('confirmation-modal-open');
      // Resetear estados cuando se abre el modal
      setIsProcessing(false);
      setShowSuccess(false);
    } else {
      document.body.classList.remove('confirmation-modal-open');
    }
    
    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('confirmation-modal-open');
    };
  }, [isOpen]);

  // Función para manejar la confirmación con simulación visual
  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Simular proceso de carga por 2 segundos
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      
      // Mostrar mensaje de éxito por 1.5 segundos y luego recargar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading && !isProcessing && !showSuccess) {
      onClose();
    }
  };

  return createPortal(
    <div className="confirmation-modal-overlay" onClick={handleOverlayClick}>
      <div className="confirmation-modal-content">
        <div className="confirmation-modal-header">
          <h3>{showSuccess ? "¡Éxito!" : title}</h3>
          {!isLoading && !isProcessing && !showSuccess && (
            <button 
              className="confirmation-modal-close" 
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="confirmation-modal-body">
          {showSuccess ? (
            // Vista de éxito
            <>
              <div className="confirmation-icon success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2"/>
                  <path d="l8 12l2 2l4-4" stroke="#28a745" strokeWidth="2"/>
                </svg>
              </div>
              <p><strong>REGISTRO CARGADO EXITOSAMENTE</strong></p>
            </>
          ) : (
            // Vista normal de confirmación
            <>
              <div className="confirmation-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#e30613" strokeWidth="2"/>
                  <path d="M12 6v6M12 16h.01" stroke="#e30613" strokeWidth="2"/>
                </svg>
              </div>
              <p>{message}</p>
            </>
          )}
        </div>
        
        <div className="confirmation-modal-actions">
          {!showSuccess && (
            <>
              <button 
                className="confirmation-btn confirmation-btn-cancel" 
                onClick={onClose}
                disabled={isLoading || isProcessing}
              >
                Cancelar
              </button>
              <button 
                className="confirmation-btn confirmation-btn-confirm" 
                onClick={handleConfirm}
                disabled={isLoading || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="confirmation-spinner"></span>
                    Cargando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
