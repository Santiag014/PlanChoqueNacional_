import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import '../../styles/Asesor/pdv.css';

// Hooks personalizados
import { usePdvData } from '../../hooks';
import { useProductSelection } from '../../hooks';
import { useKpiManagement } from '../../hooks';
import { useReportSubmission } from '../../hooks';

// Componentes
import KpiSelector from '../../components/Asesor/Pdv/KpiSelector';
import VolumeSection from '../../components/Asesor/Pdv/VolumeSection';
import PriceSection from '../../components/Asesor/Pdv/PriceSection';
import FrequencySection from '../../components/Asesor/Pdv/FrequencySection';

/**
 * Página principal para el registro de información de PDVs (Puntos de Venta) por parte del asesor.
 * Permite seleccionar KPI (Volumen, Precio, Frecuencia), cargar productos, cantidades, precios, fecha y foto.
 */
export default function Pdvs() {
  const navigate = useNavigate();

  // Obtener usuario logueado de localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Redirigir si no hay usuario logueado
  useEffect(() => {
    if (!userId) {
      navigate('/');
    }
  }, [userId, navigate]);

  // Hooks personalizados
  const pdvData = usePdvData(userId);
  const productSelection = useProductSelection();
  const kpiManagement = useKpiManagement(productSelection);
  const reportSubmission = useReportSubmission(userId);

  // Efectos para manejar cambios
  useEffect(() => {
    kpiManagement.resetKpiSiInvalido(pdvData.puedeSeleccionarKPI);
  }, [pdvData.correspondeA, pdvData.codigoPDV]);

  // Efecto para recargar referencias cuando cambie el KPI
  useEffect(() => {
    if (kpiManagement.kpiSeleccionado && productSelection.recargarReferenciasActuales) {
      productSelection.recargarReferenciasActuales();
    }
  }, [kpiManagement.kpiSeleccionado]);

  // Función para manejar el envío del reporte
  const handleCargarReporte = () => {
    const reporteFinal = reportSubmission.construirReporteFinal(
      pdvData.codigoPDV, 
      pdvData.correspondeA, 
      kpiManagement.kpiSeleccionado, 
      kpiManagement.fecha, 
      kpiManagement.foto, 
      kpiManagement.acumulados
    );
    
    reportSubmission.enviarReporte(
      pdvData.codigoPDV,
      pdvData.correspondeA,
      kpiManagement.kpiSeleccionado,
      kpiManagement.fecha,
      kpiManagement.foto,
      kpiManagement.acumulados
    );
  };

  return (
    <DashboardLayout>
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
          <label className="pdv-label" htmlFor="pdv-corresponde-input">CORRESPONDE A</label>
          <input
            id="pdv-corresponde-input"
            className={`pdv-input-corresponde${pdvData.correspondeA === 'N/A' ? ' corresponde-na' : ''}`}
            type="text"
            value={pdvData.correspondeA}
            placeholder="Ej: Lubricantes Terpel"
            readOnly
          />
        </div>

        {/* Selector de KPI */}
        <KpiSelector 
          kpis={kpiManagement.kpis}
          kpiSeleccionado={kpiManagement.kpiSeleccionado}
          puedeSeleccionarKPI={pdvData.puedeSeleccionarKPI}
          handleSeleccionarKPI={kpiManagement.handleSeleccionarKPI}
        />

        {/* Secciones por KPI */}
        {kpiManagement.kpiSeleccionado === 'Volumen' && (
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

        {kpiManagement.kpiSeleccionado === 'Precio' && (
          <PriceSection 
            kpiTransition={kpiManagement.kpiTransition}
            productos={productSelection.productos}
            precioSeleccion={kpiManagement.precioSeleccion}
            setPrecioSeleccion={kpiManagement.setPrecioSeleccion}
            precioValor={kpiManagement.precioValor}
            formatCOP={kpiManagement.formatCOP}
            handlePrecioInput={kpiManagement.handlePrecioInput}
            handleCargarPrecio={kpiManagement.handleCargarPrecio}
            acumulados={kpiManagement.acumulados}
            handleEliminar={kpiManagement.handleEliminar}
            fecha={kpiManagement.fecha}
            setFecha={kpiManagement.setFecha}
            foto={kpiManagement.foto}
            setFoto={kpiManagement.setFoto}
            enviarReporte={handleCargarReporte}
            subiendo={reportSubmission.isSubmitting}
            productSelection={productSelection}
          />
        )}

        {kpiManagement.kpiSeleccionado === 'Frecuencia' && (
          <FrequencySection 
            kpiTransition={kpiManagement.kpiTransition}
            fecha={kpiManagement.fecha}
            setFecha={kpiManagement.setFecha}
            foto={kpiManagement.foto}
            setFoto={kpiManagement.setFoto}
            enviarReporte={handleCargarReporte}
            subiendo={reportSubmission.isSubmitting}
          />
        )}

      </div>
    </DashboardLayout>
  );
}