import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useBackOfficePageProtection } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useUsuariosBackOffice } from '../../hooks/backoffice';
import UsuariosTable from '../../components/BackOffice/Usuarios/UsuariosTable';
import UsuarioDetalleModal from '../../components/BackOffice/Usuarios/UsuarioDetalleModal';
import UsuariosFilterButtons from '../../components/BackOffice/Usuarios/UsuariosFilterButtons';
import AuthLoadingScreen from '../../components/shared/AuthLoadingScreen';
import '../../styles/Backoffice/backoffice-visitas.css';
import '../../styles/Backoffice/filter-panel.css';
import '../../styles/Backoffice/filter-panel-new.css';
import '../../styles/Backoffice/backoffice-usuarios-pdvs.css';

// OPTIMIZACIÓN: Hook para debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BackOfficeUsuarios() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Proteger la página - solo backoffice puede acceder
  const { user, pageReady, shouldShowContent } = useBackOfficePageProtection();
  
  // Hook optimizado para obtener usuarios
  const { 
    usuarios, 
    loading, 
    error, 
    estadisticas,            // ✅ Usar el nombre correcto
    cargarUsuarios, 
    actualizarEstadoUsuario 
  } = useUsuariosBackOffice();

  // Estados para filtros optimizados
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroAgenteComercial, setFiltroAgenteComercial] = useState('TODOS');
  const [filtroCiudad, setFiltroCiudad] = useState('TODAS');
  const [busquedaCedula, setBusquedaCedula] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaEmail, setBusquedaEmail] = useState('');

  // OPTIMIZACIÓN: Debounce para búsquedas de texto
  const debouncedCedula = useDebounce(busquedaCedula, 300);
  const debouncedNombre = useDebounce(busquedaNombre, 300);
  const debouncedEmail = useDebounce(busquedaEmail, 300);

  // OPTIMIZACIÓN: Memoizar usuarios filtrados para evitar re-cálculos
  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuarios;

    // Filtro por Rol
    if (filtroRol !== 'TODOS') {
      filtrados = filtrados.filter(usuario => 
        usuario.descripcion?.toString() === filtroRol
      );
    }

    // Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(usuario => {
        if (filtroEstado === 'ACTIVO') {
          return usuario.activo === 1 || usuario.activo === true;
        } else if (filtroEstado === 'INACTIVO') {
          return usuario.activo === 0 || usuario.activo === false;
        }
        return true;
      });
    }

    // Filtro por Agente Comercial
    if (filtroAgenteComercial !== 'TODOS') {
      filtrados = filtrados.filter(usuario => {
        const agenteComercial = usuario.agente_comercial?.trim() || '';
        return agenteComercial === filtroAgenteComercial;
      });
    }

    // Filtro por Ciudad
    if (filtroCiudad !== 'TODAS') {
      filtrados = filtrados.filter(usuario => {
        const ciudadNombre = usuario.ciudad_nombre?.trim() || '';
        return ciudadNombre === filtroCiudad;
      });
    }

    // OPTIMIZACIÓN: Aplicar filtros de texto solo con valores debounced
    if (debouncedCedula.trim()) {
      filtrados = filtrados.filter(usuario =>
        usuario.documento?.toString().includes(debouncedCedula.trim())
      );
    }

    if (debouncedNombre.trim()) {
      filtrados = filtrados.filter(usuario =>
        usuario.name?.toLowerCase().includes(debouncedNombre.trim().toLowerCase())
      );
    }

    if (debouncedEmail.trim()) {
      filtrados = filtrados.filter(usuario =>
        usuario.email?.toLowerCase().includes(debouncedEmail.trim().toLowerCase())
      );
    }

    return filtrados;
  }, [
    usuarios, 
    filtroRol, 
    filtroEstado, 
    filtroAgenteComercial, 
    filtroCiudad, 
    debouncedCedula, 
    debouncedNombre, 
    debouncedEmail
  ]);

  // OPTIMIZACIÓN: Calcular estadísticas de los usuarios filtrados
  const estadisticasFiltradas = useMemo(() => {
    return {
      total: usuariosFiltrados.length,
      activos: usuariosFiltrados.filter(u => u.activo === 1 || u.activo === true).length,
      inactivos: usuariosFiltrados.filter(u => u.activo === 0 || u.activo === false).length,
      asesores: usuariosFiltrados.filter(u => u.rol_id === 1).length,
      mercadeo: usuariosFiltrados.filter(u => u.rol_id === 2).length,
      directores: usuariosFiltrados.filter(u => u.rol_id === 3).length,
      promotores: usuariosFiltrados.filter(u => u.IsPromotoria === 1 || u.IsPromotoria === true).length
    };
  }, [usuariosFiltrados]);

  // OPTIMIZACIÓN: Callback para recargar datos
  const handleRecargarDatos = useCallback(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!pageReady || !shouldShowContent) {
    return <AuthLoadingScreen message="Verificando acceso a gestión de usuarios..." />;
  }
  
  return (
    <DashboardLayout>
      <div className="backoffice-visitas-container">
        <div className="backoffice-page-header">
          <div>
            <h1 className="backoffice-page-title">BackOffice - Gestión de Usuarios ⚡</h1>
            <p className="backoffice-page-subtitle">Administración optimizada de usuarios del sistema</p>
          </div>
        </div>

        {/* Estadísticas optimizadas */}
        <div className="backoffice-stats-summary">
          <div className="backoffice-stat-card">
            <div className="backoffice-stat-value">{estadisticasFiltradas.total}</div>
            <div className="backoffice-stat-label">Total Usuarios</div>
          </div>
        </div>

        {/* Filtros */}
        <UsuariosFilterButtons
          filtroRol={filtroRol}
          setFiltroRol={setFiltroRol}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          filtroAgenteComercial={filtroAgenteComercial}
          setFiltroAgenteComercial={setFiltroAgenteComercial}
          filtroCiudad={filtroCiudad}
          setFiltroCiudad={setFiltroCiudad}
          busquedaCedula={busquedaCedula}
          setBusquedaCedula={setBusquedaCedula}
          busquedaNombre={busquedaNombre}
          setBusquedaNombre={setBusquedaNombre}
          busquedaEmail={busquedaEmail}
          setBusquedaEmail={setBusquedaEmail}
          usuarios={usuarios}
          totalFiltrados={usuariosFiltrados.length}
          onRecargar={handleRecargarDatos}
        />

        {/* Tabla optimizada */}
        {loading ? (
          <div className="backoffice-loading">
            <div className="loading-spinner"></div>
            <p>⚡ Cargando usuarios optimizado...</p>
          </div>
        ) : error ? (
          <div className="backoffice-error">
            <p>❌ Error: {error}</p>
            <button onClick={handleRecargarDatos} className="backoffice-btn-reload">
              🔄 Reintentar
            </button>
          </div>
        ) : (
          <UsuariosTable 
            usuarios={usuariosFiltrados}
            isMobile={isMobile}
            onActualizarEstado={actualizarEstadoUsuario}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
