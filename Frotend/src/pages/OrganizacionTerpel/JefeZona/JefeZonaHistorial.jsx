import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout.jsx';
import { useJefeZonaRoute } from '../../../hooks/auth/index.js';
import { 
  useJefeZona, 
  useHistorialVisitasJefeZona 
} from '../../../hooks/jefe-zona/useJefeZona.js';
import { API_URL } from '../../../config.js';
import '../../../styles/JefeZona/jefe-zona-historial.css';
import '../../../styles/Asesor/asesor-historial-registros.css';
import '../../../styles/JefeZona/jefe-zona-tabla-moderna.css';

/**
 * Página para mostrar el historial de visitas del Jefe de Zona
 */
export default function JefeZonaHistorial() {
  const navigate = useNavigate();
  
  // Proteger la ruta - solo Jefes de Zona pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useJefeZonaRoute();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    codigo_pdv: ''
  });
  const [busquedaCodigo, setBusquedaCodigo] = useState('');

  // Hooks personalizados
  const { esJefeZona, verificarJefeZona } = useJefeZona();
  const { 
    visitas, 
    obtenerHistorial, 
    loading: historialLoading, 
    error: historialError 
  } = useHistorialVisitasJefeZona();

  // Efectos
  useEffect(() => {
    if (user?.id) {
      verificarJefeZona();
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && esJefeZona) {
      // Cargar historial inicial
      obtenerHistorial();
    }
  }, [user, esJefeZona]);

  // Manejar cambios en filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    obtenerHistorial(filtros);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: '',
      fecha_fin: '',
      codigo_pdv: ''
    });
    setBusquedaCodigo('');
    obtenerHistorial();
  };

  // Filtrar visitas localmente
  const visitasFiltradas = visitas ? visitas.filter(visita => {
    // Filtro por código PDV
    if (busquedaCodigo && visita.codigo_pdv) {
      const codigoPdv = String(visita.codigo_pdv || '').toLowerCase();
      const busqueda = String(busquedaCodigo || '').toLowerCase();
      if (!codigoPdv.includes(busqueda)) {
        return false;
      }
    }
    return true;
  }) : [];

  // Calcular métricas de cumplimiento
  const calcularMetricas = () => {
    const META_PDVS = 30; // Meta fija de 30 PDVs
    
    // Obtener PDVs únicos impactados por código (sin filtros, solo del usuario)
    const pdvsUnicos = visitas ? 
      [...new Set(visitas.map(visita => visita.codigo_pdv))] : [];
    
    const pdvsImpactados = pdvsUnicos.length;
    const porcentajeCumplimiento = Math.round((visitasFiltradas.length / META_PDVS) * 100);
    
    return {
      totalVisitas: visitasFiltradas.length,
      pdvsImpactados,
      metaPdvs: META_PDVS,
      porcentajeCumplimiento: porcentajeCumplimiento
    };
  };

  const metricas = calcularMetricas();

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Formatear fecha y hora para mostrar
  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener URL completa de la imagen
  const getImageUrl = (imagePath) => {
    return `${API_URL}/uploads/${imagePath}`;
  };

  // Si está cargando la autenticación o no hay usuario aún, mostrar loading
  if (loading || !user) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Si no es Jefe de Zona, mostrar mensaje de acceso denegado
  if (esJefeZona === false) {
    return (
      <DashboardLayout user={user} pageTitle="ACCESO DENEGADO">
        <div className="jefe-zona-access-denied">
          <h2>Acceso Denegado</h2>
          <p>Esta funcionalidad está disponible únicamente para usuarios con rol de Jefe de Zona.</p>
          <button onClick={() => navigate('/organizacion-terpel/home')} className="btn-volver">
            Volver al Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} pageTitle="HISTORIAL DE VISITAS - JEFE DE ZONA">
      <div className="jefe-zona-historial-container">
        
        {/* Filtros modernos estilo asesor */}
        <div className="search-filter-container">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Buscar por código PDV</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Filtrar por código PDV..."
                value={busquedaCodigo}
                onChange={(e) => setBusquedaCodigo(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Fecha inicio</label>
              <input
                type="date"
                className="filter-select"
                value={filtros.fecha_inicio}
                onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Fecha fin</label>
              <input
                type="date"
                className="filter-select"
                value={filtros.fecha_fin}
                onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <button onClick={aplicarFiltros} className="apply-filter-btn">
                🔍 Buscar
              </button>
              <button onClick={limpiarFiltros} className="clear-filter-btn">
                🗑️ Limpiar
              </button>
            </div>
          </div>
          <div className="filter-results">
            <span className="results-count">
              {visitasFiltradas.length} de {visitas?.length || 0} visitas
            </span>
          </div>
        </div>

        {/* Mensajes de estado */}
        {historialError && (
          <div className="jefe-zona-error-message">
            <h3>❌ Error al cargar historial</h3>
            <p>{historialError}</p>
          </div>
        )}

        {/* Loading */}
        {historialLoading && (
          <div className="jefe-zona-loading">
            <div className="spinner"></div>
            <p>Cargando historial...</p>
          </div>
        )}

        {/* Estadísticas */}
        {!historialLoading && visitasFiltradas && (
          <div className="jefe-zona-stats">
            <div className="stat-item-mini">
              <span className="stat-number-mini">{metricas.totalVisitas}</span>
              <span className="stat-label-mini">Nro visitas</span>
            </div>
            <div className="stat-item-mini">
              <span className="stat-number-mini">{metricas.metaPdvs}</span>
              <span className="stat-label-mini">Meta</span>
            </div>
            <div className="stat-item-mini">
              <span className="stat-number-mini">{metricas.pdvsImpactados}</span>
              <span className="stat-label-mini">PDVs impactados</span>
            </div>
            <div className="stat-item-mini cumplimiento-stat-mini">
              <span className="stat-number-mini" style={{
                color: metricas.porcentajeCumplimiento >= 100 ? '#28a745' : 
                       metricas.porcentajeCumplimiento >= 80 ? '#ffc107' : '#dc3545'
              }}>
                {metricas.porcentajeCumplimiento}%
              </span>
              <span className="stat-label-mini">% Cumplimiento</span>
              <div className="progress-bar-container-mini">
                <div 
                  className="progress-bar-mini"
                  style={{
                    width: `${metricas.porcentajeCumplimiento}%`,
                    backgroundColor: metricas.porcentajeCumplimiento >= 100 ? '#28a745' : 
                                   metricas.porcentajeCumplimiento >= 80 ? '#ffc107' : '#dc3545'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de visitas */}
        {!historialLoading && visitasFiltradas && visitasFiltradas.length > 0 && (
          <div className="registros-table-container">
            <div className="table-wrapper">
              <table className="registros-table">
                <thead>
                  <tr>
                    <th className="codigo-header">Código PDV</th>
                    <th className="fecha-header">Fecha Visita</th>
                    <th className="fecha-header">Fecha Registro</th>
                    <th className="accion-header">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {visitasFiltradas.map((visita) => (
                    <tr 
                      key={visita.id} 
                      className="registro-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (visita.foto_seguimiento) {
                          window.open(getImageUrl(visita.foto_seguimiento), '_blank');
                        }
                      }}
                      title="Clic para ver detalles de la visita"
                    >
                      <td>
                        <span className="codigo-highlight">
                          {visita.codigo_pdv}
                        </span>
                        <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                          {visita.nombre_pdv}
                        </div>
                      </td>
                      <td>
                        <span className="fecha-principal">
                          {formatearFecha(visita.fecha_visita)}
                        </span>
                      </td>
                      <td>
                        <span className="fecha-principal">
                          {formatearFechaHora(visita.fecha_registro)}
                        </span>
                      </td>
                      <td>
                        {visita.foto_seguimiento ? (
                          <span className="kpi-badge" style={{background: '#4CAF50'}}>
                            📷 VER FOTO
                          </span>
                        ) : (
                          <span className="kpi-badge" style={{background: '#9E9E9E'}}>
                            SIN FOTO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensaje si no hay visitas */}
        {!historialLoading && visitasFiltradas && visitasFiltradas.length === 0 && (
          <div className="no-registros">
            <div className="no-registros-icon">🔍</div>
            <h3>No se encontraron visitas</h3>
            <p>
              {visitas && visitas.length === 0 
                ? 'No hay visitas registradas aún.'
                : 'No hay visitas que coincidan con los filtros aplicados.'
              }
            </p>
            {visitas && visitas.length > 0 && (
              <button onClick={limpiarFiltros} className="clear-filters-btn">
                Limpiar filtros
              </button>
            )}
            <button 
              onClick={() => navigate('/organizacion-terpel/registro-visitas')} 
              className="btn-nueva-visita"
            >
              Registrar nueva visita
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
