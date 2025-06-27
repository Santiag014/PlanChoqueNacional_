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
  const [filtroActivo, setFiltroActivo] = useState('TODOS');
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
          response = await authenticatedFetch(`/api/historial-registros/${user.id}`);
        } catch (authError) {
          // Fallback: usar fetch manual con token de localStorage
          const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
          if (!token) {
            throw new Error('No se encontró token de autenticación');
          }
          
          const fullUrl = `/api/historial-registros/${user.id}`.startsWith('http') 
            ? `/api/historial-registros/${user.id}` 
            : `${window.location.origin}/api/historial-registros/${user.id}`;
          
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
        
        // Solo usar datos mock en desarrollo y si no hay registros reales
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          // console.log('Usando datos mock para desarrollo');
          const registrosMock = [
            {
              id: 1,
              codigo_pdv: '001',
              nombre_agente: 'Juan Pérez',
              fecha_registro: new Date().toISOString(),
              tipo_kpi: 'VOLUMEN',
              nombre_pdv: 'Estación Norte'
            },
            {
              id: 2,
              codigo_pdv: '002', 
              nombre_agente: 'María García',
              fecha_registro: new Date(Date.now() - 86400000).toISOString(),
              tipo_kpi: 'PRECIO',
              nombre_pdv: 'Estación Sur'
            }
          ];
          
          setRegistros(registrosMock);
          setRegistrosFiltrados(registrosMock);
          setError(null);
        }
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
        response = await authenticatedFetch(`/api/registro-detalles/${registro.id}`);
      } catch (authError) {
        // console.warn('Error con authenticatedFetch en detalles, intentando fetch manual:', authError);
        
        // Fallback: usar fetch manual
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = `/api/registro-detalles/${registro.id}`.startsWith('http') 
          ? `/api/registro-detalles/${registro.id}` 
          : `${window.location.origin}/api/registro-detalles/${registro.id}`;
        
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
      // console.error('Error cargando detalles:', err);
      // Datos mock en caso de error solo en desarrollo
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        // console.log('Usando detalles mock para desarrollo');
        setRegistroSeleccionado({
          ...registro,
          detalles: {
            productos: [
              {
                referencia: 'Producto de ejemplo',
                presentacion: '1L',
                precio: 25000,
                volumen: 1
              }
            ],
            foto: null
          }
        });
      } else {
        // En producción, mostrar error
        setError(`Error al cargar detalles: ${err.message}`);
        setModalOpen(false);
      }
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroActivo('TODOS');
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
