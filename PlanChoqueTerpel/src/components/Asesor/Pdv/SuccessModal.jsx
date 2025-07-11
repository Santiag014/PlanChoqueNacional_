import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../../styles/Asesor/confirmation-modal.css';

const SuccessModal = ({ 
  isOpen, 
  title = "¡Registro Exitoso!", 
  message = "Tu información ha sido guardada correctamente.",
  onComplete,
  duration = 3000 
}) => {
  
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body
      document.body.classList.add('confirmation-modal-open');
      
      // Auto cerrar después del tiempo especificado
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);
      
      return () => {
        clearTimeout(timer);
        document.body.classList.remove('confirmation-modal-open');
      };
    } else {
      document.body.classList.remove('confirmation-modal-open');
    }
  }, [isOpen, duration, onComplete]);

  if (!isOpen) return null;

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  );

  return createPortal(
    <div className="success-modal-overlay">
      <div className="success-modal-content">
        <div className="success-modal-body">
          <div className="success-icon-container">
            <div className="success-icon">
              <CheckIcon />
            </div>
          </div>
          
          <h2 className="success-title">{title}</h2>
          <p className="success-message">{message}</p>
          
          <div className="success-progress">
            <div className="success-progress-bar"></div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SuccessModal;
