import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMercadeoRoute } from '../../hooks/auth';
import { useAuth } from '../../hooks/auth/useAuth';
import { useNavigate } from 'react-router-dom';

// Importar hooks de mercadeo
import {
  useAsesoresMercadeo,
  useCoberturaMercadeo,
  useVolumenMercadeo,
  useVisitasMercadeo,
  useProfundidadMercadeo,
  usePreciosMercadeo,
  usePuntosVentaMercadeo
} from '../../hooks/mercadeo';

// Importar componentes de filtros
import FiltrosAvanzadosMercadeo from '../../components/Mercadeo/Filtros/FiltrosAvanzadosMercadeo';
import FiltroActivoMercadeo from '../../components/Mercadeo/Filtros/FiltroActivoMercadeo';

// Importar componente de gráficos (puede ser opcional si no existe)
// import GraficoGalonajePorSegmento from '../../components/shared/GraficoGalonajePorSegmento';

// Importar estilos
import '../../styles/Mercadeo/mercadeo-informe-seguimiento-dashboard.css';
import '../../styles/Asesor/asesor-informe-seguimiento-dashboard.css';
import '../../styles/Asesor/frecuencia-visitas.css';
import '../../styles/Asesor/precios.css';
import '../../styles/Asesor/profundidad.css';
import '../../styles/shared/download-buttons.css';

// Iconos para las métricas
import IconCobertura from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import IconVolumen from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import IconVisitas from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import IconProductividad from '../../assets/Iconos/IconosPage/Icono_Page_Catalogos.png';
import IconPrecios from '../../assets/Iconos/IconosPage/Icono_Page_PremioMayor.png';

/**
 * Dashboard de Informe de Seguimiento para Mercadeo con datos de asesores
 */
export default function MercadeoInformeSeguimientoDashboard() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
  const [busquedaAsesor, setBusquedaAsesor] = useState('');
  
  // Estados para filtros avanzados
  const [filtros, setFiltros] = useState({
    asesor_id: '',
    pdv_id: ''
  });
  
  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useMercadeoRoute();

  // Obtener datos de asesores y PDVs usando los hooks
  const { asesores, loading: asesoresLoading, error: asesoresError } = useAsesoresMercadeo();
  const { puntosVenta: pdvsData, loading: pdvsLoading } = usePuntosVentaMercadeo();
  
  // Debug de asesores
  console.log('Dashboard - asesores hook result:', {
    asesores: asesores,
    asesoresLength: asesores?.length,
    asesoresLoading,
    asesoresError,
    firstAsesor: asesores?.[0]
  });
  
  // Obtener datos de métricas usando los hooks
  const { cobertura: coberturaData, loading: coberturaLoading } = useCoberturaMercadeo(filtros);
  const { volumen: volumenData, loading: volumenLoading } = useVolumenMercadeo(filtros);
  const { visitas: visitasData, loading: visitasLoading } = useVisitasMercadeo(filtros);
  const { profundidad: profundidadData, loading: profundidadLoading } = useProfundidadMercadeo(filtros);
  const { precios: preciosData, loading: preciosLoading } = usePreciosMercadeo(filtros);

  // Verificar si está cargando datos
  const isLoading = authLoading || asesoresLoading || pdvsLoading || 
                   coberturaLoading || volumenLoading || visitasLoading || 
                   profundidadLoading || preciosLoading;

  // Preparar los datos de asesores y sus PDVs asignados
  useEffect(() => {
    console.log('=== DEBUG PREPARAR DATOS ===');
    console.log('asesores:', asesores);
    console.log('pdvsData:', pdvsData);
    console.log('asesores.length:', asesores?.length);
    console.log('pdvsData.length:', pdvsData?.length);
    
    if (asesores && asesores.length > 0 && pdvsData && pdvsData.length > 0) {
      // Asociar PDVs a cada asesor
      const asesoresConPdvs = asesores.map(asesor => {
        // Encontrar todos los PDVs asignados a este asesor
        const pdvsAsesor = pdvsData.filter(pdv => pdv.asesor_id === asesor.id);
        
        console.log(`Asesor ${asesor.nombre} (ID: ${asesor.id}) tiene ${pdvsAsesor.length} PDVs:`, pdvsAsesor);
        
        return {
          ...asesor,
          pdvs: pdvsAsesor
        };
      });
      
      console.log('asesoresConPdvs:', asesoresConPdvs);
      
      // Si hay un asesor seleccionado, actualizar su info con los nuevos datos
      if (asesorSeleccionado) {
        const asesorActualizado = asesoresConPdvs.find(a => a.id === asesorSeleccionado.id);
        if (asesorActualizado && JSON.stringify(asesorActualizado.pdvs) !== JSON.stringify(asesorSeleccionado.pdvs)) {
          setAsesorSeleccionado(asesorActualizado);
        }
      }
    }
    console.log('===============================');
  }, [asesores, pdvsData]); // Remover asesorSeleccionado de las dependencias

  // Filtrar asesores por búsqueda (código o nombre)
  const asesoresFiltrados = asesores && asesores.length > 0 ? 
    asesores.filter(asesor => 
      (asesor.codigo || '').toLowerCase().includes(busquedaAsesor.toLowerCase()) ||
      (asesor.nombre || '').toLowerCase().includes(busquedaAsesor.toLowerCase())
    ) : [];

  // Hook para manejar el scroll y mostrar indicadores - IMPORTANTE: Este hook DEBE estar aquí para mantener constante el orden de los hooks
  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.dashboard-seguimiento-container');
      const scrollIndicator = document.querySelector('.scroll-indicator');
      const scrollProgress = document.querySelector('.scroll-progress');
      
      if (container && window.innerWidth > 768) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isScrollable = scrollHeight > clientHeight;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
        
        // Mostrar/ocultar indicador de scroll
        if (scrollIndicator) {
          if (isScrollable && !isNearBottom) {
            scrollIndicator.classList.add('visible');
          } else {
            scrollIndicator.classList.remove('visible');
          }
        }
        
        // Actualizar barra de progreso
        if (scrollProgress && isScrollable) {
          const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
          scrollProgress.style.width = `${scrollPercentage}%`;
        }
      }
    };

    const container = document.querySelector('.dashboard-seguimiento-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Verificar scroll inicial
      setTimeout(handleScroll, 100);
      
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [selectedMetric]); // Agregamos selectedMetric como dependencia para evitar problemas de hooks

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }
  
  // Si está cargando los datos, mostrar loading
  if (isLoading) {
    return <div className="loading-container">
      <p>Cargando datos del dashboard...</p>
      <p>Asesores: {asesoresLoading ? 'Cargando...' : 'Listo'}</p>
      <p>PDVs: {pdvsLoading ? 'Cargando...' : 'Listo'}</p>
      <p>Cobertura: {coberturaLoading ? 'Cargando...' : 'Listo'}</p>
      <p>Volumen: {volumenLoading ? 'Cargando...' : 'Listo'}</p>
      <p>Visitas: {visitasLoading ? 'Cargando...' : 'Listo'}</p>
      <p>Profundidad: {profundidadLoading ? 'Cargando...' : 'Listo'}</p>
      <p>Precios: {preciosLoading ? 'Cargando...' : 'Listo'}</p>
    </div>;
  }

  // Si hay error en la carga de asesores, mostrar mensaje
  if (asesoresError) {
    return <div className="error-container">Error al cargar datos: {asesoresError}</div>;
  }

  // Manejar cambios en filtros avanzados
  const handleFiltrosChange = (nuevosFiltros) => {
    console.log('=== handleFiltrosChange ===');
    console.log('nuevosFiltros recibidos:', nuevosFiltros);
    
    // Los filtros ya vienen en el formato correcto (asesor_id, pdv_id)
    setFiltros(nuevosFiltros);
    console.log('Filtros establecidos:', nuevosFiltros);
    console.log('==========================');
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({ asesor_id: '', pdv_id: ''});
    setAsesorSeleccionado(null);
  };

  // Obtener todos los PDVs según los filtros aplicados
  const obtenerPdvs = () => {
    if (!pdvsData) return [];
    
    let pdvsResult = [...pdvsData];
    
    // Si hay filtro por asesor_id, filtrar PDVs
    if (filtros.asesor_id) {
      pdvsResult = pdvsResult.filter(pdv => pdv.asesor_id === filtros.asesor_id);
    } else if (asesorSeleccionado) {
      // Mantener compatibilidad con el filtro anterior
      pdvsResult = pdvsResult.filter(pdv => pdv.asesor_id === asesorSeleccionado.id);
    }
    
    // Aplicar filtro por PDV específico
    if (filtros.pdv_id) {
      pdvsResult = pdvsResult.filter(pdv => pdv.id === filtros.pdv_id);
    }
    
    // Aplicar filtro por ciudad
    if (filtros.ciudad) {
      pdvsResult = pdvsResult.filter(pdv => {
        if (pdv.direccion) {
          const partes = pdv.direccion.split(',');
          if (partes.length > 1) {
            const ciudad = partes[partes.length - 1].trim();
            return ciudad === filtros.ciudad;
          }
        }
        return false;
      });
    }
    
    return pdvsResult;
  };

  const pdvsActuales = obtenerPdvs();

  // Preparar datos para el dashboard desde los hooks
  const datosBase = {
    cobertura: coberturaData?.pdvs || coberturaData?.data || [],
    volumen: volumenData?.pdvs || volumenData?.data || [],
    frecuencia: visitasData?.pdvs || visitasData?.data || [],
    profundidad: profundidadData?.pdvs || profundidadData?.data || [],
    precios: preciosData?.pdvs || preciosData?.data || []
  };

  // Función para calcular puntos específicos por KPI desde los datos de los hooks
  const calcularPuntosKPI = (kpi, filtroAsesor = null) => {
    if (!Array.isArray(datosBase[kpi])) return 0;
    
    let datosFiltrados = datosBase[kpi];
    
    if (filtroAsesor && filtroAsesor.pdvs && Array.isArray(filtroAsesor.pdvs)) {
      const pdvsIds = filtroAsesor.pdvs.map(p => p.id);
      datosFiltrados = datosBase[kpi].filter(p => pdvsIds.includes(p.pdv_id));
    }
    
    return datosFiltrados.reduce((sum, p) => sum + (p.puntos || 0), 0);
  };

  // Datos de métricas desde los hooks
  const getMetricasData = () => {
    // Debug: Verificar estructura de datos
    console.log('=== DEBUG MÉTRICAS MERCADEO ===');
    console.log('coberturaData estructura:', coberturaData);
    console.log('volumenData estructura:', volumenData);
    console.log('visitasData estructura:', visitasData);
    console.log('profundidadData estructura:', profundidadData);
    console.log('preciosData estructura:', preciosData);
    console.log('===============================');
    
    // Crear métricas usando los datos del API (igual que OT)
    return [
      {
        id: 'cobertura',
        titulo: 'Cobertura',
        icon: IconCobertura,
        meta: coberturaData?.meta || 0,
        implementado: coberturaData?.real || 0,
        porcentaje: coberturaData?.porcentajeCumplimiento || 0,
        color: '#e30613',
        puntosLabel: `${coberturaData?.puntos || 0} puntos obtenidos`
      },
      {
        id: 'volumen',
        titulo: 'Volumen',
        icon: IconVolumen,
        meta: volumenData?.meta_volumen || 0,
        implementado: volumenData?.real_volumen || 0,
        porcentaje: volumenData?.porcentajeCumplimiento || 0,
        color: '#ff6b35',
        puntosLabel: `${volumenData?.puntos || 0} puntos obtenidos`
      },
      {
        id: 'visitas',
        titulo: 'Frecuencia',
        icon: IconVisitas,
        meta: visitasData?.meta || 0,
        implementado: visitasData?.real || 0,
        porcentaje: visitasData?.porcentajeCumplimiento || 0,
        color: '#f7931e',
        puntosLabel: `${visitasData?.puntos || 0} puntos obtenidos`
      },
      {
        id: 'productividad',
        titulo: 'Profundidad',
        icon: IconProductividad,
        meta: profundidadData?.meta || 0,
        implementado: profundidadData?.real || 0,
        porcentaje: profundidadData?.porcentajeCumplimiento || 0,
        color: '#00a651',
        puntosLabel: `${profundidadData?.puntos || 0} puntos obtenidos`
      },
      {
        id: 'precios',
        titulo: 'Precios',
        icon: IconPrecios,
        meta: preciosData?.meta || 0,
        implementado: preciosData?.real || 0,
        porcentaje: preciosData?.porcentajeCumplimiento || 0,
        color: '#0066cc',
        puntosLabel: `${preciosData?.puntos || 0} puntos obtenidos`
      }
    ];
  };

  const metricas = getMetricasData();

  const handleDetalleClick = (metricId) => {
    setSelectedMetric(metricId);
  };

  const cerrarDetalle = () => {
    setSelectedMetric(null);
  };

  const toggleFiltro = () => {
    setFiltroVisible(!filtroVisible);
  };

  const seleccionarAsesor = (asesor) => {
    // Actualizar filtros para la API
    setFiltros(prev => ({
      ...prev,
      asesor_id: asesor.id
    }));
    
    // Guardar el asesor seleccionado para la UI
    setAsesorSeleccionado(asesor);
    setFiltroVisible(false);
    setBusquedaAsesor('');
  };

  const limpiarFiltro = () => {
    // Limpiar filtro de asesor en la API
    setFiltros(prev => ({
      ...prev,
      asesor_id: ''
    }));
    
    setAsesorSeleccionado(null);
    setFiltroVisible(false);
    setBusquedaAsesor('');
  };

  // Este es un comentario que reemplaza el antiguo useEffect que se ha movido arriba
  // Movido arriba para mantener constante el orden de los hooks

  // Función para hacer scroll hacia abajo
  const scrollToBottom = () => {
    const container = document.querySelector('.dashboard-seguimiento-container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <DashboardLayout user={user} pageTitle="DASHBOARD - SEGUIMIENTO ASESORES">
      {/* Barra de progreso de scroll */}
      <div className="scroll-progress"></div>
      
      <div className="dashboard-seguimiento-container">
        {/* Filtros Avanzados */}
        <FiltrosAvanzadosMercadeo 
          asesores={asesores}
          pdvs={pdvsData}
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          className="filtros-mercadeo"
        />

        {/* Filtro Activo */}
        <FiltroActivoMercadeo 
          filtros={filtros}
          onLimpiarFiltros={limpiarFiltros}
          isMobile={window.innerWidth <= 768}
          asesores={asesores}
          pdvs={pdvsData}
        />

        {/* Información del asesor seleccionado */}
        {asesorSeleccionado && (
          <div className="asesor-filtro-sutil">
            <div className="asesor-filtro-contenido-sutil">
              <div className="asesor-filtro-badge">
                <span className="asesor-filtro-icon">👤</span>
                <div className="asesor-filtro-text">
                  <span className="asesor-filtro-label">Asesor:</span>
                  <span className="asesor-filtro-valor">{asesorSeleccionado.codigo} - {asesorSeleccionado.nombre}</span>
                  <span className="asesor-filtro-pdvs">{asesorSeleccionado.pdvs.length} PDVs asignados</span>
                </div>
              </div>
              <button className="asesor-filtro-remover" onClick={limpiarFiltro} title="Quitar filtro">
                <span>×</span>
              </button>
            </div>
          </div>
        )}

        {/* Contenedor de métricas */}
        <div className="metricas-container-50">
          <div className="metricas-grid">
            {metricas.map((metrica) => (
              <div 
                key={metrica.id} 
                className="metrica-card-kpi"
                onClick={() => handleDetalleClick(metrica.id)}
              >
                <div className="metrica-header-kpi">
                  <span className="metrica-titulo-kpi">{metrica.titulo}</span>
                </div>
                
                <div className="metrica-content-kpi">
                  <div className="metrica-datos-row">
                    <div className="dato-item-kpi">
                      <span className="dato-numero">{metrica.meta.toLocaleString()}</span>
                      <span className="dato-label-small">Meta</span>
                    </div>
                    <div className="dato-item-kpi">
                      <span className="dato-numero">{metrica.implementado.toLocaleString()}</span>
                      <span className="dato-label-small">Real</span>
                    </div>
                    <div className="dato-item-kpi">
                      <span className="dato-numero porcentaje-kpi">{metrica.porcentaje}%</span>
                      <span className="dato-label-small">Cumplimiento</span>
                    </div>
                  </div>
                  <div className="puntos-obtenidos-label">
                    <span className="puntos-label-text">{metrica.puntosLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón flotante para filtrar Asesor */}
        <div className="filtro-asesor-flotante">
          <button 
            className="btn-filtro-flotante" 
            onClick={toggleFiltro}
            title="Filtrar por Asesor"
          >
            👤 Asesor
          </button>
        </div>

        {/* Panel de filtro Asesor */}
        {filtroVisible && (
          <div className="filtro-overlay" onClick={() => setFiltroVisible(false)}>
            <div className="filtro-panel" onClick={(e) => e.stopPropagation()}>
              <div className="filtro-header">
                <h3>Seleccionar Asesor</h3>
                <button className="filtro-close" onClick={() => setFiltroVisible(false)}>×</button>
              </div>
              
              <div className="filtro-busqueda">
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={busquedaAsesor}
                  onChange={(e) => setBusquedaAsesor(e.target.value)}
                  className="filtro-input"
                />
              </div>
              
              <div className="filtro-lista">
                <div 
                  className="filtro-item todos"
                  onClick={limpiarFiltro}
                >
                  <span className="asesor-codigo">TODOS</span>
                  <span className="asesor-nombre">Ver todos los asesores</span>
                </div>
                
                {asesoresFiltrados.map(asesor => (
                  <div 
                    key={asesor.id}
                    className={`filtro-item ${asesorSeleccionado?.id === asesor.id ? 'seleccionado' : ''}`}
                    onClick={() => seleccionarAsesor(asesor)}
                  >
                    <span className="asesor-codigo">{asesor.codigo}</span>
                    <span className="asesor-nombre">{asesor.nombre}</span>
                    <span className="asesor-pdvs">{asesor.pdvs.length} PDVs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalle */}
        {selectedMetric && (
          <div className="modal-overlay" onClick={cerrarDetalle}>
            <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalle - {metricas.find(m => m.id === selectedMetric)?.titulo}</h2>
                <button className="close-btn" onClick={cerrarDetalle}>×</button>
              </div>
              <div className="modal-body">
                <DetalleMetricaMercadeo 
                  metricId={selectedMetric} 
                  asesorSeleccionado={asesorSeleccionado} 
                  datosBase={datosBase}
                  asesoresData={asesores}
                  filtros={filtros}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Barra espaciadora para evitar que se corte el contenido */}
        <div className="dashboard-spacer"></div>
      </div>
      
      {/* Indicador flotante de scroll */}
      <button className="scroll-indicator" onClick={scrollToBottom} title="Ver más contenido">
        Más contenido
      </button>
    </DashboardLayout>
  );
}

// Componente para mostrar detalles específicos de cada métrica en mercadeo
function DetalleMetricaMercadeo({ metricId, asesorSeleccionado, datosBase, asesoresData, filtros }) {
  // Obtener pdvsData del contexto superior
  const { puntosVenta: pdvsData } = usePuntosVentaMercadeo();

  // Función para encontrar asesor y PDV relacionados con un punto de datos
  const encontrarAsesorYPdv = (punto) => {
    if (!punto || !punto.pdv_id || !pdvsData) {
      console.log("Datos insuficientes para encontrar PDV", {punto, pdvsData});
      return {
        pdv: null,
        asesor: null
      };
    }

    // Intentar encontrar el PDV por ID
    const pdv = pdvsData.find(p => p.id === punto.pdv_id);
    if (!pdv) {
      console.log(`No se encontró PDV con ID ${punto.pdv_id}`);
      return { pdv: null, asesor: null };
    }
    
    // Intentar encontrar el asesor asociado al PDV
    let asesor = null;
    if (asesoresData && Array.isArray(asesoresData)) {
      asesor = asesoresData.find(a => a.id === pdv.asesor_id);
      if (!asesor) {
        console.log(`PDV encontrado pero no se encontró asesor con ID ${pdv.asesor_id}`);
      }
    }
    
    return {
      pdv,
      asesor
    };
  };
  
  // Productos Terpel desde datos reales o fallback a lista estática
  const productosTerpel = [
    { id: 1, nombre: 'TERPEL OILTEC 10W-30 TITANIO' },
    { id: 2, nombre: 'TERPEL OILTEC 10W-40 TITANIO' },
    { id: 3, nombre: 'TERPEL OILTEC 20W-50 TITANIO' },
    { id: 4, nombre: 'TERPEL OILTEC TERGAS 20W-50' },
    { id: 6, nombre: 'TERPEL OILTEC 20W-50 MULTIGRADO' },
    { id: 7, nombre: 'TERPEL OILTEC 40 MONOGRADO' },
    { id: 8, nombre: 'TERPEL OILTEC 50 MONOGRADO' },
    { id: 10, nombre: 'REFRIGERANTE ESTÁNDAR' },
    { id: 11, nombre: 'REFRIGERANTE LARGA VIDA' },
    { id: 12, nombre: 'TERPEL CELERITY 4T 15W-50 SEMISINTÉTICO' },
    { id: 13, nombre: 'TERPEL CELERITY 4T 20W-50 TITANIO' },
    { id: 14, nombre: 'TERPEL CELERITY 2T BIO ANTIHUMO' },
    { id: 15, nombre: 'TERPEL CELERITY 4T 25W-50 GRUESO' },
    { id: 16, nombre: 'TERPEL CELERITY 2T FB' }
  ];

  // Filtrar datos por asesor seleccionado utilizando los pdv_id
  const filtrarDatos = () => {
    // Determinar qué conjunto de datos usar según la métrica
    let metricaKey = metricId;
    
    // Ajuste para mapear 'visitas' a 'frecuencia' en los datos
    if (metricId === 'visitas') {
      metricaKey = 'frecuencia';
    }
    
    // Ajuste para mapear 'productividad' a 'profundidad' en los datos
    if (metricId === 'productividad') {
      metricaKey = 'profundidad';
    }
    
    if (!datosBase || !datosBase[metricaKey] || !Array.isArray(datosBase[metricaKey])) {
      console.log(`No hay datos disponibles para la métrica: ${metricId} (${metricaKey})`);
      return [];
    }
    
    let datos = [...datosBase[metricaKey]];
    
    // Si hay datos y hay un asesor seleccionado, filtrar por los PDVs de ese asesor
    if (asesorSeleccionado && asesorSeleccionado.pdvs && Array.isArray(asesorSeleccionado.pdvs)) {
      const pdvsIds = asesorSeleccionado.pdvs.map(pdv => pdv.id);
      datos = datos.filter(punto => punto.pdv_id && pdvsIds.includes(punto.pdv_id));
    }
    
    // Enriquecer los datos con información de PDVs y asesores
    datos = datos.map(punto => {
      const result = { ...punto };
      const { pdv, asesor } = encontrarAsesorYPdv(punto);
      
      // Agregar referencias directas al PDV y asesor encontrados
      result._pdv = pdv;
      result._asesor = asesor;
      
      // Para volumen, asegurarse de que tenga la meta correcta
      if (metricaKey === 'volumen') {
        // Prioridad 1: Usar meta del punto de datos si existe y es > 0
        if (punto.meta && punto.meta > 0) {
          result.meta = punto.meta;
        }
        // Prioridad 2: Usar meta_volumen del PDV si está disponible
        else if (pdv && pdv.meta_volumen && pdv.meta_volumen > 0) {
          result.meta = pdv.meta_volumen;
        }
        // Prioridad 3: Si hay real pero no hay meta, usar real como meta para mostrar 100%
        else if (punto.real && punto.real > 0) {
          result.meta = punto.real;
        }
        
        // Calcular porcentaje si tenemos meta
        if (result.meta > 0 && result.real >= 0) {
          result.porcentaje = Math.round((result.real / result.meta) * 100);
        }
      }
      
      return result;
    });
    
    console.log(`Datos filtrados y enriquecidos para ${metricId} (${metricaKey}):`, datos);
    return datos;
  };

  const datos = filtrarDatos();

  return (
    <div className="detalle-content">
      {metricId === 'cobertura' && (
        <div className="tabla-container">
          <h3>Estado de Registro{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
          <table className="detalle-tabla">
            <thead>
              <tr>
                <th>Código PDV</th>
                <th>Nombre PDV</th>
                {/* <th>Asesor</th> */}
                <th>Estado</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                const pdv = punto._pdv;
                const asesor = punto._asesor;
                
                return (
                  <tr key={index}>
                    <td>{pdv?.codigo || punto.codigo || 'N/A'}</td>
                    <td>{pdv?.nombre || punto.nombre || 'N/A'}</td>
                    {/* <td>{asesor?.nombre || 'N/A'}</td> */}
                    <td>
                      <span className={`estado ${punto.estado === 'Registrado' ? 'implementado' : 'no-implementado'}`}>
                        {punto.estado || 'No Registrado'}
                      </span>
                    </td>
                    <td><strong>{punto.puntos || 0}</strong></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                    No hay datos disponibles para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {metricId === 'volumen' && (
        <div className="volumen-detalles">
          <div className="tabla-container">
            <h3>Galonaje por PDV{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
            <table className="detalle-tabla">
              <thead>
                <tr>
                  <th>Código PDV</th>
                  <th>Nombre PDV</th>
                  {/* <th>Asesor</th> */}
                  <th>Segmento</th>
                  <th>Meta (Gal)</th>
                  <th>Real (Gal)</th>
                  <th>% Cumplimiento</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                  // Ahora usamos las propiedades directamente de los puntos enriquecidos
                  const pdv = punto._pdv;
                  const asesor = punto._asesor;
                  const meta = punto.meta || 0;
                  const real = punto.real || 0;
                  const porcentaje = punto.porcentaje || (meta > 0 ? Math.round((real / meta) * 100) : 0);
                  
                  return (
                    <tr key={index}>
                      <td>{pdv?.codigo || punto.codigo || 'N/A'}</td>
                      <td>{pdv?.nombre || punto.nombre || 'N/A'}</td>
                      {/* <td>{asesor?.nombre_asesor || 'N/A'}</td> */}
                      <td>{punto.segmento || pdv?.segmento || 'N/A'}</td>
                      <td>{meta.toLocaleString()}</td>
                      <td>{real.toLocaleString()}</td>
                      <td>
                        <span className={`porcentaje ${porcentaje >= 70 ? 'alto' : 'bajo'}`}>
                          {porcentaje}%
                        </span>
                      </td>
                      <td><strong>{punto.puntos || 0}</strong></td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>
                      No hay datos disponibles para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Gráfica de galonaje por segmento */}
          <div className="segmento-container">
            <h3>Galonaje Total por Segmento{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
            
            {Array.isArray(datos) && datos.length > 0 ? (
              <div className="graficas-container">
                <ResumenVolumenMercadeo 
                  datos={datos} 
                  filtros={filtros}
                  asesorSeleccionado={asesorSeleccionado}
                />
              </div>
            ) : (
              <div className="no-data">No hay datos disponibles para mostrar</div>
            )}
          </div>
        </div>
      )}

      {metricId === 'visitas' && (
        <div className="tabla-container">
          <h3>Frecuencia de Visitas{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
          <table className="detalle-tabla">
            <thead>
              <tr>
                <th>Código PDV</th>
                <th>Nombre PDV</th>
                {/* <th>Asesor</th> */}
                <th>Visitas</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                const pdv = punto._pdv;
                const asesor = punto._asesor;
                
                return (
                  <tr key={index}>
                    <td>{pdv?.codigo || punto.codigo || 'N/A'}</td>
                    <td>{pdv?.nombre || punto.nombre || 'N/A'}</td>
                    {/* <td>{asesor?.nombre || 'N/A'}</td> */}
                    <td>{punto.visitas || punto.cantidadVisitas || 0}</td>
                    <td><strong>{punto.puntos || 0}</strong></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                    No hay datos disponibles para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {metricId === 'productividad' && (
        <div className="tabla-container">
          <h3>Profundidad de Implementación{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
          <table className="detalle-tabla">
            <thead>
              <tr>
                <th>Código PDV</th>
                <th>Nombre PDV</th>
                {/* <th>Asesor</th> */}
                {/* <th>Productos</th> */}
                <th>Estado</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                const pdv = punto._pdv;
                const asesor = punto._asesor;
                const productosIds = punto.productos ? punto.productos.split(',').map(id => parseInt(id.trim())) : [];
                const nombresProductos = productosIds.map(id => {
                  const producto = productosTerpel.find(p => p.id === id);
                  return producto ? producto.nombre : `Producto ${id}`;
                }).join(', ');
                
                return (
                  <tr key={index}>
                    <td>{pdv?.codigo || punto.codigo || 'N/A'}</td>
                    <td>{pdv?.nombre || punto.nombre || 'N/A'}</td>
                    {/* <td>{asesor?.nombre || 'N/A'}</td> */}
                    {/* <td className="productos-cell">
                      <div className="productos-texto">{nombresProductos || 'Sin productos'}</div>
                    </td> */}
                    <td>
                      <span className={`estado ${punto.estado === 'Registrado' ? 'implementado' : 'no-implementado'}`}>
                        {punto.estado || 'No Registrado'}
                      </span>
                    </td>
                    <td><strong>{punto.puntos || 0}</strong></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                    No hay datos disponibles para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {metricId === 'precios' && (
        <div className="tabla-container">
          <h3>Control de Precios{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
          <table className="detalle-tabla">
            <thead>
              <tr>
                <th>Código PDV</th>
                <th>Nombre PDV</th>
                {/* <th>Asesor</th> */}
                {/* <th>Productos</th> */}
                <th>Estado</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                const pdv = punto._pdv;
                // const asesor = punto._asesor;
                const productosIds = punto.productos ? punto.productos.split(',').map(id => parseInt(id.trim())) : [];
                const nombresProductos = productosIds.map(id => {
                  const producto = productosTerpel.find(p => p.id === id);
                  return producto ? producto.nombre : `Producto ${id}`;
                }).join(', ');
                
                return (
                  <tr key={index}>
                    <td>{pdv?.codigo || punto.codigo || 'N/A'}</td>
                    <td>{pdv?.nombre || punto.nombre || 'N/A'}</td>
                    {/* <td>{asesor?.nombre || 'N/A'}</td> */}
                    {/* <td className="productos-cell">
                      <div className="productos-texto">{nombresProductos || 'Sin productos'}</div>
                    </td> */}
                    <td>
                      <span className={`estado ${punto.estado === 'Precios Reportados' ? 'implementado' : 'no-implementado'}`}>
                        {punto.estado || 'No Reportado'}
                      </span>
                    </td>
                    <td><strong>{punto.puntos || 0}</strong></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                    No hay datos disponibles para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar resumen de volumen (segmentos y productos)
function ResumenVolumenMercadeo({ datos, filtros, asesorSeleccionado }) {
  const [segmentos, setSegmentos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        setLoading(true);
        
        // Construir parámetros de consulta
        const params = new URLSearchParams();
        if (filtros.asesor_id) params.append('asesor_id', filtros.asesor_id);
        if (filtros.pdv_id) params.append('pdv_id', filtros.pdv_id);
        
        const response = await fetch(`/api/mercadeo/volumen-detalles?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSegmentos(data.segmentos || []);
          setProductos(data.productos || []);
        }
      } catch (error) {
        console.error('Error fetching volumen detalles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [filtros]);

  if (loading) {
    return <div className="loading">Cargando detalles...</div>;
  }

  return (
    <div className="resumen-volumen-container">
      {/* Resumen por Segmento */}
      <div className="segmentos-section">
        <h4>Resumen por Segmento</h4>
        <div className="segmentos-grid">
          {segmentos.map((segmento, index) => (
            <div key={index} className="segmento-card">
              <h5>{segmento.segmento || 'Sin segmento'}</h5>
              <div className="segmento-stats">
                <p><strong>PDVs:</strong> {segmento.cantidadPdvs}</p>
                <p><strong>Meta:</strong> {(segmento.metaTotal || 0).toLocaleString()} gal</p>
                <p><strong>Real:</strong> {(segmento.totalGalones || 0).toLocaleString()} gal</p>
                <p><strong>%:</strong> {segmento.metaTotal > 0 ? 
                  Math.round((segmento.totalGalones / segmento.metaTotal) * 100) : 0}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen por Producto */}
      <div className="productos-section">
        <h4>Resumen por Producto</h4>
        <div className="productos-table">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cajas</th>
                <th>Galonaje</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr key={index}>
                  <td>{producto.nombre}</td>
                  <td>{producto.numeroCajas}</td>
                  <td>{(producto.galonaje || 0).toLocaleString()}</td>
                  <td>{producto.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
