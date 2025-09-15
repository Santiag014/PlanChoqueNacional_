import React, { useState, useEffect } from 'react';
import { useImplementacionSubmission } from '../../../hooks/asesor/useImplementacionSubmission';
import { useImplementacionPuntoVenta } from '../../../hooks/asesor/useImplementacionPuntoVenta';
import ImplementacionDropdown from './ImplementacionDropdown';
import RegistroFotograficoImplementacion from './RegistroFotograficoImplementacion';
import { API_URL } from '../../../config.js';

/**
 * Componente para el KPI de Visitas e Implementaciones
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
  // Estados para toggle entre Visitas e Implementación
  const [modoSeleccionado, setModoSeleccionado] = useState('visitas'); // 'visitas' o 'implementacion'
  
  // Estados originales de visitas
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSeguimiento, setIsSeguimiento] = useState(false);
  
  // Estados para implementación seleccionada
  const [implementacionSeleccionada, setImplementacionSeleccionada] = useState(null);
  
  // Estados para validación y observaciones
  const [deseaActivacion, setDeseaActivacion] = useState(''); // 'SI' o 'NO'
  const [observaciones, setObservaciones] = useState('');
  
  // Estados para fotos de implementación
  const [fotosImplementacion, setFotosImplementacion] = useState({});
  
  // Estado para foto de remisión
  const [fotoRemision, setFotoRemision] = useState(null);
  
  // Hooks
  const implementacionSubmission = useImplementacionSubmission(userId);
  const {
    galonajeData,
    implementacionesDisponibles,
    loadingGalonaje,
    error: galonajeError,
    consultarGalonaje,
    limpiarDatos
  } = useImplementacionPuntoVenta(pdvId, userId);

  // Efecto para consultar galonaje cuando cambie el PDV y el modo sea implementación
  useEffect(() => {
    if (modoSeleccionado === 'implementacion' && pdvId && pdvId !== 'N/A') {
      consultarGalonaje();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoSeleccionado, pdvId]);

  // Limpiar datos cuando se cambie el modo
  useEffect(() => {
    // Limpiar campos comunes
    setFecha('');
    setFoto(null);
    setSubmitError(null);
    setShowSuccessModal(false);
    
    // Limpiar campos específicos de visitas
    setIsSeguimiento(false);
    
    // Limpiar campos específicos de implementación
    setImplementacionSeleccionada(null);
    setDeseaActivacion('');
    setObservaciones('');
    setFotosImplementacion({});
    setFotoRemision(null);
    
    // Limpiar datos del hook de implementación si no estamos en implementación
    if (modoSeleccionado !== 'implementacion') {
      limpiarDatos();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoSeleccionado]);

  // Limpiar fotos cuando cambie la implementación seleccionada
  useEffect(() => {
    setFotosImplementacion({});
    setFotoRemision(null);
    setDeseaActivacion('');
    setObservaciones('');
  }, [implementacionSeleccionada]);

  // Sincronizar errores del hook con el estado local
  useEffect(() => {
    if (galonajeError) {
      setSubmitError(galonajeError);
    }
  }, [galonajeError]);

  // Función para cambiar de modo con confirmación si hay datos
  const cambiarModo = (nuevoModo) => {
    const hayDatos = fecha || foto || observaciones || 
                    Object.keys(fotosImplementacion).length > 0 || 
                    fotoRemision;
    
    if (hayDatos && modoSeleccionado !== nuevoModo) {
      const confirmacion = confirm(`¿Estás seguro de cambiar a ${nuevoModo}? Se perderán todos los datos ingresados.`);
      if (confirmacion) {
        setModoSeleccionado(nuevoModo);
      }
    } else {
      setModoSeleccionado(nuevoModo);
    }
  };

  // 🔍 Función para calcular el estado de validación del formulario
  const getValidationState = () => {
    if (!implementacionSeleccionada || !deseaActivacion || !fecha) {
      return { isValid: false, message: 'Completa todos los campos requeridos' };
    }

    // Validar comentarios obligatorios
    if (!observaciones || observaciones.trim() === '') {
      return { isValid: false, message: 'Los comentarios son obligatorios' };
    }

    // Validar longitud mínima de comentarios
    if (deseaActivacion === 'SI' && observaciones.trim().length < 5) {
      return { isValid: false, message: 'Los comentarios deben tener al menos 5 caracteres' };
    }

    if (deseaActivacion === 'NO' && observaciones.trim().length < 10) {
      return { isValid: false, message: 'Explica detalladamente por qué no se autorizó (mín. 10 caracteres)' };
    }

    // Validar fotos para implementaciones autorizadas
    if (deseaActivacion === 'SI') {
      const fotoImplementacion = fotosImplementacion[`implementacion_${implementacionSeleccionada.numero}`];
      if (!fotoImplementacion) {
        return { isValid: false, message: 'Debes subir la foto de implementación' };
      }
      if (!fotoRemision) {
        return { isValid: false, message: 'Debes subir la foto de remisión' };
      }
    }

    return { isValid: true, message: 'Formulario válido - Listo para enviar' };
  };

  // Envío directo sin popup de confirmación
  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const isSeguimientoValue = isSeguimiento ? 1 : 0;
      
      const params = {
        pdv_id: pdvId,
        user_id: userId,
        fecha,
        foto_seguimiento: foto,
        is_seguimiento: isSeguimientoValue
      };
      const result = await enviarVisita(params);
      if (result) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSubmitError(error.message || 'Error al enviar la visita');
    }
  };

  // Función para manejar el envío de implementaciones
  const handleSubmitImplementacion = async () => {
    setSubmitError(null);
    
    if (!deseaActivacion) {
      setSubmitError('Debes seleccionar si deseas activar esta implementación.');
      return;
    }
    
    if (!fecha) {
      setSubmitError('Debes seleccionar una fecha.');
      return;
    }
    
    // Si acepta la implementación, validar fotos
    if (deseaActivacion === 'SI') {
      const fotoImplementacion = fotosImplementacion[`implementacion_${implementacionSeleccionada.numero}`];
      
      if (!fotoImplementacion) {
        setSubmitError('Debes subir la foto de la implementación.');
        return;
      }
      
      if (!fotoRemision) {
        setSubmitError('Debes subir la foto de la remisión.');
        return;
      }
    }
    
    // 🚨 RESTRICCIÓN 2: Comentarios OBLIGATORIOS para cualquier implementación
    if (!observaciones || observaciones.trim() === '') {
      setSubmitError('Los comentarios son obligatorios para cargar cualquier implementación. Por favor, agrega un comentario.');
      return;
    }
    
    // Validar longitud mínima según el tipo de implementación
    if (deseaActivacion === 'SI' && observaciones.trim().length < 5) {
      setSubmitError('Los comentarios deben tener al menos 5 caracteres para implementaciones autorizadas.');
      return;
    }
    
    // Si no acepta, validar que las observaciones expliquen el rechazo
    if (deseaActivacion === 'NO' && observaciones.trim().length < 10) {
      setSubmitError('Debes explicar detalladamente por qué no se autorizó la implementación (mínimo 10 caracteres).');
      return;
    }
    
    try {
      // Crear un producto para la implementación si acepta
      let productosParaEnviar = [];
      if (deseaActivacion === 'SI') {
        productosParaEnviar = [{
          nombre: `Implementación ${implementacionSeleccionada.numero}`,
          nombre_producto: `Implementación ${implementacionSeleccionada.numero}`,
          cantidad: 1,
          producto_id: `implementacion_${implementacionSeleccionada.numero}`,
          id: `implementacion_${implementacionSeleccionada.numero}`
        }];
      }

      const params = {
        pdv_id: pdvId,
        user_id: userId,
        fecha,
        tipo_implementacion: implementacionSeleccionada.numero,
        desea_activacion: deseaActivacion,
        observaciones: observaciones || null,
        fotos_implementacion: deseaActivacion === 'SI' ? fotosImplementacion : {},
        foto_remision: deseaActivacion === 'SI' ? fotoRemision : null,
        productos_seleccionados: productosParaEnviar
      };
      
      const result = await implementacionSubmission.enviarImplementacion(params);
      
      if (result) {
        setShowSuccessModal(true);
        // Limpiar formulario después del éxito
        setFotosImplementacion({});
        setFotoRemision(null);
        setImplementacionSeleccionada(null);
        setDeseaActivacion('');
        setObservaciones('');
      }
    } catch (error) {
      setSubmitError(error.message || 'Error al enviar la implementación');
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className={`kpi-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
      
      {/* Botones Toggle para seleccionar entre Visitas e Implementación */}
      <div className="toggle-buttons-container">
        <button
          type="button"
          className={`toggle-btn ${modoSeleccionado === 'visitas' ? 'active' : ''}`}
          onClick={() => cambiarModo('visitas')}
        >
          Visitas
        </button>
        <button
          type="button"
          className={`toggle-btn ${modoSeleccionado === 'implementacion' ? 'active' : ''}`}
          onClick={() => cambiarModo('implementacion')}
        >
          Implementación
        </button>
      </div>

      {/* Sección de Visitas */}
      {modoSeleccionado === 'visitas' && (
        <div className="visitas-content">
          <div className="visitas-main-container">
            
            {/* Fecha */}
            <div className="pdv-row-visitas">
              <label className="pdv-label" htmlFor="fecha-input-visitas">FECHA</label>
              <div className="relative flex-1">
                <input
                  id="fecha-input-visitas"
                  className="pdv-input-date-visitas ta-center"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            {/* Foto de Seguimiento */}
            <div className="pdv-row-visitas">
              <label className="pdv-label">FOTO SEGUIMIENTO</label>
              <div className="pdv-foto-section">
                <input
                  type="file"
                  //accept="image/*"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  id="foto-seguimiento"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const maxSize = 8 * 1024 * 1024; // 8MB

                    const validFiles = files.filter(file => file.size <= maxSize);

                    if (validFiles.length !== files.length) {
                      alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
                    }

                    // Llamar al handler con el primer archivo válido
                    if (validFiles.length > 0) {
                      setFoto(validFiles[0]);
                    }
                  }}
                />
                <div 
                  className="pdv-foto-adjuntar clickable-area"
                  onClick={() => document.getElementById('foto-seguimiento').click()}
                >
                  <span className="adjuntar-foto-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7V17C2 17.55 2.45 18 3 18H21C21.55 18 22 17.55 22 17V7L12 2Z" fill="#e30613"/>
                      <circle cx="12" cy="12" r="3" fill="#fff"/>
                      <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                    </svg>
                  </span>
                  <span className="adjuntar-foto-placeholder">
                    {foto ? foto.name : "Seleccionar Foto"}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de envío para visitas */}
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
          </div>
        </div>
      )}

      {/* Sección de Implementación */}
      {modoSeleccionado === 'implementacion' && (
        <div className="implementacion-content">

          {loadingGalonaje && (
            <div className="loading-galonaje">
              <div className="spinner-small"></div>
              <span>Consultando galonaje...</span>
            </div>
          )}

          {galonajeData && (
            <div className="galonaje-info-card">
              <div className="galonaje-header">
                <div className="galonaje-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7V17C2 17.55 2.45 18 3 18H21C21.55 18 22 17.55 22 17V7L12 2Z" fill="#e30613"/>
                    <circle cx="12" cy="12" r="3" fill="#fff"/>
                  </svg>
                </div>
                <h4 className="galonaje-title">Información del PDV</h4>
              </div>
              
              <div className="galonaje-content">
                <div className="galonaje-main-stat">
                  <div className="main-stat-value">{galonajeData.totalReal || 0} <span className="unit">galones</span></div>
                </div>
              </div>
            </div>
          )}

          {implementacionesDisponibles.length > 0 && (
            <ImplementacionDropdown
              implementaciones={implementacionesDisponibles}
              implementacionSeleccionada={implementacionSeleccionada}
              onSelect={setImplementacionSeleccionada}
              disabled={false}
            />
          )}

          {implementacionSeleccionada && (
            <div className="implementacion-selected">
              <h4>Implementación Seleccionada: {implementacionSeleccionada.numero}</h4>
              
              {/* Campo de validación de activación */}
              <div className="activacion-field-container">
                <label className="activacion-label">
                  ¿Punto de Venta Autoriza la Implementación?
                </label>
                <select 
                  className="activacion-select"
                  value={deseaActivacion}
                  onChange={(e) => setDeseaActivacion(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="SI">SÍ</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* SI SELECCIONA SÍ: Mostrar registro fotográfico */}
              {deseaActivacion === 'SI' && (
                <RegistroFotograficoImplementacion
                  implementacionSeleccionada={implementacionSeleccionada}
                  fotosImplementacion={fotosImplementacion}
                  setFotosImplementacion={setFotosImplementacion}
                  fotoRemision={fotoRemision}
                  setFotoRemision={setFotoRemision}
                />
              )}

              {/* Campos adicionales (fecha y observaciones) - Aparecen para ambos casos */}
              {deseaActivacion && (
                <>
                  {/* Campo de fecha */}
                  <div className="visitas-fecha-field">
                    <label className="visitas-fecha-label" htmlFor="fecha-input-implementacion">
                      {deseaActivacion === 'SI' ? 'FECHA DE IMPLEMENTACIÓN' : 'FECHA DE VISITA'}
                    </label>
                    <input
                      id="fecha-input-implementacion"
                      className="visitas-fecha-input"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      required
                    />
                  </div>

                  {/* Campo de observaciones */}
                  <div className="observaciones-field-container">
                    <label className="observaciones-label">
                      {deseaActivacion === 'SI' 
                        ? '📝 Observaciones de la Implementación: (OBLIGATORIO)' 
                        : '📝 Observaciones (¿Por qué no Implemento el PDV?): (OBLIGATORIO)'}
                      <span style={{color: 'red'}}> *</span>
                    </label>
                    <textarea
                      className="observaciones-textarea"
                      rows="4"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder={
                        deseaActivacion === 'SI' 
                          ? "OBLIGATORIO: Ingrese comentarios sobre la implementación (mínimo 5 caracteres)..." 
                          : "OBLIGATORIO: Explique los motivos por los cuales no autorizaron esta implementación (mínimo 10 caracteres)..."
                      }
                      maxLength={500}
                      required
                    />
                    <div className={`observaciones-counter ${observaciones.length > 400 ? 'warning' : ''} ${observaciones.length > 480 ? 'danger' : ''}`}>
                      {observaciones.length}/500 caracteres
                    </div>
                  </div>

                  {/* Indicador de estado de validación */}
                  {(() => {
                    const validationState = getValidationState();
                    return (
                      <div className="validation-status" style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        backgroundColor: validationState.isValid ? '#d4edda' : '#f8d7da',
                        color: validationState.isValid ? '#155724' : '#721c24',
                        border: `1px solid ${validationState.isValid ? '#c3e6cb' : '#f5c6cb'}`,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {validationState.isValid ? '✅' : '❌'} {validationState.message}
                      </div>
                    );
                  })()}

                  {/* Botón de envío */}
                  <div className="volume-actions" style={{ paddingBottom: '40px' }}>
                    <button
                      type="button"
                      className="btn-cargar-registro"
                      onClick={handleSubmitImplementacion}
                      disabled={
                        subiendo || 
                        implementacionSubmission.isSubmitting || 
                        !getValidationState().isValid
                      }
                    >
                      {subiendo || implementacionSubmission.isSubmitting 
                        ? 'Enviando...' 
                        : deseaActivacion === 'NO' 
                          ? 'CARGAR OBSERVACIONES' 
                          : 'CARGAR IMPLEMENTACIÓN'
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {implementacionesDisponibles.length === 0 && !loadingGalonaje && galonajeData && (
            <div className="no-implementaciones">
              <p>No hay implementaciones disponibles para este PDV.</p>
              <p>Asegúrate de que el galonaje real sea suficiente para las metas programadas.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de éxito */}
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
            <p style={{color: '#222', margin: '12px 0 24px'}}>El registro ha sido guardado correctamente.</p>
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
