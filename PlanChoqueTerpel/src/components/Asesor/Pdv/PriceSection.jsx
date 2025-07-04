import React from 'react';
import ProductCarousel from './ProductCarousel';
import AccumulatedTable from './AccumulatedTable';
import DatePhotoSection from './DatePhotoSection';

/**
 * Componente para el KPI de Precio
 */
const PriceSection = ({ 
  kpiTransition,
  productos,
  precioSeleccion,
  setPrecioSeleccion,
  precioValor,
  formatCOP,
  handlePrecioInput,
  handleCargarPrecio,
  acumulados,
  handleEliminar,
  fecha,
  setFecha,
  foto,
  setFoto,
  enviarReporte,
  subiendo,
  productSelection
}) => {
  const productoActual = productos[productSelection.productoActivo];
  
  // Funciones wrapper para pasar el KPI ID correcto
  const navegarMarcaAnteriorConKPI = () => {
    // KPI Precio tiene ID 2 según la base de datos
    productSelection.anteriorMarca(2);
  };
  
  const navegarMarcaSiguienteConKPI = () => {
    // KPI Precio tiene ID 2 según la base de datos
    productSelection.siguienteMarca(2);
  };
  
  // Función para obtener las presentaciones según la marca
  const getPresentaciones = () => {
    const marcaActual = productSelection.marcas[productSelection.marcaActiva];
    
    if (!marcaActual) {
      return ['1/4', '1Gal', '55Gal'];
    }
    
    // Verificar todas las propiedades posibles del objeto marca
    const marcaNombre = marcaActual.descripcion || marcaActual.nombre || marcaActual.name || marcaActual.marca || '';
    const marcaNombreLower = marcaNombre.toLowerCase();
    
    if (marcaNombreLower.includes('celerity')) {
      return ['1L', '1/4gal', '5gal'];
    } else if (marcaNombreLower.includes('oiltec')) {
      return ['1/4gal', '1gal', '55gal'];
    }
    
    // Por defecto
    return ['1/4', '1Gal', '55Gal'];
  };
  
  const presentaciones = getPresentaciones();

  return (
    <div className={`kpi-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
      <div className='venta-productos-label'>VENTA PRODUCTOS</div>
      
      <ProductCarousel 
        marcas={productSelection.marcas || []}
        marcaActiva={productSelection.marcaActiva || 0}
        productos={productos || []}
        productoActivo={productSelection.productoActivo || 0}
        setProductoActivo={productSelection.setProductoActivo}
        carruselInicio={0}
        referenciasVisibles={productos?.length || 0}
        navegarMarcaAnterior={navegarMarcaAnteriorConKPI}
        navegarMarcaSiguiente={navegarMarcaSiguienteConKPI}
        navegarCarruselAnterior={productSelection.anteriorProducto}
        navegarCarruselSiguiente={productSelection.siguienteProducto}
      />
      
      {/* Presentaciones y precio */}
      <div className="precio-section flex-center-gap4">
        {presentaciones.map(pres => (
          <div key={pres} className="flex-center-gap4">
            <input
              type="checkbox"
              checked={precioSeleccion === pres}
              onChange={() => setPrecioSeleccion(precioSeleccion === pres ? '' : pres)}
              id={`check-${pres}`}
            />
            <label htmlFor={`check-${pres}`} className="cant-label">{pres}</label>
          </div>
        ))}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="cant-input w-110"
          value={precioValor ? formatCOP(precioValor) : ''}
          onChange={handlePrecioInput}
          placeholder="$"
          disabled={!precioSeleccion}
        />
      </div>
      
      <div className="mt-10 mb-0">
        <button
          type="button"
          className="cargar-btn ml-0"
          onClick={() => handleCargarPrecio(productoActual)}
          disabled={!precioSeleccion || !precioValor}
        >
          CARGAR
        </button>
      </div>
      
      <AccumulatedTable 
        acumulados={acumulados}
        kpiSeleccionado="Precio"
        handleEliminar={handleEliminar}
        formatCOP={formatCOP}
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

export default PriceSection;
