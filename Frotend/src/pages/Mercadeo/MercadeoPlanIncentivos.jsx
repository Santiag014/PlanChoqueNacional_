import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMercadeoRoute } from '../../hooks/auth';
import { useRankingMercadeo } from '../../hooks/mercadeo';
import '../../styles/Mercadeo/mercadeo-plan-incentivos.css';
import img1 from '../../assets/Img/premio_cartagena.jpg';
import img2 from '../../assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg';

// Importar imágenes para catálogos
import planpdvImg from '../../assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg';
import oiltecImg from '../../assets/Iconos/IconosCatalogos/OILTEC.png';
import celerityImg from '../../assets/Iconos/IconosCatalogos/CELERITY.png';

const slides = [
  {
    img: img1,
    titulo: "Viaje a Cartagena",
    descripcion: "Planta de Lubricantes Terpel",
    recuadro: (
      <>
        <div className="premio-recuadro-titulo">
          Estadía: 2 días y 1 noche, todo incluido
        </div>
        <div className="premio-recuadro-texto">
          <strong>Día 1:</strong>
          <ul className="premio-recuadro-lista">
            <li>Llegada al Hotel Las Américas Cartagena</li>
            <li>Ingreso a planta de lubricantes Terpel</li>
            <li>Almuerzo y tarde libre en instalaciones del hotel</li>
            <li>Cena en restaurante exclusivo (Ciudad Amurallada)</li>
          </ul>
          <strong>Día 2:</strong>
          <ul className="premio-recuadro-lista">
            <li>Desayuno en hotel</li>
            <li>Recorrido histórico: Las calles Terpel (historia, cultura y gastronomía)</li>
            <li>Almuerzo en restaurante típico</li>
            <li>Check out y regreso a ciudad de origen</li>
          </ul>
        </div>
        <div className="premio-recuadro-footer">
          Total ganadores: 36 asesores de ventas a nivel nacional
        </div>
      </>
    )
  },
  {
    img: img2,
    titulo: "Premio Nro. 2",
    descripcion: "¡Pronto anunciaremos más detalles!",
    recuadro: (
      <>
        <div className="premio-recuadro-titulo">
          Detalles próximamente
        </div>
        <div className="premio-recuadro-texto">
          Mantente atento a las novedades en esta sección.
        </div>
        <div className="premio-recuadro-footer">
          ¡Sigue participando!
        </div>
      </>
    )
  }
];

// Datos de catálogos
const catalogos = [
  {
    id: 1,
    titulo: 'CATÁLOGO PLAN PDV',
    imagen: planpdvImg,
    pdfUrl: '/catalogos/pdfs/catalogo-plan-pdv.pdf'
  },
  {
    id: 2,
    titulo: 'CATÁLOGO OILTEC',
    imagen: oiltecImg,
    pdfUrl: 'https://drive.google.com/uc?export=download&id=1WkqETK73HcfUBoI0s_UUF1vlBsgKQCGT'
  },
  {
    id: 3,
    titulo: 'CATÁLOGO CELERITY',
    imagen: celerityImg,
    pdfUrl: 'https://drive.google.com/uc?export=download&id=1gR79U5ciRXYCVy0lOFEqeuXuf57mt7vg'
  }
];

export default function MercadeoPlanIncentivos() {
  // Hook para obtener datos reales del ranking
  const { 
    loading: rankingLoading, 
    error: rankingError, 
    podiumData, 
    tableData, 
    myRankingInfo,
    filtrosData,
    filtrosActivos,
    setFiltros,
    getCiudadesDisponibles,
    totalAsesoresFiltrados,
    refetchRanking 
  } = useRankingMercadeo();

  const [infoExpanded, setInfoExpanded] = useState(false);
  const [showPremiosModal, setShowPremiosModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCatalogosModal, setShowCatalogosModal] = useState(false);
  
  // Estados para el carrusel de premios
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useMercadeoRoute();

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Función para preparar datos del podio garantizando siempre 3 posiciones
  const prepararDatosPodio = () => {
    const podioCompleto = [];
    
    // Crear datos por defecto para cada posición
    const posicionesDefault = [
      { 
        posicion: 2, 
        nombre: 'Esperando asesor', 
        total_puntos: 0, 
        trofeo: '🥈',
        isEmpty: true 
      },
      { 
        posicion: 1, 
        nombre: 'Esperando asesor', 
        total_puntos: 0, 
        trofeo: '🥇',
        isEmpty: true 
      },
      { 
        posicion: 3, 
        nombre: 'Esperando asesor', 
        total_puntos: 0, 
        trofeo: '🥉',
        isEmpty: true 
      }
    ];

    // Llenar con datos reales si están disponibles
    for (let i = 0; i < 3; i++) {
      if (podiumData && podiumData[i]) {
        podioCompleto[i] = {
          ...podiumData[i],
          isEmpty: false
        };
      } else {
        podioCompleto[i] = posicionesDefault[i];
      }
    }

    return podioCompleto;
  };

  const datosPodioCompleto = prepararDatosPodio();
  
  // Función para preparar datos de la tabla garantizando siempre las 3 primeras posiciones
  const prepararDatosTabla = () => {
    const tablaCompleta = [];
    
    // Crear un mapa de posiciones del podio para fácil acceso
    const mapaPodio = {};
    datosPodioCompleto.forEach(item => {
      mapaPodio[item.posicion] = item;
    });
    
    // Agregar las primeras 3 posiciones en orden ascendente (1°, 2°, 3°)
    for (let posicion = 1; posicion <= 3; posicion++) {
      const posicionPodio = mapaPodio[posicion];
      if (posicionPodio) {
        tablaCompleta.push({
          puesto: posicion,
          nombre: posicionPodio.isEmpty ? 'Esperando asesor' : posicionPodio.nombre,
          puntos: posicionPodio.isEmpty ? '--' : posicionPodio.total_puntos,
          esUsuarioActual: posicionPodio.esUsuarioActual || false,
          isEmpty: posicionPodio.isEmpty
        });
      }
    }
    
    // Agregar el resto de datos de la tabla (posiciones 4+)
    if (tableData && tableData.length > 0) {
      const datosRestantes = tableData.filter(item => item.puesto > 3);
      tablaCompleta.push(...datosRestantes);
    }
    
    return tablaCompleta;
  };

  const datosTablaCompleta = prepararDatosTabla();

  // Funciones para manejar filtros
  const handleDepartamentoChange = (deptoId) => {
    setFiltros({
      departamento: deptoId,
      ciudad: 'todas' // Resetear ciudad cuando cambia departamento
    });
  };

  const handleCiudadChange = (ciudadId) => {
    setFiltros({
      ...filtrosActivos,
      ciudad: ciudadId
    });
  };

  // Funciones para el carrusel de premios
  const nextSlide = () => setCurrentSlide((currentSlide + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length);

  // Handlers para swipe en el carrusel
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Función para descargar PDFs
  const handleDownloadPDF = (pdfUrl, titulo) => {
    try {
      // Si es una URL de Google Drive, abrir directamente en nueva pestaña
      if (pdfUrl.includes('drive.google.com')) {
        window.open(pdfUrl, '_blank');
      } else {
        // Para otros PDFs, usar el método tradicional de descarga
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${titulo.replace(/\s+/g, '_')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      // Fallback: abrir en nueva pestaña
      window.open(pdfUrl, '_blank');
    }
  };

  // Función para descargar términos y condiciones
  const handleDownloadTerminos = () => {
    const terminosUrl = '/storage/T&C/Términos y condiciones Plan Mejor Energia- ASESORES DE VENTA V1[1].pdf';
    handleDownloadPDF(terminosUrl, 'Terminos_y_Condiciones_Plan_Mejor_Energia');
  };

  return (
    <DashboardLayout user={user} pageTitle="PLAN DE INCENTIVOS">
      <div className="ranking-container">
        
        {/* Sección de información desplegable */}
        <div className="info-section">
          <div 
            className="info-header" 
            onClick={() => setInfoExpanded(!infoExpanded)}
          >
            <div className="info-title">
              <span>📊 Información general</span>
              <span className={`arrow ${infoExpanded ? 'expanded' : ''}`}>▼</span>
            </div>
          </div>
          
          {infoExpanded && (
            <div className="info-content">
              <div className="info-grid">
                <div className="info-item">
                  <h4>🔧 Mecánica:</h4>
                  <p>El Plan de la Mejor Energía es una estrategia de Trade Marketing Nacional​ para asegurar la correcta implementación de precios y consolidar el posicionamiento deseado de Lubricantes Terpel en el canal, impactando a la fuerza de ventas, los PDV y el consumidor final.</p>
                </div>
                
                <div className="info-item">
                  <h4>🏆 Premios:</h4>
                  <span 
                    className="link-text"
                    onClick={() => setShowPremiosModal(true)}
                  >
                    Ver más...
                  </span>
                </div>
                
                <div className="info-item">
                  <h4>📋 Información del Plan:</h4>
                  <span 
                    className="link-text"
                    onClick={() => setShowCatalogosModal(true)}
                  >
                    Ver catálogos...
                  </span>
                </div>
                
                <div className="info-item">
                  <h4>📅 Vigencia:</h4>
                  <p>Campaña vigente desde el 01 de agosto hasta el 15 de diciembre de 2025</p>
                </div>

                
                <div className="info-item link-text" onClick={handleDownloadTerminos}>
                  <h4>📜 Terminos y Condiciones</h4>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Podio */}
        <div className="podio-container">
          {rankingLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando ranking...</p>
            </div>
          ) : rankingError ? (
            <div className="error-container">
              <p className="error-message">❌ Error: {rankingError}</p>
              <button onClick={refetchRanking} className="retry-btn">
                🔄 Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* 2do lugar */}
              <div className={`podio-position segundo ${datosPodioCompleto[0].isEmpty ? 'empty' : ''}`}>
                <div className="cinta segundo">2do Lugar</div>
                <span className="trofeo segundo">{datosPodioCompleto[0].trofeo}</span>
                <div className="podio-base segundo"></div>
                <div className="podio-info">
                  <span className={`podio-nombre segundo ${datosPodioCompleto[0].isEmpty ? 'empty' : ''}`}>
                    {datosPodioCompleto[0].nombre}
                  </span><br />
                  <span className={`podio-puntos segundo ${datosPodioCompleto[0].isEmpty ? 'empty' : ''}`}>
                    {datosPodioCompleto[0].isEmpty ? '-- pts' : `${datosPodioCompleto[0].total_puntos} pts`}
                  </span>
                </div>
              </div>
              
              {/* 1er lugar */}
              <div className={`podio-position primero ${datosPodioCompleto[1].isEmpty ? 'empty' : ''}`}>
                <div className="cinta primero">1er Lugar</div>
                <span className="trofeo primero">{datosPodioCompleto[1].trofeo}</span>
                <div className="podio-base primero"></div>
                <div className="podio-info">
                  <span className={`podio-nombre primero ${datosPodioCompleto[1].isEmpty ? 'empty' : ''}`}>
                    {datosPodioCompleto[1].nombre}
                  </span> <br />
                  <span className={`podio-puntos primero ${datosPodioCompleto[1].isEmpty ? 'empty' : ''}`}>
                    {datosPodioCompleto[1].isEmpty ? '-- pts' : `${datosPodioCompleto[1].total_puntos} pts`}
                  </span>
                </div>
              </div>
              
              {/* 3er lugar */}
              <div className={`podio-position tercero ${datosPodioCompleto[2].isEmpty ? 'empty' : ''}`}>
                <div className="cinta tercero">3er Lugar</div>
                <span className="trofeo tercero">{datosPodioCompleto[2].trofeo}</span>
                <div className="podio-base tercero"></div>
                <div className="podio-info">
                  <span className={`podio-nombre tercero ${datosPodioCompleto[2].isEmpty ? 'empty' : ''}`}>
                    {datosPodioCompleto[2].nombre}
                  </span><br />
                  <span className={`podio-puntos tercero ${datosPodioCompleto[2].isEmpty ? 'empty' : ''}`}>
                    {datosPodioCompleto[2].isEmpty ? '-- pts' : `${datosPodioCompleto[2].total_puntos} pts`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabla de posiciones */}
        <div className="tabla-ranking">
          <div className="tabla-header">
            <span className="tabla-header-puesto">#</span>
            <span className="tabla-header-nombre">NOMBRE</span>
            <span className="tabla-header-puntos">PTS</span>
          </div>
          
          {rankingLoading ? (
            <div className="tabla-loading">
              <div className="loading-spinner-small"></div>
              <span>Cargando tabla...</span>
            </div>
          ) : rankingError ? (
            <div className="tabla-error">
              <span>❌ Error al cargar datos</span>
            </div>
          ) : (
            datosTablaCompleta.map(row => (
              <div 
                key={row.puesto} 
                className={`tabla-fila ${row.esUsuarioActual ? 'tabla-fila-usuario-actual' : ''} ${row.isEmpty ? 'tabla-fila-empty' : ''}`}
              >
                <span className="tabla-fila-puesto">{row.puesto}</span>
                <span className="tabla-fila-nombre">
                  {row.nombre}
                  {row.esUsuarioActual && <span className="badge-usuario"> (Tú)</span>}
                </span>
                <span className="tabla-fila-puntos">{row.puntos}</span>
              </div>
            ))
          )}
          
          {/* Información del usuario actual si no está visible */}
          {myRankingInfo && myRankingInfo.posicion > 10 && (
            <div className="mi-posicion-info">
              <div className="mi-posicion-divider">...</div>
              <div className="tabla-fila tabla-fila-usuario-actual">
                <span className="tabla-fila-puesto">{myRankingInfo.posicion}</span>
                <span className="tabla-fila-nombre">
                  {myRankingInfo.nombre} (Tú)
                </span>
                <span className="tabla-fila-puntos">{myRankingInfo.puntos}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botón para filtros debajo de la tabla */}
        <div className="filtros-section">
          <button 
            className="filtros-btn"
            onClick={() => setShowFilterModal(true)}
          >
            🔍 Filtrar Ranking
          </button>
        </div>

        {/* Modal de Premios con Carrusel */}
        {showPremiosModal && (
          <div className="modal-overlay" onClick={() => setShowPremiosModal(false)}>
            <div className="modal-content premio-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏆 Premios de la Campaña</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowPremiosModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body premio-modal-body">
                {/* Intro */}
                <div className="premio-intro">
                  <p className="premio-intro-text">
                    Los dos asesores por AC con el mayor sobre cumplimiento de KPIs al finalizar la actividad, se ganarán como premio mayor:
                  </p>
                </div>
                
                {/* Carrusel */}
                <div className="premio-carrusel">
                  <div
                    className="premio-slide"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={slides[currentSlide].img}
                      alt={slides[currentSlide].titulo}
                      className="premio-slide-img"
                    />
                  </div>
                  
                  {/* Puntos del carrusel */}
                  <div className="premio-dots">
                    {slides.map((_, idx) => (
                      <span 
                        key={idx} 
                        className={`premio-dot ${idx === currentSlide ? 'active' : 'inactive'}`}
                        onClick={() => setCurrentSlide(idx)}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Info dinámica */}
                <div className="premio-info">
                  <div className="premio-titulo">
                    {slides[currentSlide].titulo}
                  </div>
                  <div className="premio-descripcion">
                    {slides[currentSlide].descripcion}
                  </div>
                  <div className="premio-recuadro">
                    {slides[currentSlide].recuadro}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Filtros */}
        {showFilterModal && (
          <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
            <div className="filter-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="filter-modal-header">
                <h3>🔍 Filtrar Ranking</h3>
                <button 
                  className="filter-close-btn"
                  onClick={() => setShowFilterModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="filter-modal-body">
                <div className="filter-grid">
                  <div className="filter-group">
                    <label>📍 Departamento:</label>
                    <select 
                      value={filtrosActivos.departamento}
                      onChange={(e) => handleDepartamentoChange(e.target.value)}
                      className="filter-select"
                    >
                      {filtrosData?.departamentos?.map(depto => (
                        <option key={depto.id} value={depto.id}>
                          {depto.descripcion}
                        </option>
                      )) || <option value="todos">Cargando...</option>}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>🏙️ Ciudad:</label>
                    <select 
                      value={filtrosActivos.ciudad}
                      onChange={(e) => handleCiudadChange(e.target.value)}
                      className="filter-select"
                      disabled={filtrosActivos.departamento === 'todos'}
                    >
                      {getCiudadesDisponibles().map(ciudad => (
                        <option key={ciudad.id} value={ciudad.id}>
                          {ciudad.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="filter-stats">
                  <span className="filter-results">
                    📊 Mostrando {totalAsesoresFiltrados} asesores
                  </span>
                </div>
                
                <div className="filter-actions">
                  <button 
                    className="apply-filter-btn"
                    onClick={() => setShowFilterModal(false)}
                  >
                    ✅ Aplicar Filtros
                  </button>
                  <button 
                    className="clear-filter-btn"
                    onClick={() => {
                      setFiltros({ departamento: 'todos', ciudad: 'todas' });
                    }}
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Catálogos */}
        {showCatalogosModal && (
          <div className="modal-overlay" onClick={() => setShowCatalogosModal(false)}>
            <div className="modal-content catalogos-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📋 Catálogos del Plan</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCatalogosModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="catalogos-grid">
                  {catalogos.map((catalogo) => (
                    <div key={catalogo.id} className="catalogo-card">
                      <div className="catalogo-image">
                        <img 
                          src={catalogo.imagen} 
                          alt={catalogo.titulo}
                          onError={(e) => {
                            e.target.src = '/placeholder-catalog.png';
                          }}
                        />
                      </div>
                      
                      <div className="catalogo-content">
                        <h3 className="catalogo-titulo">{catalogo.titulo}</h3>
                        <p className="catalogo-descripcion">{catalogo.descripcion}</p>
                        
                        <button 
                          className="catalogo-download-btn"
                          onClick={() => handleDownloadPDF(catalogo.pdfUrl, catalogo.titulo)}
                        >
                        Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
