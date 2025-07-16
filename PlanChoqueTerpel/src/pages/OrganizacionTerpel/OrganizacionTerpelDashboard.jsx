import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useOTRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
// Importar hooks de OT
import { 
  useCoberturaOT, 
  useVolumenOT, 
  useVisitasOT, 
  usePreciosOT, 
  useProfundidadOT,
  useAsesoresOT,
  useAgentesOT,
  useHistorialOT,
  usePuntosVentaOT
} from '../../hooks/ot';
import { useExcelDownload } from '../../hooks/shared/useExcelDownload';
import '../../styles/Mercadeo/mercadeo-informe-seguimiento-dashboard.css';
import '../../styles/shared/download-buttons.css';
import FiltrosAvanzadosOT from '../../components/organizacionTerpel/FiltrosAvanzadosOT';
import FiltroActivoOT from '../../components/organizacionTerpel/FiltroActivoOT';
// Iconos para las métricas
import IconCobertura from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import IconVolumen from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import IconVisitas from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import IconProductividad from '../../assets/Iconos/IconosPage/Icono_Page_Catalogos.png';
import IconPrecios from '../../assets/Iconos/IconosPage/Icono_Page_PremioMayor.png';

/**
 * Dashboard de Informe de Seguimiento para Mercadeo con datos de asesores
 */


export default function OrganizacionTerpelDashboard() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
  const [busquedaAsesor, setBusquedaAsesor] = useState('');
  
  // Estados para filtros avanzados
  const [filtros, setFiltros] = useState({
    asesor: '',
    pdv: '',
    compania: '',
    agente: ''
  });

  // Proteger la ruta - solo OT puede acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useOTRoute();

  // Estados para manejar el modal
  useEffect(() => {
    if (selectedMetric) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedMetric]);

  // Usar los hooks de OT para obtener datos reales
  const { cobertura, loading: loadingCobertura, error: errorCobertura } = useCoberturaOT(filtros);
  const { volumen, loading: loadingVolumen, error: errorVolumen } = useVolumenOT(filtros);
  const { visitas, loading: loadingVisitas, error: errorVisitas } = useVisitasOT(filtros);
  const { precios, loading: loadingPrecios, error: errorPrecios } = usePreciosOT(filtros);
  const { profundidad, loading: loadingProfundidad, error: errorProfundidad } = useProfundidadOT(filtros);
  const { asesores, loading: loadingAsesores, error: errorAsesores } = useAsesoresOT();
  const { agentes, loading: loadingAgentes, error: errorAgentes } = useAgentesOT();
  const { historial, loading: loadingHistorial, error: errorHistorial } = useHistorialOT();
  const { pdvs, loading: loadingPdvs, error: errorPdvs } = usePuntosVentaOT();

  // Hook para descargas Excel
  const { downloadAllKPIData, downloadVisitasHistorial, loading: loadingDownload } = useExcelDownload();

  // Función para aplicar filtros a los datos
  const aplicarFiltros = (datos) => {
    if (!Array.isArray(datos)) return [];
    
    return datos.filter(item => {
      // Filtro por asesor
      if (filtros.asesor && item.asesor_id && item.asesor_id.toString() !== filtros.asesor) {
        return false;
      }
      
      // Filtro por PDV
      if (filtros.pdv && item.id && item.id.toString() !== filtros.pdv) {
        return false;
      }
      
      // Filtro por compañía
      if (filtros.compania && item.compania && item.compania !== filtros.compania) {
        return false;
      }
      
      // Filtro por agente
      if (filtros.agente && item.agente_id && item.agente_id.toString() !== filtros.agente) {
        return false;
      }
      
      return true;
    });
  };

  // Filtrar datos basado en los filtros activos
  const coberturaPdvsFiltrados = aplicarFiltros(cobertura.pdvs);
  const volumenPdvsFiltrados = aplicarFiltros(volumen.pdvs);
  const visitasPdvsFiltrados = aplicarFiltros(visitas.pdvs);
  const preciosPdvsFiltrados = aplicarFiltros(precios.pdvs);
  const profundidadPdvsFiltrados = aplicarFiltros(profundidad.pdvs);

  // Filtrar asesores por búsqueda (nombre, email)
  const asesoresFiltrados = asesores.filter(asesor => {
    const coincideBusqueda =
      asesor.name.toLowerCase().includes(busquedaAsesor.toLowerCase()) ||
      asesor.email.toLowerCase().includes(busquedaAsesor.toLowerCase());
    return coincideBusqueda;
  });



  // Manejar cambios en filtros avanzados
  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    // Limpiar asesor seleccionado si se cambian filtros
    if (nuevosFiltros.asesor && nuevosFiltros.asesor !== asesorSeleccionado?.id?.toString()) {
      const asesor = asesores.find(a => a.id.toString() === nuevosFiltros.asesor);
      setAsesorSeleccionado(asesor);
    }
    // Cerrar modal si está abierto cuando se cambian filtros
    if (selectedMetric) {
      setSelectedMetric(null);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({ asesor: '', pdv: '', compania: '', agente: '' });
    setAsesorSeleccionado(null);
    // Cerrar modal si está abierto
    if (selectedMetric) {
      setSelectedMetric(null);
    }
  };

  // Función para calcular las métricas usando los datos filtrados
  const getMetricasData = () => {
    const coberturaTotal = coberturaPdvsFiltrados.length;
    const coberturaImplementados = coberturaPdvsFiltrados.filter(p => p.estado === 'IMPLEMENTADO').length;
    
    const volumenMeta = volumenPdvsFiltrados.reduce((sum, p) => sum + (p.meta || 0), 0);
    const volumenReal = volumenPdvsFiltrados.reduce((sum, p) => sum + (p.real || 0), 0);
    
    const visitasMeta = visitasPdvsFiltrados.reduce((sum, p) => sum + (p.meta || 0), 0);
    const visitasReal = visitasPdvsFiltrados.reduce((sum, p) => sum + (p.cantidadVisitas || 0), 0);
    
    const preciosTotal = preciosPdvsFiltrados.length;
    const preciosReportados = preciosPdvsFiltrados.filter(p => p.estado === 'REPORTADOS').length;
    
    const profundidadTotal = profundidadPdvsFiltrados.length;
    const profundidadRegistrados = profundidadPdvsFiltrados.filter(p => p.estado === 'REGISTRADO').length;
    
    return [
      {
        id: 'cobertura',
        titulo: 'Cobertura',
        icon: IconCobertura,
        meta: coberturaTotal,
        implementado: coberturaImplementados,
        porcentaje: coberturaTotal > 0 ? Math.round((coberturaImplementados / coberturaTotal) * 100) : 0,
        color: '#e30613',
        puntosLabel: `${coberturaPdvsFiltrados.reduce((sum, p) => sum + (p.puntos || 0), 0)} puntos obtenidos`
      },
      {
        id: 'volumen',
        titulo: 'Volumen',
        icon: IconVolumen,
        meta: volumenMeta,
        implementado: volumenReal,
        porcentaje: volumenMeta > 0 ? Math.round((volumenReal / volumenMeta) * 100) : 0,
        color: '#ff6b35',
        puntosLabel: `${volumenPdvsFiltrados.reduce((sum, p) => sum + (p.puntos || 0), 0)} puntos obtenidos`
      },
      {
        id: 'visitas',
        titulo: 'Frecuencia',
        icon: IconVisitas,
        meta: visitasMeta,
        implementado: visitasReal,
        porcentaje: visitasMeta > 0 ? Math.round((visitasReal / visitasMeta) * 100) : 0,
        color: '#f7931e',
        puntosLabel: `${visitasPdvsFiltrados.reduce((sum, p) => sum + (p.puntos || 0), 0)} puntos obtenidos`
      },
      {
        id: 'productividad',
        titulo: 'Profundidad',
        icon: IconProductividad,
        meta: profundidadTotal,
        implementado: profundidadRegistrados,
        porcentaje: profundidadTotal > 0 ? Math.round((profundidadRegistrados / profundidadTotal) * 100) : 0,
        color: '#00a651',
        puntosLabel: `${profundidadPdvsFiltrados.reduce((sum, p) => sum + (p.puntos || 0), 0)} puntos obtenidos`
      },
      {
        id: 'precios',
        titulo: 'Precios',
        icon: IconPrecios,
        meta: preciosTotal,
        implementado: preciosReportados,
        porcentaje: preciosTotal > 0 ? Math.round((preciosReportados / preciosTotal) * 100) : 0,
        color: '#0066cc',
        puntosLabel: `${preciosPdvsFiltrados.reduce((sum, p) => sum + (p.puntos || 0), 0)} puntos obtenidos`
      }
    ];
  };

  const metricas = getMetricasData();

  // Funciones para descargar datos
  const handleDownloadAllKPIs = () => {
    const allData = {
      cobertura: coberturaPdvsFiltrados,
      volumen: volumenPdvsFiltrados,
      visitas: visitasPdvsFiltrados,
      productividad: profundidadPdvsFiltrados,
      precios: preciosPdvsFiltrados
    };
    
    downloadAllKPIData(allData, 'ot');
  };

  const handleDownloadHistorial = () => {
    // Simular datos de historial de visitas (en una implementación real, estos vendrían del hook)
    const visitasData = historial.map(item => ({
      codigo_pdv: item.codigo_pdv,
      nombre_pdv: item.nombre_pdv,
      asesor_nombre: item.asesor_nombre,
      fecha_visita: item.fecha_visita,
      hora_visita: item.hora_visita,
      tipo_visita: item.tipo_visita,
      observaciones: item.observaciones,
      estado: item.estado,
      puntos: item.puntos
    }));
    
    downloadVisitasHistorial(visitasData);
  };

  const handleDetalleClick = (metricId) => {
    setSelectedMetric(metricId);
  };

  const handleCloseModal = () => {
    setSelectedMetric(null);
  };

  // Función para cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedMetric) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedMetric]);

  const toggleFiltro = () => {
    setFiltroVisible(!filtroVisible);
  };

  const seleccionarAsesor = (asesor) => {
    setAsesorSeleccionado(asesor);
    setFiltroVisible(false);
  };

  const limpiarFiltro = () => {
    setAsesorSeleccionado(null);
    setFiltroVisible(false);
  };

  // Manejo del scroll para mostrar indicador
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
  }, []);

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
        <FiltrosAvanzadosOT 
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          className="filtros-mercadeo"
        />

        {/* Filtro Activo */}
        <FiltroActivoOT 
          filtros={filtros}
          onLimpiarFiltros={limpiarFiltros}
          isMobile={window.innerWidth <= 768}
        />

        {/* Sección de Descarga de Reportes */}
        <div className="dashboard-download-section">
          <div className="dashboard-download-title">
            Descargar Reportes Completos
          </div>
          <div className="download-buttons-container">
            <button 
              className="download-btn download-btn-tooltip"
              onClick={handleDownloadAllKPIs}
              disabled={loadingDownload}
              data-tooltip="Descargar reporte completo con todos los KPIs en hojas separadas"
              style={{ minWidth: '200px', fontSize: '15px' }}
            >
              {loadingDownload ? (
                <div className="loading-spinner"></div>
              ) : (
                <span className="download-icon">�</span>
              )}
              Descargar Todos los KPIs
            </button>
          </div>
          
          {/* Sección de Historial de Visitas */}
          <div className="historial-download-container">
            <div className="historial-download-title">
              Historial de Implementaciones
            </div>
            <button 
              className="historial-download-btn"
              onClick={handleDownloadHistorial}
              disabled={loadingDownload}
            >
              {loadingDownload ? (
                <div className="loading-spinner"></div>
              ) : (
                <span>📋</span>
              )}
              Descargar Historial Completo de Visitas
            </button>
          </div>
        </div>

        {/* Información del asesor seleccionado */}
        {asesorSeleccionado && (
          <div className="asesor-filtro-sutil">
            <div className="asesor-filtro-contenido-sutil">
              <div className="asesor-filtro-badge">
                <span className="asesor-filtro-icon">👤</span>
                <div className="asesor-filtro-text">
                  <span className="asesor-filtro-label">Asesor:</span>
                  <span className="asesor-filtro-valor">{asesorSeleccionado.name}</span>
                  <span className="asesor-filtro-pdvs">{asesorSeleccionado.email}</span>
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
            placeholder="Buscar por nombre o email..."
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
                    <span className="asesor-codigo">{asesor.id}</span>
                    <span className="asesor-nombre">{asesor.name}</span>
                    <span className="asesor-pdvs">{asesor.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalle */}
        {selectedMetric && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalle - {metricas.find(m => m.id === selectedMetric)?.titulo}</h2>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
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
                
                <DetalleMetricaOT 
                  metricId={selectedMetric} 
                  cobertura={coberturaPdvsFiltrados}
                  volumen={volumenPdvsFiltrados}
                  volumenCompleto={volumen}
                  visitas={visitasPdvsFiltrados}
                  precios={preciosPdvsFiltrados}
                  profundidad={profundidadPdvsFiltrados}
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

// Componente para mostrar detalles específicos de cada métrica en OT
function DetalleMetricaOT({ metricId, cobertura, volumen, volumenCompleto, visitas, precios, profundidad }) {
  
  const renderDetalle = () => {
    switch(metricId) {
      case 'cobertura':
        return (
          <div className="detalle-cobertura">
            <h3>Cobertura por PDV</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Código PDV</th>
                    <th>Nombre</th>
                    <th>Asesor</th>
                    <th>Estado</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {cobertura.map(pdv => (
                    <tr key={pdv.id}>
                      <td>{pdv.codigo}</td>
                      <td>{pdv.nombre}</td>
                      <td>{pdv.asesor_nombre}</td>
                      <td>
                        <span className={`estado ${pdv.estado.toLowerCase().replace(' ', '-')}`}>
                          {pdv.estado}
                        </span>
                      </td>
                      <td>{pdv.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'volumen':
        return (
          <div className="detalle-volumen">
            <h3>Volumen por PDV</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Código PDV</th>
                    <th>Nombre</th>
                    <th>Asesor</th>
                    <th>Segmento</th>
                    <th>Meta</th>
                    <th>Real</th>
                    <th>%</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {volumen.map(pdv => (
                    <tr key={pdv.id}>
                      <td>{pdv.codigo}</td>
                      <td>{pdv.nombre}</td>
                      <td>{pdv.asesor_nombre}</td>
                      <td>{pdv.segmento}</td>
                      <td>{pdv.meta}</td>
                      <td>{pdv.real}</td>
                      <td>{pdv.meta > 0 ? Math.round((pdv.real / pdv.meta) * 100) : 0}%</td>
                      <td>{pdv.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen por Segmento */}
            <h3 style={{ marginTop: '30px' }}>Volumen por Segmento</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Segmento</th>
                    <th>Cantidad PDVs</th>
                    <th>Total Galones</th>
                    <th>Promedio por PDV</th>
                  </tr>
                </thead>
                <tbody>
                  {volumenCompleto?.segmentos?.map(segmento => (
                    <tr key={segmento.segmento}>
                      <td>{segmento.segmento}</td>
                      <td>{segmento.cantidadPdvs}</td>
                      <td>{segmento.totalGalones?.toFixed(2) || 0}</td>
                      <td>{segmento.cantidadPdvs > 0 ? (segmento.totalGalones / segmento.cantidadPdvs).toFixed(2) : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Volumen por Producto/Referencia */}
            <h3 style={{ marginTop: '30px' }}>Volumen por Producto (Galonaje por Referencia)</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Referencia/Producto</th>
                    <th>Número de Cajas</th>
                    <th>Galonaje Total</th>
                    <th>% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  {volumenCompleto?.productos?.map(producto => (
                    <tr key={producto.nombre}>
                      <td>{producto.nombre}</td>
                      <td>{producto.numeroCajas}</td>
                      <td>{producto.galonaje?.toFixed(2) || 0}</td>
                      <td>{producto.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'visitas':
        return (
          <div className="detalle-visitas">
            <h3>Visitas por PDV</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Código PDV</th>
                    <th>Nombre</th>
                    <th>Asesor</th>
                    <th>Visitas</th>
                    <th>Meta</th>
                    <th>%</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {visitas.map(pdv => (
                    <tr key={pdv.id}>
                      <td>{pdv.codigo}</td>
                      <td>{pdv.nombre}</td>
                      <td>{pdv.asesor_nombre}</td>
                      <td>{pdv.cantidadVisitas}</td>
                      <td>{pdv.meta}</td>
                      <td>{pdv.porcentaje}%</td>
                      <td>{pdv.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'productividad':
        return (
          <div className="detalle-profundidad">
            <h3>Profundidad por PDV</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Código PDV</th>
                    <th>Nombre</th>
                    <th>Asesor</th>
                    <th>Estado</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {profundidad.map(pdv => (
                    <tr key={pdv.id}>
                      <td>{pdv.codigo}</td>
                      <td>{pdv.nombre}</td>
                      <td>{pdv.asesor_nombre}</td>
                      <td>
                        <span className={`estado ${pdv.estado.toLowerCase().replace(' ', '-')}`}>
                          {pdv.estado}
                        </span>
                      </td>
                      <td>{pdv.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'precios':
        return (
          <div className="detalle-precios">
            <h3>Precios por PDV</h3>
            <div className="tabla-detalle">
              <table>
                <thead>
                  <tr>
                    <th>Código PDV</th>
                    <th>Nombre</th>
                    <th>Asesor</th>
                    <th>Estado</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {precios.map(pdv => (
                    <tr key={pdv.id}>
                      <td>{pdv.codigo}</td>
                      <td>{pdv.nombre}</td>
                      <td>{pdv.asesor_nombre}</td>
                      <td>
                        <span className={`estado ${pdv.estado.toLowerCase().replace(' ', '-')}`}>
                          {pdv.estado}
                        </span>
                      </td>
                      <td>{pdv.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return <div>Métrica no encontrada</div>;
    }
  };

  return (
    <div className="detalle-metrica-container">
      {renderDetalle()}
    </div>
  );
}

