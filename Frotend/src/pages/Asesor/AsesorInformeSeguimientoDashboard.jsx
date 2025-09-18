import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import { useAuth } from '../../hooks/auth/useAuth';
import { useCoberturaAsesor } from '../../hooks/asesor/useCoberturaAsesor';
import { useVolumenAsesor } from '../../hooks/asesor/useVolumenAsesor';
import { useVisitasAsesor } from '../../hooks/asesor/useVisitasAsesor';
import { usePreciosAsesor } from '../../hooks/asesor/usePreciosAsesor';
import { useExcelDownload } from '../../hooks/shared/useExcelDownload';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import '../../styles/Asesor/asesor-informe-seguimiento-dashboard.css';
import '../../styles/Asesor/frecuencia-visitas.css';
import '../../styles/Asesor/precios.css';
import '../../styles/shared/download-buttons.css';
import FiltrosAvanzadosAsesor from '../../components/Asesor/Filtros/FiltrosAvanzadosAsesor';
import FiltroActivo from '../../components/Asesor/Filtros/FiltroActivo';
import * as XLSX from 'xlsx';

// Iconos para las métricas
import IconCobertura from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import IconVolumen from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import IconVisitas from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import IconPrecios from '../../assets/Iconos/IconosPage/Icono_Page_PremioMayor.png';

/**
 * Dashboard de Informe de Seguimiento con métricas
 */
export default function AsesorInformeSeguimientoDashboard() {
  const navigate = useNavigate(); // Agregar useNavigate
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const [pdvSeleccionado, setPdvSeleccionado] = useState(null);
  const [pdvs, setPdvs] = useState([]);
  const [busquedaPdv, setBusquedaPdv] = useState('');
  
  // Estados para filtros avanzados
  const [filtros, setFiltros] = useState({
    pdv: '',
    ciudad: ''
  });
  
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  
  // Hook para obtener token de autenticación
  const { token } = useAuth();

  // Hooks para datos reales
  const { cobertura, loading: loadingCobertura, error: errorCobertura } = useCoberturaAsesor(user?.id, pdvSeleccionado?.id);
  const { volumen, loading: loadingVolumen, error: errorVolumen } = useVolumenAsesor(user?.id, pdvSeleccionado?.id);
  const { visitas, loading: loadingVisitas, error: errorVisitas } = useVisitasAsesor(user?.id, pdvSeleccionado?.id);
  const { precios, loading: loadingPrecios, error: errorPrecios } = usePreciosAsesor(user?.id);
  
  // Hook para descargas Excel
  const { downloadAllKPIData, downloadVisitasHistorial, loading: loadingDownload } = useExcelDownload();

  // Filtrar PDVs por búsqueda (código o nombre) usando cobertura real
  const pdvsFiltrados = cobertura.pdvs.filter(pdv => {
    const codigoStr = pdv.codigo ? String(pdv.codigo) : '';
    const nombreStr = pdv.nombre ? String(pdv.nombre) : '';
    const busquedaLower = busquedaPdv.toLowerCase();
    
    return codigoStr.toLowerCase().includes(busquedaLower) || 
           nombreStr.toLowerCase().includes(busquedaLower);
  });

  // Si está cargando la autenticación o datos, mostrar loading
  if (loading || loadingCobertura || loadingVolumen || loadingVisitas || loadingPrecios) {
    return <div className="loading-container">Verificando autenticación o cargando datos...</div>;
  }

  // Manejar errores de autenticación o de datos
  const handleError = (errorMsg) => {
    // Si el error es de autenticación, mostrar botón para recargar/redirigir
    if (errorMsg.includes('token') || errorMsg.includes('autenticación')) {
      return (
        <div className="error-container">
          <p>{errorMsg}</p>
          <button 
            className="btn-reload" 
            onClick={() => {
              // Opción 1: Recargar la página
              window.location.reload();
              
              // Opción 2: Redirigir al login (descomenta si prefieres esta opción)
              // navigate('/login');
            }}
          >
            Reintentar / Recargar
          </button>
        </div>
      );
    }
    return <div className="error-container">{errorMsg}</div>;
  };

  // Verificar errores en los hooks
  if (errorCobertura) return handleError(errorCobertura);
  if (errorVolumen) return handleError(errorVolumen);
  if (errorVisitas) return handleError(errorVisitas);
  if (errorPrecios) return handleError(errorPrecios);

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }
  
  // Verificar si es promotoria para restringir KPIs
  const esPromotoria = user?.IsPromotoria === 1;
  //console.log('👤 Usuario es promotoria:', esPromotoria, 'IsPromotoria:', user?.IsPromotoria);
  
  // Asegurar que cobertura.pdvs es un array para evitar errores
  if (!Array.isArray(cobertura.pdvs)) {
    //console.warn('cobertura.pdvs no es un array:', cobertura.pdvs);
    cobertura.pdvs = [];
  }

  // Datos base para cálculos (solo para otras métricas, cobertura ahora es real)
  const datosBase = {
    volumen: [],
    frecuencia: [],
    precios: []
  };

  // Función para calcular puntos específicos por KPI y PDV
  const calcularPuntosKPI = (kpi, pdvCodigo = null) => {
    if (pdvCodigo) {
      const puntosPdv = datosBase[kpi].find(p => p.codigo === pdvCodigo)?.puntos || 0;
      return puntosPdv;
    } else {
      const totalPuntos = datosBase[kpi].reduce((sum, p) => sum + p.puntos, 0);
      return totalPuntos;
    }
  };

  // Función para calcular puntos totales por PDV
  const calcularPuntosTotales = (pdvCodigo = null) => {
    if (pdvCodigo) {
      // Para PDV específico, sumar puntos de todos los KPIs
      const puntosCobertura = datosBase.cobertura.find(p => p.codigo === pdvCodigo)?.puntos || 0;
      const puntosVolumen = datosBase.volumen.find(p => p.codigo === pdvCodigo)?.puntos || 0;
      const puntosFrecuencia = datosBase.frecuencia.find(p => p.codigo === pdvCodigo)?.puntos || 0;
      const puntosPrecios = datosBase.precios.find(p => p.codigo === pdvCodigo)?.puntos || 0;
      
      return puntosCobertura + puntosVolumen + puntosFrecuencia + puntosPrecios;
    } else {
      // Para todos los PDVs, sumar todos los puntos
      const totalCobertura = datosBase.cobertura.reduce((sum, p) => sum + p.puntos, 0);
      const totalVolumen = datosBase.volumen.reduce((sum, p) => sum + p.puntos, 0);
      const totalFrecuencia = datosBase.frecuencia.reduce((sum, p) => sum + p.puntos, 0);
      const totalPrecios = datosBase.precios.reduce((sum, p) => sum + p.puntos, 0);
      
      return totalCobertura + totalVolumen + totalFrecuencia + totalPrecios;
    }
  };

  const pdvsReales = cobertura.pdvs || [];

  // Manejar cambios en filtros avanzados
  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    // Si se selecciona un PDV específico, también configurar pdvSeleccionado para compatibilidad
    if (nuevosFiltros.pdv) {
      const pdv = pdvsReales.find(p => p.nombre === nuevosFiltros.pdv);
      setPdvSeleccionado(pdv);
    } else {
      setPdvSeleccionado(null);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({ pdv: '', ciudad: '' });
    setPdvSeleccionado(null);
  };

  // Obtener PDVs filtrados según los filtros aplicados
  const obtenerPdvsFiltrados = () => {
    let pdvsResult = [...pdvsReales];
    
    // Aplicar filtro por PDV específico
    if (filtros.pdv) {
      pdvsResult = pdvsResult.filter(pdv => pdv.nombre === filtros.pdv);
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

  // Datos de métricas con datos reales de PDV
  const getMetricasData = () => {
    const todasLasMetricas = [
      {
        id: 'cobertura',
        titulo: 'Cobertura',
        icon: IconCobertura,
        meta: pdvSeleccionado ? 1 : cobertura.totalAsignados,
        implementado: pdvSeleccionado
          ? (cobertura.pdvs.find(p => p.id === pdvSeleccionado.id)?.estado === 'REGISTRADO' ? 1 : 0)
          : cobertura.totalImplementados,
        porcentaje: pdvSeleccionado
          ? (cobertura.pdvs.find(p => p.id === pdvSeleccionado.id)?.estado === 'REGISTRADO' ? 100 : 0)
          : (cobertura.totalAsignados > 0 ? Math.round((cobertura.totalImplementados / cobertura.totalAsignados) * 100) : 0),
        color: '#e30613',
        puntosLabel: `${cobertura.puntosCobertura} puntos obtenidos`,
        restrictedForPromotoria: true
      },
      // Métrica de volumen con datos reales - SIEMPRE VISIBLE
      {
        id: 'volumen',
        titulo: 'Volumen',
        icon: IconVolumen,
        meta: pdvSeleccionado 
          ? (volumen?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.meta || 0)
          : volumen?.meta_volumen || 0,
        implementado: pdvSeleccionado
          ? (volumen?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.real || 0)
          : volumen?.real_volumen || 0,
        porcentaje: pdvSeleccionado
          ? (volumen?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.porcentaje || 0)
          : (volumen?.meta_volumen > 0 ? ((volumen?.real_volumen / volumen?.meta_volumen) * 100).toFixed(0) : 0),
        color: '#00a651',
        puntosLabel: `${volumen?.puntos || 0} puntos obtenidos`,
        restrictedForPromotoria: false
      },
      {
        id: 'visitas',
        titulo: 'Visitas',
        icon: IconVisitas,
        meta: pdvSeleccionado 
          ? (visitas?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.meta || 0)
          : visitas?.meta_visitas || 0,
        implementado: pdvSeleccionado
          ? (visitas?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.cantidadVisitas || 0)
          : visitas?.real_visitas || 0,
        porcentaje: pdvSeleccionado
          ? (visitas?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.porcentaje || 0)
          : visitas?.porcentajeCumplimiento || 0,
        color: '#f7941d',
        puntosLabel: `${visitas?.puntos || 0} puntos obtenidos`,
        restrictedForPromotoria: true
      },
      {
        id: 'precios',
        titulo: 'Precios',
        icon: IconPrecios,
        meta: pdvSeleccionado 
          ? 1
          : precios?.totalAsignados || 0,
        implementado: pdvSeleccionado
          ? (precios?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.estado === 'REPORTADOS' ? 1 : 0)
          : precios?.totalReportados || 0,
        porcentaje: pdvSeleccionado
          ? (precios?.pdvs?.find(p => p.id === pdvSeleccionado.id)?.estado === 'REPORTADOS' ? 100 : 0)
          : precios?.porcentaje || 0,
        color: '#e30613',
        puntosLabel: `${precios?.puntosPrecios || 0} puntos obtenidos`,
        restrictedForPromotoria: true
      }
    ];

    // Si es promotoria, filtrar solo volumen
    if (esPromotoria) {
      //console.log('🚫 Filtrando métricas para promotoria - solo volumen visible');
      return todasLasMetricas.filter(metrica => !metrica.restrictedForPromotoria);
    }

    // Si no es promotoria, mostrar todas las métricas
    return todasLasMetricas;
  };

  const metricas = getMetricasData();

  // Funciones para descargar datos
  const handleDownloadAllKPIs = () => {
    const allData = {
      cobertura: cobertura.pdvs || [],
      volumen: volumen.pdvs || [],
      visitas: visitas.pdvs || [],
      precios: precios.pdvs || []
    };
    
    downloadAllKPIData(allData, 'asesor');
  };

  const handleDownloadHistorial = async () => {
    try {
      const response = await fetch(`${API_URL}/api/asesor/historial-visitas/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener el historial de visitas');
      }

      // Crear blob del archivo Excel
      const blob = await response.blob();
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial_visitas_${user.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      //console.error('Error al descargar historial de visitas:', error);
      alert('Error al descargar el historial de visitas');
    }
  };

  const handleDetalleClick = (metricId) => {
    setSelectedMetric(metricId);
  };

  const cerrarDetalle = () => {
    setSelectedMetric(null);
  };

  const toggleFiltro = () => {
    setFiltroVisible(!filtroVisible);
  };

  const seleccionarPdv = (pdv) => {
    setPdvSeleccionado(pdv);
    setFiltroVisible(false);
    setBusquedaPdv('');
  };

  const limpiarFiltro = () => {
    setPdvSeleccionado(null);
    setFiltroVisible(false);
    setBusquedaPdv('');
  };

  return (
    <DashboardLayout user={user} pageTitle="DASHBOARD - INFORME SEGUIMIENTO">
      <div className="dashboard-seguimiento-container">
        {/* Filtros Avanzados */}
        <FiltrosAvanzadosAsesor 
          pdvs={pdvsReales}
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          className="filtros-asesor"
        />

        {/* Filtro Activo */}
        <FiltroActivo 
          filtros={filtros}
          onLimpiarFiltros={limpiarFiltros}
          isMobile={window.innerWidth <= 768}
          onDownloadAllKPIs={handleDownloadAllKPIs}
          onDownloadHistorial={handleDownloadHistorial}
          loadingDownload={loadingDownload}
        />

        {/* Contenedor de métricas con ancho fijo del 50% */}
        <div className="metricas-container-50">
          <div className="metricas-grid">
            {metricas.map((metrica) => (
              <div 
                key={metrica.id} 
                className="metrica-card-kpi"
                onClick={() => handleDetalleClick(metrica.id)}
              >
                {/* Pestaña roja superior con efecto mordida */}
                <div className="metrica-header-kpi">
                  <span className="metrica-titulo-kpi">{metrica.titulo}</span>
                </div>
                
                {/* Contenido blanco inferior */}
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
                  {/* Label de puntos obtenidos */}
                  <div className="puntos-obtenidos-label">
                    <span className="puntos-label-text">{metrica.puntosLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón flotante para filtrar PDV */}
        <div className="filtro-pdv-flotante">
          <button 
            className="btn-filtro-flotante" 
            onClick={toggleFiltro}
            title="Filtrar por PDV"
          >
            🔍 PDV
          </button>
        </div>

        {/* Panel de filtro PDV */}
        {filtroVisible && (
          <div className="filtro-overlay" onClick={() => setFiltroVisible(false)}>
            <div className="filtro-panel" onClick={(e) => e.stopPropagation()}>
              <div className="filtro-header">
                <h3>Seleccionar PDV</h3>
                <button className="filtro-close" onClick={() => setFiltroVisible(false)}>×</button>
              </div>
              
              <div className="filtro-busqueda">
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={busquedaPdv}
                  onChange={(e) => setBusquedaPdv(e.target.value)}
                  className="filtro-input"
                />
              </div>
              
              <div className="filtro-lista">
                <div 
                  className="filtro-item todos"
                  onClick={limpiarFiltro}
                >
                  <span className="pdv-codigo">TODOS</span>
                  <span className="pdv-nombre">Ver todos los PDVs</span>
                </div>
                
                {pdvsFiltrados.map(pdv => (
                  <div 
                    key={pdv.id}
                    className={`filtro-item ${pdvSeleccionado?.id === pdv.id ? 'seleccionado' : ''}`}
                    onClick={() => seleccionarPdv(pdv)}
                  >
                    <span className="pdv-codigo">{pdv.codigo}</span>
                    <span className="pdv-nombre">{pdv.nombre}</span>
                    <span className="pdv-meta">Meta: {(pdv.meta_volumen || 0).toLocaleString()}</span>
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
                <button 
                  className="download-btn modal-download-btn"
                  onClick={handleDownloadAllKPIs}
                  disabled={loadingDownload}
                >
                  {loadingDownload ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <span className="download-icon">📊</span>
                  )}
                  Descargar Reporte Completo
                </button>
                
                <DetalleMetrica 
                  metricId={selectedMetric} 
                  pdvSeleccionado={pdvSeleccionado} 
                  datosCobertura={cobertura}
                  datosVolumen={volumen}
                  datosVisitas={visitas}
                  datosPrecios={precios}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );

  // Componente para mostrar detalles de métricas
  function DetalleMetrica({ metricId, pdvSeleccionado, datosCobertura, datosVolumen, datosVisitas, datosPrecios }) {
    // Validar que los datos estén definidos y tengan la estructura correcta
    const coberturaPdvs = Array.isArray(datosCobertura?.pdvs) ? datosCobertura.pdvs : [];
    
    // Preparar datos según la métrica seleccionada
    let datosFiltrados = {
      puntos: [],
      productosResumen: [],
      frecuencia: [],
      visitasPorTipo: []
    };
    
    if (metricId === 'cobertura' && coberturaPdvs.length > 0) {
      // Para cobertura, usar datos reales del hook
      try {
        const pdvsFiltrados = pdvSeleccionado && pdvSeleccionado.id
          ? coberturaPdvs.filter(pdv => pdv.id === pdvSeleccionado.id)
          : coberturaPdvs;
          
        datosFiltrados.puntos = pdvsFiltrados.map(pdv => ({
          codigo: pdv.codigo ? String(pdv.codigo) : 'N/A',
          nombre: pdv.nombre ? String(pdv.nombre) : 'Sin nombre',
          direccion: pdv.direccion ? String(pdv.direccion) : 'No disponible',
          estado: pdv.estado === 'REGISTRADO' ? 'Registrado' : 'No Registrado',
          puntos: pdv.puntos || 0
        }));
      } catch (err) {
        //console.error('Error al preparar datos de cobertura:', err);
        datosFiltrados.puntos = [];
      }
    } else if (metricId === 'volumen') {
      try {
        // Para volumen, usar datos reales del hook de volumen
        const volumenPdvs = Array.isArray(datosVolumen?.pdvs) ? datosVolumen.pdvs : [];
        const segmentosData = Array.isArray(datosVolumen?.segmentos) ? datosVolumen.segmentos : [];
        const productosData = Array.isArray(datosVolumen?.productos) ? datosVolumen.productos : [];
        
        // Filtrar PDVs según selección
        const pdvsFiltrados = pdvSeleccionado && pdvSeleccionado.id
          ? volumenPdvs.filter(pdv => pdv.id === pdvSeleccionado.id)
          : volumenPdvs;
          
        datosFiltrados.puntos = pdvsFiltrados.map(pdv => ({
          codigo: pdv.codigo ? String(pdv.codigo) : 'N/A',
          nombre: pdv.nombre ? String(pdv.nombre) : 'Sin nombre',
          segmento: pdv.segmento || 'N/A',
          meta: pdv.meta || 0,
          real: pdv.real || 0,
          porcentaje: pdv.porcentaje || 0,
          puntos: pdv.puntos || 0
        }));
        
        // Datos de segmentos
        datosFiltrados.segmentos = segmentosData.map(seg => ({
          segmento: seg.segmento,
          cantidadPdvs: seg.cantidadPdvs,
          totalGalones: seg.totalGalones
        }));
        
        // Datos de productos
        datosFiltrados.productosResumen = productosData.map(prod => ({
          nombre: prod.nombre,
          numeroCajas: prod.numeroCajas,
          galonaje: prod.galonaje,
          porcentaje: prod.porcentaje
        }));
      } catch (err) {
        // console.error('Error al preparar datos de volumen:', err);
        // datosFiltrados = {
        //   puntos: [],
        //   productosResumen: [],
        //   segmentos: [],
        //   visitasPorTipo: []
        // };
      }
    } else if (metricId === 'visitas') {
      try {
        // Para visitas, usar datos reales del hook de visitas
        const visitasPdvs = Array.isArray(datosVisitas?.pdvs) ? datosVisitas.pdvs : [];
        const tiposVisitaData = Array.isArray(datosVisitas?.tiposVisita) ? datosVisitas.tiposVisita : [];
        
        // Filtrar PDVs según selección
        const pdvsFiltrados = pdvSeleccionado && pdvSeleccionado.id
          ? visitasPdvs.filter(pdv => pdv.id === pdvSeleccionado.id)
          : visitasPdvs;
        
        datosFiltrados.puntos = pdvsFiltrados;
        datosFiltrados.visitasPorTipo = tiposVisitaData;
      } catch (err) {
        //console.error('Error al preparar datos de visitas:', err);
        datosFiltrados = {
          puntos: [],
          productosResumen: [],
          segmentos: [],
          visitasPorTipo: []
        };
      }
    } else if (metricId === 'precios' && Array.isArray(datosPrecios?.pdvs)) {
      try {
        const preciosPdvs = datosPrecios.pdvs;
        
        // Filtrar PDVs según selección
        const pdvsFiltrados = pdvSeleccionado && pdvSeleccionado.id
          ? preciosPdvs.filter(pdv => pdv.id === pdvSeleccionado.id)
          : preciosPdvs;
        
        datosFiltrados.puntos = pdvsFiltrados.map(pdv => ({
          codigo: pdv.codigo ? String(pdv.codigo) : 'N/A',
          nombre: pdv.nombre ? String(pdv.nombre) : 'Sin nombre',
          direccion: pdv.direccion ? String(pdv.direccion) : 'No disponible',
          estado: pdv.estado === 'REPORTADOS' ? 'Registrado' : 'No Registrado',
          puntos: pdv.puntos || 0
        }));
      } catch (err) {
        //console.error('Error al preparar datos de precios:', err);
        datosFiltrados.puntos = [];
      }
    }

    return (
      <div className="detalle-content">
        {metricId === 'cobertura' && (
          <div className="tabla-container">
            <h3>Estado de Registro por PDV</h3>
            <table className="detalle-tabla">
              <thead>
                <tr>
                  <th>COD</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.puntos.length > 0 ? (
                  datosFiltrados.puntos.map((punto, index) => (
                    <tr key={index}>
                      <td>{punto.codigo}</td>
                      <td>{punto.nombre}</td>
                      <td>{punto.direccion}</td>
                      <td>
                        <span className={`estado ${punto.estado === 'Registrado' ? 'implementado' : 'no-implementado'}`}>
                          {punto.estado}
                        </span>
                      </td>
                      <td>
                        <strong>{punto.puntos}</strong>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="sin-datos">No hay datos disponibles</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mostrar datos reales para volumen */}
        {metricId === 'volumen' && (
          <div className="volumen-detalles">
            <div className="tabla-container">
              <h3>Galonaje por PDV</h3>
              <table className="detalle-tabla">
                <thead>
                  <tr>
                    <th>COD</th>
                    <th>Nombre PDV</th>
                    <th>Segmento</th>
                    <th>Meta (Gal)</th>
                    <th>Real (Gal)</th>
                    <th>% Cumplimiento</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.puntos.length > 0 ? (
                    datosFiltrados.puntos.map((punto, index) => (
                      <tr key={index}>
                        <td>{punto.codigo}</td>
                        <td>{punto.nombre}</td>
                        <td>{punto.segmento}</td>
                        <td>{punto.meta.toLocaleString()}</td>
                        <td>{punto.real.toLocaleString()}</td>
                        <td>{punto.porcentaje}%</td>
                        <td><strong>{punto.puntos}</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="sin-datos">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Tabla de segmentos */}
            {datosFiltrados.segmentos && datosFiltrados.segmentos.length > 0 && (
              <div className="tabla-container">
                <h3>Resumen por Segmento</h3>
                <table className="detalle-tabla">
                  <thead>
                    <tr>
                      <th>Segmento</th>
                      <th>Cantidad PDVs</th>
                      <th>Total Galones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosFiltrados.segmentos.map((seg, index) => (
                      <tr key={index}>
                        <td>{seg.segmento}</td>
                        <td>{seg.cantidadPdvs}</td>
                        <td>{seg.totalGalones.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Tabla de productos */}
            {datosFiltrados.productosResumen && datosFiltrados.productosResumen.length > 0 && (
              <div className="tabla-container">
                <h3>Resumen por Producto</h3>
                <table className="detalle-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cajas</th>
                      <th>Galonaje</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosFiltrados.productosResumen.map((prod, index) => (
                      <tr key={index}>
                        <td>{prod.nombre}</td>
                        <td>{prod.numeroCajas}</td>
                        <td>{prod.galonaje.toLocaleString()}</td>
                        <td>{prod.porcentaje}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {metricId === 'visitas' && (
          <div className="visitas-detalles">
            <div className="tabla-container">
              <h3>Frecuencia de Visitas por PDV</h3>
              <table className="detalle-tabla">
                <thead>
                  <tr>
                    <th>COD</th>
                    <th>Nombre</th>
                    <th>Meta</th>
                    <th>Cantidad Visitas</th>
                    <th>% Cumplimiento</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {datosVisitas && Array.isArray(datosVisitas.pdvs) && datosVisitas.pdvs.length > 0 ? (
                    datosVisitas.pdvs
                      .filter(pdv => !pdvSeleccionado || pdv.id === pdvSeleccionado.id)
                      .map((pdv, index) => (
                        <tr key={index}>
                          <td>{pdv.codigo}</td>
                          <td>{pdv.nombre}</td>
                          <td>{pdv.meta}</td>
                          <td>{pdv.cantidadVisitas}</td>
                          <td>{pdv.porcentaje}%</td>
                          <td><strong>{pdv.puntos}</strong></td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="sin-datos">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mostrar resumen por tipo de visita si hay datos disponibles */}
            {datosVisitas && Array.isArray(datosVisitas.tiposVisita) && datosVisitas.tiposVisita.length > 0 && (
              <div className="tabla-container">
                <h3>Visitas por Tipo</h3>
                <table className="detalle-tabla">
                  <thead>
                    <tr>
                      <th>Tipo de Visita</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosVisitas.tiposVisita.map((tipo, index) => (
                      <tr key={index}>
                        <td>{tipo.tipo}</td>
                        <td>{tipo.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Mostrar datos reales para precios */}
        {metricId === 'precios' && (
          <div className="precios-detalles">
            <div className="estado-precios-resumen">
              <h4>Estado de Precios por PDV</h4>
              <span className="pdvs-con-precio">
                {datosPrecios.totalReportados} de {datosPrecios.totalAsignados} PDVs con precios reportados
              </span>
              <span className="porcentaje-precio">
                {datosPrecios.porcentaje}%
              </span>
            </div>
            
            <div className="tabla-container">
              <table className="tabla-precios">
                <thead>
                  <tr>
                    <th>COD</th>
                    <th>NOMBRE</th>
                    <th>DIRECCIÓN</th>
                    <th>ESTADO</th>
                    <th>PUNTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.puntos.length > 0 ? (
                    datosFiltrados.puntos.map((punto, index) => (
                      <tr key={index}>
                        <td>{punto.codigo}</td>
                        <td>{punto.nombre}</td>
                        <td>{punto.direccion}</td>
                        <td>
                          <span className={`estado-precio ${punto.estado === 'Registrado' ? 'reportados' : 'no-reportados'}`}>
                            {punto.estado === 'Registrado' ? 'PRECIOS REPORTADOS' : 'NO REPORTADOS'}
                          </span>
                        </td>
                        <td>{punto.puntos}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="sin-datos">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* No necesitamos mostrar últimos precios reportados ni productos */}
          </div>
        )}
      </div>
    );
  }
}
