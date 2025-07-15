import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import '../../styles/Asesor/asesor-registro-pdv.css';

// Hooks personalizados
import { usePdvData } from '../../hooks';
import { useProductSelection } from '../../hooks';
import { useKpiManagement } from '../../hooks';
import { useReportSubmission, useVisitaSubmission } from '../../hooks';

// Componentes
import KpiSelector from '../../components/Asesor/Pdv/KpiSelector';
import ImplementationSection from '../../components/Asesor/Pdv/ImplementationSection';
import { createPortal } from 'react-dom';
import VisitaSection from '../../components/Asesor/Pdv/VisitaSection';
import PdvInfoPopup from '../../components/Asesor/Pdv/PdvInfoPopup';

/**
 * Página principal para el registro de implementación de PDVs (Puntos de Venta) por parte del asesor.
 * Permite seleccionar KPI (Volumen, Precio, Frecuencia), cargar productos, cantidades, precios, fecha y foto.
 */
export default function RegistroImplementacion() {
  const navigate = useNavigate();
  
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();

    // Estado para el modal de éxito global
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estado para el pop-up de información de PDVs
  const [showPdvPopup, setShowPdvPopup] = useState(false);

  // Usar user?.id directamente y manejar el caso undefined en los hooks
  const userId = user?.id || null;

  // Hooks personalizados - DEBEN ir antes de cualquier return condicional
  const pdvData = usePdvData(userId);
  const productSelection = useProductSelection();
  const kpiManagement = useKpiManagement(productSelection);
  const reportSubmission = useReportSubmission(userId);
  const visitaSubmission = useVisitaSubmission(userId);

  // Efectos para manejar cambios
  useEffect(() => {
    if (pdvData.puedeSeleccionarKPI !== undefined) {
      kpiManagement.resetKpiSiInvalido(pdvData.puedeSeleccionarKPI);
    }
  }, [pdvData.correspondeA, pdvData.codigoPDV, pdvData.puedeSeleccionarKPI]);

  // Efecto para recargar referencias cuando cambie el KPI
  useEffect(() => {
    if (kpiManagement.kpiSeleccionado && productSelection.recargarReferenciasActuales) {
      productSelection.recargarReferenciasActuales();
    }
  }, [kpiManagement.kpiSeleccionado]);

  // Si está cargando la autenticación o no hay usuario aún, mostrar loading
  if (loading || !user) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Función para manejar el envío del reporte
  // Recibe el objeto de datos y lo pasa tal cual al hook
  const handleCargarReporte = async (params, onSuccess = null) => {
    try {
      const resultado = await reportSubmission.enviarReporte(params);
      // Si hay un callback de éxito y el envío fue exitoso, ejecutarlo
      if (resultado && onSuccess) {
        onSuccess();
      }
      return resultado;
    } catch (error) {
      console.error('Error en handleCargarReporte:', error);
      throw error;
    }
  };

  // Función para abrir el pop-up de información de PDVs
  const handleOpenPdvInfo = () => {
    setShowPdvPopup(true);
  };

  // Función para manejar la selección de un PDV desde el pop-up
  const handleSelectPdv = (pdv) => {
    pdvData.setCodigoPDV(pdv.codigo);
    // Al seleccionar un PDV, automáticamente se carga la información
    // gracias al efecto del hook usePdvData
  };



  return (
    <DashboardLayout user={user} pageTitle="REGISTRO IMPLEMENTACIÓN">
      <div className="pdv-main-box">
        {/* Spinner de carga */}
        {reportSubmission.isSubmitting && (
          <div className="pdv-spinner-overlay">
            <div className="spinner-red small" />
          </div>
        )}

        {/* Fila: CÓDIGO PDV */}
        <div className="pdv-row">
          <label className="pdv-label" htmlFor="pdv-codigo-input">CÓDIGO PDV</label>
          <input
            id="pdv-codigo-input"
            className="pdv-input-codigo"
            type="text"
            value={pdvData.codigoPDV}
            onChange={e => pdvData.setCodigoPDV(e.target.value)}
            placeholder="Ej: 221"
            autoFocus
          />
        </div>

        {/* Fila: CORRESPONDE A */}
        <div className="pdv-row">
          <label className="pdv-label" htmlFor="pdv-corresponde-input">NOMBRE PDV</label>
          <input
            id="pdv-corresponde-input"
            className={`pdv-input-corresponde${pdvData.correspondeA === 'N/A' ? ' corresponde-na' : ''}`}
            type="text"
            value={pdvData.correspondeA}
            placeholder="Ej: Lubricantes Terpel"
            readOnly
          />
        </div>

        {/* Texto para ayuda - ¿Olvidaste el código del PDV? */}
        <div className="pdv-forgot-code">
          <button 
            className="pdv-forgot-link"
            onClick={handleOpenPdvInfo}
            type="button"
          >
            ¿Olvidaste el código del PDV?
          </button>
        </div>

        {/* Selector de KPI */}
        <KpiSelector 
          kpis={kpiManagement.kpis}
          kpiSeleccionado={kpiManagement.kpiSeleccionado}
          puedeSeleccionarKPI={pdvData.puedeSeleccionarKPI}
          handleSeleccionarKPI={kpiManagement.handleSeleccionarKPI}
        />

        {/* Secciones por KPI */}
        {kpiManagement.kpiSeleccionado === 'Implementación' && (
          <ImplementationSection 
            kpiTransition={kpiManagement.kpiTransition}
            fecha={kpiManagement.fecha}
            setFecha={kpiManagement.setFecha}
            foto={kpiManagement.foto}
            setFoto={kpiManagement.setFoto}
            enviarReporte={handleCargarReporte}
            isSubmitting={reportSubmission.isSubmitting}
            userId={userId}
            pdvCode={pdvData.codigoPDV}
            acumulados={kpiManagement.acumulados}
            subirFotoEvidencia={reportSubmission.subirFotoEvidencia}
            onSuccess={() => setShowSuccessModal(true)}
          />
        )}
      {/* Modal de éxito global para implementación */}
      {showSuccessModal && createPortal(
        <div className="modal-overlay" style={{background: 'rgba(0,0,0,0.25)', zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="modal-box success-modal" style={{background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 24, textAlign: 'center', maxWidth: 400, width: '90vw'}}>
            <span className="success-icon" style={{fontSize: 56, color: '#27ae60', marginBottom: 12, display: 'inline-block'}}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="28" fill="#27ae60"/>
                <path d="M16 29.5L24.5 38L40 22.5" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h2 style={{color: '#27ae60', margin: 0, fontWeight: 700}}>¡Registro exitoso!</h2>
            <p style={{color: '#222', margin: '12px 0 24px'}}>El registro de Implementación ha sido guardado correctamente.</p>
            <button className="btn-confirm" onClick={() => { setShowSuccessModal(false); window.location.reload(); }} style={{marginTop: 0, borderRadius: 8, background: '#27ae60', color: '#fff', border: 'none', padding: '10px 28px', fontWeight: 600, fontSize: 16}}>Aceptar</button>
          </div>
        </div>,
        document.body
      )}

        {kpiManagement.kpiSeleccionado === 'Visitas' && (
          <VisitaSection
            kpiTransition={kpiManagement.kpiTransition}
            fecha={kpiManagement.fecha}
            setFecha={kpiManagement.setFecha}
            foto={kpiManagement.foto}
            setFoto={kpiManagement.setFoto}
            pdvId={pdvData.codigoPDV}
            userId={userId}
            enviarVisita={visitaSubmission.enviarVisita}
            subiendo={visitaSubmission.isSubmitting}
          />
        )}

      </div>

      {/* Pop-up de información de PDVs */}
      <PdvInfoPopup 
        isOpen={showPdvPopup}
        onClose={() => setShowPdvPopup(false)}
        userId={userId}
        onSelectPdv={handleSelectPdv}
      />
    </DashboardLayout>
  );
}