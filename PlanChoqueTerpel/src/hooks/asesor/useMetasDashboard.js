import { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Hook personalizado para manejar los datos del dashboard de metas
 * @param {Object} user - Usuario autenticado (opcional, se puede obtener del contexto de auth)
 * @returns {Object} Estados y funciones para el dashboard
 */
export const useMetasDashboard = (user) => {
  const { authenticatedFetch, token, isAuthenticated } = useAuthContext();

  // Estado único para todos los datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    visitas: [],
    kpiDashboard: null,
    pdvMetas: [],
    kpiPuntos: [],
  });

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    kpiDashboard: null,
    pdvMetas: null,
    kpiPuntos: null,
  });

  // Estados para modales
  const [modalOpen, setModalOpen] = useState(false);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiPdvData, setKpiPdvData] = useState([]);
  const [loadingKpiData, setLoadingKpiData] = useState(false);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    nombre: '',
    codigo: ''
  });

  // Estados para puntos actualizados
  const [puntosPorKpiActualizados, setPuntosPorKpiActualizados] = useState([]);

  // Definición de KPI Labels
  const kpiLabels = [
    { id: 1, label: 'VOLUMEN', color: '#e30613', name: 'volumen' },
    { id: 2, label: 'PRECIO', color: '#a1000b', name: 'precio' },
    { id: 3, label: 'FRECUENCIA', color: '#007bff', name: 'frecuencia' },
    { id: 4, label: 'COBERTURA', color: '#28a745', name: 'cobertura' },
    { id: 5, label: 'PROFUNDIDAD', color: '#ffa751', name: 'profundidad' }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id && isAuthenticated && token) {
      setLoading(true);
      Promise.all([
        authenticatedFetch(`${API_URL}/api/asesor/visitas-pdv-resumen/${user.id}`).then(res => res.json()).catch(() => null),
        authenticatedFetch(`${API_URL}/api/asesor/dashboard-kpi/${user.id}`).then(res => res.json()).catch(() => null),
        authenticatedFetch(`${API_URL}/api/asesor/pdv-metas/${user.id}`).then(res => res.json()).catch(() => null),
        authenticatedFetch(`${API_URL}/api/asesor/kpi-puntos/${user.id}`).then(res => res.json()).catch(() => null),
      ]).then(([visitasRes, kpiRes, metasRes, puntosRes]) => {
        setDashboardData({
          visitas: visitasRes?.success ? visitasRes.data : [],
          kpiDashboard: kpiRes?.success ? kpiRes : null,
          pdvMetas: metasRes?.success ? metasRes.data || [] : [],
          kpiPuntos: puntosRes?.success ? puntosRes.data || [] : [],
        });
        setErrors({
          kpiDashboard: !kpiRes?.success ? 'Hubo un error al cargar el KPI. Inténtelo de nuevo.' : null,
          pdvMetas: !metasRes?.success ? 'Hubo un error al cargar la gráfica de metas. Inténtelo de nuevo.' : null,
          kpiPuntos: !puntosRes?.success ? 'Hubo un error al cargar la gráfica de KPIs. Inténtelo de nuevo.' : null,
        });
        setLoading(false);
      });
    }
  }, [user?.id, authenticatedFetch, isAuthenticated, token]);

  // Función para cargar datos de puntos por KPI
  const cargarPuntosKpiReales = async () => {
    if (!user?.id || !isAuthenticated || !token) return [];
    
    try {
      const kpiPromises = kpiLabels.map(async (kpi) => {
        try {
          const response = await authenticatedFetch(`${API_URL}/api/asesor/kpi-puntos-por-pdv/${user.id}/${kpi.name}`);
          const result = await response.json();
          if (result.success) {
            const totalPuntos = result.data.reduce((total, pdv) => total + (Number(pdv.puntos_totales) || 0), 0);
            return { ...kpi, puntos: totalPuntos };
          }
        } catch (error) {
          console.error(`Error cargando KPI ${kpi.name}:`, error);
        }
        return { ...kpi, puntos: 0 };
      });
      
      const resultados = await Promise.all(kpiPromises);
      setPuntosPorKpiActualizados(resultados);
      return resultados;
    } catch (error) {
      console.error('Error general cargando KPIs:', error);
      return kpiLabels.map(kpi => ({ ...kpi, puntos: 0 }));
    }
  };

  // Cargar automáticamente los puntos reales al inicializar
  useEffect(() => {
    if (user?.id && !loading && isAuthenticated && token) {
      cargarPuntosKpiReales();
    }
  }, [user?.id, loading, isAuthenticated, token]);

  // Función para abrir modal de KPI específico
  const openKpiModal = async (kpi) => {
    if (!user?.id || !isAuthenticated || !token) {
      console.error('No se puede abrir el modal: usuario no autenticado');
      return;
    }

    setSelectedKpi(kpi);
    setKpiModalOpen(true);
    setLoadingKpiData(true);
    
    try {
      const response = await authenticatedFetch(`${API_URL}/api/asesor/kpi-puntos-por-pdv/${user.id}/${kpi.name}`);
      const result = await response.json();
      if (result.success) {
        setKpiPdvData(result.data);
        
        // Actualizar el total en tiempo real
        const totalReal = result.data.reduce((total, pdv) => total + (Number(pdv.puntos_totales) || 0), 0);
        
        setPuntosPorKpiActualizados(prev => 
          prev.map(kpiItem => 
            kpiItem.id === kpi.id 
              ? { ...kpiItem, puntos: totalReal }
              : kpiItem
          )
        );
      } else {
        setKpiPdvData([]);
      }
    } catch (error) {
      console.error('Error al cargar datos del KPI:', error);
      setKpiPdvData([]);
    } finally {
      setLoadingKpiData(false);
    }
  };

  return {
    dashboardData,
    loading,
    errors,
    kpiLabels,
    puntosPorKpiActualizados,
    setPuntosPorKpiActualizados,
    cargarPuntosKpiReales,
    filters,
    setFilters,
    modalOpen,
    setModalOpen,
    kpiModalOpen,
    setKpiModalOpen,
    selectedKpi,
    setSelectedKpi,
    kpiPdvData,
    loadingKpiData,
    openKpiModal
  };
};
