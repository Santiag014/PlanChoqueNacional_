import React, { useState, useEffect } from 'react';
import { useAsesorRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useAuthContext } from '../../contexts/AuthContext';
import { API_URL } from '../../config.js';
import DashboardLayout from '../../components/DashboardLayout';
import RegistrosAuditoriaTable from '../../components/Asesor/ResultadosAuditorias/RegistrosAuditoriaTable';
import RegistroAuditoriaModal from '../../components/Asesor/ResultadosAuditorias/RegistroAuditoriaModal';
import FilterButtonsAuditoria from '../../components/Asesor/ResultadosAuditorias/FilterButtonsAuditoria';
import '../../styles/Asesor/asesor-resultados-auditorias.css';

export default function ResultadosAuditorias() {
  // TODOS LOS HOOKS DEBEN IR AQUÍ PRIMERO - ANTES DE CUALQUIER RETORNO CONDICIONAL
  
  // Proteger la ruta
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  const { isMobile } = useResponsive();
  const { authenticatedFetch } = useAuthContext();

  // Estados
  const [auditorias, setAuditorias] = useState([]);
  const [auditoriasFiltradas, setAuditoriasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroKPI, setFiltroKPI] = useState('TODOS');
  const [filtroActividad, setFiltroActividad] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  // Cargar auditorias
  useEffect(() => {
    const cargarAuditorias = async () => {
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
          response = await authenticatedFetch(`${API_URL}/api/asesor/resultados-auditorias/${user.id}`);
        } catch (authError) {
          console.warn('authenticatedFetch falló, usando fetch directo:', authError.message);
          
          // Fallback a fetch tradicional con token del localStorage
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          if (!token) {
            throw new Error('No se encontró token de autenticación');
          }
          
          // Usar la URL relativa directamente - Vite manejará el proxy
          response = await fetch(`${API_URL}/api/asesor/resultados-auditorias/${user.id}`, {
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
          console.error('Error response text:', errorText);
          throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Respuesta completa de auditorias API:', data);
        
        if (data.success) {
          const auditoriasData = data.data || [];
          console.log('📊 DATOS AUDITORIAS RECIBIDOS:', auditoriasData);
          
          // Debuggear la estructura de cada auditoría
          if (auditoriasData.length > 0) {
            console.log('🔍 PRIMERA AUDITORÍA:', auditoriasData[0]);
            console.log('🏷️ CAMPOS DISPONIBLES:', Object.keys(auditoriasData[0]));
            auditoriasData.forEach((auditoria, index) => {
              console.log(`Auditoría ${index + 1}:`, {
                codigo: auditoria.codigo,
                estado: auditoria.estado,
                estado_agente: auditoria.estado_agente,
                tipo_accion: auditoria.tipo_accion
              });
            });
          }
          
          setAuditorias(auditoriasData);
          setAuditoriasFiltradas(auditoriasData); // Inicialmente mostrar todos
        } else {
          throw new Error(data.message || 'Error al obtener auditorias');
        }
      } catch (error) {
        console.error('Error cargando auditorias:', error);
        setError(error.message);
        setAuditorias([]);
        setAuditoriasFiltradas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAuditorias();
  }, [user?.id, authenticatedFetch]); // Dependencias exactas

  // Aplicar filtros
  useEffect(() => {
    console.log('🔍 APLICANDO FILTROS:');
    console.log('📊 Total auditorias:', auditorias.length);
    console.log('🔍 Filtro código:', busquedaCodigo);
    console.log('🏷️ Filtro estado:', filtroEstado);
    console.log('📈 Filtro actividad:', filtroActividad);
    
    let datosFiltrados = [...auditorias];

    // Filtro por búsqueda de código
    if (busquedaCodigo.trim()) {
      console.log('🔍 Aplicando filtro de código...');
      const codigosBefore = datosFiltrados.map(r => r.codigo);
      console.log('Códigos antes del filtro:', codigosBefore);
      
      datosFiltrados = datosFiltrados.filter(registro => {
        // Convertir el código a string de forma segura
        const codigoStr = String(registro.codigo || '').toLowerCase();
        const busquedaStr = busquedaCodigo.toLowerCase().trim();
        return codigoStr.includes(busquedaStr);
      });
      
      console.log('Registros después del filtro código:', datosFiltrados.length);
    }

    // Filtro por actividad (tipo de auditoria)
    if (filtroActividad !== 'TODAS') {
      console.log('🏷️ Aplicando filtro de actividad...');
      datosFiltrados = datosFiltrados.filter(registro => {
        const tipoAccion = String(registro.tipo_accion || '').toUpperCase();
        console.log('Comparando:', tipoAccion, 'con', filtroActividad);
        return tipoAccion === filtroActividad;
      });
      console.log('Registros después del filtro actividad:', datosFiltrados.length);
    }

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      console.log('📊 Aplicando filtro de estado...');
      datosFiltrados = datosFiltrados.filter(registro => {
        const estado = String(registro.estado || '').toLowerCase();
        const estadoAgente = String(registro.estado_agente || '').toLowerCase();
        const estadoMystery = registro.estado_mystery || 1; // Default a "En Revisión"
        
        console.log('Estado registro:', estado, 'Estado agente:', estadoAgente, 'Estado mystery:', estadoMystery);
        
        switch (filtroEstado) {
          case 'VALIDADO':
            const esValidado = estado.includes('validado') || estado.includes('aprobado') || 
                   estado.includes('confirmado') || estadoAgente.includes('validado') || 
                   estadoAgente.includes('aprobado') || estadoMystery === 2;
            console.log('¿Es validado?', esValidado);
            return esValidado;
          case 'PENDIENTE':
            const esPendiente = estado.includes('pendiente') || estado.includes('revision') || 
                   estado.includes('proceso') || estadoAgente.includes('pendiente') || 
                   estadoAgente.includes('revision') || estadoMystery === 1 ||
                   estado.includes('en revisión');
            console.log('¿Es pendiente?', esPendiente);
            return esPendiente;
          case 'RECHAZADO':
            const esRechazado = estado.includes('rechazado') || estado.includes('error') || 
                   estado.includes('fallido') || estadoAgente.includes('rechazado') || 
                   estadoAgente.includes('error') || estadoMystery === 3;
            console.log('¿Es rechazado?', esRechazado);
            return esRechazado;
          default:
            return true;
        }
      });
      console.log('Registros después del filtro estado:', datosFiltrados.length);
    }

    console.log('✅ RESULTADO FINAL:', datosFiltrados.length, 'auditorías filtradas');
    setAuditoriasFiltradas(datosFiltrados);
  }, [auditorias, filtroKPI, filtroActividad, filtroEstado, busquedaCodigo]);

  // Manejar selección de auditoria
  const handleSeleccionarAuditoria = async (auditoria) => {
    setLoadingDetalles(true);
    try {
      // Procesar los datos de la auditoria para el modal
      const auditoriaProcessada = {
        ...auditoria,
        productos: []
      };

      // Procesar productos si existen datos concatenados
      if (auditoria.referencias) {
        const referencias = auditoria.referencias.split(',');
        const presentaciones = auditoria.presentaciones ? auditoria.presentaciones.split(',') : [];
        const preciosSugeridos = auditoria.precios_sugeridos ? auditoria.precios_sugeridos.split(',') : [];
        const preciosReales = auditoria.precios_reales ? auditoria.precios_reales.split(',') : [];

        // Crear productos y filtrar duplicados
        const productosTemp = referencias.map((ref, index) => ({
          referencia: ref.trim(),
          presentacion: presentaciones[index] ? presentaciones[index].trim() : 'N/A',
          precio_sugerido: preciosSugeridos[index] ? preciosSugeridos[index].trim() : '0',
          precio_real: preciosReales[index] ? preciosReales[index].trim() : '0'
        }));

        // Filtrar duplicados usando un Set con clave única
        const productosUnicos = [];
        const seen = new Set();
        
        productosTemp.forEach(producto => {
          const key = `${producto.referencia}-${producto.presentacion}-${producto.precio_sugerido}-${producto.precio_real}`;
          if (!seen.has(key)) {
            seen.add(key);
            productosUnicos.push(producto);
          }
        });

        auditoriaProcessada.productos = productosUnicos;
      }

      console.log('🔍 Auditoria procesada para modal:', auditoriaProcessada);
      console.log('🔍 Productos procesados:', auditoriaProcessada.productos);

      setAuditoriaSeleccionada(auditoriaProcessada);
      setModalOpen(true);
    } catch (error) {
      console.error('Error al obtener detalles de auditoría:', error);
      setError('Error al cargar detalles de la auditoría');
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalOpen(false);
    setAuditoriaSeleccionada(null);
    setLoadingDetalles(false);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroKPI('TODOS');
    setFiltroActividad('TODAS');
    setFiltroEstado('TODOS');
    setBusquedaCodigo('');
  };

  // Verificaciones de carga y autenticación DESPUÉS de todos los hooks
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verificando autenticación...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return (
      <DashboardLayout>
        <div className="error-container">
          <h3>❌ Acceso Denegado</h3>
          <p>No tienes permisos para acceder a esta página</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} pageTitle="RESULTADOS AUDITORIAS">
      <div className="historial-registros-container">
        
        {/* Header */}
        <div className="historial-header">
          <div className="header-content">
        
          </div>
        </div>

        {/* Filtros */}
        <div className="search-filter-container">
          <FilterButtonsAuditoria
            filtroKPI={filtroKPI}
            setFiltroKPI={setFiltroKPI}
            filtroActividad={filtroActividad}
            setFiltroActividad={setFiltroActividad}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            busquedaCodigo={busquedaCodigo}
            setBusquedaCodigo={setBusquedaCodigo}
            onLimpiarFiltros={limpiarFiltros}
            totalRegistros={auditorias.length}
            registrosFiltrados={auditoriasFiltradas.length}
            isMobile={isMobile}
          />
        </div>

        {/* Contenido */}
        <div className="content-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando auditorías...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <h3>❌ Error al cargar auditorias</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-button"
              >
                Reintentar
              </button>
            </div>
          ) : auditoriasFiltradas.length === 0 ? (
            <div className="no-registros">
              <div className="no-registros-icon">🔍</div>
              <h3>No se encontraron auditorias</h3>
              <p>
                {auditorias.length === 0 
                  ? 'No tienes auditorias registradas aún.'
                  : 'No hay auditorias que coincidan con los filtros aplicados.'
                }
              </p>
              {auditorias.length > 0 && (
                <button onClick={limpiarFiltros} className="clear-filters-btn">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <RegistrosAuditoriaTable
              auditorias={auditoriasFiltradas}
              onSeleccionarAuditoria={handleSeleccionarAuditoria}
              isMobile={isMobile}
            />
          )}
        </div>

        {/* Modal */}
        {modalOpen && auditoriaSeleccionada && (
          <RegistroAuditoriaModal
            datos={auditoriaSeleccionada}
            isOpen={modalOpen}
            onClose={cerrarModal}
            loading={loadingDetalles}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
