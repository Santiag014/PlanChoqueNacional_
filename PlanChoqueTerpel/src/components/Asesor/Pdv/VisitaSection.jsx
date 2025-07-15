import React, { useState } from 'react';

/**
 * Componente para el KPI de Visitas (anteriormente Volumen)
 */

const VisitaSection = ({
  kpiTransition,
  fecha,
  setFecha,
  foto,
  setFoto,
  pdvId,
  userId,
  enviarVisita,
  subiendo
}) => {
  // Eliminado número de visita
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Envío directo sin popup de confirmación
  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const params = {
        pdv_id: pdvId,
        user_id: userId,
        fecha,
        foto_seguimiento: foto
      };
      const result = await enviarVisita(params);
      if (result) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSubmitError(error.message || 'Error al enviar la visita');
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccessModal(false);
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


      {/* Eliminado campo de número de visita */}

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
          disabled={subiendo || !fecha || !foto}
        >
          {subiendo ? 'Enviando...' : 'CARGAR REGISTRO'}
        </button>
      </div>

      {/* Modal de éxito bonito */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{background: 'rgba(0,0,0,0.25)'}}>
          <div className="modal-box success-modal" style={{background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 24, textAlign: 'center'}}>
            <span className="success-icon" style={{fontSize: 56, color: '#27ae60', marginBottom: 12, display: 'inline-block'}}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="28" fill="#27ae60"/>
                <path d="M16 29.5L24.5 38L40 22.5" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h2 style={{color: '#27ae60', margin: 0, fontWeight: 700}}>¡Registro exitoso!</h2>
            <p style={{color: '#222', margin: '12px 0 24px'}}>El registro de visita ha sido guardado correctamente.</p>
            <button className="btn-confirm" onClick={handleSuccessComplete} style={{marginTop: 0, borderRadius: 8, background: '#27ae60', color: '#fff', border: 'none', padding: '10px 28px', fontWeight: 600, fontSize: 16}}>Aceptar</button>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {submitError && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Error</h3>
            <p>{submitError}</p>
            <button className="btn-confirm" onClick={() => setSubmitError(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitaSection;
