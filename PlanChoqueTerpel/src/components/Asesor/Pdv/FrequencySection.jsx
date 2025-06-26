import React from 'react';
import DatePhotoSection from './DatePhotoSection';

/**
 * Componente para el KPI de Frecuencia
 */
const FrequencySection = ({ 
  fecha,
  setFecha,
  foto,
  setFoto,
  enviarReporte,
  subiendo
}) => {
  return (
    <div className="frequency-section">
      <DatePhotoSection 
        fecha={fecha}
        setFecha={setFecha}
        foto={foto}
        setFoto={setFoto}
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
