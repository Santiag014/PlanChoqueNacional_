import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useMercadeoRoute } from '../../hooks/auth';
import FilterPanel from '../../components/mercadeo/FilterPanel';
import '../../styles/Mercadeo/visitas.css';

export default function MercadeoVisitas() {
  const navigate = useNavigate();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCedula, setFiltroCedula] = useState('');
  const [filtroCodigoPDV, setFiltroCodigoPDV] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);

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

  // Datos de ejemplo para las visitas
  useEffect(() => {
    const fetchVisitas = () => {
      setLoading(true);
      // Simular carga de datos
      setTimeout(() => {
        const visitasEjemplo = [
          {
            id: 1,
            usuario: 'Paulo Herrera',
            cedula: '123456789',
            puntoVenta: 'LUBRICANTES EL HERRERO',
            codigo: '1001',
            direccion: 'Calle 45 #23-12, Bogotá',
            telefono: '300-555-0123',
            propietario: 'Carlos Herrera',
            fecha: '27/06/2025',
            actividad: 'IMPLEMENTACIÓN',
            kpi: 'VOLUMEN',
            tipo: 'vol',
            estado: 'pendiente',
            fotoPopUrl: '/storage/2025-07-04/1751639626310-09-33-46.png',
            productos: [
              { referencia: 'TERPEL OILTEC 10W-30 TITANIO', presentacion: '1/4 Gal', nroCajas: 62, galonaje: 15.5 },
              { referencia: 'TERPEL OILTEC 10W-40 TITANIO', presentacion: '1 Gal', nroCajas: 8, galonaje: 8.0 },
              { referencia: 'TERPEL OILTEC 20W-50 TITANIO', presentacion: '55 Gal', nroCajas: 2, galonaje: 110.0 },
              { referencia: 'REFRIGERANTE ESTÁNDAR', presentacion: '1 Gal', nroCajas: 12, galonaje: 12.0 }
            ],
            volumenTotal: 145.5
          },
          {
            id: 2,
            usuario: 'Valentina Gómez',
            cedula: '987654321',
            puntoVenta: 'LA TIENDA DEL MÁXIMO DESEMPEÑO',
            codigo: '1002',
            direccion: 'Carrera 15 #78-45, Medellín',
            telefono: '300-555-0124',
            propietario: 'Valentina Gómez',
            fecha: '26/06/2025',
            actividad: 'VISITA',
            kpi: 'FRECUENCIA',
            tipo: 'fre',
            estado: 'aprobado',
            fotoPopUrl: '/storage/2025-07-04/1751639742109-09-35-42.png'
          },
          {
            id: 3,
            usuario: 'Rosario Téllez',
            cedula: '476482848',
            puntoVenta: 'TODO PARA TU MOTOR SAS',
            codigo: '1003',
            direccion: 'Avenida 68 #12-34, Cali',
            telefono: '300-555-0125',
            propietario: 'Roberto Téllez',
            fecha: '26/06/2025',
            actividad: 'IMPLEMENTACIÓN',
            kpi: 'PRECIO',
            tipo: 'pre',
            estado: 'pendiente',
            fotoPopUrl: '/storage/2025-07-04/1751639822542-09-37-02.png',
            fotoFacturaUrl: '/storage/2025-07-04/1751641060969-09-57-40.png',
            productos: [
              { referencia: 'TERPEL OILTEC 10W-30 TITANIO', presentacion: '1/4 Gal', precioSugerido: 30000, precioReal: 28500 },
              { referencia: 'TERPEL OILTEC 20W-50 MULTIGRADO', presentacion: '1 Gal', precioSugerido: 98000, precioReal: 95000 },
              { referencia: 'REFRIGERANTE LARGA VIDA', presentacion: '1 Gal', precioSugerido: 37000, precioReal: 35000 }
            ],
            valorTotal: 945000
          },
          {
            id: 4,
            usuario: 'Santiago Párraga',
            cedula: '555666777',
            puntoVenta: 'ESTACIÓN CENTRAL',
            codigo: '1004',
            direccion: 'Transversal 12 #56-89, Barranquilla',
            telefono: '300-555-0126',
            propietario: 'Santiago Párraga Sr.',
            fecha: '26/06/2025',
            actividad: 'IMPLEMENTACIÓN',
            kpi: 'PRECIO/VOLUMEN',
            tipo: 'pre-vol',
            estado: 'rechazado',
            fotoPopUrl: '/storage/2025-07-04/1751639626310-09-33-46.png',
            fotoFacturaUrl: '/storage/2025-07-04/1751644579791-10-56-19.png',
            productos: [
              { 
                referencia: 'TERPEL OILTEC 40 MONOGRADO', 
                presentacion: '55 Gal', 
                nroCajas: 3, 
                galonaje: 165.0,
                precioSugerido: 2800000,
                precioReal: 2750000
              },
              { 
                referencia: 'TERPEL OILTEC 50 MONOGRADO', 
                presentacion: '1 Gal', 
                nroCajas: 25, 
                galonaje: 25.0,
                precioSugerido: 95000,
                precioReal: 93000
              }
            ],
            volumenTotal: 190.0,
            valorTotal: 5075000
          },
          {
            id: 5,
            usuario: 'María González',
            cedula: '888999000',
            puntoVenta: 'LUBRICANTES TOTAL',
            codigo: '1005',
            direccion: 'Diagonal 25 #34-67, Bucaramanga',
            telefono: '300-555-0127',
            propietario: 'María González',
            fecha: '25/06/2025',
            actividad: 'VISITA',
            kpi: 'FRECUENCIA',
            tipo: 'fre',
            estado: 'pendiente',
            fotoPopUrl: '/storage/2025-07-04/1751639742109-09-35-42.png'
          },
          {
            id: 6,
            usuario: 'Jorge Ramírez',
            cedula: '111222333',
            puntoVenta: 'DISTRIBUIDORA EL SOL',
            codigo: '1006',
            direccion: 'Calle 80 #45-23, Pereira',
            telefono: '300-555-0128',
            propietario: 'Jorge Ramírez',
            fecha: '25/06/2025',
            actividad: 'IMPLEMENTACIÓN',
            kpi: 'PRECIO',
            tipo: 'pre',
            estado: 'aprobado',
            fotoPopUrl: '/storage/2025-07-04/1751639822542-09-37-02.png',
            fotoFacturaUrl: '/storage/2025-07-04/1751644694242-10-58-14.png',
            productos: [
              { referencia: 'TERPEL OILTEC 15W-40 TITANIO', presentacion: '1/4 Gal', precioSugerido: 28000, precioReal: 27000 },
              { referencia: 'TERPEL OILTEC SAE 40', presentacion: '1 Gal', precioSugerido: 88000, precioReal: 85000 }
            ],
            valorTotal: 1220000
          },
          {
            id: 7,
            usuario: 'Ana Rodríguez',
            cedula: '444555666',
            puntoVenta: 'SERVITERPEL NORTE',
            codigo: '1007',
            direccion: 'Autopista Norte Km 15, Bogotá',
            telefono: '300-555-0129',
            propietario: 'Ana Rodríguez',
            fecha: '24/06/2025',
            actividad: 'IMPLEMENTACIÓN',
            kpi: 'VOLUMEN',
            tipo: 'vol',
            estado: 'pendiente',
            fotoPopUrl: '/storage/2025-07-04/1751639626310-09-33-46.png',
            productos: [
              { referencia: 'TERPEL OILTEC TERGAS 20W-50', presentacion: '1 Gal', nroCajas: 45, galonaje: 45.0 },
              { referencia: 'REFRIGERANTE PREMIUM', presentacion: '1/2 Gal', nroCajas: 36, galonaje: 18.0 }
            ],
            volumenTotal: 63.0
          },
          {
            id: 8,
            usuario: 'Luis Morales',
            cedula: '777888999',
            puntoVenta: 'MOTOR PARTS CENTER',
            codigo: '1008',
            direccion: 'Carrera 7 #123-45, Manizales',
            telefono: '300-555-0130',
            propietario: 'Luis Morales',
            fecha: '24/06/2025',
            actividad: 'VISITA',
            kpi: 'FRECUENCIA',
            tipo: 'fre',
            estado: 'rechazado',
            fotoPopUrl: '/storage/2025-07-04/1751639742109-09-35-42.png'
          }
        ];
        console.log('🏪 Visitas cargadas:', visitasEjemplo);
        setVisitas(visitasEjemplo);
        setLoading(false);
      }, 1000);
    };

    fetchVisitas();
  }, []);

  // Filtrar visitas
  const visitasFiltradas = visitas.filter(visita => {
    const cumpleFiltroCedula = 
      filtroCedula === '' || visita.cedula.includes(filtroCedula);
    
    const cumpleFiltroCodigoPDV = 
      filtroCodigoPDV === '' || visita.codigo.includes(filtroCodigoPDV);
    
    const cumpleFiltroEstado = 
      filtroEstado === 'todas' || visita.estado === filtroEstado;
    
    return cumpleFiltroCedula && cumpleFiltroCodigoPDV && cumpleFiltroEstado;
  });

  const limpiarFiltros = () => {
    setFiltroCedula('');
    setFiltroCodigoPDV('');
    setFiltroEstado('todas');
  };

  // Configuración de filtros para el FilterPanel
  const filterConfig = [
    {
      id: 'cedula',
      type: 'input',
      inputType: 'text',
      label: 'Número de Cédula',
      placeholder: 'Ingrese número de cédula...',
      value: filtroCedula,
      icon: '👤'
    },
    {
      id: 'codigoPDV',
      type: 'input',
      inputType: 'text',
      label: 'Código PDV',
      placeholder: 'Código del punto de venta...',
      value: filtroCodigoPDV,
      icon: '🏪'
    },
    {
      id: 'estado',
      type: 'select',
      label: 'Estado',
      placeholder: 'Seleccione estado...',
      value: filtroEstado,
      icon: '📋',
      options: [
        { value: 'todas', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendientes por Aprobar' },
        { value: 'aprobado', label: 'Aprobados' },
        { value: 'rechazado', label: 'Rechazados' }
      ]
    }
  ];

  // Handler para cambios en los filtros
  const handleFilterChange = (filterId, value) => {
    switch (filterId) {
      case 'cedula':
        setFiltroCedula(value);
        break;
      case 'codigoPDV':
        setFiltroCodigoPDV(value);
        break;
      case 'estado':
        setFiltroEstado(value);
        break;
      default:
        break;
    }
  };

  const abrirPopup = (visita) => {
    setVisitaSeleccionada(visita);
    setPopupAbierto(true);
  };

  const cerrarPopup = () => {
    setPopupAbierto(false);
    setVisitaSeleccionada(null);
  };

  // Función para aprobar una visita
  const aprobarVisita = (visitaId, event) => {
    event.stopPropagation(); // Evitar que se abra el popup
    console.log('✅ Aprobando visita ID:', visitaId);
    setVisitas(prevVisitas => 
      prevVisitas.map(visita => 
        visita.id === visitaId 
          ? { ...visita, estado: 'aprobado' }
          : visita
      )
    );
  };

  // Función para rechazar una visita
  const rechazarVisita = (visitaId, event) => {
    event.stopPropagation(); // Evitar que se abra el popup
    console.log('❌ Rechazando visita ID:', visitaId);
    setVisitas(prevVisitas => 
      prevVisitas.map(visita => 
        visita.id === visitaId 
          ? { ...visita, estado: 'rechazado' }
          : visita
      )
    );
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  return (
    <DashboardLayout user={user}>
      <div className="visitas-dashboard-container">
        <div className="visitas-content">
          {/* Filtros usando el componente FilterPanel */}
          <FilterPanel
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            onClearFilters={limpiarFiltros}
            totalResults={visitasFiltradas.length}
            title="Filtros de Búsqueda"
          />

          {/* Tabla de visitas */}
          {loading ? (
            <div className="loading-container">
              <p>Cargando visitas...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error al cargar las visitas</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="visitas-table-container">
              <div className="table-header">
                <div className="header-cell">ASESOR</div>
                <div className="header-cell">PUNTO DE VENTA</div>
                <div className="header-cell">DIRECCIÓN</div>
                <div className="header-cell">FECHA</div>
                <div className="header-cell">ACTIVIDAD</div>
                <div className="header-cell">ACCIONES</div>
              </div>

              <div className={`table-body ${visitasFiltradas.length > 6 ? 'scrollable' : ''}`}>
                {visitasFiltradas.length === 0 ? (
                  <div className="no-results">
                    <p>No se encontraron visitas que coincidan con los filtros</p>
                  </div>
                ) : (
                  visitasFiltradas.map((visita, index) => (
                    <div key={visita.id} className="table-row" onClick={() => abrirPopup(visita)}>
                      <div className="cell usuario-cell" data-label="Asesor">
                        <div className="usuario-info">
                          <div className="usuario-name">{visita.usuario}</div>
                          <div className="usuario-cedula">CC: {visita.cedula}</div>
                        </div>
                      </div>
                      
                      <div className="cell punto-cell" data-label="Punto de Venta">
                        <div className="punto-info">
                          <div className="punto-nombre">{visita.puntoVenta}</div>
                          <div className="codigo-badge">#{visita.codigo}</div>
                        </div>
                      </div>
                      
                      <div className="cell direccion-cell" data-label="Dirección">
                        <span className="direccion-text">{visita.direccion}</span>
                      </div>
                      
                      <div className="cell fecha-cell" data-label="Fecha">
                        <span className="fecha-text">{visita.fecha}</span>
                      </div>
                      
                      <div className="cell actividad-cell" data-label="Actividad">
                        <div className="actividad-info">
                          <span className={`actividad-badge ${visita.actividad.toLowerCase()}`}>
                            {visita.actividad}
                          </span>
                          <span className={`kpi-badge ${visita.tipo}`}>
                            {visita.kpi}
                          </span>
                        </div>
                      </div>
                      
                      <div className="cell acciones-cell" data-label="Acciones">
                        {visita.estado === 'pendiente' ? (
                          <div className="acciones-group">
                            <button className="btn-action btn-aprobar" onClick={(e) => aprobarVisita(visita.id, e)}>
                              Aprobar
                            </button>
                            <button className="btn-action btn-rechazar" onClick={(e) => rechazarVisita(visita.id, e)}>
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className={`estado-badge ${visita.estado}`}>
                            {visita.estado === 'aprobado' ? 'Confirmado' : 'Rechazado'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Popup de detalles de visita */}
        {popupAbierto && visitaSeleccionada && (
          <div className="popup-overlay" onClick={cerrarPopup}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h3>Detalles de la Visita</h3>
                <button className="popup-close" onClick={cerrarPopup}>×</button>
              </div>
              
              <div className="popup-body">
                {/* Información del Asesor */}
                <div className="visita-info">
                  <h4 style={{color: '#e31e24', marginBottom: '1rem', fontSize: '1.1rem'}}>👤 Información del Asesor</h4>
                  <div className="info-row">
                    <span className="info-label">Nombre:</span>
                    <span className="info-value">{visitaSeleccionada.usuario}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cédula:</span>
                    <span className="info-value">{visitaSeleccionada.cedula}</span>
                  </div>
                </div>

                {/* Información del PDV */}
                <div className="visita-info">
                  <h4 style={{color: '#e31e24', marginBottom: '1rem', fontSize: '1.1rem'}}>🏪 Información del PDV</h4>
                  <div className="info-row">
                    <span className="info-label">Punto de Venta:</span>
                    <span className="info-value">{visitaSeleccionada.puntoVenta}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Código PDV:</span>
                    <span className="info-value">#{visitaSeleccionada.codigo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Propietario:</span>
                    <span className="info-value">{visitaSeleccionada.propietario}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Dirección:</span>
                    <span className="info-value">{visitaSeleccionada.direccion}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Teléfono:</span>
                    <span className="info-value">{visitaSeleccionada.telefono}</span>
                  </div>
                </div>

                {/* Información de la Actividad */}
                <div className="visita-info">
                  <h4 style={{color: '#e31e24', marginBottom: '1rem', fontSize: '1.1rem'}}>📋 Información de la Actividad</h4>
                  <div className="info-row">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{visitaSeleccionada.fecha}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tipo de Actividad:</span>
                    <span className={`info-badge ${visitaSeleccionada.actividad.toLowerCase()}`}>
                      {visitaSeleccionada.actividad}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">KPI de la Actividad:</span>
                    <span className={`info-badge ${visitaSeleccionada.tipo}`}>
                      {visitaSeleccionada.kpi}
                    </span>
                  </div>
                </div>

                {/* Contenido específico según el tipo de KPI */}
                {visitaSeleccionada.tipo === 'fre' ? (
                  // Solo mostrar foto para FRECUENCIA
                  <div className="popup-foto-section">
                    <h4>📷 Evidencia de la Visita</h4>
                    {visitaSeleccionada.fotoPopUrl ? (
                      <div className="foto-container">
                        <img 
                          src={visitaSeleccionada.fotoPopUrl} 
                          alt="Evidencia de la visita" 
                          className="popup-foto"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                            e.target.alt = 'Imagen no disponible';
                          }}
                        />
                      </div>
                    ) : (
                      <p className="no-foto-msg">No hay evidencia fotográfica disponible</p>
                    )}
                  </div>
                ) : visitaSeleccionada.tipo === 'vol' ? (
                  // Mostrar tabla de productos para VOLUMEN
                  <div className="popup-productos-section">
                    <h4>📦 Productos - Implementación de Volumen</h4>
                    <div className="productos-table">
                      <div className="productos-header">
                        <div className="producto-header-cell">Referencia</div>
                        <div className="producto-header-cell">Presentación</div>
                        <div className="producto-header-cell">Nro. Cajas</div>
                        <div className="producto-header-cell">Galonaje</div>
                      </div>
                      <div className="productos-body">
                        {visitaSeleccionada.productos?.map((producto, idx) => (
                          <div key={idx} className="producto-row">
                            <div className="producto-cell">{producto.referencia}</div>
                            <div className="producto-cell">{producto.presentacion}</div>
                            <div className="producto-cell">{producto.nroCajas}</div>
                            <div className="producto-cell">{producto.galonaje} Gal</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="volumen-total">
                      <strong>🔢 Volumen Total Implementado: {visitaSeleccionada.volumenTotal} Galones</strong>
                    </div>
                    {/* Solo mostrar foto POP si existe */}
                    {visitaSeleccionada.fotoPopUrl && (
                      <div className="popup-foto-section">
                        <h4>📷 Material POP</h4>
                        <div className="foto-container">
                          <img 
                            src={visitaSeleccionada.fotoPopUrl} 
                            alt="Material POP" 
                            className="popup-foto"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                              e.target.alt = 'Imagen no disponible';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : visitaSeleccionada.tipo === 'pre' ? (
                  // Mostrar tabla de precios para PRECIO
                  <div className="popup-productos-section">
                    <h4>💰 Productos - Implementación de Precios</h4>
                    <div className="productos-table">
                      <div className="productos-header precio">
                        <div className="producto-header-cell">Referencia</div>
                        <div className="producto-header-cell">Presentación</div>
                        <div className="producto-header-cell">Precio Sugerido</div>
                        <div className="producto-header-cell">Precio Real</div>
                      </div>
                      <div className="productos-body">
                        {visitaSeleccionada.productos?.map((producto, idx) => (
                          <div key={idx} className="producto-row precio-volumen">
                            <div className="producto-cell">{producto.referencia}</div>
                            <div className="producto-cell">{producto.presentacion}</div>
                            <div className="producto-cell">{formatearPrecio(producto.precioSugerido)}</div>
                            <div className="producto-cell">{formatearPrecio(producto.precioReal)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="valor-total">
                      <strong>💵 Valor Total de la Implementación: {formatearPrecio(visitaSeleccionada.valorTotal)}</strong>
                    </div>
                    {/* Mostrar ambas evidencias si existen */}
                    <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
                      {visitaSeleccionada.fotoPopUrl && (
                        <div className="popup-foto-section">
                          <h4>📷 Material POP</h4>
                          <div className="foto-container">
                            <img 
                              src={visitaSeleccionada.fotoPopUrl} 
                              alt="Material POP" 
                              className="popup-foto"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                                e.target.alt = 'Imagen no disponible';
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {visitaSeleccionada.fotoFacturaUrl && (
                        <div className="popup-foto-section">
                          <h4>📷 Foto Factura</h4>
                          <div className="foto-container">
                            <img 
                              src={visitaSeleccionada.fotoFacturaUrl} 
                              alt="Foto Factura" 
                              className="popup-foto"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                                e.target.alt = 'Imagen no disponible';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : visitaSeleccionada.tipo === 'pre-vol' ? (
                  // Mostrar tabla combinada para PRECIO/VOLUMEN
                  <div className="popup-productos-section">
                    <h4>💰📦 Productos - Implementación de Precio y Volumen</h4>
                    <div className="productos-table">
                      <div className="productos-header precio-volumen">
                        <div className="producto-header-cell">Referencia</div>
                        <div className="producto-header-cell">Presentación</div>
                        <div className="producto-header-cell">Nro. Cajas</div>
                        <div className="producto-header-cell">Galonaje</div>
                        <div className="producto-header-cell">Precio Sugerido</div>
                        <div className="producto-header-cell">Precio Real</div>
                      </div>
                      <div className="productos-body">
                        {visitaSeleccionada.productos?.map((producto, idx) => (
                          <div key={idx} className="producto-row precio-volumen">
                            <div className="producto-cell">{producto.referencia}</div>
                            <div className="producto-cell">{producto.presentacion}</div>
                            <div className="producto-cell">{producto.nroCajas}</div>
                            <div className="producto-cell">{producto.galonaje} Gal</div>
                            <div className="producto-cell">{formatearPrecio(producto.precioSugerido)}</div>
                            <div className="producto-cell">{formatearPrecio(producto.precioReal)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="totales-container">
                      <div className="volumen-total">
                        <strong>🔢 Volumen Total: {visitaSeleccionada.volumenTotal} Galones</strong>
                      </div>
                      <div className="valor-total">
                        <strong>💵 Valor Total: {formatearPrecio(visitaSeleccionada.valorTotal)}</strong>
                      </div>
                    </div>
                    {/* Mostrar ambas evidencias si existen */}
                    <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
                      {visitaSeleccionada.fotoPopUrl && (
                        <div className="popup-foto-section">
                          <h4>📷 Material POP</h4>
                          <div className="foto-container">
                            <img 
                              src={visitaSeleccionada.fotoPopUrl} 
                              alt="Material POP" 
                              className="popup-foto"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                                e.target.alt = 'Imagen no disponible';
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {visitaSeleccionada.fotoFacturaUrl && (
                        <div className="popup-foto-section">
                          <h4>📷 Foto Factura</h4>
                          <div className="foto-container">
                            <img 
                              src={visitaSeleccionada.fotoFacturaUrl} 
                              alt="Foto Factura" 
                              className="popup-foto"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                                e.target.alt = 'Imagen no disponible';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}