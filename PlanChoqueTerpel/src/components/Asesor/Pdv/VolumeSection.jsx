import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import SuccessModal from './SuccessModal';

/**
 * Componente para el KPI de Visitas (anteriormente Volumen)
 */
const VolumeSection = ({ 
  kpiTransition,
  fecha,
  setFecha,
  foto,
  setFoto,
  enviarReporte,
  subiendo
}) => {
  const [numeroVisita, setNumeroVisita] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    
    // Intentar llamar con callback si la función lo soporta
    try {
      const resultado = enviarReporte(() => {
        // Callback de éxito
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 500);
      });
      
      // Si no soporta callback, usar timeout como fallback
      if (resultado === undefined) {
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error al enviar reporte:', error);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccessModal(false);
    // Recargar la página después de un breve delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleCancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  return (
    <div className={`kpi-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
      
      {/* Fecha */}
      <div className="pdv-row-fecha">
        <label className="pdv-label" htmlFor="fecha-input-visitas">FECHA</label>
        <div className="relative flex-1">
          <input
            id="fecha-input-visitas"
            className="pdv-input-date ta-center"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <span className="date-icon cursor-pointer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
              <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
              <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
              <rect x="3" y="9" width="18" height="2" fill="#fff"/>
            </svg>
          </span>
        </div>
      </div>

      {/* Número de Visita de Seguimiento */}
      <div className="pdv-row">
        <label className="pdv-label" htmlFor="numero-visita-input">NÚMERO DE VISITA</label>
        <input
          id="numero-visita-input"
          className="pdv-input-corresponde"
          type="number"
          min="1"
          value={numeroVisita}
          onChange={(e) => setNumeroVisita(e.target.value)}
          placeholder="Ej: 1, 2, 3..."
        />
      </div>

      {/* Foto de Seguimiento */}
      <div className="pdv-row-foto">
        <label className="pdv-label pdv-label-multiline" htmlFor="foto-seguimiento-input">
          FOTO<br/>SEGUIMIENTO
        </label>
        <div className="adjuntar-foto-box">
          <input
            type="file"
            accept="image/*"
            id="foto-seguimiento-input"
            className="display-none"
            onChange={(e) => setFoto(e.target.files[0])}
          />
          <div
            className="adjuntar-foto-input cursor-pointer"
            tabIndex={0}
            onClick={() => document.getElementById('foto-seguimiento-input').click()}
          >
            <span className="foto-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="#e30613" stroke="#fff" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="3" fill="#fff"/>
                <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
              </svg>
            </span>
            <span className="adjuntar-foto-placeholder">
              {foto ? foto.name : "Seleccionar foto de seguimiento"}
            </span>
          </div>
        </div>
      </div>

      {/* Botón de envío */}
      <div className="volume-actions">
        <button
          type="button"
          className="btn-cargar-registro"
          onClick={handleSubmit}
          disabled={subiendo || !numeroVisita || !fecha || !foto}
        >
          {subiendo ? 'Enviando...' : 'CARGAR REGISTRO'}
        </button>
      </div>

      {/* Modal de confirmación para envío de reporte */}
      <ConfirmationModal
        isOpen={showSubmitConfirm}
        onClose={handleCancelSubmit}
        onConfirm={handleConfirmSubmit}
        title="Confirmar envío de visitas"
        message="¿Estás seguro de que deseas cargar este reporte de visitas? Esta acción no se puede deshacer."
        isLoading={subiendo}
      />

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="¡Visita Registrada!"
        message="Tu reporte de visita ha sido enviado exitosamente."
        onComplete={handleSuccessComplete}
        duration={3000}
      />
    </div>
  );
};

export default VolumeSection;
