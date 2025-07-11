import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
// import '../../styles/Asesor/asesor-informe-seguimiento-dashboard.css';
import FiltrosAvanzadosAsesor from '../../components/Asesor/Filtros/FiltrosAvanzadosAsesor';
import FiltroActivo from '../../components/Asesor/Filtros/FiltroActivo';

// Iconos para las métricas
import IconCobertura from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import IconVolumen from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import IconVisitas from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import IconProductividad from '../../assets/Iconos/IconosPage/Icono_Page_Catalogos.png';
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

  // PDVs reales del sistema (solo los 4 PDVs de la BD)
  const pdvsReales = [
    { id: 1, codigo: '1001', nombre: 'Tienda El Progreso', direccion: 'Calle 10 #5-20, Bogotá', meta_volumen: 150, segmento: 'CVL' },
    { id: 2, codigo: '1002', nombre: 'Minimercado Don Juan', direccion: 'Carrera 8 #12-34, Medellín', meta_volumen: 120, segmento: 'MCO' },
    { id: 3, codigo: '1003', nombre: 'Supermercado La Economía', direccion: 'Av. Principal 45-67, Cali', meta_volumen: 90, segmento: 'MCO' },
    { id: 4, codigo: '1004', nombre: 'Tienda La Esquina', direccion: 'Cra 3 #45-67, Barranquilla', meta_volumen: 30, segmento: 'CVL' }
  ];

  useEffect(() => {
    setPdvs(pdvsReales);
  }, []);

  // Filtrar PDVs por búsqueda (código o nombre)
  const pdvsFiltrados = pdvs.filter(pdv => 
    pdv.codigo.toLowerCase().includes(busquedaPdv.toLowerCase()) ||
    pdv.nombre.toLowerCase().includes(busquedaPdv.toLowerCase())
  );

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Datos base para cálculos (definir una sola vez)
  const datosBase = {
    cobertura: [
      { codigo: '1001', nombre: 'Tienda El Progreso', estado: 'Registrado', puntos: 25 },
      { codigo: '1002', nombre: 'Minimercado Don Juan', estado: 'Registrado', puntos: 30 },
      { codigo: '1003', nombre: 'Supermercado La Economía', estado: 'Registrado', puntos: 28 },
      { codigo: '1004', nombre: 'Tienda La Esquina', estado: 'No Registrado', puntos: 0 }
    ],
    volumen: pdvsReales.map(pdv => {
      const real = Math.floor(pdv.meta_volumen * 0.78); // 78% de cumplimiento consistente
      const porcentaje = 78;
      const puntosVolumen = Math.floor(porcentaje * 0.5); // Puntos basados en porcentaje
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        segmento: pdv.segmento, // Agregar segmento desde pdvsReales
        meta: pdv.meta_volumen,
        real: real,
        porcentaje: porcentaje,
        puntos: puntosVolumen
      };
    }),
    frecuencia: pdvsReales.map((pdv, index) => {
      const visitasRealizadas = 16; // Consistente con los datos del detalle
      const puntosVisitas = visitasRealizadas * 2; // 2 puntos por visita
      return {
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        visitas: visitasRealizadas,
        puntos: puntosVisitas
      };
    }),
    profundidad: [
      { codigo: '1001', nombre: 'Tienda El Progreso', estado: 'Registrado', puntos: 22 },
      { codigo: '1002', nombre: 'Minimercado Don Juan', estado: 'Registrado', puntos: 25 },
      { codigo: '1003', nombre: 'Supermercado La Economía', estado: 'Registrado', puntos: 19 },
      { codigo: '1004', nombre: 'Tienda La Esquina', estado: 'No Registrado', puntos: 0 }
    ],
    precios: [
      { codigo: '1001', nombre: 'Tienda El Progreso', estado: 'Precios Reportados', puntos: 4 },
      { codigo: '1002', nombre: 'Minimercado Don Juan', estado: 'Precios Reportados', puntos: 2 },
      { codigo: '1003', nombre: 'Supermercado La Economía', estado: 'Precios Reportados', puntos: 4 },
      { codigo: '1004', nombre: 'Tienda La Esquina', estado: 'Precios No Reportados', puntos: 0 }
    ]
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
      const puntosProfundidad = datosBase.profundidad.find(p => p.codigo === pdvCodigo)?.puntos || 0;
      const puntosPrecios = datosBase.precios.find(p => p.codigo === pdvCodigo)?.puntos || 0;
      
      return puntosCobertura + puntosVolumen + puntosFrecuencia + puntosProfundidad + puntosPrecios;
    } else {
      // Para todos los PDVs, sumar todos los puntos
      const totalCobertura = datosBase.cobertura.reduce((sum, p) => sum + p.puntos, 0);
      const totalVolumen = datosBase.volumen.reduce((sum, p) => sum + p.puntos, 0);
      const totalFrecuencia = datosBase.frecuencia.reduce((sum, p) => sum + p.puntos, 0);
      const totalProfundidad = datosBase.profundidad.reduce((sum, p) => sum + p.puntos, 0);
      const totalPrecios = datosBase.precios.reduce((sum, p) => sum + p.puntos, 0);
      
      return totalCobertura + totalVolumen + totalFrecuencia + totalProfundidad + totalPrecios;
    }
  };

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
    
    return [
      {
        id: 'cobertura',
        titulo: 'Cobertura',
        icon: IconCobertura,
        meta: pdvSeleccionado ? 1 : 4,
        implementado: pdvSeleccionado ? 
          (datosBase.cobertura.find(p => p.codigo === pdvSeleccionado.codigo)?.estado === 'Registrado' ? 1 : 0) :
          datosBase.cobertura.filter(p => p.estado === 'Registrado').length,
        porcentaje: pdvSeleccionado ? 
          (datosBase.cobertura.find(p => p.codigo === pdvSeleccionado.codigo)?.estado === 'Registrado' ? 100 : 0) :
          Math.round((datosBase.cobertura.filter(p => p.estado === 'Registrado').length / 4) * 100),
        color: '#e30613',
        puntosLabel: `${calcularPuntosKPI('cobertura', pdvSeleccionado?.codigo)} puntos obtenidos`
      },
      {
        id: 'volumen',
        titulo: 'Volumen',
        icon: IconVolumen,
        meta: pdvSeleccionado ? 
          (datosBase.volumen.find(p => p.codigo === pdvSeleccionado.codigo)?.meta || 0) :
          datosBase.volumen.reduce((total, pdv) => total + pdv.meta, 0),
        implementado: pdvSeleccionado ? 
          (datosBase.volumen.find(p => p.codigo === pdvSeleccionado.codigo)?.real || 0) :
          datosBase.volumen.reduce((total, pdv) => total + pdv.real, 0),
        porcentaje: pdvSeleccionado ? 
          (datosBase.volumen.find(p => p.codigo === pdvSeleccionado.codigo)?.porcentaje || 0) :
          78,
        color: '#ff6b35',
        puntosLabel: `${calcularPuntosKPI('volumen', pdvSeleccionado?.codigo)} puntos obtenidos`
      },
      {
        id: 'visitas',
        titulo: 'Frecuencia',
        icon: IconVisitas,
        meta: pdvSeleccionado ? 20 : 80,
        implementado: pdvSeleccionado ? 
          (datosBase.frecuencia.find(p => p.codigo === pdvSeleccionado.codigo)?.visitas || 0) :
          datosBase.frecuencia.reduce((total, p) => total + p.visitas, 0),
        porcentaje: pdvSeleccionado ? 
          Math.round(((datosBase.frecuencia.find(p => p.codigo === pdvSeleccionado.codigo)?.visitas || 0) / 20) * 100) :
          Math.round((datosBase.frecuencia.reduce((total, p) => total + p.visitas, 0) / 80) * 100),
        color: '#f7931e',
        puntosLabel: `${calcularPuntosKPI('frecuencia', pdvSeleccionado?.codigo)} puntos obtenidos`
      },
      {
        id: 'productividad',
        titulo: 'Profundidad',
        icon: IconProductividad,
        meta: pdvSeleccionado ? 1 : 4,
        implementado: pdvSeleccionado ? 
          (datosBase.profundidad.find(p => p.codigo === pdvSeleccionado.codigo)?.estado === 'Registrado' ? 1 : 0) :
          datosBase.profundidad.filter(p => p.estado === 'Registrado').length,
        porcentaje: pdvSeleccionado ? 
          (datosBase.profundidad.find(p => p.codigo === pdvSeleccionado.codigo)?.estado === 'Registrado' ? 100 : 0) :
          Math.round((datosBase.profundidad.filter(p => p.estado === 'Registrado').length / 4) * 100),
        color: '#00a651',
        puntosLabel: `${calcularPuntosKPI('profundidad', pdvSeleccionado?.codigo)} puntos obtenidos`
      },
      {
        id: 'precios',
        titulo: 'Precios',
        icon: IconPrecios,
        meta: pdvSeleccionado ? 1 : 4,
        implementado: pdvSeleccionado ? 
          (datosBase.precios.find(p => p.codigo === pdvSeleccionado.codigo)?.estado === 'Precios Reportados' ? 1 : 0) :
          datosBase.precios.filter(p => p.estado === 'Precios Reportados').length,
        porcentaje: pdvSeleccionado ? 
          (datosBase.precios.find(p => p.codigo === pdvSeleccionado.codigo)?.estado === 'Precios Reportados' ? 100 : 0) :
          Math.round((datosBase.precios.filter(p => p.estado === 'Precios Reportados').length / 4) * 100),
        color: '#0066cc',
        puntosLabel: `${calcularPuntosKPI('precios', pdvSeleccionado?.codigo)} puntos obtenidos`
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
                    <span className="pdv-meta">Meta: {pdv.meta_volumen.toLocaleString()}</span>
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
                <DetalleMetrica 
                  metricId={selectedMetric} 
                  pdvSeleccionado={pdvSeleccionado} 
                  datosBase={datosBase}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente para mostrar detalles específicos de cada métrica
function DetalleMetrica({ metricId, pdvSeleccionado, datosBase }) {
  // PDVs reales del sistema (solo los 4 de la BD)
  const pdvsReales = [
    { id: 1, codigo: '1001', nombre: 'Tienda El Progreso', direccion: 'Calle 10 #5-20, Bogotá', meta_volumen: 150, segmento: 'CVL' },
    { id: 2, codigo: '1002', nombre: 'Minimercado Don Juan', direccion: 'Carrera 8 #12-34, Medellín', meta_volumen: 120, segmento: 'MCO' },
    { id: 3, codigo: '1003', nombre: 'Supermercado La Economía', direccion: 'Av. Principal 45-67, Cali', meta_volumen: 90, segmento: 'MCO' },
    { id: 4, codigo: '1004', nombre: 'Tienda La Esquina', direccion: 'Cra 3 #45-67, Barranquilla', meta_volumen: 30, segmento: 'CVL' }
  ];

  // Productos Terpel reales del sistema
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

  // Datos con PDVs reales y sus metas de la columna meta_volumen
  const datosDetalles = {
    cobertura: {
      puntos: datosBase.cobertura
    },
    volumen: {
      puntos: datosBase.volumen,
      productos: pdvsReales.flatMap(pdv => 
        productosTerpel.slice(0, 3 + Math.floor(Math.random() * 3)).map(producto => {
          const metaProducto = Math.floor(pdv.meta_volumen * (0.1 + Math.random() * 0.2)); // 10-30% del meta_volumen del PDV
          const realProducto = Math.floor(metaProducto * (0.6 + Math.random() * 0.4)); // 60-100% de la meta
          return {
            codigo: pdv.codigo,
            nombre_pdv: pdv.nombre,
            producto: producto.nombre,
            meta: metaProducto,
            real: realProducto,
            porcentaje: Math.round((realProducto / metaProducto) * 100)
          };
        })
      ),
      // Resumen de productos: galonaje proporcional a datos reales y consistente
      productosResumen: (() => {
        // Si hay PDV seleccionado, calcular productos solo para ese PDV
        const pdvsParaCalcular = pdvSeleccionado ? 
          pdvsReales.filter(pdv => pdv.codigo === pdvSeleccionado.codigo) : 
          pdvsReales;

        const resumen = {};
        
        // Definir distribución consistente de productos por PDV
        const distribucionProductos = {
          '1001': [ // Tienda El Progreso - CVL
            { producto: 'TERPEL OILTEC 10W-30 TITANIO', porcentaje: 0.25 },
            { producto: 'TERPEL OILTEC 20W-50 TITANIO', porcentaje: 0.20 },
            { producto: 'REFRIGERANTE ESTÁNDAR', porcentaje: 0.15 },
            { producto: 'TERPEL CELERITY 4T 15W-50 SEMISINTÉTICO', porcentaje: 0.12 },
            { producto: 'TERPEL OILTEC 40 MONOGRADO', porcentaje: 0.10 },
            { producto: 'REFRIGERANTE LARGA VIDA', porcentaje: 0.08 },
            { producto: 'TERPEL CELERITY 2T BIO ANTIHUMO', porcentaje: 0.06 },
            { producto: 'TERPEL OILTEC 10W-40 TITANIO', porcentaje: 0.04 }
          ],
          '1002': [ // Minimercado Don Juan - MCO
            { producto: 'TERPEL OILTEC 20W-50 MULTIGRADO', porcentaje: 0.22 },
            { producto: 'TERPEL OILTEC 10W-40 TITANIO', porcentaje: 0.18 },
            { producto: 'TERPEL CELERITY 4T 20W-50 TITANIO', porcentaje: 0.16 },
            { producto: 'REFRIGERANTE ESTÁNDAR', porcentaje: 0.14 },
            { producto: 'TERPEL OILTEC 20W-50 TITANIO', porcentaje: 0.12 },
            { producto: 'TERPEL CELERITY 4T 25W-50 GRUESO', porcentaje: 0.10 },
            { producto: 'TERPEL OILTEC 50 MONOGRADO', porcentaje: 0.08 }
          ],
          '1003': [ // Supermercado La Economía - MCO
            { producto: 'TERPEL OILTEC 10W-30 TITANIO', porcentaje: 0.24 },
            { producto: 'TERPEL OILTEC 20W-50 MULTIGRADO', porcentaje: 0.20 },
            { producto: 'REFRIGERANTE LARGA VIDA', porcentaje: 0.16 },
            { producto: 'TERPEL CELERITY 4T 15W-50 SEMISINTÉTICO', porcentaje: 0.14 },
            { producto: 'TERPEL OILTEC TERGAS 20W-50', porcentaje: 0.12 },
            { producto: 'TERPEL CELERITY 2T FB', porcentaje: 0.08 },
            { producto: 'TERPEL OILTEC 40 MONOGRADO', porcentaje: 0.06 }
          ],
          '1004': [ // Tienda La Esquina - CVL
            { producto: 'TERPEL OILTEC 40 MONOGRADO', porcentaje: 0.30 },
            { producto: 'TERPEL OILTEC 50 MONOGRADO', porcentaje: 0.25 },
            { producto: 'REFRIGERANTE ESTÁNDAR', porcentaje: 0.20 },
            { producto: 'TERPEL CELERITY 4T 25W-50 GRUESO', porcentaje: 0.15 },
            { producto: 'TERPEL CELERITY 2T BIO ANTIHUMO', porcentaje: 0.10 }
          ]
        };
        
        // Para cada PDV, distribuir su galonaje real entre los productos definidos
        pdvsParaCalcular.forEach(pdv => {
          const galonajeRealPdv = datosBase.volumen.find(v => v.codigo === pdv.codigo)?.real || 0;
          const productosDelPdv = distribucionProductos[pdv.codigo] || [];
          
          productosDelPdv.forEach(({ producto, porcentaje }) => {
            const galonajeProducto = Math.floor(galonajeRealPdv * porcentaje);
            
            if (resumen[producto]) {
              resumen[producto] += galonajeProducto;
            } else {
              resumen[producto] = galonajeProducto;
            }
          });
        });

        return Object.keys(resumen)
          .map(nombreProducto => ({
            nombre: nombreProducto,
            galonaje: resumen[nombreProducto]
          }))
          .filter(producto => producto.galonaje > 0) // Solo productos con galonaje
          .sort((a, b) => b.galonaje - a.galonaje); // Ordenar por galonaje descendente
      })()
    },
    visitas: {
      frecuencia: pdvsReales.map((pdv, index) => {
        // Distribución fija de visitas por PDV para consistencia
        const visitasData = {
          '1001': { visitas: 20, tipo: 'PRECIO/VOLUMEN' },
          '1002': { visitas: 16, tipo: 'VOLUMEN' },
          '1003': { visitas: 16, tipo: 'PRECIO' },
          '1004': { visitas: 23, tipo: 'FRECUENCIA' }
        };
        
        const dataPdv = visitasData[pdv.codigo] || { visitas: 16, tipo: 'VOLUMEN' };
        const puntosVisitas = dataPdv.visitas * 2; // 2 puntos por visita
        
        return {
          codigo: pdv.codigo,
          nombre: pdv.nombre,
          tipo: dataPdv.tipo,
          visitas: dataPdv.visitas,
          puntos: puntosVisitas
        };
      }),
      // Datos para gráfica de barras por tipo de visita - Datos consistentes
      visitasPorTipo: (() => {
        const tipos = ['PRECIO/VOLUMEN', 'VOLUMEN', 'PRECIO', 'FRECUENCIA'];
        
        // Distribución fija de visitas por tipo basada en los PDVs
        const distribucionVisitas = {
          'PRECIO/VOLUMEN': 8,  // 1001: 20 visitas * 0.4
          'VOLUMEN': 8,         // 1002: 16 visitas * 0.5  
          'PRECIO': 6,          // 1003: 16 visitas * 0.375
          'FRECUENCIA': 7       // 1004: 23 visitas * 0.3
        };
        
        return tipos.map(tipo => {
          let cantidad;
          
          if (pdvSeleccionado) {
            // Si hay PDV seleccionado, calcular visitas específicas para ese PDV
            const visitasPdv = pdvsReales
              .filter(pdv => pdv.codigo === pdvSeleccionado.codigo)[0];
            
            if (visitasPdv) {
              const visitasData = {
                '1001': { 'PRECIO/VOLUMEN': 8, 'VOLUMEN': 5, 'PRECIO': 4, 'FRECUENCIA': 3 },
                '1002': { 'PRECIO/VOLUMEN': 2, 'VOLUMEN': 8, 'PRECIO': 3, 'FRECUENCIA': 3 },
                '1003': { 'PRECIO/VOLUMEN': 3, 'VOLUMEN': 3, 'PRECIO': 6, 'FRECUENCIA': 4 },
                '1004': { 'PRECIO/VOLUMEN': 4, 'VOLUMEN': 4, 'PRECIO': 4, 'FRECUENCIA': 11 }
              };
              cantidad = visitasData[visitasPdv.codigo]?.[tipo] || 0;
            } else {
              cantidad = 0;
            }
          } else {
            // Mostrar datos de todos los PDVs
            cantidad = distribucionVisitas[tipo] || 0;
          }
          
          return {
            tipo,
            cantidad,
            color: ['#e30613', '#ff6b35', '#f7931e', '#00a651'][tipos.indexOf(tipo)]
          };
        });
      })()
    },
    productividad: {
      puntos: pdvsReales.map((pdv, index) => {
        const estado = index < 3 ? 'Registrado' : 'No Registrado'; // 3 de 4 registrados
        const puntosProf = estado === 'Registrado' ? (20 + Math.floor(Math.random() * 15)) : 0;
        return {
          codigo: pdv.codigo,
          nombre: pdv.nombre,
          direccion: pdv.direccion,
          estado: estado,
          puntos: puntosProf
        };
      })
    },
    precios: {
      puntos: pdvsReales.map((pdv, index) => {
        const estado = index < 3 ? 'Precios Reportados' : 'Precios No Reportados'; // 3 de 4 reportados
        // Puntos realistas: 2, 4 o 0
        const puntosPrecios = estado === 'Precios Reportados' ? 
          (index === 1 ? 2 : 4) : 0; // Don Juan: 2 puntos, otros: 4 puntos, La Esquina: 0 puntos
        return {
          codigo: pdv.codigo,
          nombre: pdv.nombre,
          direccion: pdv.direccion,
          estado: estado,
          puntos: puntosPrecios
        };
      })
    }
  };

  const datos = datosDetalles[metricId];

  // Filtrar datos si hay un PDV seleccionado
  const datosFiltrados = pdvSeleccionado ? {
    ...datos,
    puntos: datos.puntos?.filter(punto => punto.codigo === pdvSeleccionado.codigo) || datos.puntos,
    frecuencia: datos.frecuencia?.filter(punto => punto.codigo === pdvSeleccionado.codigo) || datos.frecuencia,
    productos: datos.productos?.filter(producto => producto.codigo === pdvSeleccionado.codigo) || datos.productos,
    // productosResumen ya está filtrado en la lógica principal, no necesita filtrado adicional
    productosResumen: datos.productosResumen,
    // Para visitas por tipo, usar los datos ya calculados en visitasPorTipo
    visitasPorTipo: datos.visitasPorTipo
  } : datos;

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
              {datosFiltrados.puntos.map((punto, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                {datosFiltrados.puntos.map((punto, index) => (
                  <tr key={index}>
                    <td>{punto.codigo}</td>
                    <td>{punto.nombre}</td>
                    <td>{punto.segmento}</td>
                    <td>{punto.meta.toLocaleString()}</td>
                    <td>{punto.real.toLocaleString()}</td>
                    <td>
                      <span className={`porcentaje ${punto.porcentaje >= 80 ? 'alto' : 'bajo'}`}>
                        {punto.porcentaje}%
                      </span>
                    </td>
                    <td>
                      <strong>{punto.puntos}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="grafica-segmentos">
            <h3>Galonaje Total por Segmento{pdvSeleccionado ? ` - ${pdvSeleccionado.nombre}` : ''}</h3>
            <div className="barras-container-popup">
              {(() => {
                // Calcular totales por segmento basado en datos reales filtrados
                const segmentos = ['CVL', 'MCO'];
                const datosSegmentos = segmentos.map(segmento => {
                  const totalSegmento = datosFiltrados.puntos
                    .filter(p => p.segmento === segmento)
                    .reduce((sum, p) => sum + p.real, 0);
                  return { segmento, total: totalSegmento };
                }).filter(s => s.total > 0); // Solo mostrar segmentos con datos

                const maxTotal = Math.max(...datosSegmentos.map(s => s.total));

                return datosSegmentos.map(({ segmento, total }) => (
                  <div key={segmento} className="barra-segmento-popup">
                    <div className="barra-info">
                      {datosFiltrados.puntos.filter(p => p.segmento === segmento).length} PDV{datosFiltrados.puntos.filter(p => p.segmento === segmento).length !== 1 ? 's' : ''}
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
              {/* Mensaje cuando no hay datos */}
              {datosFiltrados.puntos.reduce((sum, p) => sum + p.real, 0) === 0 && (
                <div className="sin-datos-mensaje">
                  <p>No hay datos de volumen disponibles</p>
                </div>
              )}
            </div>
          </div>

          <div className="tabla-container">
            <h3>Galonaje por Producto{pdvSeleccionado ? ` - ${pdvSeleccionado.nombre}` : ' (Todos los PDVs)'}</h3>
            <table className="detalle-tabla tabla-productos">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Nro Cajas</th>
                  <th>Galonaje Total</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.productosResumen?.length > 0 ? (
                  datosFiltrados.productosResumen.map((producto, index) => {
                    const totalGalonaje = datosFiltrados.productosResumen.reduce((sum, p) => sum + p.galonaje, 0);
                    const porcentaje = totalGalonaje > 0 ? ((producto.galonaje / totalGalonaje) * 100).toFixed(1) : 0;
                    // Calcular número de cajas (asumiendo 4 galones por caja como estándar)
                    const numeroCajas = Math.ceil(producto.galonaje / 4);
                    return (
                      <tr key={index}>
                        <td className="producto-nombre">{producto.nombre}</td>
                        <td><strong>{numeroCajas.toLocaleString()}</strong> cajas</td>
                        <td><strong>{producto.galonaje.toLocaleString()}</strong> gal</td>
                        <td>{porcentaje}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                      {pdvSeleccionado ? 
                        `No hay datos de productos para el PDV ${pdvSeleccionado.codigo}` :
                        'No hay datos de productos disponibles'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  <th>Cantidad Visitas</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.frecuencia.map((punto, index) => {
                  return (
                    <tr key={index}>
                      <td>{punto.codigo}</td>
                      <td>{punto.nombre}</td>
                      <td><strong>{punto.visitas}</strong></td>
                      <td>
                        <strong>{punto.puntos}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Gráfica de barras por tipo de visita */}
          <div className="grafica-visitas-tipo">
            <h3>Visitas por Tipo</h3>
            <div className="barras-container-visitas">
              {(datosFiltrados.visitasPorTipo || datos.visitasPorTipo).map((tipoData, index) => {
                const maxCantidad = Math.max(...(datosFiltrados.visitasPorTipo || datos.visitasPorTipo).map(t => t.cantidad));
                const altura = maxCantidad > 0 ? (tipoData.cantidad / maxCantidad) * 100 : 0;
                
                return (
                  <div key={index} className="barra-tipo-visita">
                    <div className="barra-visual-visita">
                      <div 
                        className="barra-fill-visita" 
                        style={{
                          height: `${altura}%`,
                          backgroundColor: tipoData.color
                        }}
                      ></div>
                    </div>
                    <div className="barra-valor-visita">{tipoData.cantidad}</div>
                    <div className="barra-label-visita">{tipoData.tipo}</div>
                  </div>
                );
              })}
            </div>
          </div>
{/* 
          <div className="grafica-visitas">
            <h3>Distribución de Visitas por PDV</h3>
            <div className="torta-container">
              {datosFiltrados.frecuencia.map((punto, index) => (
                <div key={index} className="torta-item">
                  <div className="torta-color" style={{backgroundColor: `hsl(${index * 90}, 70%, 50%)`}}></div>
                  <span>{punto.codigo}: {punto.visitas} visitas</span>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      )}

      {metricId === 'productividad' && (
        <div className="tabla-container">
          <h3>Estado de Profundidad por PDV{pdvSeleccionado ? ` - ${pdvSeleccionado.nombre}` : ''}</h3>
          <div className="tabla-productos-info">
            <p>📈 {datosFiltrados.puntos.filter(p => p.estado === 'Registrado').length} de {datosFiltrados.puntos.length} PDVs con profundidad registrada</p>
          </div>
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
              {datosFiltrados.puntos.map((punto, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {metricId === 'precios' && (
        <div className="tabla-container">
          <h3>Estado de Precios por PDV{pdvSeleccionado ? ` - ${pdvSeleccionado.nombre}` : ''}</h3>
          <div className="tabla-productos-info">
            <p>📋 {datosFiltrados.puntos.filter(p => p.estado === 'Precios Reportados').length} de {datosFiltrados.puntos.length} PDVs con precios reportados</p>
          </div>
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
              {datosFiltrados.puntos.map((punto, index) => (
                <tr key={index}>
                  <td>{punto.codigo}</td>
                  <td>{punto.nombre}</td>
                  <td>{punto.direccion}</td>
                  <td>
                    <span className={`estado ${punto.estado === 'Precios Reportados' ? 'implementado' : 'no-implementado'}`}>
                      {punto.estado}
                    </span>
                  </td>
                  <td>
                    <strong>{punto.puntos}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
