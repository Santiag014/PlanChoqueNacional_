import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useJefeZonaRoute } from '../../hooks/auth';
import { 
  useJefeZona, 
  useHistorialVisitasJefeZona 
} from '../../hooks/jefe-zona/useJefeZona';
import { API_URL } from '../../config.js';
import '../../styles/JefeZona/jefe-zona-historial.css';
import '../../styles/Asesor/asesor-historial-registros.css';
import '../../styles/JefeZona/jefe-zona-tabla-moderna.css';

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
    if (busquedaCodigo && !visita.codigo_pdv.toLowerCase().includes(busquedaCodigo.toLowerCase())) {
      return false;
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
    const porcentajeCumplimiento = Math.round((pdvsImpactados / META_PDVS) * 100);
    
    return {
      totalVisitas: visitasFiltradas.length,
      pdvsImpactados,
      metaPdvs: META_PDVS,
      porcentajeCumplimiento: Math.min(porcentajeCumplimiento, 100) // Máximo 100%
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
        
        {/* Sección de filtros */}
        <div className="jefe-zona-filtros">
          <h3>Filtros de búsqueda</h3>
          <div className="filtros-row">
            <div className="filtro-item">
              <label>Fecha inicio:</label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
              />
            </div>
            <div className="filtro-item">
              <label>Fecha fin:</label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
              />
            </div>
            <div className="filtro-item">
              <label>Código PDV:</label>
              <input
                type="text"
                placeholder="Ej: 101"
                value={filtros.codigo_pdv}
                onChange={(e) => handleFiltroChange('codigo_pdv', e.target.value)}
              />
            </div>
          </div>
          <div className="filtros-buttons">
            <button onClick={aplicarFiltros} className="btn-aplicar">
              Aplicar Filtros
            </button>
            <button onClick={limpiarFiltros} className="btn-limpiar">
              Limpiar
            </button>
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
        {!historialLoading && visitas && (
          <div className="jefe-zona-stats">
            <div className="stat-item-mini">
              <span className="stat-number-mini">{visitas.length}</span>
              <span className="stat-label-mini">Nro visitas</span>
            </div>
            <div className="stat-item-mini">
              <span className="stat-number-mini">30</span>
              <span className="stat-label-mini">Meta</span>
            </div>
            <div className="stat-item-mini">
              <span className="stat-number-mini">{[...new Set(visitas.map(v => v.codigo_pdv))].length}</span>
              <span className="stat-label-mini">PDVs impactados</span>
            </div>
            <div className="stat-item-mini cumplimiento-stat-mini">
              <span className="stat-number-mini" style={{
                color: Math.round(([...new Set(visitas.map(v => v.codigo_pdv))].length / 30) * 100) >= 100 ? '#28a745' : 
                       Math.round(([...new Set(visitas.map(v => v.codigo_pdv))].length / 30) * 100) >= 80 ? '#ffc107' : '#dc3545'
              }}>
                {Math.min(Math.round(([...new Set(visitas.map(v => v.codigo_pdv))].length / 30) * 100), 100)}%
              </span>
              <span className="stat-label-mini">% Cumplimiento</span>
              <div className="progress-bar-container-mini">
                <div 
                  className="progress-bar-mini"
                  style={{
                    width: `${Math.min(([...new Set(visitas.map(v => v.codigo_pdv))].length / 30) * 100, 100)}%`,
                    backgroundColor: Math.round(([...new Set(visitas.map(v => v.codigo_pdv))].length / 30) * 100) >= 100 ? '#28a745' : 
                                   Math.round(([...new Set(visitas.map(v => v.codigo_pdv))].length / 30) * 100) >= 80 ? '#ffc107' : '#dc3545'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de visitas */}
        {!historialLoading && visitas && visitas.length > 0 && (
          <div className="jefe-zona-tabla-container">
            <table className="jefe-zona-tabla">
              <thead>
                <tr>
                  <th>Código PDV</th>
                  <th>Nombre PDV</th>
                  <th>Empresa</th>
                  <th>Fecha Visita</th>
                  <th>Fecha Registro</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map((visita) => (
                  <tr key={visita.id}>
                    <td className="codigo-pdv">{visita.codigo_pdv}</td>
                    <td className="nombre-pdv">{visita.nombre_pdv}</td>
                    <td className="empresa">{visita.agente_nombre}</td>
                    <td className="fecha-visita">{formatearFecha(visita.fecha_visita)}</td>
                    <td className="fecha-registro">{formatearFechaHora(visita.fecha_registro)}</td>
                    <td className="foto-cell">
                      {visita.foto_seguimiento && (
                        <a 
                          href={getImageUrl(visita.foto_seguimiento)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="foto-link"
                        >
                          📷 Ver foto
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
