import React, { useState, useEffect } from 'react';
import '../../../styles/Mercadeo/filtros-avanzados-new.css';
import { useAsesoresMercadeo, usePuntosVentaMercadeo } from '../../../hooks/mercadeo';

/**
 * Componente de filtros avanzados para mercadeo con datos reales
 * Permite filtrar por asesor, PDV, segmento, fechas y métricas
 * Incluye funcionalidad de colapso/expansión mejorada
 */
export default function FiltrosAvanzados({ 
  filtros = {}, 
  onFiltrosChange, 
  className = '' 
}) {
  // Usar hooks para obtener datos reales
  const { asesores, loading: loadingAsesores } = useAsesoresMercadeo();
  const { puntosVenta, loading: loadingPdvs } = usePuntosVentaMercadeo();

  const [filtrosLocal, setFiltrosLocal] = useState({
    fechaDesde: '',
    fechaHasta: '',
    asesorSeleccionado: '',
    pdvSeleccionado: '',
    segmentoSeleccionado: '',
    metricaSeleccionada: '',
    rangoSeleccionado: '',
    ...filtros
  });
  
  const [pdvsDisponibles, setPdvsDisponibles] = useState([]);
  const [segmentosDisponibles, setSegmentosDisponibles] = useState([]);
  
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

  // Actualizar PDVs y segmentos disponibles basado en el asesor seleccionado
  useEffect(() => {
    if (filtrosLocal.asesorSeleccionado) {
      // Filtrar PDVs por el asesor seleccionado
      const pdvsFiltrados = puntosVenta.filter(pdv => 
        pdv.id_agente === parseInt(filtrosLocal.asesorSeleccionado)
      );
      setPdvsDisponibles(pdvsFiltrados);
      
      // Obtener segmentos únicos de los PDVs filtrados
      const segmentosFiltrados = [...new Set(pdvsFiltrados.map(pdv => pdv.segmento))].filter(Boolean);
      setSegmentosDisponibles(segmentosFiltrados);
    } else {
      // Mostrar todos los PDVs y segmentos
      setPdvsDisponibles(puntosVenta);
      const todosSegmentos = [...new Set(puntosVenta.map(pdv => pdv.segmento))].filter(Boolean);
      setSegmentosDisponibles(todosSegmentos);
    }
  }, [filtrosLocal.asesorSeleccionado, puntosVenta]);

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtrosLocal, [campo]: valor };
    
    // Si cambió el asesor, limpiar PDV seleccionado
    if (campo === 'asesorSeleccionado') {
      nuevosFiltros.pdvSeleccionado = '';
    }
    
    setFiltrosLocal(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtrosVacios = {
      fechaDesde: '',
      fechaHasta: '',
      asesorSeleccionado: '',
      pdvSeleccionado: '',
      segmentoSeleccionado: '',
      metricaSeleccionada: '',
      rangoSeleccionado: ''
    };
    setFiltrosLocal(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  // Aplicar filtros rápidos de fecha
  const aplicarFiltroRapido = (rango) => {
    const fechaHoy = new Date();
    const fechaDesde = new Date();
    
    switch(rango) {
      case 'semana':
        fechaDesde.setDate(fechaHoy.getDate() - 7);
        break;
      case 'mes':
        fechaDesde.setMonth(fechaHoy.getMonth() - 1);
        break;
      case 'trimestre':
        fechaDesde.setMonth(fechaHoy.getMonth() - 3);
        break;
      default:
        return;
    }
    
    const fechaDesdeStr = fechaDesde.toISOString().split('T')[0];
    const fechaHastaStr = fechaHoy.toISOString().split('T')[0];
    
    const nuevosFiltros = {
      ...filtrosLocal,
      fechaDesde: fechaDesdeStr,
      fechaHasta: fechaHastaStr
    };
    
    setFiltrosLocal(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  // Opciones de métricas y rangos
  const metricas = [
    { value: 'cobertura', label: 'Cobertura' },
    { value: 'volumen', label: 'Volumen' },
    { value: 'visitas', label: 'Visitas' },
    { value: 'productividad', label: 'Productividad' },
    { value: 'precios', label: 'Precios' }
  ];

  const rangos = [
    'Arriba del 80%',
    'Entre 60% y 80%',
    'Debajo del 60%'
  ];

  if (loadingAsesores || loadingPdvs) {
    return (
      <div className="filtros-loading">
        <div className="loading-spinner"></div>
        <span>Cargando filtros...</span>
      </div>
    );
  }

  return (
    <div className={`filtros-container ${className}`}>
      <div className="filtros-header">
        <h3 className="filtros-title">
          <span className="filtros-icon">🔍</span>
          Filtros Avanzados
        </h3>
        <button 
          className={`filtros-toggle ${filtrosExpanded ? 'expanded' : ''}`}
          onClick={toggleFiltrosExpansion}
          title={filtrosExpanded ? 'Colapsar filtros' : 'Expandir filtros'}
        >
          <span className="toggle-icon">▼</span>
        </button>
      </div>

      <div className={`filtros-content ${filtrosExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Filtros rápidos de fecha */}
        <div className="filtros-rapidos">
          <span className="filtros-label">Filtros rápidos:</span>
          <div className="filtros-rapidos-buttons">
            <button 
              className="filtro-rapido-btn" 
              onClick={() => aplicarFiltroRapido('semana')}
            >
              Última semana
            </button>
            <button 
              className="filtro-rapido-btn" 
              onClick={() => aplicarFiltroRapido('mes')}
            >
              Último mes
            </button>
            <button 
              className="filtro-rapido-btn" 
              onClick={() => aplicarFiltroRapido('trimestre')}
            >
              Último trimestre
            </button>
          </div>
        </div>

        {/* Filtros de fecha */}
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Fecha desde:</label>
            <input
              type="date"
              className="filtro-input"
              value={filtrosLocal.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
            />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha hasta:</label>
            <input
              type="date"
              className="filtro-input"
              value={filtrosLocal.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
            />
          </div>
        </div>

        {/* Filtros de asesor y PDV */}
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Asesor:</label>
            <select
              className="filtro-select"
              value={filtrosLocal.asesorSeleccionado}
              onChange={(e) => handleFiltroChange('asesorSeleccionado', e.target.value)}
            >
              <option value="">Todos los asesores</option>
              {asesores.map(asesor => (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.codigo} - {asesor.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">PDV:</label>
            <select
              className="filtro-select"
              value={filtrosLocal.pdvSeleccionado}
              onChange={(e) => handleFiltroChange('pdvSeleccionado', e.target.value)}
              disabled={!filtrosLocal.asesorSeleccionado && pdvsDisponibles.length === 0}
            >
              <option value="">Todos los PDVs</option>
              {pdvsDisponibles.map(pdv => (
                <option key={pdv.id} value={pdv.codigo}>
                  {pdv.codigo} - {pdv.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros de segmento y métrica */}
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Segmento:</label>
            <select
              className="filtro-select"
              value={filtrosLocal.segmentoSeleccionado}
              onChange={(e) => handleFiltroChange('segmentoSeleccionado', e.target.value)}
            >
              <option value="">Todos los segmentos</option>
              {segmentosDisponibles.map(segmento => (
                <option key={segmento} value={segmento}>
                  {segmento}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Métrica:</label>
            <select
              className="filtro-select"
              value={filtrosLocal.metricaSeleccionada}
              onChange={(e) => handleFiltroChange('metricaSeleccionada', e.target.value)}
            >
              <option value="">Todas las métricas</option>
              {metricas.map(metrica => (
                <option key={metrica.value} value={metrica.value}>
                  {metrica.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro de rango */}
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Rango de desempeño:</label>
            <select
              className="filtro-select"
              value={filtrosLocal.rangoSeleccionado}
              onChange={(e) => handleFiltroChange('rangoSeleccionado', e.target.value)}
            >
              <option value="">Todos los rangos</option>
              {rangos.map(rango => (
                <option key={rango} value={rango}>
                  {rango}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="filtros-actions">
          <button 
            className="filtro-btn filtro-btn-limpiar"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
