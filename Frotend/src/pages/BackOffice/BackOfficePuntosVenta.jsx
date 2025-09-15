import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useBackOfficePageProtection } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { usePuntosVentaBackOffice } from '../../hooks/backoffice';
import PuntosVentaTable from '../../components/BackOffice/PuntosVenta/PuntosVentaTable';
import PdvDetalleModal from '../../components/BackOffice/PuntosVenta/PdvDetalleModal';
import PuntosVentaFilterButtons from '../../components/BackOffice/PuntosVenta/PuntosVentaFilterButtons';
import AuthLoadingScreen from '../../components/shared/AuthLoadingScreen';
import '../../styles/Backoffice/backoffice-visitas.css';
import '../../styles/Backoffice/filter-panel.css';
import '../../styles/Backoffice/backoffice-usuarios-pdvs.css';

export default function BackOfficePuntosVenta() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Proteger la página - solo backoffice puede acceder
  const { user, pageReady, shouldShowContent } = useBackOfficePageProtection();
  
  // Hook para obtener puntos de venta
  const { 
    puntosVenta, 
    loading, 
    error, 
    cargarPuntosVenta, 
    actualizarEstadoPdv 
  } = usePuntosVentaBackOffice();

  // Estados para filtros
  const [puntosVentaFiltrados, setPuntosVentaFiltrados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroAgenteComercial, setFiltroAgenteComercial] = useState('TODOS');
  const [filtroCiudad, setFiltroCiudad] = useState('TODAS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [busquedaNit, setBusquedaNit] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaDireccion, setBusquedaDireccion] = useState('');

  // Filtrar puntos de venta
  useEffect(() => {
    let filtrados = puntosVenta;

    // Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(pdv => {
        if (filtroEstado === 'ACTIVO') {
          return pdv.activo === 1 || pdv.activo === true;
        } else if (filtroEstado === 'INACTIVO') {
          return pdv.activo === 0 || pdv.activo === false;
        }
        return true;
      });
    }

    // Filtro por Agente Comercial
    if (filtroAgenteComercial !== 'TODOS') {
      filtrados = filtrados.filter(pdv => {
        const agenteComercial = pdv.agente_comercial?.trim() || '';
        return agenteComercial === filtroAgenteComercial;
      });
    }

    // Filtro por código
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(pdv =>
        pdv.codigo?.toString().includes(busquedaCodigo.trim())
      );
    }

    // Filtro por NIT
    if (busquedaNit.trim()) {
      filtrados = filtrados.filter(pdv =>
        pdv.nit?.toString().includes(busquedaNit.trim())
      );
    }

    // Filtro por nombre
    if (busquedaNombre.trim()) {
      filtrados = filtrados.filter(pdv =>
        pdv.descripcion?.toLowerCase().includes(busquedaNombre.trim().toLowerCase())
      );
    }

    // Filtro por dirección
    if (busquedaDireccion.trim()) {
      filtrados = filtrados.filter(pdv =>
        pdv.direccion?.toLowerCase().includes(busquedaDireccion.trim().toLowerCase())
      );
    }

    setPuntosVentaFiltrados(filtrados);
  }, [puntosVenta, filtroEstado, filtroAgenteComercial, filtroCiudad, busquedaCodigo, busquedaNit, busquedaNombre, busquedaDireccion]);

  // Calcular estadísticas FILTRADAS
  const calcularEstadisticasFiltradas = () => {
    const pdvsParaEstadisticas = puntosVentaFiltrados;
    
    const totalRegistros = pdvsParaEstadisticas.reduce((sum, pdv) => sum + (pdv.total_registros || 0), 0);
    const totalAprobados = pdvsParaEstadisticas.reduce((sum, pdv) => sum + (pdv.registros_aprobados || 0), 0);
    const totalRechazados = pdvsParaEstadisticas.reduce((sum, pdv) => sum + (pdv.registros_rechazados || 0), 0);
    const totalPendientes = pdvsParaEstadisticas.reduce((sum, pdv) => sum + (pdv.registros_pendientes || 0), 0);
    
    return {
      total: pdvsParaEstadisticas.length,
      activos: pdvsParaEstadisticas.filter(pdv => pdv.activo === 1 || pdv.activo === true).length,
      inactivos: pdvsParaEstadisticas.filter(pdv => pdv.activo === 0 || pdv.activo === false).length,
      conRegistros: pdvsParaEstadisticas.filter(pdv => (pdv.total_registros || 0) > 0).length,
      totalRegistros,
      totalAprobados,
      totalRechazados,
      totalPendientes
    };
  };

  const estadisticas = calcularEstadisticasFiltradas();

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!pageReady || !shouldShowContent) {
    return <AuthLoadingScreen message="Verificando acceso a gestión de puntos de venta..." />;
  }
  
  return (
    <DashboardLayout>
      <div className="backoffice-visitas-container">
        <div className="backoffice-page-header">
          <div>
            <h1 className="backoffice-page-title">BackOffice - Gestión de Puntos de Venta</h1>
            <p className="backoffice-page-subtitle">Administración y supervisión de todos los puntos de venta del sistema</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="backoffice-stats-summary">
          <div className="backoffice-stat-card">
            <div className="backoffice-stat-value">{estadisticas.total}</div>
            <div className="backoffice-stat-label">Total PDVs</div>
          </div>
        </div>

        {/* Filtros */}
        <PuntosVentaFilterButtons
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          filtroAgenteComercial={filtroAgenteComercial}
          setFiltroAgenteComercial={setFiltroAgenteComercial}
          filtroCiudad={filtroCiudad}
          setFiltroCiudad={setFiltroCiudad}
          busquedaCodigo={busquedaCodigo}
          setBusquedaCodigo={setBusquedaCodigo}
          busquedaNit={busquedaNit}
          setBusquedaNit={setBusquedaNit}
          busquedaNombre={busquedaNombre}
          setBusquedaNombre={setBusquedaNombre}
          busquedaDireccion={busquedaDireccion}
          setBusquedaDireccion={setBusquedaDireccion}
          isMobile={isMobile}
        />

        {/* Manejo de estados */}
        {error && (
          <div className="backoffice-error-container">
            <div className="backoffice-error-message">
              Error: {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="backoffice-loading-container">
            <div className="backoffice-loading-message">Cargando puntos de venta...</div>
          </div>
        ) : (
          <PuntosVentaTable
            puntosVenta={puntosVentaFiltrados}
            isMobile={isMobile}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
