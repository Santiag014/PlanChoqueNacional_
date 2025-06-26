import React from 'react';
import ProductCarousel from './ProductCarousel';
import AccumulatedTable from './AccumulatedTable';
import DatePhotoSection from './DatePhotoSection';

/**
 * Componente para el KPI de Volumen
 */
const VolumeSection = ({ 
  kpiTransition,
  productos,
  cant14,
  setCant14,
  cant1,
  setCant1,
  cant55,
  setCant55,
  totalCantidad,
  handleCargarVolumen,
  acumulados,
  handleEliminar,
  totalGalones,
  fecha,
  setFecha,
  foto,
  setFoto,
  enviarReporte,
  subiendo,
  productSelection
}) => {
  const productoActual = productos[productSelection.productoActivo];
  
  // Función para obtener las presentaciones según la marca
  const getPresentaciones = () => {
    const marcaActual = productSelection.marcas[productSelection.marcaActiva];
    
    if (!marcaActual) {
      return { labels: ['1/4', '1Gal', '55Gal'], values: ['14', '1', '55'] };
    }
    
    // Verificar todas las propiedades posibles del objeto marca
    const marcaNombre = marcaActual.descripcion || marcaActual.nombre || marcaActual.name || marcaActual.marca || '';
    const marcaNombreLower = marcaNombre.toLowerCase();
    
    if (marcaNombreLower.includes('celerity')) {
      return { 
        labels: ['1L', '1/4gal', '5gal'], 
        values: ['1L', '14', '5'] 
      };
    } else if (marcaNombreLower.includes('oiltec')) {
      return { 
        labels: ['1/4gal', '1gal', '55gal'], 
        values: ['14', '1', '55'] 
      };
    }
    
    // Por defecto
    return { labels: ['1/4', '1Gal', '55Gal'], values: ['14', '1', '55'] };
  };
  
  const presentaciones = getPresentaciones();

  return (
    <div className={`kpi-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
      <div className='venta-productos-label'>VENTA PRODUCTOS</div>
      
      <ProductCarousel {...productSelection} />
      
      {/* Inputs de cantidades */}
      <div className="cantidades-section">
        <span className="cant-label">{presentaciones.labels[0]}</span>
        <input
          type="number"
          min="0"
          className="cant-input"
          value={cant14}
          onChange={e => setCant14(e.target.value)}
          placeholder="0"
        />
        <span className="cant-label">{presentaciones.labels[1]}</span>
        <input
          type="number"
          min="0"
          className="cant-input"
          value={cant1}
          onChange={e => setCant1(e.target.value)}
          placeholder="0"
        />
        <span className="cant-label">{presentaciones.labels[2]}</span>
        <input
          type="number"
          min="0"
          className="cant-input"
          value={cant55}
          onChange={e => setCant55(e.target.value)}
          placeholder="0"
        />
        <span className="cant-label cant-label-total">Total</span>
        <span className="cant-total">{totalCantidad}</span>
      </div>
      
      <button
        type="button"
        className="cargar-btn ml-8"
        onClick={() => handleCargarVolumen(productoActual)}
      >
        CARGAR
      </button>
      
      <AccumulatedTable 
        acumulados={acumulados}
        kpiSeleccionado="Volumen"
        handleEliminar={handleEliminar}
        totalCantidad={totalCantidad}
        totalGalones={totalGalones}
      />
      
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

export default VolumeSection;
