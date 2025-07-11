import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import '../../styles/Asesor/asesor-registro-pdv.css';

// Hooks personalizados
import { usePdvData } from '../../hooks';
import { useProductSelection } from '../../hooks';
import { useKpiManagement } from '../../hooks';
import { useReportSubmission } from '../../hooks';

// Componentes
import KpiSelector from '../../components/Asesor/Pdv/KpiSelector';
import ImplementationSection from '../../components/Asesor/Pdv/ImplementationSection';
import VolumeSection from '../../components/Asesor/Pdv/VolumeSection';
import PdvInfoPopup from '../../components/Asesor/Pdv/PdvInfoPopup';

/**
 * Página principal para el registro de implementación de PDVs (Puntos de Venta) por parte del asesor.
 * Permite seleccionar KPI (Volumen, Precio, Frecuencia), cargar productos, cantidades, precios, fecha y foto.
 */
export default function RegistroImplementacion() {
  const navigate = useNavigate();
  
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();

  // Estado para el pop-up de información de PDVs
  const [showPdvPopup, setShowPdvPopup] = useState(false);

  // Usar user?.id directamente y manejar el caso undefined en los hooks
  const userId = user?.id || null;

  // Hooks personalizados - DEBEN ir antes de cualquier return condicional
  const pdvData = usePdvData(userId);
  const productSelection = useProductSelection();
  const kpiManagement = useKpiManagement(productSelection);
  const reportSubmission = useReportSubmission(userId);

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
  const handleCargarReporte = async (onSuccess = null) => {
    try {
      const reporteFinal = reportSubmission.construirReporteFinal(
        pdvData.codigoPDV, 
        pdvData.correspondeA, 
        kpiManagement.kpiSeleccionado, 
        kpiManagement.fecha, 
        kpiManagement.foto, 
        kpiManagement.acumulados
      );
      
      const resultado = await reportSubmission.enviarReporte(
        pdvData.codigoPDV,
        pdvData.correspondeA,
        kpiManagement.kpiSeleccionado,
        kpiManagement.fecha,
        kpiManagement.foto,
        kpiManagement.acumulados
      );

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

  const PDVS = [
    { codigo: '1001', nombre: 'Tienda El Progreso', direccion: 'Calle 10 #5-20, Bogotá' },
    { codigo: '1002', nombre: 'Minimercado Don Juan', direccion: 'Carrera 8 #12-34, Medellín' },
    { codigo: '1003', nombre: 'Supermercado La Economía', direccion: 'Av. Principal 45-67, Cali' },
    { codigo: '1004', nombre: 'Tienda La Esquina', direccion: 'Cra 3 #45-67, Barranquilla' }
  ];

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
            subiendo={reportSubmission.isSubmitting}
            userId={userId}
            pdvCode={pdvData.codigoPDV}
          />
        )}

        {kpiManagement.kpiSeleccionado === 'Visitas' && (
          <VolumeSection 
            kpiTransition={kpiManagement.kpiTransition}
            productos={productSelection.productos}
            cant14={kpiManagement.cant14}
            setCant14={kpiManagement.setCant14}
            cant1={kpiManagement.cant1}
            setCant1={kpiManagement.setCant1}
            cant55={kpiManagement.cant55}
            setCant55={kpiManagement.setCant55}
            totalCantidad={kpiManagement.totalCantidad}
            handleCargarVolumen={kpiManagement.handleCargarVolumen}
            acumulados={kpiManagement.acumulados}
            handleEliminar={kpiManagement.handleEliminar}
            totalGalones={kpiManagement.totalGalones}
            fecha={kpiManagement.fecha}
            setFecha={kpiManagement.setFecha}
            foto={kpiManagement.foto}
            setFoto={kpiManagement.setFoto}
            enviarReporte={handleCargarReporte}
            subiendo={reportSubmission.isSubmitting}
            productSelection={productSelection}
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