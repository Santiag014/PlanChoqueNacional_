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
          response = await authenticatedFetch(`/api/asesor/historial-registros/${user.id}`);
        } catch (authError) {
          // Fallback: usar fetch manual con token de localStorage
          const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
          if (!token) {
            throw new Error('No se encontró token de autenticación');
          }
          
          const fullUrl = `/api/asesor/historial-registros/${user.id}`.startsWith('http') 
            ? `/api/asesor/historial-registros/${user.id}` 
            : `${window.location.origin}/api/asesor/historial-registros/${user.id}`;
          
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
      filtrados = filtrados.filter(registro => {
        // Puede venir como estado o estado_id o estado_nombre
        if (registro.estado) {
          return registro.estado?.toUpperCase() === filtroEstado;
        }
        if (registro.estado_id) {
          return registro.estado_id?.toString() === filtroEstado;
        }
        return false;
      });
    }

    // Filtro por código PDV
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.codigo_pdv?.toString().includes(busquedaCodigo.trim())
      );
    }

    setRegistrosFiltrados(filtrados);
  }, [registros, filtroKPI, filtroActividad, filtroEstado, busquedaCodigo]);

  // Abrir modal con detalles
  const handleVerDetalles = async (registro) => {
    try {
      setRegistroSeleccionado(registro);
      setModalOpen(true);
      setLoadingDetalles(true);

      // Verificar que tenemos registro válido
      if (!registro?.id) {
        throw new Error('Registro inválido');
      }

      // console.log('Cargando detalles para registro:', registro.id);

      // Intentar con authenticatedFetch primero
      let response;
      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        response = await authenticatedFetch(`/api/asesor/registro-detalles/${registro.id}`);
      } catch (authError) {
        // console.warn('Error con authenticatedFetch en detalles, intentando fetch manual:', authError);
        
        // Fallback: usar fetch manual
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = `/api/asesor/registro-detalles/${registro.id}`.startsWith('http') 
          ? `/api/asesor/registro-detalles/${registro.id}` 
          : `${window.location.origin}/api/asesor/registro-detalles/${registro.id}`;
        
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!response) {
        throw new Error('No se pudo realizar la petición de detalles');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        // console.error('Error HTTP en detalles:', response.status, errorText);
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      // console.log('Detalles recibidos:', data);
      
      if (data.success) {
        setRegistroSeleccionado({
          ...registro,
          detalles: data.data
        });
      } else {
        throw new Error(data.message || 'Error al cargar detalles');
      }
    } catch (err) {
    } finally {
      setLoadingDetalles(false);
    }
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
