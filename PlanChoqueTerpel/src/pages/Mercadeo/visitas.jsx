import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useMercadeoRoute } from '../../hooks/auth';
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
            segmento: 'N/A',
            fotoFactura: true,
            fecha: '27/06/2025',
            kpi: 'VOLUMEN',
            tipo: 'vol',
            estado: 'pendiente',
            fotoUrl: '/storage/2025-06-26/1750954094915-11-08-14.jpg',
            productos: [
              { nombre: 'TERPEL OILTEC 10W-30 TITANIO', presentacion: '1/4 Gal', volumenAprobado: 15.5, cantidad: 62 },
              { nombre: 'TERPEL OILTEC 10W-40 TITANIO', presentacion: '1 Gal', volumenAprobado: 8.0, cantidad: 8 },
              { nombre: 'TERPEL OILTEC 20W-50 TITANIO', presentacion: '55 Gal', volumenAprobado: 110.0, cantidad: 2 },
              { nombre: 'REFRIGERANTE ESTÁNDAR', presentacion: '1 Gal', volumenAprobado: 12.0, cantidad: 12 }
            ],
            volumenTotal: 145.5
          },
          {
            id: 2,
            usuario: 'Valentina Gómez',
            cedula: '987654321',
            puntoVenta: 'LA TIENDA DEL MÁXIMO DESEMPEÑO',
            codigo: '1002',
            segmento: 'N/A',
            fotoFactura: true,
            fecha: '26/06/2025',
            kpi: 'FRECUENCIA',
            tipo: 'fre',
            estado: 'aprobado',
            fotoUrl: '/storage/2025-06-26/1750955400880-11-30-00.jpg'
          },
          {
            id: 3,
            usuario: 'Rosario Téllez',
            cedula: '476482848',
            puntoVenta: 'TODO PARA TU MOTOR SAS',
            codigo: '1002',
            segmento: 'N/A',
            fotoFactura: true,
            fecha: '26/06/2025',
            kpi: 'PRECIO',
            tipo: 'pre',
            estado: 'pendiente',
            fotoUrl: '/storage/2025-06-27/1751031436049-08-37-16.jpg',
            productos: [
              { nombre: 'TERPEL OILTEC 10W-30 TITANIO', presentacion: '1/4 Gal', precio: 28500, cantidad: 10 },
              { nombre: 'TERPEL OILTEC 20W-50 MULTIGRADO', presentacion: '1 Gal', precio: 95000, cantidad: 5 },
              { nombre: 'REFRIGERANTE LARGA VIDA', presentacion: '1 Gal', precio: 35000, cantidad: 8 }
            ],
            valorTotal: 945000
          },
          {
            id: 4,
            usuario: 'Carlos Martínez',
            cedula: '555666777',
            puntoVenta: 'ESTACIÓN CENTRAL',
            codigo: '1001',
            segmento: 'N/A',
            fotoFactura: false,
            fecha: '26/06/2025',
            kpi: 'VOLUMEN',
            tipo: 'vol',
            estado: 'rechazado',
            fotoUrl: '/storage/2025-06-27/1751032442889-08-54-02.jpg',
            productos: [
              { nombre: 'TERPEL OILTEC 40 MONOGRADO', presentacion: '55 Gal', volumenAprobado: 165.0, cantidad: 3 },
              { nombre: 'TERPEL OILTEC 50 MONOGRADO', presentacion: '1 Gal', volumenAprobado: 25.0, cantidad: 25 }
            ],
            volumenTotal: 190.0
          },
          {
            id: 5,
            usuario: 'María González',
            cedula: '888999000',
            puntoVenta: 'LUBRICANTES TOTAL',
            codigo: '1003',
            segmento: 'N/A',
            fotoFactura: true,
            fecha: '25/06/2025',
            kpi: 'FRECUENCIA',
            tipo: 'fre',
            estado: 'pendiente',
            fotoUrl: '/storage/2025-06-26/1750955530114-11-32-10.jpg'
          },
          {
            id: 6,
            usuario: 'Jorge Ramírez',
            cedula: '111222333',
            puntoVenta: 'DISTRIBUIDORA EL SOL',
            codigo: '1004',
            segmento: 'N/A',
            fotoFactura: true,
            fecha: '25/06/2025',
            kpi: 'PRECIO',
            tipo: 'pre',
            estado: 'aprobado',
            fotoUrl: '/storage/2025-06-27/1751031541147-08-39-01.jpg',
            productos: [
              { nombre: 'TERPEL OILTEC 15W-40 TITANIO', presentacion: '1/4 Gal', precio: 27000, cantidad: 20 },
              { nombre: 'TERPEL OILTEC SAE 40', presentacion: '1 Gal', precio: 85000, cantidad: 8 }
            ],
            valorTotal: 1220000
          },
          {
            id: 7,
            usuario: 'Ana Rodríguez',
            cedula: '444555666',
            puntoVenta: 'SERVITERPEL NORTE',
            codigo: '1005',
            segmento: 'N/A',
            fotoFactura: true,
            fecha: '24/06/2025',
            kpi: 'VOLUMEN',
            tipo: 'vol',
            estado: 'pendiente',
            fotoUrl: '/storage/2025-06-27/1751031625476-08-40-25.jpg',
            productos: [
              { nombre: 'TERPEL OILTEC TERGAS 20W-50', presentacion: '1 Gal', volumenAprobado: 45.0, cantidad: 45 },
              { nombre: 'REFRIGERANTE PREMIUM', presentacion: '1/2 Gal', volumenAprobado: 18.0, cantidad: 36 }
            ],
            volumenTotal: 63.0
          },
          {
            id: 8,
            usuario: 'Luis Morales',
            cedula: '777888999',
            puntoVenta: 'MOTOR PARTS CENTER',
            codigo: '1006',
            segmento: 'N/A',
            fotoFactura: false,
            fecha: '24/06/2025',
            kpi: 'FRECUENCIA',
            tipo: 'fre',
            estado: 'rechazado',
            fotoUrl: '/storage/2025-06-27/1751032679740-08-57-59.jpg'
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
      <div className="visitas-page">
        {/* Banner con imagen de fondo y texto encima */}
        <div className="visitas-banner">
          <div className="visitas-banner-content">
            <h1 className="visitas-banner-title">VISITAS POR APROBAR</h1>
          </div>
        </div>

        <div className="visitas-content">
          {/* Filtros */}
          <div className="filtros-container">
            <div className="filtros-card">
              <div className="filtros-header">
                <h3 className="filtros-title">
                  <span className="filtros-icon">🔍</span>
                  Filtros de Búsqueda
                </h3>
              </div>
              
              <div className="filtros-row">
                <div className="filtro-group">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="Ingrese número de cédula..."
                      value={filtroCedula}
                      onChange={(e) => setFiltroCedula(e.target.value)}
                      className="filtro-input"
                    />
                    <span className="input-focus-border"></span>
                  </div>
                </div>

                <div className="filtro-group">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="Código del punto de venta..."
                      value={filtroCodigoPDV}
                      onChange={(e) => setFiltroCodigoPDV(e.target.value)}
                      className="filtro-input"
                    />
                    <span className="input-focus-border"></span>
                  </div>
                </div>

                <div className="filtro-group">
                  <div className="select-wrapper">
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="filtro-select"
                    >
                      <option value="todas">Todos los estados</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="aprobado">Aprobados</option>
                      <option value="rechazado">Rechazados</option>
                    </select>
                    <span className="select-arrow">▼</span>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="contador-container">
              <div className="contador-badge">
                <span className="contador-icon">📋</span>
                <span className="contador-text">Total de registros: {visitasFiltradas.length}</span>
              </div>
            </div> */}
          </div>

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
                <div className="header-cell">USUARIO</div>
                <div className="header-cell">PUNTO</div>
                <div className="header-cell">CÓDIGO PDV</div>
                <div className="header-cell">SEGMENTO</div>
                <div className="header-cell">FOTO FACTURA</div>
                <div className="header-cell">FECHA</div>
                <div className="header-cell">KPI</div>
                <div className="header-cell">ACCIONES</div>
              </div>

              <div className={`table-body ${visitasFiltradas.length > 5 ? 'scrollable' : ''}`}>
                {visitasFiltradas.length === 0 ? (
                  <div className="no-results">
                    <p>No se encontraron visitas que coincidan con los filtros</p>
                  </div>
                ) : (
                  visitasFiltradas.map((visita, index) => (
                    <div key={visita.id} className="table-row" onClick={() => abrirPopup(visita)}>
                      <div className="cell usuario-cell">
                        <div className="usuario-info">
                          <div className="usuario-name">{visita.usuario}</div>
                          <div className="usuario-cedula">{visita.cedula}</div>
                        </div>
                      </div>
                      
                      <div className="cell punto-cell">
                        <div className="punto-info">
                          <span className="punto-nombre">{visita.puntoVenta}</span>
                        </div>
                      </div>

                      <div className="cell codigo-cell">
                        <span className="codigo-badge">{visita.codigo}</span>
                      </div>
                      
                      <div className="cell segmento-cell">
                        <span className="segmento-text">{visita.segmento}</span>
                      </div>
                      
                      <div className="cell foto-cell">
                        {visita.fotoFactura ? (
                          <div className="foto-icon">
                            <span className="foto-disponible">📷</span>
                            <span className="foto-texto">FOTO FACTURA</span>
                          </div>
                        ) : (
                          <span className="no-foto">N/A</span>
                        )}
                      </div>
                      
                      <div className="cell fecha-cell">
                        <span className="fecha-text">{visita.fecha}</span>
                      </div>
                      
                      <div className="cell kpi-cell">
                        {visita.kpi && visita.tipo ? (
                          <span className={`kpi-badge ${visita.tipo}`}>
                            {visita.kpi}
                          </span>
                        ) : (
                          <span className="kpi-badge" style={{ background: '#6c757d', color: 'white' }}>
                            N/A
                          </span>
                        )}
                      </div>
                      
                      <div className="cell acciones-cell">
                        {visita.estado === 'pendiente' ? (
                          <div className="acciones-group">
                            <button className="btn-accion aprobar" onClick={(e) => aprobarVisita(visita.id, e)}>
                              Aprobar
                            </button>
                            <button className="btn-accion rechazar" onClick={(e) => rechazarVisita(visita.id, e)}>
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="estado-final">
                            {visita.estado === 'aprobado' ? '✅ Confirmado' : '❌ Rechazado'}
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
                <div className="visita-info">
                  <div className="info-row">
                    <span className="info-label">Usuario:</span>
                    <span className="info-value">{visitaSeleccionada.usuario}</span>
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
                    <span className="info-label">KPI:</span>
                    <span className={`info-badge ${visitaSeleccionada.tipo}`}>
                      {visitaSeleccionada.kpi}
                    </span>
                  </div>
                </div>

                {/* Contenido específico según el tipo de KPI */}
                {visitaSeleccionada.tipo === 'fre' ? (
                  // Solo mostrar foto para FRECUENCIA
                  <div className="popup-foto-section">
                    <h4>Foto de la Visita</h4>
                    {visitaSeleccionada.fotoUrl ? (
                      <div className="foto-container">
                        <img 
                          src={visitaSeleccionada.fotoUrl} 
                          alt="Foto de la visita" 
                          className="popup-foto"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                            e.target.alt = 'Imagen no disponible';
                          }}
                        />
                      </div>
                    ) : (
                      <p className="no-foto-msg">No hay foto disponible</p>
                    )}
                  </div>
                ) : visitaSeleccionada.tipo === 'vol' ? (
                  // Mostrar tabla de productos para VOLUMEN
                  <div className="popup-productos-section">
                    <h4>Productos - Volumen en Galones</h4>
                    <div className="productos-table">
                      <div className="productos-header">
                        <div className="producto-header-cell">Producto</div>
                        <div className="producto-header-cell">Presentación</div>
                        <div className="producto-header-cell">Cantidad</div>
                        <div className="producto-header-cell">Volumen Reportado</div>
                      </div>
                      <div className="productos-body">
                        {visitaSeleccionada.productos?.map((producto, idx) => (
                          <div key={idx} className="producto-row">
                            <div className="producto-cell">{producto.nombre}</div>
                            <div className="producto-cell">{producto.presentacion}</div>
                            <div className="producto-cell">{producto.cantidad}</div>
                            <div className="producto-cell">{producto.volumenAprobado} Gal</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="volumen-total">
                      <strong>Volumen Total: {visitaSeleccionada.volumenTotal} Galones</strong>
                    </div>
                    
                    {/* Foto de la factura */}
                    {visitaSeleccionada.fotoUrl && (
                      <div className="popup-foto-section">
                        <h4>Foto de la Factura</h4>
                        <div className="foto-container">
                          <img 
                            src={visitaSeleccionada.fotoUrl} 
                            alt="Foto de la factura" 
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
                    <h4>Productos - Relación de Precios</h4>
                    <div className="productos-table">
                      <div className="productos-header precio">
                        <div className="producto-header-cell">Producto</div>
                        <div className="producto-header-cell">Presentación</div>
                        <div className="producto-header-cell">Precio Unitario</div>
                      </div>
                      <div className="productos-body">
                        {visitaSeleccionada.productos?.map((producto, idx) => (
                          <div key={idx} className="producto-row precio">
                            <div className="producto-cell">{producto.nombre}</div>
                            <div className="producto-cell">{producto.presentacion}</div>
                            <div className="producto-cell">{formatearPrecio(producto.precio)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="valor-total">
                      <strong>Valor Total: {formatearPrecio(visitaSeleccionada.valorTotal)}</strong>
                    </div>
                    
                    {/* Foto de la factura */}
                    {visitaSeleccionada.fotoUrl && (
                      <div className="popup-foto-section">
                        <h4>Foto de la Factura</h4>
                        <div className="foto-container">
                          <img 
                            src={visitaSeleccionada.fotoUrl} 
                            alt="Foto de la factura" 
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
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}