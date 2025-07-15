import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import FilterPanel from '../../components/mercadeo/FilterPanel';
import { useMercadeoRoute } from '../../hooks/auth';
import '../../styles/Mercadeo/mystery-shopper.css';


export default function MercadeoMysteryShopperVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    cedula: '',
    codigoPDV: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todas',
    puntaje: 'todos'
  });

  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useMercadeoRoute();

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Datos de ejemplo para visitas Mystery Shopper
  useEffect(() => {
    const fetchVisitasMystery = () => {
      setLoading(true);
      setTimeout(() => {
        const visitasMystery = [
          {
            id: 1,
            mystery_shopper: 'Carlos Mendoza',
            cedula: '12345678',
            puntoVenta: 'ESTACIÓN NORTE',
            codigo: '2001',
            direccion: 'Autopista Norte Km 12, Bogotá',
            fecha: '28/06/2025',
            puntaje: 85,
            estado: 'completado',
            evaluaciones: [
              { categoria: 'Atención al Cliente', puntaje: 90 },
              { categoria: 'Limpieza y Orden', puntaje: 80 },
              { categoria: 'Disponibilidad de Productos', puntaje: 85 },
              { categoria: 'Señalización', puntaje: 85 }
            ],
            observaciones: 'El personal fue muy amable y atento. La estación estaba limpia y bien organizada.',
            fotos: [
              '/storage/mystery/2025-06-28/foto1.jpg',
              '/storage/mystery/2025-06-28/foto2.jpg'
            ]
          },
          {
            id: 2,
            mystery_shopper: 'Ana Patricia López',
            cedula: '87654321',
            puntoVenta: 'SERVICENTRO CENTRAL',
            codigo: '2002',
            direccion: 'Carrera 15 #45-23, Medellín',
            fecha: '27/06/2025',
            puntaje: 92,
            estado: 'completado',
            evaluaciones: [
              { categoria: 'Atención al Cliente', puntaje: 95 },
              { categoria: 'Limpieza y Orden', puntaje: 90 },
              { categoria: 'Disponibilidad de Productos', puntaje: 90 },
              { categoria: 'Señalización', puntaje: 93 }
            ],
            observaciones: 'Excelente servicio. Personal capacitado y estación impecable.',
            fotos: [
              '/storage/mystery/2025-06-27/foto1.jpg',
              '/storage/mystery/2025-06-27/foto2.jpg',
              '/storage/mystery/2025-06-27/foto3.jpg'
            ]
          },
          {
            id: 3,
            mystery_shopper: 'Roberto Silva',
            cedula: '45678912',
            puntoVenta: 'TERPEL SUR',
            codigo: '2003',
            direccion: 'Avenida Sur #67-89, Cali',
            fecha: '26/06/2025',
            puntaje: 78,
            estado: 'pendiente_revision',
            evaluaciones: [
              { categoria: 'Atención al Cliente', puntaje: 75 },
              { categoria: 'Limpieza y Orden', puntaje: 80 },
              { categoria: 'Disponibilidad de Productos', puntaje: 75 },
              { categoria: 'Señalización', puntaje: 82 }
            ],
            observaciones: 'La atención fue correcta pero podría mejorar en la rapidez del servicio.',
            fotos: [
              '/storage/mystery/2025-06-26/foto1.jpg'
            ]
          },
          {
            id: 4,
            mystery_shopper: 'María González',
            cedula: '74185296',
            puntoVenta: 'ESTACIÓN OCCIDENTAL',
            codigo: '2004',
            direccion: 'Calle 80 #123-45, Barranquilla',
            fecha: '25/06/2025',
            puntaje: 95,
            estado: 'completado',
            evaluaciones: [
              { categoria: 'Atención al Cliente', puntaje: 98 },
              { categoria: 'Limpieza y Orden', puntaje: 92 },
              { categoria: 'Disponibilidad de Productos', puntaje: 95 },
              { categoria: 'Señalización', puntaje: 95 }
            ],
            observaciones: 'Servicio excepcional. Esta estación es un ejemplo a seguir.',
            fotos: [
              '/storage/mystery/2025-06-25/foto1.jpg',
              '/storage/mystery/2025-06-25/foto2.jpg'
            ]
          },
          {
            id: 5,
            mystery_shopper: 'Pedro Ramírez',
            cedula: '96325874',
            puntoVenta: 'SERVICENTRO ORIENTE',
            codigo: '2005',
            direccion: 'Carrera 68 #45-12, Bucaramanga',
            fecha: '24/06/2025',
            puntaje: 72,
            estado: 'pendiente_revision',
            evaluaciones: [
              { categoria: 'Atención al Cliente', puntaje: 70 },
              { categoria: 'Limpieza y Orden', puntaje: 75 },
              { categoria: 'Disponibilidad de Productos', puntaje: 70 },
              { categoria: 'Señalización', puntaje: 73 }
            ],
            observaciones: 'Necesita mejoras en varios aspectos. Baños en mal estado.',
            fotos: [
              '/storage/mystery/2025-06-24/foto1.jpg'
            ]
          }
        ];
        setVisitas(visitasMystery);
        setLoading(false);
      }, 1000);
    };

    fetchVisitasMystery();
  }, []);

  // Configuración de filtros para Mystery Shopper
  const filtrosConfig = [
    {
      id: 'cedula',
      type: 'input',
      label: 'Cédula Mystery Shopper',
      placeholder: 'Ingrese número de cédula...',
      icon: 'ID',
      value: filtros.cedula
    },
    {
      id: 'codigoPDV',
      type: 'input',
      label: 'Código PDV',
      placeholder: 'Código del punto de venta...',
      icon: 'PDV',
      value: filtros.codigoPDV
    },
    {
      id: 'fechaDesde',
      type: 'date',
      label: 'Fecha Desde',
      icon: 'DATE',
      value: filtros.fechaDesde
    },
    {
      id: 'fechaHasta',
      type: 'date',
      label: 'Fecha Hasta',
      icon: 'DATE',
      value: filtros.fechaHasta
    },
    {
      id: 'estado',
      type: 'select',
      label: 'Estado',
      icon: 'STATUS',
      value: filtros.estado,
      options: [
        { value: 'todas', label: 'Todas las visitas' },
        { value: 'completado', label: 'Completadas' },
        { value: 'pendiente_revision', label: 'Pendiente Revisión' },
        { value: 'en_proceso', label: 'En Proceso' }
      ]
    },
    {
      id: 'puntaje',
      type: 'select',
      label: 'Rango de Puntaje',
      icon: 'SCORE',
      value: filtros.puntaje,
      options: [
        { value: 'todos', label: 'Todos los puntajes' },
        { value: 'excelente', label: 'Excelente (90-100)' },
        { value: 'bueno', label: 'Bueno (80-89)' },
        { value: 'regular', label: 'Regular (70-79)' },
        { value: 'deficiente', label: 'Deficiente (< 70)' }
      ]
    }
  ];

  // Filtrar visitas
  const visitasFiltradas = visitas.filter(visita => {
    const cumpleCedula = !filtros.cedula || visita.cedula.includes(filtros.cedula);
    const cumpleCodigoPDV = !filtros.codigoPDV || visita.codigo.includes(filtros.codigoPDV);
    const cumpleEstado = filtros.estado === 'todas' || visita.estado === filtros.estado;
    
    // Filtro por rango de puntaje
    let cumplePuntaje = true;
    if (filtros.puntaje !== 'todos') {
      switch (filtros.puntaje) {
        case 'excelente':
          cumplePuntaje = visita.puntaje >= 90;
          break;
        case 'bueno':
          cumplePuntaje = visita.puntaje >= 80 && visita.puntaje < 90;
          break;
        case 'regular':
          cumplePuntaje = visita.puntaje >= 70 && visita.puntaje < 80;
          break;
        case 'deficiente':
          cumplePuntaje = visita.puntaje < 70;
          break;
      }
    }

    // Filtro por fecha
    let cumpleFecha = true;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const fechaVisita = new Date(visita.fecha.split('/').reverse().join('-'));
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        cumpleFecha = cumpleFecha && fechaVisita >= fechaDesde;
      }
      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        cumpleFecha = cumpleFecha && fechaVisita <= fechaHasta;
      }
    }

    return cumpleCedula && cumpleCodigoPDV && cumpleEstado && cumplePuntaje && cumpleFecha;
  });

  const handleFilterChange = (filterId, value) => {
    setFiltros(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  const handleClearFilters = () => {
    setFiltros({
      cedula: '',
      codigoPDV: '',
      fechaDesde: '',
      fechaHasta: '',
      estado: 'todas',
      puntaje: 'todos'
    });
  };

  const abrirPopup = (visita) => {
    setVisitaSeleccionada(visita);
    setPopupAbierto(true);
  };

  const cerrarPopup = () => {
    setPopupAbierto(false);
    setVisitaSeleccionada(null);
  };

  const getPuntajeColor = (puntaje) => {
    if (puntaje >= 90) return '#28a745'; // Verde
    if (puntaje >= 80) return '#ffc107'; // Amarillo
    if (puntaje >= 70) return '#fd7e14'; // Naranja
    return '#dc3545'; // Rojo
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'completado': { color: '#28a745', text: 'Completado' },
      'pendiente_revision': { color: '#ffc107', text: 'Pendiente Revisión' },
      'en_proceso': { color: '#007bff', text: 'En Proceso' }
    };
    return badges[estado] || { color: '#6c757d', text: 'Desconocido' };
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando visitas Mystery Shopper...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="mystery-shopper-page">
        {/* Banner */}
        <div className="visitas-banner">
          <div className="visitas-banner-content">
            <h1 className="visitas-banner-title">REGISTROS MYSTERY SHOPPER</h1>
          </div>
        </div>

        <div className="mystery-shopper-content">
          {/* Panel de Filtros */}
          <FilterPanel
            filters={filtrosConfig}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalResults={visitasFiltradas.length}
            title="Filtros de Búsqueda Mystery Shopper"
          />

          {/* Tabla de visitas */}
          <div className="visitas-table-container">
            <div className="table-header">
              <div className="header-cell">MYSTERY SHOPPER</div>
              <div className="header-cell">CÓDIGO PDV</div>
              <div className="header-cell">PUNTO DE VENTA</div>
              <div className="header-cell">FECHA</div>
              <div className="header-cell">PUNTAJE</div>
              <div className="header-cell">ESTADO</div>
              <div className="header-cell">FOTOS</div>
              <div className="header-cell">ACCIONES</div>
            </div>
            
            <div className="table-body">
              {visitasFiltradas.length === 0 ? (
                <div className="no-results">
                  <p>No se encontraron visitas con los filtros aplicados</p>
                </div>
              ) : (
                visitasFiltradas.map((visita) => (
                  <div key={visita.id} className="table-row" onClick={() => abrirPopup(visita)}>
                    <div className="cell usuario-cell" data-label="Mystery Shopper">
                      <div className="usuario-info">
                        <span className="usuario-name">{visita.mystery_shopper}</span>
                        <span className="usuario-cedula">CC: {visita.cedula}</span>
                      </div>
                    </div>
                    
                    <div className="cell codigo-cell" data-label="Código PDV">
                      <span className="codigo-badge">{visita.codigo}</span>
                    </div>
                    
                    <div className="cell punto-cell" data-label="Punto de Venta">
                      <div className="punto-info">
                        <span className="punto-nombre">{visita.puntoVenta}</span>
                        <span className="direccion-text">{visita.direccion}</span>
                      </div>
                    </div>
                    
                    <div className="cell fecha-cell" data-label="Fecha">
                      <span className="fecha-text">{visita.fecha}</span>
                    </div>
                    
                    <div className="cell puntaje-cell" data-label="Puntaje">
                      <div className="puntaje-badge" style={{ backgroundColor: getPuntajeColor(visita.puntaje) }}>
                        {visita.puntaje}%
                      </div>
                    </div>
                    
                    <div className="cell estado-cell" data-label="Estado">
                      <span 
                        className="estado-badge"
                        style={{ backgroundColor: getEstadoBadge(visita.estado).color }}
                      >
                        {getEstadoBadge(visita.estado).text}
                      </span>
                    </div>
                    
                    <div className="cell foto-cell" data-label="Fotos">
                      <div className="foto-icon">
                        <span className="foto-disponible">[IMG]</span>
                        <span className="foto-texto">{visita.fotos.length} foto{visita.fotos.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="cell acciones-cell" data-label="Acciones">
                      <button 
                        className="btn-accion ver-detalle"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirPopup(visita);
                        }}
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Popup de detalles */}
        {popupAbierto && visitaSeleccionada && (
          <div className="popup-overlay" onClick={cerrarPopup}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h3>Detalle Visita Mystery Shopper</h3>
                <button className="popup-close" onClick={cerrarPopup}>×</button>
              </div>
              
              <div className="popup-body">
                <div className="visita-info">
                  <div className="info-row">
                    <span className="info-label">Mystery Shopper:</span>
                    <span className="info-value">{visitaSeleccionada.mystery_shopper}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cédula:</span>
                    <span className="info-value">{visitaSeleccionada.cedula}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Punto de Venta:</span>
                    <span className="info-value">{visitaSeleccionada.puntoVenta}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Código PDV:</span>
                    <span className="info-value">{visitaSeleccionada.codigo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{visitaSeleccionada.fecha}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Puntaje Total:</span>
                    <span className="info-value">
                      <span 
                        className="puntaje-badge" 
                        style={{ backgroundColor: getPuntajeColor(visitaSeleccionada.puntaje) }}
                      >
                        {visitaSeleccionada.puntaje}%
                      </span>
                    </span>
                  </div>
                </div>

                {/* Evaluaciones por categoría */}
                <div className="evaluaciones-section">
                  <h4>Evaluaciones por Categoría</h4>
                  <div className="evaluaciones-grid">
                    {visitaSeleccionada.evaluaciones.map((evaluacion, index) => (
                      <div key={index} className="evaluacion-item">
                        <span className="evaluacion-categoria">{evaluacion.categoria}</span>
                        <span 
                          className="evaluacion-puntaje"
                          style={{ backgroundColor: getPuntajeColor(evaluacion.puntaje) }}
                        >
                          {evaluacion.puntaje}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observaciones */}
                <div className="observaciones-section">
                  <h4>Observaciones</h4>
                  <p className="observaciones-text">{visitaSeleccionada.observaciones}</p>
                </div>

                {/* Fotos */}
                <div className="fotos-section">
                  <h4>Evidencias Fotográficas ({visitaSeleccionada.fotos.length})</h4>
                  <div className="fotos-grid">
                    {visitaSeleccionada.fotos.map((foto, index) => (
                      <div key={index} className="foto-item">
                        <img src={foto} alt={`Evidencia ${index + 1}`} className="foto-evidencia" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
