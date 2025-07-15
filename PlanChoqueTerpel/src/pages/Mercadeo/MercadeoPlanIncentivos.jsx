import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMercadeoRoute } from '../../hooks/auth';
import '../../styles/Mercadeo/mercadeo-plan-incentivos.css';
import img1 from '../../assets/Img/premio_cartagena.jpg';
import img2 from '../../assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg';

// Importar imágenes para catálogos
import planpdvImg from '../../assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg';
import oiltecImg from '../../assets/Iconos/IconosCatalogos/OILTEC.png';
import celerityImg from '../../assets/Iconos/IconosCatalogos/CELERITY.png';

const podio = [
  {
    puesto: 2,
    nombre: 'Santiago Párraga',
    puntos: 15483,
    color: '#b0b0b0',
    trofeo: '🥈',
  },
  {
    puesto: 1,
    nombre: 'Ana María González',
    puntos: 16847,
    color: '#ffd700',
    trofeo: '🥇',
  },
  {
    puesto: 3,
    nombre: 'María Fernanda López',
    puntos: 12234,
    color: '#cd7f32',
    trofeo: '🥉',
  }
];

const tabla = [
  { puesto: 4, nombre: 'Luis Fernando Silva', puntos: 11756 },
  { puesto: 5, nombre: 'Carmen Elena Torres', puntos: 11052 },
  { puesto: 6, nombre: 'Roberto Andrés Mesa', puntos: 10850 },
  { puesto: 7, nombre: 'Patricia Morales', puntos: 10648 },
  { puesto: 8, nombre: 'Miguel Ángel Castro', puntos: 10445 },
  { puesto: 9, nombre: 'Diana Patricia Ruiz', puntos: 10243 },
  { puesto: 10, nombre: 'Carlos Eduardo Ramírez', puntos: 10040 },
];

const departamentos = [
  'Todos los departamentos',
  'Antioquia',
  'Atlántico', 
  'Bogotá D.C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Cauca',
  'Cesar',
  'Córdoba',
  'Cundinamarca',
  'Chocó',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Quindío',
  'Risaralda',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca'
];

const ciudadesPorDepartamento = {
  'Antioquia': ['Todas las ciudades', 'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Copacabana', 'Girardota'],
  'Valle del Cauca': ['Todas las ciudades', 'Cali', 'Palmira', 'Jamundí', 'Santander de Quilichao', 'Piendamó'],
  'Bogotá D.C.': ['Todas las ciudades', 'Bogotá D.C.'],
  'Santander': ['Todas las ciudades', 'Bucaramanga', 'Girón', 'San Gíl'],
  'Atlántico': ['Todas las ciudades', 'Barranquilla', 'Soledad'],
  'La Guajira': ['Todas las ciudades', 'Riohacha', 'Maicao'],
  'Cesar': ['Todas las ciudades', 'Valledupar', 'Aguachica'],
  'Norte de Santander': ['Todas las ciudades', 'Cúcuta'],
  'Magdalena': ['Todas las ciudades', 'Santa Marta'],
  'Cauca': ['Todas las ciudades', 'Popayán', 'Santander de Quilichao']
};

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
          Total ganadores: 38 asesores de ventas a nivel nacional
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
    pdfUrl: '/catalogos/pdfs/catalogo-oiltec.pdf'
  },
  {
    id: 3,
    titulo: 'CATÁLOGO CELERITY',
    imagen: celerityImg,
    pdfUrl: '/catalogos/pdfs/catalogo-celerity.pdf'
  }
];

export default function MercadeoPlanIncentivos() {
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [showPremiosModal, setShowPremiosModal] = useState(false);
  const [showTycModal, setShowTycModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCatalogosModal, setShowCatalogosModal] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('Todos los departamentos');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('Todas las ciudades');
  
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

  const handleDepartamentoChange = (depto) => {
    setDepartamentoSeleccionado(depto);
    setCiudadSeleccionada('Todas las ciudades');
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
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${titulo.replace(/\s+/g, '_')}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      // Fallback: abrir en nueva pestaña
      window.open(pdfUrl, '_blank');
    }
  };

  const ciudadesDisponibles = ciudadesPorDepartamento[departamentoSeleccionado] || ['Todas las ciudades'];

  return (
    <DashboardLayout user={user} pageTitle="PLAN DE INCENTIVOS">
      <div className="plan-incentivos-container">
        
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
                  <p>Lorem ipsum dolor sit amet consectetur adipiscing elit fringilla montes, vivamus maecenas praesent non integer sollicitudin id cras mus ligula, mi lobortis lacinia hac dignissim et libero nulla.</p>
                </div>
                
                <div className="info-item">
                  <h4>📄 Conoce más:</h4>
                  <span 
                    className="link-text"
                    onClick={() => setShowTycModal(true)}
                  >
                    (TyC) - Términos y Condiciones
                  </span>
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
                  <p>Campaña vigente desde el 01 de enero hasta el 31 de diciembre de 2025</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Podio */}
        <div className="podio-container">
          {/* 2do lugar */}
          <div className="podio-position segundo">
            <div className="cinta segundo">2do Lugar</div>
            <span className="trofeo">{podio[0].trofeo}</span>
            <div className="podio-base segundo">
              <span className="podio-posicion segundo">{podio[0].nombre}</span>
              <span className="podio-puntos segundo">{podio[0].puntos}</span>
            </div>
          </div>
          
          {/* 1er lugar */}
          <div className="podio-position primero">
            <div className="cinta primero">1er Lugar</div>
            <span className="trofeo primero">{podio[1].trofeo}</span>
            <div className="podio-base primero">
              <span className="podio-posicion primero">{podio[1].nombre}</span>
              <span className="podio-puntos primero">{podio[1].puntos}</span>
            </div>
          </div>
          
          {/* 3er lugar */}
          <div className="podio-position tercero">
            <div className="cinta tercero">3er Lugar</div>
            <span className="trofeo">{podio[2].trofeo}</span>
            <div className="podio-base tercero">
              <span className="podio-posicion tercero">{podio[2].nombre}</span>
              <span className="podio-puntos tercero">{podio[2].puntos}</span>
            </div>
          </div>
        </div>

        {/* Tabla de posiciones */}
        <div className="tabla-ranking">
          <div className="tabla-header">
            <span className="tabla-header-puesto">#</span>
            <span className="tabla-header-nombre">ASESOR</span>
            <span className="tabla-header-puntos">PUNTOS</span>
          </div>
          {tabla.map(row => (
            <div key={row.puesto} className="tabla-fila">
              <span className="tabla-fila-puesto">{row.puesto}</span>
              <span className="tabla-fila-nombre">{row.nombre}</span>
              <span className="tabla-fila-puntos">{row.puntos}</span>
            </div>
          ))}
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

        {/* Modal de Términos y Condiciones */}
        {showTycModal && (
          <div className="modal-overlay" onClick={() => setShowTycModal(false)}>
            <div className="modal-content tyc-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📄 Términos y Condiciones</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowTycModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="tyc-content">
                  <h3>Condiciones Generales</h3>
                  <p>La campaña "Visionarios de la Mejor Energía" está dirigida a todos los asesores de ventas autorizados de Terpel a nivel nacional.</p>
                  
                  <h4>Elegibilidad:</h4>
                  <ul>
                    <li>Ser asesor de ventas activo durante toda la campaña</li>
                    <li>Cumplir con los KPIs establecidos</li>
                    <li>Mantener un desempeño consistente</li>
                  </ul>
                  
                  <h4>Evaluación:</h4>
                  <ul>
                    <li>Los puntos se calculan según cumplimiento de metas</li>
                    <li>Se evalúa mensualmente el desempeño</li>
                    <li>Los rankings se actualizan semanalmente</li>
                  </ul>
                  
                  <h4>Premios:</h4>
                  <ul>
                    <li>Los premios no son transferibles</li>
                    <li>Los ganadores serán notificados oficialmente</li>
                    <li>Terpel se reserva el derecho de modificar los premios</li>
                  </ul>
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
                      value={departamentoSeleccionado}
                      onChange={(e) => handleDepartamentoChange(e.target.value)}
                      className="filter-select"
                    >
                      {departamentos.map(depto => (
                        <option key={depto} value={depto}>{depto}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>🏙️ Ciudad:</label>
                    <select 
                      value={ciudadSeleccionada}
                      onChange={(e) => setCiudadSeleccionada(e.target.value)}
                      className="filter-select"
                      disabled={departamentoSeleccionado === 'Todos los departamentos'}
                    >
                      {ciudadesDisponibles.map(ciudad => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>
                  </div>
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
                      setDepartamentoSeleccionado('Todos los departamentos');
                      setCiudadSeleccionada('Todas las ciudades');
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

        {/* Botón flotante para abrir filtros */}
        <button 
          className="floating-filter-btn"
          onClick={() => setShowFilterModal(true)}
        >
        Filtros
        </button>
      </div>
    </DashboardLayout>
  );
}
