import React from 'react';
import '../../../styles/Mercadeo/filtros-avanzados-new.css';

/**
 * Componente para mostrar y gestionar el filtro activo en el dashboard de Mercadeo
 */
export default function FiltroActivo({ filtros, onLimpiarFiltros, isMobile }) {
  
  // Verificar si hay algún filtro activo
  const tieneFiltrooActivo = filtros.fechaDesde || filtros.fechaHasta || 
                           filtros.asesorSeleccionado || filtros.pdvSeleccionado || 
                           filtros.segmentoSeleccionado || filtros.metricaSeleccionada || 
                           filtros.rangoSeleccionado;

  if (!tieneFiltrooActivo) {
    return null;
  }

  // Obtener el nombre del asesor seleccionado
  const obtenerNombreAsesor = (asesorId) => {
    // En un componente real, esto vendría de los datos de asesores
    const asesoresMap = {
      '1': 'Felipe Yara',
      '2': 'Alejandro Palomino',
      '3': 'Claudia Rivas',
      '4': 'Manuel Ruiz',
      '5': 'Ana Gutierrez'
    };
    return asesoresMap[asesorId] || 'Asesor desconocido';
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Construir el texto del filtro activo
  const construirTextoFiltro = () => {
    const partes = [];
    
    if (filtros.fechaDesde && filtros.fechaHasta) {
      partes.push(`Fecha: ${formatearFecha(filtros.fechaDesde)} - ${formatearFecha(filtros.fechaHasta)}`);
    } else if (filtros.fechaDesde) {
      partes.push(`Desde: ${formatearFecha(filtros.fechaDesde)}`);
    } else if (filtros.fechaHasta) {
      partes.push(`Hasta: ${formatearFecha(filtros.fechaHasta)}`);
    }
    
    if (filtros.asesorSeleccionado) {
      partes.push(`Asesor: ${obtenerNombreAsesor(filtros.asesorSeleccionado)}`);
    }
    
    if (filtros.pdvSeleccionado) {
      partes.push(`PDV: ${filtros.pdvSeleccionado}`);
    }
    
    if (filtros.segmentoSeleccionado) {
      partes.push(`Segmento: ${filtros.segmentoSeleccionado}`);
    }
    
    if (filtros.metricaSeleccionada) {
      const metricasMap = {
        'cobertura': 'Cobertura',
        'volumen': 'Volumen',
        'visitas': 'Visitas',
        'productividad': 'Productividad',
        'precios': 'Precios'
      };
      partes.push(`Métrica: ${metricasMap[filtros.metricaSeleccionada] || filtros.metricaSeleccionada}`);
    }
    
    if (filtros.rangoSeleccionado) {
      partes.push(`Rango: ${filtros.rangoSeleccionado}`);
    }
    
    return partes.join(' | ');
  };

  return (
    <div className="filtro-activo-container">
      <div className="filtro-activo-content">
        <div className="filtro-activo-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 1a.5.5 0 0 1 .5.5v1h3a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H7v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V4H2a.5.5 0 0 1-.5-.5V2.5a.5.5 0 0 1 .5-.5h3v-1a.5.5 0 0 1 .5-.5h1z" fill="currentColor"/>
            <path d="M2 7.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-1z" fill="currentColor"/>
          </svg>
        </div>
        <div className="filtro-activo-texto">
          <span className="filtro-activo-label">Filtro aplicado:</span>
          <span className="filtro-activo-valor">{construirTextoFiltro()}</span>
        </div>
        <button 
          className="filtro-activo-limpiar" 
          onClick={onLimpiarFiltros}
          title="Limpiar filtros"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
