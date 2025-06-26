import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMetasDashboard, useKpiCalculations } from '../../hooks/asesor';
import { useResponsive } from '../../hooks/shared';
import { useAsesorRoute } from '../../hooks/auth';
import KpiCard from '../../components/Asesor/Metas/KpiCard';
import MetasChart from '../../components/Asesor/Metas/MetasChart';
import KpisContainer from '../../components/Asesor/Metas/KpisContainer';
import PdvModal from '../../components/Asesor/Metas/PdvModal';
import KpiModal from '../../components/Asesor/Metas/KpiModal';
import '../../styles/Asesor/metas-organizado.css';

export default function MetasPage() {
  const location = useLocation();
  
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  
  // Obtener usuario de la navegación o localStorage como fallback
  const fallbackUser = useMemo(() => {
    let u = location.state?.user;
    if (!u) {
      try {
        u = JSON.parse(localStorage.getItem('user'));
      } catch {}
    }
    return u;
  }, [location.state?.user]);

  // Usar el usuario del hook de auth o el fallback
  const currentUser = user || fallbackUser;

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Redirect si no hay usuario después de la verificación
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Hooks personalizados
  const {
    dashboardData,
    loading,
    errors,
    kpiLabels,
    puntosPorKpiActualizados,
    filters,
    setFilters,
    modalOpen,
    setModalOpen,
    kpiModalOpen,
    setKpiModalOpen,
    selectedKpi,
    kpiPdvData,
    loadingKpiData,
    openKpiModal
  } = useMetasDashboard(currentUser);

  const { isMobile } = useResponsive();

  const {
    pdvsFiltrados,
    kpiDashboardFiltrado,
    puntosPorKPIFinal
  } = useKpiCalculations(dashboardData, filters, kpiLabels, puntosPorKpiActualizados);

  return (
    <DashboardLayout user={currentUser}>
      {/* KPI Principal - Conteo de PDVs */}
      <KpiCard
        title="PUNTOS DE VENTA"
        value={kpiDashboardFiltrado.totalPDVs}
        isLoading={loading}
        error={errors.kpiDashboard}
        isMobile={isMobile}
      />

      {/* Gráfico de Metas vs Real */}
      <MetasChart
        pdvsFiltrados={pdvsFiltrados}
        error={errors.pdvMetas}
        isMobile={isMobile}
        onOpenModal={() => setModalOpen(true)}
      />

      {/* Contenedor de KPIs */}
      <KpisContainer
        kpiPuntos={puntosPorKPIFinal}
        kpiLabels={kpiLabels}
        error={errors.kpiPuntos}
        isMobile={isMobile}
        onKpiClick={openKpiModal}
      />

      {/* Modales */}
      {modalOpen && (
        <PdvModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          pdvData={pdvsFiltrados}
          filters={filters}
          setFilters={setFilters}
          isMobile={isMobile}
        />
      )}

      {kpiModalOpen && (
        <KpiModal
          isOpen={kpiModalOpen}
          onClose={() => setKpiModalOpen(false)}
          selectedKpi={selectedKpi}
          kpiPdvData={kpiPdvData}
          isLoading={loadingKpiData}
          isMobile={isMobile}
        />
      )}
    </DashboardLayout>
  );
}
