import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import '../../styles/Asesor/asesor-registro-visitas.css';

// Hooks personalizados
import { usePdvData } from '../../hooks';
import { useKpiManagement } from '../../hooks';
import { useVisitaSubmission } from '../../hooks';

// Componentes
import VisitaSection from '../../components/Asesor/Pdv/VisitaSection';
import PdvInfoPopup from '../../components/Asesor/Pdv/PdvInfoPopup';

/**
 * Página específica para el registro de visitas por parte del asesor.
 * Permite registrar visitas de seguimiento a PDVs.
 */
export default function RegistroVisitas() {
  const navigate = useNavigate();
  
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();

  // Estado para el pop-up de información de PDVs
  const [showPdvPopup, setShowPdvPopup] = useState(false);

  // Usar user?.id directamente y manejar el caso undefined en los hooks
  const userId = user?.id || null;

  // Hooks personalizados - DEBEN ir antes de cualquier return condicional
  const pdvData = usePdvData(userId);
  const kpiManagement = useKpiManagement(null); // No necesitamos productSelection para visitas
  const visitaSubmission = useVisitaSubmission(userId);

  // Efectos para manejar cambios - Simplificado para visitas
  useEffect(() => {
    // Para visitas no necesitamos validación especial de KPI
  }, []);

  // Si está cargando la autenticación o no hay usuario aún, mostrar loading
  if (loading || !user) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Función para abrir el pop-up de información de PDVs
  const handleOpenPdvInfo = () => {
    setShowPdvPopup(true);
  };

  // Función para manejar la selección de un PDV desde el pop-up
  const handleSelectPdv = (pdv) => {
    // Usar la nueva función que establece el código y ejecuta la consulta automáticamente
    pdvData.setCodigoYConsultar(pdv.codigo);
  };

  return (
    <DashboardLayout user={user} pageTitle="REGISTRO DE VISITAS">
      <div className="visitas-main-container">
        {/* Spinner de carga */}
        {visitaSubmission.isSubmitting && (
          <div className="visitas-spinner-overlay">
            <div className="visitas-spinner" />
          </div>
        )}

        {/* Fila: CÓDIGO PDV */}
        <div className="visitas-pdv-row">
          <label className="visitas-label" htmlFor="pdv-codigo-input">CÓDIGO PDV</label>
          <input
            id="pdv-codigo-input"
            className="visitas-input-codigo"
            type="text"
            value={pdvData.codigoPDV}
            onChange={e => pdvData.setCodigoPDV(e.target.value)}
            placeholder="Ej: 221"
            autoFocus
          />
        </div>

        {/* Fila: CORRESPONDE A */}
        <div className="visitas-pdv-row-corresponde">
          <label className="visitas-label" htmlFor="pdv-corresponde-input">NOMBRE PDV</label>
          <input
            id="pdv-corresponde-input"
            className={`visitas-input-corresponde${pdvData.correspondeA === 'N/A' ? ' corresponde-na' : ''}`}
            type="text"
            value={pdvData.correspondeA}
            placeholder="Ej: Lubricantes Terpel"
            readOnly
          />
        </div>

        {/* Texto para ayuda - ¿Olvidaste el código del PDV? */}
        <div className="visitas-forgot-code">
          <button 
            className="visitas-forgot-link"
            onClick={handleOpenPdvInfo}
            type="button"
          >
            ¿Olvidaste el código del PDV?
          </button>
        </div>

        {/* Contenido directo de Visitas - Sin selector de KPI */}
        {pdvData.puedeSeleccionarKPI && (
          <div className="visitas-content-section">
            <VisitaSection
              kpiTransition={false}
              fecha={kpiManagement.fecha}
              setFecha={kpiManagement.setFecha}
              foto={kpiManagement.foto}
              setFoto={kpiManagement.setFoto}
              pdvId={pdvData.codigoPDV}
              userId={userId}
              enviarVisita={visitaSubmission.enviarVisita}
              subiendo={visitaSubmission.isSubmitting}
            />
          </div>
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
