import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useMercadeoRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useHistorialRegistrosMercadeo } from '../../hooks/mercadeo';
import RegistrosTable from '../../components/Mercadeo/HistorialRegistros/RegistrosTable';
import RegistroDetalleModal from '../../components/Mercadeo/HistorialRegistros/RegistroDetalleModal';
import FilterButtons from '../../components/Mercadeo/HistorialRegistros/FilterButtons';
import '../../styles/Mercadeo/mercadeo-visitas.css';

export default function MercadeoVisitas() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useMercadeoRoute();
  
  // Hook para obtener registros
  const { 
    registros, 
    loading, 
    error, 
    cargarRegistros, 
    actualizarEstadoRegistro 
  } = useHistorialRegistrosMercadeo();

  // Estados para filtros
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [filtroKPI, setFiltroKPI] = useState('TODOS');
  const [filtroActividad, setFiltroActividad] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [busquedaAsesor, setBusquedaAsesor] = useState('');
  const [busquedaCedula, setBusquedaCedula] = useState('');
  
  // Estados para modal
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingAccion, setLoadingAccion] = useState(false);

  // Filtrar registros
  useEffect(() => {
    let filtrados = registros;

    // Filtro por KPI
    if (filtroKPI !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const tipoKpi = registro.tipo_kpi?.toUpperCase();
        
        // Para PRECIO_VOLUMEN, mostrar tanto en filtro PRECIO como VOLUMEN
        if (tipoKpi === 'VOLUMEN / PRECIO') {
          return filtroKPI === 'PRECIO' || filtroKPI === 'VOLUMEN' || filtroKPI === 'PRECIO_VOLUMEN';
        }
        
        return tipoKpi === filtroKPI;
      });
    }

    // Filtro por Actividad
    if (filtroActividad !== 'TODAS') {
      filtrados = filtrados.filter(registro => {
        const tipoAccion = registro.tipo_accion?.toUpperCase();
        return tipoAccion === filtroActividad.toUpperCase();
      });
    }

    // Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const estadoRegistro = registro.estado?.toLowerCase?.().trim() || '';
        
        const esValido = (estado) => {
          switch(filtroEstado) {
            case 'VALIDADO':
              return estado.includes('validado') || estado.includes('aprobado') || estado.includes('approved') || estado.includes('aceptado');
            case 'PENDIENTE':
              return estado.includes('pendiente') || estado.includes('pending') || estado.includes('revision') || estado.includes('revisión') || estado === '';
            case 'RECHAZADO':
              return estado.includes('rechazado') || estado.includes('rejected');
            default:
              return estado === filtroEstado.toLowerCase();
          }
        };
        
        return esValido(estadoRegistro);
      });
    }

    // Filtro por código PDV
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.codigo?.toString().includes(busquedaCodigo.trim())
      );
    }

    // Filtro por asesor
    if (busquedaAsesor.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.name?.toLowerCase().includes(busquedaAsesor.trim().toLowerCase())
      );
    }

    // Filtro por cédula del asesor
    if (busquedaCedula.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.cedula?.toString().includes(busquedaCedula.trim())
      );
    }

    setRegistrosFiltrados(filtrados);
  }, [registros, filtroKPI, filtroActividad, filtroEstado, busquedaCodigo, busquedaAsesor, busquedaCedula]);

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
        console.log('Registro aprobado exitosamente');
        // Recargar registros para mostrar cambios
        cargarRegistros();
      } else {
        console.error('Error al aprobar registro:', resultado.message);
      }
    } catch (error) {
      console.error('Error al aprobar registro:', error);
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
        console.log('Registro rechazado exitosamente');
        // Recargar registros para mostrar cambios
        cargarRegistros();
      } else {
        console.error('Error al rechazar registro:', resultado.message);
      }
    } catch (error) {
      console.error('Error al rechazar registro:', error);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    total: registros.length,
    aprobados: registros.filter(r => {
      const estado = r.estado?.toLowerCase() || '';
      return estado.includes('aprobado') || estado.includes('approved') || estado.includes('validado') || estado.includes('aceptado');
    }).length,
    rechazados: registros.filter(r => {
      const estado = r.estado?.toLowerCase() || '';
      return estado.includes('rechazado') || estado.includes('rejected');
    }).length,
    pendientes: registros.filter(r => {
      const estado = r.estado?.toLowerCase() || '';
      return estado.includes('pendiente') || estado.includes('pending') || estado.includes('revisión') || estado.includes('revision') || !r.estado;
    }).length
  };

  // Debug: Mostrar los estados reales para entender el problema
  console.log('Estados únicos en registros:', [...new Set(registros.map(r => r.estado))]);
  console.log('Estadísticas calculadas:', estadisticas);

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
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
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          busquedaCodigo={busquedaCodigo}
          setBusquedaCodigo={setBusquedaCodigo}
          busquedaAsesor={busquedaAsesor}
          setBusquedaAsesor={setBusquedaAsesor}
          busquedaCedula={busquedaCedula}
          setBusquedaCedula={setBusquedaCedula}
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
            registros={registrosFiltrados}
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
