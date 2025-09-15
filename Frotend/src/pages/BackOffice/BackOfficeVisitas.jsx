import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useBackOfficePageProtection } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useHistorialRegistrosBackOffice } from '../../hooks/backoffice';
import RegistrosTable from '../../components/BackOffice/HistorialRegistros/RegistrosTable';
import RegistroDetalleModal from '../../components/BackOffice/HistorialRegistros/RegistroDetalleModal';
import FilterButtons from '../../components/BackOffice/HistorialRegistros/FilterButtons';
import AuthLoadingScreen from '../../components/shared/AuthLoadingScreen';
import '../../styles/Backoffice/backoffice-visitas.css';
import '../../styles/Backoffice/filter-panel.css';

// OPTIMIZACIÓN: Hook para debounce de búsquedas
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BackOfficeVisitas() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Proteger la página - solo backoffice puede acceder
  const { user, pageReady, shouldShowContent } = useBackOfficePageProtection();
  
  // Hook para obtener registros OPTIMIZADO
  const { 
    registros, 
    registroDetalle,
    loading, 
    loadingDetalle,
    error, 
    cargarRegistros, 
    cargarDetalleRegistro,
    actualizarEstadoRegistro 
  } = useHistorialRegistrosBackOffice();

  // Estados para filtros
  const [filtroKPI, setFiltroKPI] = useState('TODOS');
  const [filtroActividad, setFiltroActividad] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroEstadoBackoffice, setFiltroEstadoBackoffice] = useState('TODOS');
  const [filtroAgenteComercial, setFiltroAgenteComercial] = useState('TODOS'); // Empezar mostrando todos
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [busquedaAsesor, setBusquedaAsesor] = useState('');
  const [busquedaCedula, setBusquedaCedula] = useState('');
  const [busquedaId, setBusquedaId] = useState('');
  
  // OPTIMIZACIÓN: Debounce más agresivo para búsquedas pesadas
  const debouncedCodigo = useDebounce(busquedaCodigo, 500); // Más lento para búsquedas costosas
  const debouncedAsesor = useDebounce(busquedaAsesor, 500);
  const debouncedCedula = useDebounce(busquedaCedula, 500);
  const debouncedId = useDebounce(busquedaId, 100); // ID sigue rápido
  
  // Nuevos filtros de fecha
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroSemana, setFiltroSemana] = useState('');
  const [filtroDiaCreacion, setFiltroDiaCreacion] = useState('');
  
  // Estados para modal
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingAccion, setLoadingAccion] = useState(false);

  // OPTIMIZACIÓN: Filtrar registros con useMemo y early returns
  const registrosFiltrados = useMemo(() => {
    let filtrados = registros;

    // EARLY RETURN: Si no hay registros, no procesar
    if (!registros.length) return [];

    // OPTIMIZACIÓN: Filtro por ID PRIMERO (más eficiente para búsquedas exactas)
    if (debouncedId.trim()) {
      const idBuscado = debouncedId.trim();
      const resultado = registros.filter(registro => {
        const id = registro.id?.toString() || '';
        return id === idBuscado;
      });
      // EARLY RETURN: Si hay filtro por ID, retornar inmediatamente
      return resultado;
    }

    // OPTIMIZACIÓN: Aplicar filtros en orden de selectividad (más específicos primero)
    
    // 1. Filtro por Agente Comercial (muy selectivo)
    if (filtroAgenteComercial !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const agenteComercial = registro.agente_comercial?.trim() || '';
        return agenteComercial === filtroAgenteComercial;
      });
      // EARLY RETURN: Si después de este filtro no hay registros, retornar vacío
      if (!filtrados.length) return [];
    }

    // 2. Filtros de estado (selectivos)
    if (filtroEstadoBackoffice !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const estadoBackoffice = registro.estado_backoffice?.toLowerCase?.().trim() || '';
        
        switch(filtroEstadoBackoffice) {
          case 'APROBADO':
            return estadoBackoffice.includes('aprobado') || estadoBackoffice.includes('approved') || estadoBackoffice.includes('validado');
          case 'PENDIENTE':
            return estadoBackoffice.includes('pendiente') || estadoBackoffice.includes('pending') || estadoBackoffice === '';
          case 'EN_REVISION':
            return estadoBackoffice.includes('revision') || estadoBackoffice.includes('revisión');
          case 'RECHAZADO':
            return estadoBackoffice.includes('rechazado') || estadoBackoffice.includes('rejected');
          default:
            return estadoBackoffice === filtroEstadoBackoffice.toLowerCase();
        }
      });
      if (!filtrados.length) return [];
    }

    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const estadoAgente = registro.estado_agente?.toLowerCase?.().trim() || '';
        
        switch(filtroEstado) {
          case 'VALIDADO':
            return estadoAgente.includes('validado') || estadoAgente.includes('aprobado') || estadoAgente.includes('approved') || estadoAgente.includes('aceptado');
          case 'PENDIENTE':
            return estadoAgente.includes('pendiente') || estadoAgente.includes('pending') || estadoAgente === '';
          case 'EN_REVISION':
            return estadoAgente.includes('revision') || estadoAgente.includes('revisión');
          case 'RECHAZADO':
            return estadoAgente.includes('rechazado') || estadoAgente.includes('rejected');
          default:
            return estadoAgente === filtroEstado.toLowerCase();
        }
      });
      if (!filtrados.length) return [];
    }

    // 3. Filtro por Actividad (moderadamente selectivo)
    if (filtroActividad !== 'TODAS') {
      filtrados = filtrados.filter(registro => {
        const tipoAccion = registro.tipo_accion?.toUpperCase() || registro.actividad?.toUpperCase();
        return tipoAccion === filtroActividad.toUpperCase();
      });
      if (!filtrados.length) return [];
    }

    // 4. Filtros de búsqueda de texto (más costosos, aplicar al final)
    if (debouncedCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        (registro.codigo?.toString().includes(debouncedCodigo.trim()) ||
         registro.id_pdv?.toString().includes(debouncedCodigo.trim()) ||
         registro.pdv_codigo?.toString().includes(debouncedCodigo.trim()))
      );
      if (!filtrados.length) return [];
    }

    if (debouncedAsesor.trim()) {
      const busquedaLower = debouncedAsesor.trim().toLowerCase();
      filtrados = filtrados.filter(registro =>
        (registro.name?.toLowerCase().includes(busquedaLower) ||
         registro.nombre_asesor?.toLowerCase().includes(busquedaLower) ||
         registro.asesor_nombre?.toLowerCase().includes(busquedaLower))
      );
      if (!filtrados.length) return [];
    }

    if (debouncedCedula.trim()) {
      filtrados = filtrados.filter(registro =>
        (registro.cedula?.toString().includes(debouncedCedula.trim()) ||
         registro.id_asesor?.toString().includes(debouncedCedula.trim()) ||
         registro.asesor_cedula?.toString().includes(debouncedCedula.trim()))
      );
      if (!filtrados.length) return [];
    }

    // 5. Filtros de fecha (más costosos, aplicar al final)
    if (filtroDia) {
      filtrados = filtrados.filter(registro => {
        if (!registro.fecha_registro) return false;
        
        try {
          const fechaRegistroObj = new Date(registro.fecha_registro);
          if (isNaN(fechaRegistroObj.getTime())) return false;
          
          const fechaRegistroStr = fechaRegistroObj.toISOString().split('T')[0];
          return fechaRegistroStr === filtroDia;
        } catch (error) {
          return false;
        }
      });
      if (!filtrados.length) return [];
    }

    if (filtroSemana) {
      filtrados = filtrados.filter(registro => {
        if (!registro.fecha_registro) return false;
        
        try {
          const fechaRegistroStr = registro.fecha_registro.split('T')[0] || registro.fecha_registro.split(' ')[0];
          const fechaRegistro = new Date(fechaRegistroStr + 'T12:00:00');
          
          const [año, semanaStr] = filtroSemana.split('-W');
          const semanaFiltro = parseInt(semanaStr);
          
          const inicioAño = new Date(fechaRegistro.getFullYear(), 0, 1);
          const diasTranscurridos = Math.floor((fechaRegistro - inicioAño) / (24 * 60 * 60 * 1000));
          const semanaRegistro = Math.ceil((diasTranscurridos + inicioAño.getDay() + 1) / 7);
          
          return fechaRegistro.getFullYear() === parseInt(año) && semanaRegistro === semanaFiltro;
        } catch (error) {
          return false;
        }
      });
      if (!filtrados.length) return [];
    }

    if (filtroDiaCreacion) {
      filtrados = filtrados.filter(registro => {
        if (!registro.created_at) return false;
        
        try {
          const fechaCreacionObj = new Date(registro.created_at);
          if (isNaN(fechaCreacionObj.getTime())) return false;
          
          const fechaCreacionStr = fechaCreacionObj.toISOString().split('T')[0];
          return fechaCreacionStr === filtroDiaCreacion;
        } catch (error) {
          return false;
        }
      });
    }

    return filtrados;
  }, [
    registros, 
    filtroKPI, 
    filtroActividad, 
    filtroEstado, 
    filtroEstadoBackoffice, 
    filtroAgenteComercial, 
    debouncedCodigo, 
    debouncedAsesor, 
    debouncedCedula,
    debouncedId,
    filtroDia, 
    filtroSemana, 
    filtroDiaCreacion
  ]);

  // OPTIMIZACIÓN: Manejar ver detalle con useCallback
  const handleVerDetalle = useCallback(async (registro) => {
    try {
      // Primero mostrar el modal con datos básicos
      setRegistroSeleccionado(registro);
      setModalOpen(true);
      
      // Luego cargar los detalles completos en segundo plano
      console.log(`🔍 Cargando detalles completos del registro ${registro.id}...`);
      const detalleCompleto = await cargarDetalleRegistro(registro.id);
      
      // Actualizar el registro seleccionado con los detalles completos
      setRegistroSeleccionado(detalleCompleto);
      console.log(`✅ Detalles completos del registro ${registro.id} cargados`);
    } catch (error) {
      console.error('Error cargando detalles del registro:', error);
      // Mantener el modal abierto con los datos básicos aunque falle la carga de detalles
    }
  }, [cargarDetalleRegistro]);

  // OPTIMIZACIÓN: Manejar cerrar modal con useCallback
  const handleCerrarModal = useCallback(() => {
    setModalOpen(false);
    setRegistroSeleccionado(null);
  }, []);

  // OPTIMIZACIÓN: Manejar aprobar registro con useCallback
  const handleAprobar = useCallback(async (registroId, comentario) => {
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
  }, [actualizarEstadoRegistro, cargarRegistros]);

  // OPTIMIZACIÓN: Manejar rechazar registro con useCallback
  const handleRechazar = useCallback(async (registroId, comentario) => {
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
  }, [actualizarEstadoRegistro, cargarRegistros]);

  // OPTIMIZACIÓN: Calcular estadísticas FILTRADAS con useMemo
  const estadisticas = useMemo(() => {
    // Usar registrosFiltrados en lugar de registros para que respete los filtros activos
    const registrosParaEstadisticas = registrosFiltrados;
    
    return {
      total: registrosParaEstadisticas.length,
      aprobados: registrosParaEstadisticas.filter(r => {
        const estadoBackoffice = r.estado_backoffice?.toLowerCase() || '';
        return estadoBackoffice.includes('aprobado') || estadoBackoffice.includes('approved') || estadoBackoffice.includes('validado') || estadoBackoffice.includes('aceptado');
      }).length,
      rechazados: registrosParaEstadisticas.filter(r => {
        const estadoBackoffice = r.estado_backoffice?.toLowerCase() || '';
        return estadoBackoffice.includes('rechazado') || estadoBackoffice.includes('rejected');
      }).length,
      pendientes: registrosParaEstadisticas.filter(r => {
        const estadoBackoffice = r.estado_backoffice?.toLowerCase() || '';
        return estadoBackoffice.includes('pendiente') || estadoBackoffice.includes('pending') || estadoBackoffice.includes('revisión') || estadoBackoffice.includes('revision') || !r.estado_backoffice;
      }).length
    };
  }, [registrosFiltrados]);

  // OPTIMIZACIÓN: Limitar registros mostrados para evitar DOM pesado
  const registrosPaginados = useMemo(() => {
    const maxRegistros = 100; // Mostrar máximo 100 registros para mantener rendimiento óptimo
    if (registrosFiltrados.length > maxRegistros) {
      return registrosFiltrados.slice(0, maxRegistros);
    }
    return registrosFiltrados;
  }, [registrosFiltrados]);

  // Debug: Mostrar los estados reales para entender el problema
  // console.log('Estados BackOffice únicos en registros:', [...new Set(registros.map(r => r.estado_backoffice))]);
  // console.log('Estados Agente únicos en registros:', [...new Set(registros.map(r => r.estado_agente))]);
  // console.log('Estadísticas calculadas:', estadisticas);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!pageReady || !shouldShowContent) {
    return <AuthLoadingScreen message="Verificando acceso a gestión de registros..." />;
  }
  
  return (
    <DashboardLayout>
      <div className="backoffice-visitas-container">
        <div className="backoffice-page-header">
          <div>
            <h1 className="backoffice-page-title">BackOffice - Gestión de Registros</h1>
            <p className="backoffice-page-subtitle">Administración y supervisión de todos los registros</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="backoffice-stats-summary">
          <div className="backoffice-stat-card">
            <div className="backoffice-stat-value">{estadisticas.total}</div>
            <div className="backoffice-stat-label">Total Registros</div>
          </div>
          <div className="backoffice-stat-card">
            <div className="backoffice-stat-value">{estadisticas.aprobados}</div>
            <div className="backoffice-stat-label">Aprobados</div>
          </div>
          <div className="backoffice-stat-card">
            <div className="backoffice-stat-value">{estadisticas.rechazados}</div>
            <div className="backoffice-stat-label">Rechazados</div>
          </div>
          <div className="backoffice-stat-card">
            <div className="backoffice-stat-value">{estadisticas.pendientes}</div>
            <div className="backoffice-stat-label">Pendientes</div>
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
          filtroEstadoBackoffice={filtroEstadoBackoffice}
          setFiltroEstadoBackoffice={setFiltroEstadoBackoffice}
          filtroAgenteComercial={filtroAgenteComercial}
          setFiltroAgenteComercial={setFiltroAgenteComercial}
          busquedaCodigo={busquedaCodigo}
          setBusquedaCodigo={setBusquedaCodigo}
          busquedaAsesor={busquedaAsesor}
          setBusquedaAsesor={setBusquedaAsesor}
          busquedaCedula={busquedaCedula}
          setBusquedaCedula={setBusquedaCedula}
          busquedaId={busquedaId}
          setBusquedaId={setBusquedaId}
          filtroDia={filtroDia}
          setFiltroDia={setFiltroDia}
          filtroSemana={filtroSemana}
          setFiltroSemana={setFiltroSemana}
          filtroDiaCreacion={filtroDiaCreacion}
          setFiltroDiaCreacion={setFiltroDiaCreacion}
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
            <div className="backoffice-loading-message">Cargando registros...</div>
          </div>
        ) : (
          <>
            {/* OPTIMIZACIÓN: Notificación cuando hay muchos registros */}
            {/* {registrosFiltrados.length > 500 && (
              <div className="backoffice-info-banner" style={{ 
                background: '#fff3cd', 
                color: '#856404', 
                padding: '10px', 
                margin: '10px 0', 
                borderRadius: '5px',
                border: '1px solid #ffeaa7'
              }}>
                ⚡ <strong>Optimización activa:</strong> Mostrando los primeros 500 de {registrosFiltrados.length} registros. 
                Usa los filtros para encontrar registros específicos más rápido.
              </div>
            )} */}
            
            <RegistrosTable
              registros={registrosPaginados}
              onVerDetalle={handleVerDetalle}
              onAprobar={handleAprobar}
              onRechazar={handleRechazar}
              isMobile={isMobile}
            />
          </>
        )}

        {/* Modal de detalles OPTIMIZADO */}
        <RegistroDetalleModal
          isOpen={modalOpen}
          onClose={handleCerrarModal}
          registro={registroSeleccionado}
          loadingDetalle={loadingDetalle}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
        />
      </div>
    </DashboardLayout>
  );
}
