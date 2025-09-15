import React, { useState, useEffect } from 'react';
import '../../../styles/Mercadeo/filtros-avanzados.css';

/**
 * Componente de filtros avanzados para mercadeo
 * Permite filtrar por asesor, PDV y ciudad
 * Incluye funcionalidad de colapso/expansión mejorada
 */
export default function FiltrosAvanzados({ 
  asesores = [], 
  filtros = {}, 
  onFiltrosChange, 
  className = '' 
}) {
  const [filtrosLocal, setFiltrosLocal] = useState({
    asesor: '',
    pdv: '',
    ciudad: '',
    compania: '',
    ...filtros
  });
  // Obtener compañías únicas de los asesores
  const companiasDisponibles = Array.from(new Set(asesores.map(a => a.compania))).sort();

  // Filtrar asesores por compañía seleccionada
  const asesoresFiltradosPorCompania = filtrosLocal.compania
    ? asesores.filter(a => a.compania === filtrosLocal.compania)
    : asesores;
  
  const [pdvsDisponibles, setPdvsDisponibles] = useState([]);
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState([]);
  
  // Estado de expansión mejorado - recordar preferencia del usuario
  const [filtrosExpanded, setFiltrosExpanded] = useState(() => {
    const saved = localStorage.getItem('mercadeo-filtros-expanded');
    return saved !== null ? JSON.parse(saved) : true; // Por defecto expandido
  });

  // Actualizar filtros locales cuando cambien los filtros externos
  useEffect(() => {
    setFiltrosLocal(prev => ({ ...prev, ...filtros }));
  }, [filtros]);

  // Guardar estado de expansión en localStorage
  useEffect(() => {
    localStorage.setItem('mercadeo-filtros-expanded', JSON.stringify(filtrosExpanded));
  }, [filtrosExpanded]);

  // Función para toggle del estado de expansión
  const toggleFiltrosExpansion = () => {
    setFiltrosExpanded(!filtrosExpanded);
  };

  // Obtener PDVs únicos de todos los asesores filtrados por compañía
  useEffect(() => {
    const todosPdvs = [];
    asesoresFiltradosPorCompania.forEach(asesor => {
      if (asesor.pdvs) {
        asesor.pdvs.forEach(pdv => {
          if (!todosPdvs.find(p => p.codigo === pdv.codigo)) {
            todosPdvs.push({
              ...pdv,
              asesorNombre: asesor.nombre,
              compania: asesor.compania
            });
          }
        });
      }
    });
    setPdvsDisponibles(todosPdvs);
  }, [asesoresFiltradosPorCompania]);

  // Obtener ciudades únicas de los PDVs filtrados por compañía
  useEffect(() => {
    const ciudades = new Set();
    pdvsDisponibles.forEach(pdv => {
      if (pdv.direccion) {
        // Extraer ciudad de la dirección (último elemento después de la coma)
        const partes = pdv.direccion.split(',');
        if (partes.length > 1) {
          const ciudad = partes[partes.length - 1].trim();
          ciudades.add(ciudad);
        }
      }
    });
    setCiudadesDisponibles(Array.from(ciudades).sort());
  }, [pdvsDisponibles]);

  // Filtrar PDVs según el asesor seleccionado
  const pdvsFiltrados = filtrosLocal.asesor 
    ? pdvsDisponibles.filter(pdv => pdv.asesorNombre === filtrosLocal.asesor)
    : pdvsDisponibles;

  // Manejar cambio en los filtros
  const handleFiltroChange = (tipo, valor) => {
    const nuevosFiltros = { ...filtrosLocal };
    if (tipo === 'asesor') {
      nuevosFiltros.asesor = valor;
      // Limpiar PDV y ciudad si se cambia el asesor
      if (valor !== filtrosLocal.asesor) {
        nuevosFiltros.pdv = '';
        nuevosFiltros.ciudad = '';
      }
    } else if (tipo === 'pdv') {
      nuevosFiltros.pdv = valor;
      // Si se selecciona un PDV, también filtrar por ciudad automáticamente
      if (valor) {
        const pdvSeleccionado = pdvsFiltrados.find(p => p.nombre === valor);
        if (pdvSeleccionado && pdvSeleccionado.direccion) {
          const partes = pdvSeleccionado.direccion.split(',');
          if (partes.length > 1) {
            nuevosFiltros.ciudad = partes[partes.length - 1].trim();
          }
        }
        // Al seleccionar un PDV, limpiar y deshabilitar compañía
        nuevosFiltros.compania = '';
      }
    } else if (tipo === 'compania') {
      nuevosFiltros.compania = valor;
      // Al cambiar compañía, limpiar asesor, pdv y ciudad
      nuevosFiltros.asesor = '';
      nuevosFiltros.pdv = '';
      nuevosFiltros.ciudad = '';
    } else if (tipo === 'ciudad') {
      nuevosFiltros.ciudad = valor;
    }
    setFiltrosLocal(nuevosFiltros);
    if (onFiltrosChange) {
      onFiltrosChange(nuevosFiltros);
    }
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtrosVacios = { asesor: '', pdv: '', ciudad: '', compania: '' };
    setFiltrosLocal(filtrosVacios);
    if (onFiltrosChange) {
      onFiltrosChange(filtrosVacios);
    }
  };

  return (
    <div className={`filtros-avanzados ${className}`}>
      {/* Header con botón desplegable mejorado */}
      <div className="filtros-header" onClick={toggleFiltrosExpansion}>
        <h3 className="filtros-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M9 12h12M3 18h18" stroke="#e30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Filtros
          {/* Indicador de filtros activos (ahora incluye compañía) */}
          {(filtrosLocal.asesor || filtrosLocal.pdv || filtrosLocal.ciudad || filtrosLocal.compania) && (
            <span className="filtros-activos-badge">
              {[filtrosLocal.asesor, filtrosLocal.pdv, filtrosLocal.ciudad, filtrosLocal.compania].filter(Boolean).length}
            </span>
          )}
        </h3>
        <div className="filtros-header-actions">
          {/* Botón limpiar visible siempre */}
          <button 
            className="filtros-limpiar-header" 
            onClick={(e) => {e.stopPropagation(); limpiarFiltros();}}
            title="Limpiar todos los filtros"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="filtros-toggle" title={filtrosExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              className={`filtros-toggle-icon ${filtrosExpanded ? 'expanded' : ''}`}
            >
              <path d="M6 9l6 6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido de filtros (comportamiento de colapso mejorado) */}
      <div className={`filtros-content ${filtrosExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="filtros-grid">
          {/* Filtro por Asesor */}
          <div className="filtro-item">
            <label className="filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="filtro-icon">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Asesor
            </label>
            <select
              value={filtrosLocal.asesor}
              onChange={(e) => handleFiltroChange('asesor', e.target.value)}
              className="filtro-select"
              disabled={!!filtrosLocal.pdv}
            >
              <option value="">Todos los asesores</option>
              {asesoresFiltradosPorCompania.map(asesor => (
                <option key={asesor.id} value={asesor.nombre}>
                  {asesor.nombre} ({asesor.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por PDV */}
          <div className="filtro-item">
            <label className="filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="filtro-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Punto de Venta
            </label>
            <select
              value={filtrosLocal.pdv}
              onChange={(e) => handleFiltroChange('pdv', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los PDVs</option>
              {pdvsFiltrados.map(pdv => (
                <option key={pdv.id} value={pdv.nombre}>
                  {pdv.nombre} ({pdv.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Compañía */}
          <div className="filtro-item">
            <label className="filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="filtro-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Compañía
            </label>
            <select
              value={filtrosLocal.compania}
              onChange={(e) => handleFiltroChange('compania', e.target.value)}
              className="filtro-select"
              disabled={!!filtrosLocal.pdv}
            >
              <option value="">Todas las compañías</option>
              {companiasDisponibles.map(compania => (
                <option key={compania} value={compania}>{compania}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Ciudad */}
          <div className="filtro-item">
            <label className="filtro-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="filtro-icon">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ciudad
            </label>
            <select
              value={filtrosLocal.ciudad}
              onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas las ciudades</option>
              {ciudadesDisponibles.map(ciudad => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
