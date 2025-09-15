import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useMercadeoPageProtection } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useHistorialRegistrosMercadeo } from '../../hooks/mercadeo';
import RegistrosTable from '../../components/mercadeo/HistorialRegistros/RegistrosTable';
import RegistroDetalleModal from '../../components/mercadeo/HistorialRegistros/RegistroDetalleModal';
import FilterButtons from '../../components/mercadeo/HistorialRegistros/FilterButtons';
import AuthLoadingScreen from '../../components/shared/AuthLoadingScreen';
import '../../styles/Mercadeo/mercadeo-visitas.css';

export default function MercadeoVisitas() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Proteger la página - solo mercadeo puede acceder
  const { user, pageReady, shouldShowContent } = useMercadeoPageProtection();
  
  // Hook para obtener registros
  const { 
    registros, 
    loading, 
    error, 
    cargarRegistros, 
    actualizarEstadoRegistro 
  } = useHistorialRegistrosMercadeo();

  // Estados para filtros
  const [filtroKPI, setFiltroKPI] = useState('TODOS');
  const [filtroActividad, setFiltroActividad] = useState('TODAS');
  const [filtroEstadoBackoffice, setFiltroEstadoBackoffice] = useState('TODOS');
  const [filtroEstadoAgente, setFiltroEstadoAgente] = useState('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [busquedaCedula, setBusquedaCedula] = useState('');
  const [busquedaId, setBusquedaId] = useState('');
  const [fechaActividad, setFechaActividad] = useState('');
  const [fechaCreacion, setFechaCreacion] = useState('');
  
  // Estados para modal
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingAccion, setLoadingAccion] = useState(false);

  // Recargar registros cuando cambien los filtros
  useEffect(() => {
    const filtros = {
      busquedaCodigo,
      busquedaCedula,
      busquedaId,
      filtroKPI,
      filtroActividad,
      filtroEstadoBackoffice,
      filtroEstadoAgente,
      fechaActividad,
      fechaCreacion
    };
    cargarRegistros(filtros);
  }, [filtroKPI, filtroActividad, filtroEstadoBackoffice, filtroEstadoAgente, busquedaCodigo, busquedaCedula, busquedaId, fechaActividad, fechaCreacion]);

  // Manejar ver detalle
  const handleVerDetalle = (registro) => {
    setRegistroSeleccionado(registro);
    setModalOpen(true);
  };

  // Manejar cerrar modal
  const handleCerrarModal = () => {
    setModalOpen(false);
    setRegistroSeleccionado(null);
  };

  // Manejar aprobar registro
  const handleAprobar = async (registroId, comentario) => {
    setLoadingAccion(true);
    try {
      const resultado = await actualizarEstadoRegistro(registroId, 2, comentario); // 2 = aprobado
      if (resultado.success) {
        //console.log('Registro aprobado exitosamente');
        // Recargar registros para mostrar cambios
        cargarRegistros();
      } else {
        //console.error('Error al aprobar registro:', resultado.message);
      }
    } catch (error) {
      //console.error('Error al aprobar registro:', error);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Manejar rechazar registro
  const handleRechazar = async (registroId, comentario) => {
    setLoadingAccion(true);
    try {
      const resultado = await actualizarEstadoRegistro(registroId, 3, comentario); // 3 = rechazado
      if (resultado.success) {
        //console.log('Registro rechazado exitosamente');
        // Recargar registros para mostrar cambios
        cargarRegistros();
      } else {
        //console.error('Error al rechazar registro:', resultado.message);
      }
    } catch (error) {
      //console.error('Error al rechazar registro:', error);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Calcular estadísticas FILTRADAS - ahora los registros ya vienen filtrados del backend
  // IMPORTANTE: Los KPIs se basan únicamente en la columna ESTADO_AGENTE
  const calcularEstadisticasFiltradas = () => {
    // Usar registros ya que ahora vienen filtrados del backend
    const registrosParaEstadisticas = registros;
    
    return {
      total: registrosParaEstadisticas.length, // Total de registros filtrados
      aprobados: registrosParaEstadisticas.filter(r => {
        const estadoAgente = r.estado_agente?.toLowerCase() || '';
        return estadoAgente.includes('aprobado') || estadoAgente.includes('approved') || estadoAgente.includes('validado') || estadoAgente.includes('aceptado');
      }).length,
      rechazados: registrosParaEstadisticas.filter(r => {
        const estadoAgente = r.estado_agente?.toLowerCase() || '';
        return estadoAgente.includes('rechazado') || estadoAgente.includes('rejected');
      }).length,
      pendientes: registrosParaEstadisticas.filter(r => {
        const estadoAgente = r.estado_agente?.toLowerCase() || '';
        return estadoAgente.includes('pendiente') || estadoAgente.includes('pending') || estadoAgente.includes('revisión') || estadoAgente.includes('revision') || !r.estado_agente;
      }).length
    };
  };

  const estadisticas = calcularEstadisticasFiltradas();

  // Debug: Mostrar los estados reales para entender el problema
  // console.log('Estados agente únicos en registros:', [...new Set(registros.map(r => r.estado_agente))]);
  // console.log('Estados backoffice únicos en registros:', [...new Set(registros.map(r => r.estado_backoffice))]);
  // console.log('Estadísticas calculadas basadas en ESTADO_AGENTE:', estadisticas);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!pageReady || !shouldShowContent) {
    return <AuthLoadingScreen message="Verificando acceso a gestión de registros..." />;
  }
  
  return (
    <DashboardLayout>
      <div className="mercadeo-visitas-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestión de Registros</h1>
            <p className="page-subtitle">Supervisión de los registros de implementación</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-value">{estadisticas.total}</div>
            <div className="stat-label">Total Registros</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.aprobados}</div>
            <div className="stat-label">Aprobados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.rechazados}</div>
            <div className="stat-label">Rechazados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.pendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        {/* Filtros */}
        <FilterButtons
          filtroKPI={filtroKPI}
          setFiltroKPI={setFiltroKPI}
          filtroActividad={filtroActividad}
          setFiltroActividad={setFiltroActividad}
          filtroEstadoBackoffice={filtroEstadoBackoffice}
          setFiltroEstadoBackoffice={setFiltroEstadoBackoffice}
          filtroEstadoAgente={filtroEstadoAgente}
          setFiltroEstadoAgente={setFiltroEstadoAgente}
          busquedaCodigo={busquedaCodigo}
          setBusquedaCodigo={setBusquedaCodigo}
          busquedaCedula={busquedaCedula}
          setBusquedaCedula={setBusquedaCedula}
          busquedaId={busquedaId}
          setBusquedaId={setBusquedaId}
          fechaActividad={fechaActividad}
          setFechaActividad={setFechaActividad}
          fechaCreacion={fechaCreacion}
          setFechaCreacion={setFechaCreacion}
          isMobile={isMobile}
        />

        {/* Manejo de estados */}
        {error && (
          <div className="error-container">
            <div className="error-message">
              Error: {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <span>Cargando registros...</span>
          </div>
        ) : (
          <RegistrosTable
            registros={registros}
            onVerDetalle={handleVerDetalle}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
            isMobile={isMobile}
          />
        )}

        {/* Modal de detalles */}
        <RegistroDetalleModal
          isOpen={modalOpen}
          onClose={handleCerrarModal}
          registro={registroSeleccionado}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
        />
      </div>
    </DashboardLayout>
  );
}
