import React from 'react';
import DatePhotoSection from './DatePhotoSection';

/**
 * Componente para el KPI de Frecuencia
 */
const FrequencySection = ({ 
  kpiTransition,
  fecha,
  setFecha,
  foto,
  setFoto,
  enviarReporte,
  subiendo
}) => {
  return (
    <div className={`frequency-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
      <DatePhotoSection 
        fecha={fecha}
        setFecha={setFecha}
        foto={foto}
        setFoto={setFoto}
        idPrefix="frecuencia"
      />
      
      <button
        type="button"
        className="cargar-report-btn ml-8"
        onClick={enviarReporte}
        disabled={subiendo}
      >
        CARGAR REPORTE
      </button>
    </div>
  );
};

export default FrequencySection;
