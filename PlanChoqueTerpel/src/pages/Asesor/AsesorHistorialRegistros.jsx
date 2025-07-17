import React, { useState, useEffect } from 'react';
import { useAsesorRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useAuthContext } from '../../contexts/AuthContext';
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
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

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
          response = await authenticatedFetch(`/api/asesor/historial-registros-asesor/${user.id}`);
        } catch (authError) {
          // Fallback: usar fetch manual con token de localStorage
          const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
          if (!token) {
            throw new Error('No se encontró token de autenticación');
          }
          
          const fullUrl = `/api/asesor/historial-registros-asesor/${user.id}`.startsWith('http') 
            ? `/api/asesor/historial-registros-asesor/${user.id}` 
            : `${window.location.origin}/api/asesor/historial-registros-asesor/${user.id}`;
          
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
        console.log('Respuesta completa de la API:', data); // <-- Agregado para ver todo lo que trae la API
        
        if (data.success) {
          const registrosData = data.data || [];
          
          console.log('📊 DATOS RECIBIDOS DE LA API:', registrosData);
          
          // Log para ver los estados únicos
          const estadosUnicos = [...new Set(registrosData.map(r => r.estado))];
          const estadosAgenteUnicos = [...new Set(registrosData.map(r => r.estado_agente))];
          
          console.log('📊 ESTADOS ÚNICOS:', estadosUnicos);
          console.log('📊 ESTADOS AGENTE ÚNICOS:', estadosAgenteUnicos);
          
          // Log para verificar observaciones
          const observacionesEjemplo = registrosData.slice(0, 3).map(r => ({
            id: r.id,
            codigo: r.codigo,
            observacion: r.observacion
          }));
          console.log('📊 OBSERVACIONES EJEMPLO:', observacionesEjemplo);
          
          setRegistros(registrosData);
          setRegistrosFiltrados(registrosData);
          setError(null);
        } else {
          throw new Error(data.message || 'Error al cargar los registros');
        }
      } catch (err) {
        setError(`Error al cargar registros: ${err.message}`);
      } finally {
        setLoading(false);
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

    // Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      console.log("🔍 FILTRO ESTADO - Valor seleccionado:", filtroEstado);
      
      filtrados = filtrados.filter(registro => {
        console.log("🔍 FILTRO ESTADO - Registro:", {
          id: registro.id,
          estado: registro.estado,
          estado_agente: registro.estado_agente,
          codigo: registro.codigo
        });
        
        // Normalizar el estado del registro
        const estadoRegistro = registro.estado?.toUpperCase?.().trim();
        const estadoAgenteRegistro = registro.estado_agente?.toUpperCase?.().trim();
        
        console.log("🔍 FILTRO ESTADO - Estados normalizados:", {
          estadoRegistro,
          estadoAgenteRegistro,
          filtroEstado
        });
        
        // Mapear posibles valores de estado
        const esValido = (estado) => {
          if (!estado) return false;
          
          switch(filtroEstado) {
            case 'VALIDADO':
              return estado.includes('VALIDADO') || estado.includes('APROBADO') || estado.includes('APPROVED');
            case 'PENDIENTE':
              return estado.includes('PENDIENTE') || estado.includes('PENDING') || estado.includes('REVISION') || estado.includes('REVISIÓN');
            case 'RECHAZADO':
              return estado.includes('RECHAZADO') || estado.includes('REJECTED');
            default:
              return estado === filtroEstado;
          }
        };
        
        const cumpleCondicion = esValido(estadoRegistro) || esValido(estadoAgenteRegistro);
        console.log("🔍 FILTRO ESTADO - Cumple condición:", cumpleCondicion);
        
        return cumpleCondicion;
      });
      
      console.log("🔍 FILTRO ESTADO - Registros filtrados:", filtrados.length);
    }

    // Filtro por código PDV
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.codigo?.toString().includes(busquedaCodigo.trim())
      );
    }

    setRegistrosFiltrados(filtrados);
  }, [registros, filtroKPI, filtroActividad, filtroEstado, busquedaCodigo]);

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

        {/* Filtros */}
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
            <button onClick={limpiarFiltros} className="limpiar-btn">
              Limpiar
            </button>
          </div>

          {/* Filtros por KPI, Actividad y Estado */}
          <FilterButtons 
            filtroKPI={filtroKPI}
            filtroActividad={filtroActividad}
            filtroEstado={filtroEstado}
            onFiltroKPIChange={setFiltroKPI}
            onFiltroActividadChange={setFiltroActividad}
            onFiltroEstadoChange={setFiltroEstado}
            isMobile={isMobile}
          />

          {/* Contador de registros simple */}
          <div className="contador-simple">
            Total de registros: {registrosFiltrados.length}
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