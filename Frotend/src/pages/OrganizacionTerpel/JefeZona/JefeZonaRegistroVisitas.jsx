import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import ModalPdvsDisponibles from '../../../components/JefeZona/ModalPdvsDisponibles';
import { useJefeZonaRoute } from '../../../hooks/auth';
import { 
  useJefeZona, 
  usePdvJefeZona, 
  useRegistroVisitaJefeZona 
} from '../../../hooks/jefe-zona/useJefeZona';
import '../../../styles/JefeZona/jefe-zona-registro-visitas.css';

/**
 * Página para registro de visitas por parte del Jefe de Zona
 * Similar a la funcionalidad del asesor pero para rol 5 con verificación de Jefe de Zona
 */
export default function JefeZonaRegistroVisitas() {
  const navigate = useNavigate();
  
  // Proteger la ruta - solo Jefes de Zona pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useJefeZonaRoute();

  // Estados locales para el formulario
  const [fecha, setFecha] = useState('');
  const [fotoSeguimiento, setFotoSeguimiento] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [showCodigoInput, setShowCodigoInput] = useState(false);
  const [showModalPdvs, setShowModalPdvs] = useState(false);
  const [pdvSeleccionadoDesdeModal, setPdvSeleccionadoDesdeModal] = useState(false);

  // Hooks personalizados
  const { esJefeZona, verificarJefeZona } = useJefeZona();
  const { 
    codigoPDV, 
    pdvInfo, 
    setCodigoYBuscar,
    loading: pdvLoading,
    error: pdvError 
  } = usePdvJefeZona();
  
  const { 
    registrarVisita, 
    loading: submitLoading, 
    error: submitError, 
    success: submitSuccess,
    limpiarEstados 
  } = useRegistroVisitaJefeZona();

  // Efectos
  useEffect(() => {
    if (user?.id) {
      verificarJefeZona();
    }
  }, [user]);

  useEffect(() => {
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    setFecha(today);
  }, []);

  useEffect(() => {
    if (submitSuccess) {
      // Limpiar formulario después de éxito
      setCodigoYBuscar('');
      setFecha(new Date().toISOString().split('T')[0]);
      setFotoSeguimiento(null);
      setPreviewFoto(null);
      setShowCodigoInput(false);
      setShowModalPdvs(false);
      
      // Limpiar estados después de 3 segundos
      setTimeout(() => {
        limpiarEstados();
      }, 3000);
    }
  }, [submitSuccess]);

  // Efecto para cerrar el input cuando se encuentra un PDV válido
  useEffect(() => {
    if (pdvInfo && codigoPDV) {
      setShowCodigoInput(false);
    }
  }, [pdvInfo, codigoPDV]);

  // Manejar selección de PDV desde el modal
  const handleSelectPdv = async (pdv) => {
    try {
      // Cerrar el modal inmediatamente
      setShowModalPdvs(false);
      setShowCodigoInput(false);
      
      // Marcar que fue seleccionado desde el modal
      setPdvSeleccionadoDesdeModal(true);
      
      // Establecer el código del PDV seleccionado y validar automáticamente
      // El hook usePdvJefeZona ya hace la validación contra el endpoint PDV-JEFESDEZONA
      setCodigoYBuscar(pdv.codigo);
      
      console.log('PDV seleccionado desde modal:', pdv);
      
      // Limpiar la marca después de 3 segundos
      setTimeout(() => {
        setPdvSeleccionadoDesdeModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error al seleccionar PDV:', error);
      alert('Error al seleccionar el PDV. Por favor, inténtelo de nuevo.');
    }
  };

  // Manejar cambio de archivo de foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoSeguimiento(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewFoto(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos antes de proceder
    if (!pdvInfo) {
      alert('Debe ingresar un código de PDV válido');
      // Enfocar en el campo PDV
      document.getElementById('pdv-codigo-input')?.focus();
      return;
    }
    
    if (!fecha) {
      alert('Debe seleccionar una fecha');
      // Enfocar en el campo fecha
      document.getElementById('fecha-input')?.focus();
      return;
    }
    
    if (!fotoSeguimiento) {
      alert('Debe seleccionar una foto de seguimiento');
      // Enfocar en el campo foto
      document.getElementById('foto-input')?.focus();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('codigo_pdv', codigoPDV);
      formData.append('fecha_registro', fecha);
      formData.append('foto_seguimiento', fotoSeguimiento);

      await registrarVisita(formData);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error al procesar el formulario. Por favor, inténtelo de nuevo.');
    }
  };

  // Si está cargando la autenticación o no hay usuario aún, mostrar loading
  if (loading || !user) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Si no es Jefe de Zona, mostrar mensaje de acceso denegado
  if (esJefeZona === false) {
    return (
      <DashboardLayout user={user} pageTitle="ACCESO DENEGADO">
        <div className="jefe-zona-access-denied">
          <h2>Acceso Denegado</h2>
          <p>Esta funcionalidad está disponible únicamente para usuarios con rol de Jefe de Zona.</p>
          <button onClick={() => navigate('/organizacion-terpel/home')} className="btn-volver">
            Volver al Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} pageTitle="REGISTRO DE VISITAS - JEFE DE ZONA">
      <div className="jefe-zona-main-container">
        {/* Spinner de carga */}
        {submitLoading && (
          <div className="jefe-zona-spinner-overlay">
            <div className="jefe-zona-spinner" />
          </div>
        )}

        {/* Mensajes de estado */}
        {submitSuccess && (
          <div className="jefe-zona-success-message">
            <h3>✅ Visita registrada exitosamente</h3>
            <p>La visita ha sido registrada correctamente en el sistema.</p>
          </div>
        )}

        {submitError && (
          <div className="jefe-zona-error-message">
            <h3>❌ Error al registrar visita</h3>
            <p>{submitError}</p>
          </div>
        )}

        {/* Mensaje de PDV seleccionado desde modal */}
        {/* {pdvSeleccionadoDesdeModal && pdvInfo && (
          <div className="jefe-zona-pdv-selected-message">
            <h3>✅ PDV Seleccionado</h3>
            <p>Se ha seleccionado el PDV <strong>{pdvInfo.codigo} - {pdvInfo.nombre}</strong></p>
          </div>
        )} */}

        <div className="jefe-zona-form-container">
          {/* Header con código PDV destacado */}
          <div className="jefe-zona-header">
            <div className="codigo-pdv-section">
              <label className="codigo-pdv-label">CÓDIGO PDV</label>
              <div className="codigo-pdv-display">
                {codigoPDV || '---'}
              </div>
            </div>
          </div>

          {/* Sección de información del PDV */}
          <div className="pdv-info-section">
            <div className="pdv-nombre-section">
              <label className="pdv-nombre-label">NOMBRE PDV</label>
              <div className="pdv-nombre-display">
                {pdvInfo ? pdvInfo.nombre : 'N/A'}
              </div>
            </div>
            
            {/* Enlace para buscar PDV - abre modal */}
            <div className="codigo-actions">
              <button 
                type="button" 
                className="olvidar-codigo-btn"
                onClick={() => setShowModalPdvs(true)}
              >
                ¿Olvidaste el código del PDV?
              </button>
            </div>
            
            {/* Input para el código PDV - se muestra cuando el usuario hace click */}
            {showCodigoInput && (
              <div className="codigo-input-container">
                <input
                  id="pdv-codigo-input"
                  type="text"
                  value={codigoPDV}
                  onChange={e => setCodigoYBuscar(e.target.value)}
                  placeholder="Ingrese código del PDV"
                  className="codigo-pdv-input"
                  onBlur={() => {
                    if (!codigoPDV) {
                      setShowCodigoInput(false);
                    }
                  }}
                />
                {pdvLoading && <div className="jefe-zona-loading-pdv">Buscando PDV...</div>}
              </div>
            )}
          </div>

          {/* Información adicional del PDV */}
          {pdvInfo && (
            <div className="jefe-zona-pdv-info">
              <p><strong>Dirección:</strong> {pdvInfo.direccion}</p>
              <p><strong>Ciudad:</strong> {pdvInfo.ciudad}</p>
              <p><strong>Empresa:</strong> {pdvInfo.agente_nombre}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="jefe-zona-form">
            {/* Fila: FECHA */}
            <div className="jefe-zona-form-row">
              <label className="jefe-zona-label" htmlFor="fecha-input">
                FECHA <span className="required">*</span>
              </label>
              <input
                id="fecha-input"
                name="fecha_registro"
                className="jefe-zona-input-fecha"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
              />
            </div>

            {/* Fila: FOTO SEGUIMIENTO */}
            <div className="jefe-zona-form-row">
              <label className="jefe-zona-label" htmlFor="foto-input">
                FOTO SEGUIMIENTO <span className="required">*</span>
              </label>
              <div className="foto-upload-container">
                <input
                  id="foto-input"
                  name="foto_seguimiento"
                  className="jefe-zona-input-foto"
                  type="file"
                  //accept="image/*"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const maxSize = 8 * 1024 * 1024; // 8MB

                    const validFiles = files.filter(file => file.size <= maxSize);

                    if (validFiles.length !== files.length) {
                      alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
                    }

                    // Llamar al handler con el primer archivo válido (ya que es input single)
                    if (validFiles.length > 0) {
                      const fakeEvent = { target: { files: validFiles } };
                      handleFotoChange(fakeEvent);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label htmlFor="foto-input" className="foto-upload-btn">
                  📷 Seleccionar Foto
                </label>
                {!fotoSeguimiento && (
                  <small className="field-error">
                    La foto de seguimiento es obligatoria
                  </small>
                )}
              </div>
            </div>

            {/* Preview de la foto */}
            {previewFoto && (
              <div className="jefe-zona-foto-preview">
                <img src={previewFoto} alt="Preview" className="foto-preview-img" />
              </div>
            )}

            {/* Botón de envío */}
            <div className="jefe-zona-form-row">
              <button 
                type="submit" 
                className="jefe-zona-btn-submit"
                disabled={submitLoading || !pdvInfo || !fecha || !fotoSeguimiento}
              >
                {submitLoading ? 'REGISTRANDO...' : 'CARGAR REGISTRO'}
              </button>
            </div>
          </form>
        </div>

        {/* Modal para seleccionar PDV */}
        <ModalPdvsDisponibles
          isOpen={showModalPdvs}
          onClose={() => setShowModalPdvs(false)}
          onSelectPdv={handleSelectPdv}
        />
      </div>
    </DashboardLayout>
  );
}
