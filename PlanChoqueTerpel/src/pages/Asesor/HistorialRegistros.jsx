import React, { useState, useEffect } from 'react';
import { useAsesorRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useAuthContext } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import RegistrosTable from '../../components/Asesor/HistorialRegistros/RegistrosTable';
import RegistroModal from '../../components/Asesor/HistorialRegistros/RegistroModal';
import FilterButtons from '../../components/Asesor/HistorialRegistros/FilterButtons';
import '../../styles/Asesor/historial-registros.css';

export default function HistorialRegistros() {
  // Proteger la ruta
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  const { isMobile } = useResponsive();
  const { authenticatedFetch } = useAuthContext();

  // Estados
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  // Loading de autenticación
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Verificar autorización
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Cargar registros
  useEffect(() => {
    const cargarRegistros = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/historial-registros/${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setRegistros(data.data);
          setRegistrosFiltrados(data.data);
        } else {
          setError('Error al cargar los registros');
        }
      } catch (err) {
        console.error('Error cargando registros:', err);
        setError('Error de conexión al cargar registros');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      cargarRegistros();
    }
  }, [user?.id, authenticatedFetch]);

  // Filtrar registros
  useEffect(() => {
    let filtrados = registros;

    // Filtro por KPI
    if (filtroActivo !== 'TODOS') {
      filtrados = filtrados.filter(registro => 
        registro.tipo_kpi?.toUpperCase() === filtroActivo
      );
    }

    // Filtro por código PDV
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.codigo_pdv?.toString().includes(busquedaCodigo.trim())
      );
    }

    setRegistrosFiltrados(filtrados);
  }, [registros, filtroActivo, busquedaCodigo]);

  // Abrir modal con detalles
  const handleVerDetalles = async (registro) => {
    setRegistroSeleccionado(registro);
    setModalOpen(true);
    setLoadingDetalles(true);

    try {
      const response = await authenticatedFetch(`/api/registro-detalles/${registro.id}`);
      const data = await response.json();
      
      if (data.success) {
        setRegistroSeleccionado({
          ...registro,
          detalles: data.data
        });
      }
    } catch (err) {
      console.error('Error cargando detalles:', err);
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroActivo('TODOS');
    setBusquedaCodigo('');
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando historial de registros...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user}>
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
    <DashboardLayout user={user}>
      <div className="historial-registros">
        <div className="historial-header">
          <h1>Historial de Registros</h1>
          <p className="subtitle">
            Total de registros: <strong>{registrosFiltrados.length}</strong>
          </p>
        </div>

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

          {/* Botones de filtro por KPI */}
          <FilterButtons 
            filtroActivo={filtroActivo}
            onFiltroChange={setFiltroActivo}
            isMobile={isMobile}
          />
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
