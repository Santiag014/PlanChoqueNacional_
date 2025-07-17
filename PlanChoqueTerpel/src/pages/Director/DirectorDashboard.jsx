import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDirectorRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Mercadeo/mercadeo-informe-seguimiento-dashboard.css';
import FiltrosAvanzados from '../../components/director/Filtros/FiltrosAvanzados';
import FiltroActivo from '../../components/Asesor/Filtros/FiltroActivo';
// Iconos para las métricas
import IconCobertura from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import IconVolumen from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import IconVisitas from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import IconProductividad from '../../assets/Iconos/IconosPage/Icono_Page_Catalogos.png';
import IconPrecios from '../../assets/Iconos/IconosPage/Icono_Page_PremioMayor.png';

/**
 * Dashboard de Informe de Seguimiento para Mercadeo con datos de asesores
 */


export default function DirectorDashboard() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [busquedaAsesor, setBusquedaAsesor] = useState('');
  // Estado para filtro de compañía en el popup de asesores
  const [companiaFiltro, setCompaniaFiltro] = useState('');
  
  // Estados para filtros avanzados
  const [filtros, setFiltros] = useState({
    asesor: '',
    pdv: '',
    ciudad: '',
    compania: ''
  });

  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useDirectorRoute();

  // Asesores del sistema con sus PDVs asignados y compañía
  const asesoresData = [
    {
      id: 1,
      codigo: 'AS001',
      nombre: 'Santiago Párraga',
      email: 'santiago.parraga@terpel.com',
      compania: 'Ludelpa',
      pdvs: [
        { id: 1, codigo: '1001', nombre: 'Tienda El Progreso', direccion: 'Calle 10 #5-20, Bogotá', meta_volumen: 120, segmento: 'CVL' },
        { id: 2, codigo: '1002', nombre: 'Minimercado Don Juan', direccion: 'Carrera 8 #12-34, Medellín', meta_volumen: 95, segmento: 'MCO' },
        { id: 3, codigo: '1003', nombre: 'Supermercado La Economía', direccion: 'Av. Principal 45-67, Cali', meta_volumen: 85, segmento: 'MCO' },
        { id: 4, codigo: '1004', nombre: 'Tienda La Esquina', direccion: 'Cra 3 #45-67, Barranquilla', meta_volumen: 75, segmento: 'CVL' }
      ]
    },
    {
      id: 2,
      codigo: 'AS002',
      nombre: 'Ana María González',
      email: 'ana.gonzalez@terpel.com',
      compania: 'RyR',
      pdvs: [
        { id: 5, codigo: '1005', nombre: 'Autoservicio El Centro', direccion: 'Calle 25 #15-30, Bucaramanga', meta_volumen: 110, segmento: 'MCO' },
        { id: 6, codigo: '1006', nombre: 'Tienda Los Andes', direccion: 'Carrera 12 #8-45, Manizales', meta_volumen: 90, segmento: 'CVL' },
        { id: 7, codigo: '1007', nombre: 'Supermercado Norte', direccion: 'Av. Norte 78-90, Pereira', meta_volumen: 80, segmento: 'MCO' },
        { id: 8, codigo: '1008', nombre: 'Minimercado La Plaza', direccion: 'Plaza Central #5-12, Ibagué', meta_volumen: 70, segmento: 'CVL' }
      ]
    },
    {
      id: 3,
      codigo: 'AS003',
      nombre: 'María Fernanda López',
      email: 'maria.lopez@terpel.com',
      compania: 'Ludelpa',
      pdvs: [
        { id: 9, codigo: '1009', nombre: 'Supermercado Central', direccion: 'Avenida Central #45-67, Cartagena', meta_volumen: 130, segmento: 'MCO' },
        { id: 10, codigo: '1010', nombre: 'Tienda Del Puerto', direccion: 'Calle Puerto #12-34, Santa Marta', meta_volumen: 100, segmento: 'CVL' },
        { id: 11, codigo: '1011', nombre: 'Autoservicio La Costa', direccion: 'Carrera Costa #23-45, Barranquilla', meta_volumen: 115, segmento: 'MCO' }
      ]
    },
    // Asesores cerito (sin PDVs)
    {
      id: 4,
      codigo: 'AS004',
      nombre: 'Carlos Cerito',
      email: 'carlos.cerito@ludelpa.com',
      compania: 'Ludelpa',
      pdvs: []
    },
    {
      id: 5,
      codigo: 'AS005',
      nombre: 'Laura Cerito',
      email: 'laura.cerito@ryr.com',
      compania: 'RyR',
      pdvs: []
    },
    // Más asesores de ejemplo
    {
      id: 6,
      codigo: 'AS006',
      nombre: 'Pedro Pérez',
      email: 'pedro.perez@ludelpa.com',
      compania: 'Ludelpa',
      pdvs: [
        { id: 12, codigo: '1012', nombre: 'Tienda Nueva', direccion: 'Calle 50 #10-20, Bogotá', meta_volumen: 60, segmento: 'CVL' }
      ]
    },
    {
      id: 7,
      codigo: 'AS007',
      nombre: 'Marta Ramírez',
      email: 'marta.ramirez@ryr.com',
      compania: 'RyR',
      pdvs: [
        { id: 13, codigo: '1013', nombre: 'Supermercado Central', direccion: 'Calle 80 #20-30, Medellín', meta_volumen: 90, segmento: 'MCO' }
      ]
    }
  ];

  useEffect(() => {
    setAsesores(asesoresData);
  }, []);

  // Filtrar asesores por búsqueda (código, nombre) y compañía desde filtros

  // Filtrar asesores por búsqueda y compañía (del popup)
  const asesoresFiltrados = asesores.filter(asesor => {
    const coincideBusqueda =
      asesor.codigo.toLowerCase().includes(busquedaAsesor.toLowerCase()) ||
      asesor.nombre.toLowerCase().includes(busquedaAsesor.toLowerCase());
    // Si hay filtro de compañía en el popup, filtrar por ese, si no, por el global
    const coincideCompania = companiaFiltro
      ? asesor.compania === companiaFiltro
      : (filtros.compania ? asesor.compania === filtros.compania : true);
    return coincideBusqueda && coincideCompania;
  });



  // Manejar cambios en filtros avanzados
  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    // Si se cambia el filtro de compañía, limpiar asesor seleccionado si no pertenece a esa compañía
    if (
      nuevosFiltros.compania &&
      asesorSeleccionado &&
      asesorSeleccionado.compania !== nuevosFiltros.compania
    ) {
      setAsesorSeleccionado(null);
    }
    // Sincronizar filtro de compañía del popup con el global
    setCompaniaFiltro(nuevosFiltros.compania || '');
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({ asesor: '', pdv: '', ciudad: '', compania: '' });
    setAsesorSeleccionado(null);
    setCompaniaFiltro('');
  };

  // Obtener todos los PDVs según los filtros aplicados
  const obtenerPdvs = () => {
    let pdvsResult = [];
    let asesoresFiltradosPorCompania = asesoresData;
    // Filtrar asesores por compañía si aplica
    if (filtros.compania) {
      asesoresFiltradosPorCompania = asesoresData.filter(a => a.compania === filtros.compania);
    }
    // Si hay filtro por asesor, obtener solo PDVs de ese asesor
    if (filtros.asesor) {
      const asesor = asesoresFiltradosPorCompania.find(a => a.nombre === filtros.asesor);
      if (asesor) {
        pdvsResult = asesor.pdvs;
      }
    } else if (asesorSeleccionado) {
      // Mantener compatibilidad con el filtro anterior
      pdvsResult = asesorSeleccionado.pdvs;
    } else {
      // Sin filtro de asesor: obtener todos los PDVs de los asesores filtrados por compañía
      pdvsResult = asesoresFiltradosPorCompania.flatMap(asesor => asesor.pdvs);
    }
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

  const pdvsActuales = obtenerPdvs();

  // Datos base para cálculos con rendimiento más bajo
  const datosBase = {
    cobertura: pdvsActuales.map((pdv, index) => {
      // Rendimiento más bajo: solo 60% de PDVs registrados
      const registrado = index % 5 !== 0; // 4 de cada 5 registrados (80%)
      const puntos = registrado ? (15 + Math.floor(Math.random() * 8)) : 0; // Puntos más bajos
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        estado: registrado ? 'Registrado' : 'No Registrado',
        puntos: puntos
      };
    }),
    volumen: pdvsActuales.map(pdv => {
      const cumplimiento = 55 + Math.floor(Math.random() * 20); // 55-75% cumplimiento (más bajo)
      const real = Math.floor(pdv.meta_volumen * (cumplimiento / 100));
      const puntosVolumen = Math.floor(cumplimiento * 0.35); // Puntos reducidos
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        segmento: pdv.segmento,
        meta: pdv.meta_volumen,
        real: real,
        porcentaje: cumplimiento,
        puntos: puntosVolumen
      };
    }),
    frecuencia: pdvsActuales.map((pdv, index) => {
      const visitasRealizadas = 8 + Math.floor(Math.random() * 6); // 8-13 visitas (más bajo)
      const puntosVisitas = visitasRealizadas * 1.5; // Menos puntos por visita
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        visitas: visitasRealizadas,
        puntos: Math.floor(puntosVisitas)
      };
    }),
    profundidad: pdvsActuales.map((pdv, index) => {
      // Solo 70% registrados
      const registrado = index % 10 < 7;
      const puntos = registrado ? (12 + Math.floor(Math.random() * 8)) : 0; // Puntos más bajos
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        estado: registrado ? 'Registrado' : 'No Registrado',
        puntos: puntos
      };
    }),
    precios: pdvsActuales.map((pdv, index) => {
      // Solo 65% reportados
      const reportado = index % 20 < 13;
      const puntos = reportado ? (1 + Math.floor(Math.random() * 3)) : 0; // 1-3 puntos
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        estado: reportado ? 'Precios Reportados' : 'Precios No Reportados',
        puntos: puntos
      };
    })
  };

  // Función para calcular puntos específicos por KPI
  const calcularPuntosKPI = (kpi, filtroAsesor = null) => {
    let datosFiltrados = datosBase[kpi];
    
    if (filtroAsesor) {
      const pdvsCodigos = filtroAsesor.pdvs.map(p => p.codigo);
      datosFiltrados = datosBase[kpi].filter(p => pdvsCodigos.includes(p.codigo));
    }
    
    return datosFiltrados.reduce((sum, p) => sum + p.puntos, 0);
  };

  // Meta real para cada KPI según los PDVs filtrados
  const getMetricasData = () => {
    // Cantidad de PDVs filtrados
    const totalPdvsFiltrados = pdvsActuales.length;

    // Suma de meta_volumen de los PDVs filtrados
    const metaVolumen = datosBase.volumen.reduce((total, pdv) => total + (pdv.meta || 0), 0);

    // Para frecuencia, asume que la meta por PDV es 20 (ajusta si es diferente)
    const META_VISITAS_POR_PDV = 20;
    const metaFrecuencia = totalPdvsFiltrados * META_VISITAS_POR_PDV;

    // Para cobertura, profundidad y precios, la meta es la cantidad de PDVs filtrados
    const metaCobertura = totalPdvsFiltrados;
    const metaProfundidad = totalPdvsFiltrados;
    const metaPrecios = totalPdvsFiltrados;

    return [
      {
        id: 'cobertura',
        titulo: 'Cobertura',
        icon: IconCobertura,
        meta: metaCobertura,
        implementado: datosBase.cobertura.filter(p => p.estado === 'Registrado').length,
        porcentaje: metaCobertura > 0 ? Math.round(datosBase.cobertura.filter(p => p.estado === 'Registrado').length / metaCobertura * 100) : 0,
        color: '#e30613',
        puntosLabel: `${calcularPuntosKPI('cobertura', asesorSeleccionado)} puntos obtenidos`
      },
      {
        id: 'volumen',
        titulo: 'Volumen',
        icon: IconVolumen,
        meta: metaVolumen,
        implementado: datosBase.volumen.reduce((total, pdv) => total + pdv.real, 0),
        porcentaje: metaVolumen > 0 ? Math.round(datosBase.volumen.reduce((total, pdv) => total + pdv.real, 0) / metaVolumen * 100) : 0,
        color: '#ff6b35',
        puntosLabel: `${calcularPuntosKPI('volumen', asesorSeleccionado)} puntos obtenidos`
      },
      {
        id: 'visitas',
        titulo: 'Frecuencia',
        icon: IconVisitas,
        meta: metaFrecuencia,
        implementado: datosBase.frecuencia.reduce((total, p) => total + p.visitas, 0),
        porcentaje: metaFrecuencia > 0 ? Math.round(datosBase.frecuencia.reduce((total, p) => total + p.visitas, 0) / metaFrecuencia * 100) : 0,
        color: '#f7931e',
        puntosLabel: `${calcularPuntosKPI('frecuencia', asesorSeleccionado)} puntos obtenidos`
      },
      {
        id: 'productividad',
        titulo: 'Profundidad',
        icon: IconProductividad,
        meta: metaProfundidad,
        implementado: datosBase.profundidad.filter(p => p.estado === 'Registrado').length,
        porcentaje: metaProfundidad > 0 ? Math.round(datosBase.profundidad.filter(p => p.estado === 'Registrado').length / metaProfundidad * 100) : 0,
        color: '#00a651',
        puntosLabel: `${calcularPuntosKPI('profundidad', asesorSeleccionado)} puntos obtenidos`
      },
      {
        id: 'precios',
        titulo: 'Precios',
        icon: IconPrecios,
        meta: metaPrecios,
        implementado: datosBase.precios.filter(p => p.estado === 'Precios Reportados').length,
        porcentaje: metaPrecios > 0 ? Math.round(datosBase.precios.filter(p => p.estado === 'Precios Reportados').length / metaPrecios * 100) : 0,
        color: '#0066cc',
        puntosLabel: `${calcularPuntosKPI('precios', asesorSeleccionado)} puntos obtenidos`
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
    setAsesorSeleccionado(asesor);
    setFiltroVisible(false);
    setBusquedaAsesor('');
  };

  const limpiarFiltro = () => {
    setAsesorSeleccionado(null);
    setFiltroVisible(false);
    setBusquedaAsesor('');
  };

  // Hook para manejar el scroll y mostrar indicadores
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
        <FiltrosAvanzados 
          asesores={asesoresData}
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          className="filtros-mercadeo"
        />

        {/* Filtro Activo */}
        <FiltroActivo 
          filtros={filtros}
          onLimpiarFiltros={limpiarFiltros}
          isMobile={window.innerWidth <= 768}
        />

        {/* Información del asesor seleccionado */}
        {/* Mostrar div de compañía seleccionada si hay filtro de compañía */}

        {/* Mostrar div de asesor seleccionado */}
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
                <select
                  value={companiaFiltro}
                  onChange={e => {
                    setCompaniaFiltro(e.target.value);
                    // Al cambiar el filtro de compañía en el popup, actualizar el filtro global
                    handleFiltrosChange({ ...filtros, compania: e.target.value });
                  }}
                  className="filtro-input"
                  style={{ marginTop: 8 }}
                >
                  <option value="">Todas las compañías</option>
                  {/* Obtener compañías únicas dinámicamente */}
                  {[...new Set(asesores.map(a => a.compania))].map(compania => (
                    <option key={compania} value={compania}>{compania}</option>
                  ))}
                </select>
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
                  asesoresData={asesoresData}
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
function DetalleMetricaMercadeo({ metricId, asesorSeleccionado, datosBase, asesoresData }) {
  
  // Productos Terpel
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

  // Filtrar datos si hay un asesor seleccionado
  const datosFiltrados = asesorSeleccionado ? {
    ...datosBase,
    [metricId]: datosBase[metricId]?.filter(punto => 
      asesorSeleccionado.pdvs.some(pdv => pdv.codigo === punto.codigo)
    ) || []
  } : datosBase;

  const datos = Array.isArray(datosFiltrados[metricId]) ? datosFiltrados[metricId] : [];

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
                const asesor = asesoresData.find(a => a.pdvs.some(p => p.codigo === punto.codigo));
                return (
                  <tr key={index}>
                    <td>{punto.codigo}</td>
                    <td>{punto.nombre}</td>
                    {/* <td>{asesor?.nombre || 'N/A'}</td> */}
                    <td>
                      <span className={`estado ${punto.estado === 'Registrado' ? 'implementado' : 'no-implementado'}`}>
                        {punto.estado}
                      </span>
                    </td>
                    <td><strong>{punto.puntos}</strong></td>
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
                  <th>Asesor</th>
                  <th>Segmento</th>
                  <th>Meta (Gal)</th>
                  <th>Real (Gal)</th>
                  <th>% Cumplimiento</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                  const asesor = asesoresData.find(a => a.pdvs.some(p => p.codigo === punto.codigo));
                  return (
                    <tr key={index}>
                      <td>{punto.codigo}</td>
                      <td>{punto.nombre}</td>
                      <td>{asesor?.nombre || 'N/A'}</td>
                      <td>{punto.segmento}</td>
                      <td>{punto.meta.toLocaleString()}</td>
                      <td>{punto.real.toLocaleString()}</td>
                      <td>
                        <span className={`porcentaje ${punto.porcentaje >= 70 ? 'alto' : 'bajo'}`}>
                          {punto.porcentaje}%
                        </span>
                      </td>
                      <td><strong>{punto.puntos}</strong></td>
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
          <div className="grafica-segmentos">
            <h3>Galonaje Total por Segmento{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
            <div className="barras-container-popup">
              {(() => {
                // Calcular totales por segmento basado en datos reales filtrados
                const segmentos = ['CVL', 'MCO'];
                const datosSegmentos = segmentos.map(segmento => {
                  const totalSegmento = Array.isArray(datos) ? datos
                    .filter(p => p.segmento === segmento)
                    .reduce((sum, p) => sum + (p.real || 0), 0) : 0;
                  const cantidadPdvs = Array.isArray(datos) ? datos.filter(p => p.segmento === segmento).length : 0;
                  return { segmento, total: totalSegmento, cantidadPdvs };
                }).filter(s => s.total > 0); // Solo mostrar segmentos con datos

                if (datosSegmentos.length === 0) {
                  return (
                    <div className="sin-datos-mensaje">
                      <p>No hay datos de volumen disponibles</p>
                    </div>
                  );
                }

                const maxTotal = Math.max(...datosSegmentos.map(s => s.total));

                return datosSegmentos.map(({ segmento, total, cantidadPdvs }) => (
                  <div key={segmento} className="barra-segmento-popup">
                    <div className="barra-info">
                      {cantidadPdvs} PDV{cantidadPdvs !== 1 ? 's' : ''}
                    </div>
                    <div className="barra-valor">{total.toLocaleString()} gal</div>
                    <div className="barra-visual-popup">
                      <div 
                        className="barra-fill" 
                        style={{
                          height: `${(total / (maxTotal || 1)) * 100}%`,
                          backgroundColor: segmento === 'CVL' ? '#e30613' : '#00a651'
                        }}
                      ></div>
                    </div>
                    <div className="barra-label">{segmento}</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Gráfica de galonaje por producto */}
          <div className="tabla-container">
            <h3>Galonaje por Producto{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
            <table className="detalle-tabla tabla-productos">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Número de Cajas</th>
                  <th>Galonaje Total</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Simular productos basados en datos de volumen
                  const productosSimulados = [
                    { nombre: 'TERPEL OILTEC 10W-30 TITANIO', porcentaje: 0.25 },
                    { nombre: 'TERPEL OILTEC 20W-50 TITANIO', porcentaje: 0.20 },
                    { nombre: 'REFRIGERANTE ESTÁNDAR', porcentaje: 0.15 },
                    { nombre: 'TERPEL OILTEC 20W-50 MULTIGRADO', porcentaje: 0.15 },
                    { nombre: 'TERPEL CELERITY 4T 15W-50 SEMISINTÉTICO', porcentaje: 0.12 },
                    { nombre: 'TERPEL OILTEC 40 MONOGRADO', porcentaje: 0.08 },
                    { nombre: 'REFRIGERANTE LARGA VIDA', porcentaje: 0.05 }
                  ];

                  const totalGalonaje = Array.isArray(datos) ? datos.reduce((sum, p) => sum + (p.real || 0), 0) : 0;
                  
                  if (totalGalonaje === 0) {
                    return (
                      <tr>
                        <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                          No hay datos de productos disponibles
                        </td>
                      </tr>
                    );
                  }

                  return productosSimulados.map((producto, index) => {
                    const galonajeProducto = Math.floor(totalGalonaje * producto.porcentaje);
                    const numeroCajas = Math.ceil(galonajeProducto / 4);
                    const porcentajeReal = ((galonajeProducto / totalGalonaje) * 100).toFixed(1);
                    
                    return (
                      <tr key={index}>
                        <td className="producto-nombre">{producto.nombre}</td>
                        <td><strong>{numeroCajas.toLocaleString()}</strong> cajas</td>
                        <td><strong>{galonajeProducto.toLocaleString()}</strong> gal</td>
                        <td>{porcentajeReal}%</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metricId === 'visitas' && (
        <div className="visitas-detalles">
          <div className="tabla-container">
            <h3>Frecuencia de Visitas{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
            <table className="detalle-tabla">
              <thead>
                <tr>
                  <th>Código PDV</th>
                  <th>Nombre PDV</th>
                  <th>Asesor</th>
                  <th>Cantidad Visitas</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                  const asesor = asesoresData.find(a => a.pdvs.some(p => p.codigo === punto.codigo));
                  return (
                    <tr key={index}>
                      <td>{punto.codigo}</td>
                      <td>{punto.nombre}</td>
                      <td>{asesor?.nombre || 'N/A'}</td>
                      <td>{punto.visitas}</td>
                      <td><strong>{punto.puntos}</strong></td>
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
        </div>
      )}

      {metricId === 'productividad' && (
        <div className="tabla-container">
          <h3>Estado de Profundidad{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
          <table className="detalle-tabla">
            <thead>
              <tr>
                <th>Código PDV</th>
                <th>Nombre PDV</th>
                <th>Asesor</th>
                <th>Estado</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                const asesor = asesoresData.find(a => a.pdvs.some(p => p.codigo === punto.codigo));
                return (
                  <tr key={index}>
                    <td>{punto.codigo}</td>
                    <td>{punto.nombre}</td>
                    <td>{asesor?.nombre || 'N/A'}</td>
                    <td>
                      <span className={`estado ${punto.estado === 'Registrado' ? 'implementado' : 'no-implementado'}`}>
                        {punto.estado}
                      </span>
                    </td>
                    <td><strong>{punto.puntos}</strong></td>
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

      {metricId === 'precios' && (
        <div className="tabla-container">
          <h3>Estado de Precios{asesorSeleccionado ? ` - ${asesorSeleccionado.nombre}` : ' (Todos los Asesores)'}</h3>
          <table className="detalle-tabla">
            <thead>
              <tr>
                <th>Código PDV</th>
                <th>Nombre PDV</th>
                <th>Asesor</th>
                <th>Estado</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(datos) && datos.length > 0 ? datos.map((punto, index) => {
                const asesor = asesoresData.find(a => a.pdvs.some(p => p.codigo === punto.codigo));
                return (
                  <tr key={index}>
                    <td>{punto.codigo}</td>
                    <td>{punto.nombre}</td>
                    <td>{asesor?.nombre || 'N/A'}</td>
                    <td>
                      <span className={`estado ${punto.estado === 'Precios Reportados' ? 'implementado' : 'no-implementado'}`}>
                        {punto.estado}
                      </span>
                    </td>
                    <td><strong>{punto.puntos}</strong></td>
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
    </div>
  );
}

