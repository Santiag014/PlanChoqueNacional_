import React, { useState, useEffect } from 'react';
import { useAsesorRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useAuthContext } from '../../contexts/AuthContext';
import { API_URL } from '../../config.js';
import DashboardLayout from '../../components/DashboardLayout';
import RegistrosTable from '../../components/Asesor/HistorialRegistros/RegistrosTable';
import RegistroModal from '../../components/Asesor/HistorialRegistros/RegistroModal';
import FilterButtons from '../../components/Asesor/HistorialRegistros/FilterButtons';
import '../../styles/Asesor/asesor-historial-registros.css';

export default function HistorialRegistros() {
  // TODOS LOS HOOKS DEBEN IR AQUÍ PRIMERO - ANTES DE CUALQUIER RETORNO CONDICIONAL
  
  // Proteger la ruta
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  const { isMobile } = useResponsive();
  const { authenticatedFetch } = useAuthContext();

  // Estados
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroKPI, setFiltroKPI] = useState('TODOS');
  const [filtroActividad, setFiltroActividad] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroEstadoBackoffice, setFiltroEstadoBackoffice] = useState('TODOS');
  const [filtroEstadoAgente, setFiltroEstadoAgente] = useState('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  // Estados adicionales para el toggle de filtros
  const [filtrosExpanded, setFiltrosExpanded] = useState(() => {
    const saved = localStorage.getItem('asesor-filtros-expanded');
    return saved !== null ? JSON.parse(saved) : false; // Por defecto CONTRAÍDO
  });

  // Guardar estado de expansión en localStorage y recalcular altura de tabla
  useEffect(() => {
    localStorage.setItem('asesor-filtros-expanded', JSON.stringify(filtrosExpanded));
    
    // Recalcular altura de tabla después de que se complete la animación
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 600); // Esperar a que termine la animación CSS (0.5s + margen)
  }, [filtrosExpanded]);

  // Efecto para recalcular altura cuando cambie el loading o los datos
  useEffect(() => {
    if (!loading && registros.length > 0) {
      // Múltiples recálculos más agresivos para asegurar que se adapte después de renderizar
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('tableDataLoaded'));
      }, 50);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
    }
  }, [loading, registros.length]);

  // Función para toggle del estado de expansión
  const toggleFiltrosExpansion = () => {
    setFiltrosExpanded(!filtrosExpanded);
  };

  // Cargar registros
  useEffect(() => {
    const cargarRegistros = async () => {
      // Verificar que tenemos usuario y token antes de hacer la petición
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Limpiar errores anteriores
        
        // Intentar con authenticatedFetch primero
        let response;
        try {
          if (!authenticatedFetch) {
            throw new Error('authenticatedFetch no está disponible');
          }
          response = await authenticatedFetch(`${API_URL}/api/asesor/historial-registros-asesor/${user.id}`);
        } catch (authError) {
          // Fallback: usar fetch manual con token de localStorage
          const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
          if (!token) {
            throw new Error('No se encontró token de autenticación');
          }
          
          const fullUrl = `${API_URL}/api/asesor/historial-registros-asesor/${user.id}`.startsWith('http') 
            ? `${API_URL}/api/asesor/historial-registros-asesor/${user.id}` 
            : `${API_URL}/api/asesor/historial-registros-asesor/${user.id}`;
          
          response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!response) {
          throw new Error('No se pudo realizar la petición');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        //console.log('Respuesta completa de la API:', data); // <-- Agregado para ver todo lo que trae la API
        
        if (data.success) {
          const registrosData = data.data || [];
          
          //console.log('📊 DATOS RECIBIDOS DE LA API:', registrosData);
          
          // Log para ver los estados únicos
          const estadosUnicos = [...new Set(registrosData.map(r => r.estado))];
          const estadosAgenteUnicos = [...new Set(registrosData.map(r => r.estado_agente))];
          
          // console.log('📊 ESTADOS ÚNICOS:', estadosUnicos);
          // console.log('📊 ESTADOS AGENTE ÚNICOS:', estadosAgenteUnicos);
          
          // Log para verificar observaciones
          const observacionesEjemplo = registrosData.slice(0, 3).map(r => ({
            id: r.id,
            codigo: r.codigo,
            observacion_asesor: r.observacion_asesor,
            observacion_agente: r.observacion_agente,
            estado_backoffice: r.estado_backoffice,
            estado_agente: r.estado_agente
          }));
          //console.log('📊 OBSERVACIONES Y ESTADOS EJEMPLO:', observacionesEjemplo);
          
          setRegistros(registrosData);
          setRegistrosFiltrados(registrosData);
          setError(null);
          
          // Recalcular altura después de cargar datos
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('tableDataLoaded'));
          }, 100);
        } else {
          throw new Error(data.message || 'Error al cargar los registros');
        }
      } catch (err) {
        setError(`Error al cargar registros: ${err.message}`);
      } finally {
        setLoading(false);
        
        // Recalcular altura después de que termine el loading
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          window.dispatchEvent(new Event('tableDataLoaded'));
        }, 200);
      }
    };

    // Solo cargar si tenemos usuario y no estamos en loading de auth
    if (user?.id && !authLoading && isAuthenticated && hasRequiredRole) {
      cargarRegistros();
    }
  }, [user?.id, authenticatedFetch, authLoading, isAuthenticated, hasRequiredRole]);

  // Filtrar registros
  useEffect(() => {
    let filtrados = registros;

    // Filtro por KPI
    if (filtroKPI !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const tipoKpi = registro.tipo_kpi?.toUpperCase();
        
        // Para PRECIO_VOLUMEN, mostrar tanto en filtro PRECIO como VOLUMEN
        if (tipoKpi === 'PRECIO_VOLUMEN') {
          return filtroKPI === 'PRECIO' || filtroKPI === 'VOLUMEN' || filtroKPI === 'PRECIO_VOLUMEN';
        }
        
        return tipoKpi === filtroKPI;
      });
    }

    // Filtro por Actividad usando tipo_accion directamente
    if (filtroActividad !== 'TODAS') {
      filtrados = filtrados.filter(registro => {
        // tipo_accion puede venir en mayúsculas/minúsculas
        const tipoAccion = registro.tipo_accion?.toUpperCase();
        return tipoAccion === filtroActividad.toUpperCase();
      });
    }

    // Filtro por Estado BackOffice
    if (filtroEstadoBackoffice !== 'TODOS') {
      //console.log("🔍 FILTRO ESTADO BACKOFFICE - Valor seleccionado:", filtroEstadoBackoffice);
      
      filtrados = filtrados.filter(registro => {
        const estadoBackoffice = registro.estado_backoffice?.toUpperCase?.().trim();

        //console.log("🔍 FILTRO ESTADO BACKOFFICE - Registro:", {
        //   id: registro.id,
        //   estado_backoffice: estadoBackoffice,
        //   codigo: registro.codigo
        // });
        
        // Mapear posibles valores de estado
        const esValido = (estado) => {
          if (!estado) return false;
          
          switch(filtroEstadoBackoffice) {
            case 'VALIDADO':
              return estado.includes('VALIDADO') || estado.includes('APROBADO') || estado.includes('APPROVED');
            case 'PENDIENTE':
              return estado.includes('PENDIENTE') || estado.includes('PENDING') || estado.includes('REVISION') || estado.includes('REVISIÓN');
            case 'RECHAZADO':
              return estado.includes('RECHAZADO') || estado.includes('REJECTED');
            default:
              return estado === filtroEstadoBackoffice;
          }
        };
        
        const cumpleCondicion = esValido(estadoBackoffice);

        //console.log("🔍 FILTRO ESTADO BACKOFFICE - Cumple condición:", cumpleCondicion);

        return cumpleCondicion;
      });
      
      //console.log("🔍 FILTRO ESTADO BACKOFFICE - Registros filtrados:", filtrados.length);
    }

    // Filtro por Estado Agente
    if (filtroEstadoAgente !== 'TODOS') {
      //console.log("🔍 FILTRO ESTADO AGENTE - Valor seleccionado:", filtroEstadoAgente);
      
      filtrados = filtrados.filter(registro => {
        const estadoAgente = registro.estado_agente?.toUpperCase?.().trim();
        
        // console.log("🔍 FILTRO ESTADO AGENTE - Registro:", {
        //   id: registro.id,
        //   estado_agente: estadoAgente,
        //   codigo: registro.codigo
        // });
        
        // Mapear posibles valores de estado
        const esValido = (estado) => {
          if (!estado) return false;
          
          switch(filtroEstadoAgente) {
            case 'VALIDADO':
              return estado.includes('VALIDADO') || estado.includes('APROBADO') || estado.includes('APPROVED');
            case 'PENDIENTE':
              return estado.includes('PENDIENTE') || estado.includes('PENDING') || estado.includes('REVISION') || estado.includes('REVISIÓN');
            case 'RECHAZADO':
              return estado.includes('RECHAZADO') || estado.includes('REJECTED');
            default:
              return estado === filtroEstadoAgente;
          }
        };
        
        const cumpleCondicion = esValido(estadoAgente);
        
        //console.log("🔍 FILTRO ESTADO AGENTE - Cumple condición:", cumpleCondicion);
        
        return cumpleCondicion;
      });
      
      //console.log("🔍 FILTRO ESTADO AGENTE - Registros filtrados:", filtrados.length);
    }

    // Filtro por código PDV
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.codigo?.toString().includes(busquedaCodigo.trim())
      );
    }

    setRegistrosFiltrados(filtrados);
  }, [registros, filtroKPI, filtroActividad, filtroEstado, filtroEstadoBackoffice, filtroEstadoAgente, busquedaCodigo]);

  // Abrir modal con detalles
  const handleVerDetalles = (registro) => {
    // Ya tenemos todos los datos necesarios en el registro inicial
    setRegistroSeleccionado(registro);
    setModalOpen(true);
    setLoadingDetalles(false);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroKPI('TODOS');
    setFiltroActividad('TODAS');
    setFiltroEstado('TODOS');
    setFiltroEstadoBackoffice('TODOS');
    setFiltroEstadoAgente('TODOS');
    setBusquedaCodigo('');
  };

  // AHORA SÍ PODEMOS HACER LOS RETORNOS CONDICIONALES DESPUÉS DE TODOS LOS HOOKS

  // Loading de autenticación
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Verificar autorización
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout user={user} pageTitle="HISTORIAL DE REGISTROS">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando historial de registros...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} pageTitle="HISTORIAL DE REGISTROS">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} pageTitle="HISTORIAL DE REGISTROS">
      <div className="historial-registros">

        {/* Filtros con toggle collapsible */}
        <div className="filtros-container-collapsible">
          {/* Header con botón desplegable */}
          <div className="filtros-header" onClick={toggleFiltrosExpansion}>
            <h3 className="filtros-titulo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/>
              </svg>
              Filtros de Búsqueda
              {/* Indicador de filtros activos */}
              {(busquedaCodigo || filtroKPI !== 'TODOS' || filtroActividad !== 'TODAS' || 
                filtroEstado !== 'TODOS' || filtroEstadoBackoffice !== 'TODOS' || 
                filtroEstadoAgente !== 'TODOS') && (
                <span className="filtros-activos-badge">
                  {[busquedaCodigo, 
                    filtroKPI !== 'TODOS' ? '1' : '', 
                    filtroActividad !== 'TODAS' ? '1' : '',
                    filtroEstado !== 'TODOS' ? '1' : '',
                    filtroEstadoBackoffice !== 'TODOS' ? '1' : '',
                    filtroEstadoAgente !== 'TODOS' ? '1' : ''
                  ].filter(Boolean).length}
                </span>
              )}
            </h3>
            
            {/* Botón desplegable */}
            <div className="filtros-header-actions">
              {/* Botón limpiar visible siempre */}
              <button 
                className="filtros-limpiar-header" 
                onClick={(e) => {e.stopPropagation(); limpiarFiltros();}}
                title="Limpiar todos los filtros"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '6px'}}>
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
                Limpiar
              </button>
              
              <button className="filtros-toggle" title={filtrosExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className={`filtros-toggle-icon ${filtrosExpanded ? 'expanded' : ''}`}
                >
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido de filtros (collapsible) */}
          <div className={`filtros-content ${filtrosExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="filtros-container">
              {/* Búsqueda por código */}
              <div className="busqueda-container">
                <input
                  type="text"
                  placeholder="Filtrar por código PDV"
                  value={busquedaCodigo}
                  onChange={(e) => setBusquedaCodigo(e.target.value)}
                  className="busqueda-input"
                />
              </div>

              {/* Filtros por KPI, Actividad y Estado */}
              <FilterButtons 
                filtroKPI={filtroKPI}
                filtroActividad={filtroActividad}
                filtroEstado={filtroEstado}
                filtroEstadoBackoffice={filtroEstadoBackoffice}
                filtroEstadoAgente={filtroEstadoAgente}
                onFiltroKPIChange={setFiltroKPI}
                onFiltroActividadChange={setFiltroActividad}
                onFiltroEstadoChange={setFiltroEstado}
                onFiltroEstadoBackofficeChange={setFiltroEstadoBackoffice}
                onFiltroEstadoAgenteChange={setFiltroEstadoAgente}
                isMobile={isMobile}
              />

              {/* Contador de registros simple */}
              <div className="contador-simple">
                Total de registros: {registrosFiltrados.length}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de registros */}
        <RegistrosTable
          registros={registrosFiltrados}
          onVerDetalles={handleVerDetalles}
          isMobile={isMobile}
        />

        {/* Modal de detalles */}
        {modalOpen && (
          <RegistroModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            registro={registroSeleccionado}
            loading={loadingDetalles}
            isMobile={isMobile}
          />
        )}
      </div>
    </DashboardLayout>
  );
}