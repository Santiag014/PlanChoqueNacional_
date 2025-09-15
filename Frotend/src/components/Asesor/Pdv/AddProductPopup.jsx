import React, { useState, useEffect } from 'react';
import ProductCarousel from './ProductCarousel';
import '../../../styles/Asesor/asesor-popup-agregar-producto.css';

/**
 * Pop-up para agregar productos con carrusel y formulario
 */

const AddProductPopup = ({ isOpen, onClose, productos, onAddProduct }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [presentacion, setPresentacion] = useState('');
  const [cajas, setCajas] = useState('');
  const [volumenCalculado, setVolumenCalculado] = useState(0);
  const [precioReal, setPrecioReal] = useState('');

  // Presentaciones y galonaje según marca
  const presentacionesPorMarca = {
    OILTEC: [
      { value: 'Tambor', label: 'Tambor', galonesPorCaja: 55 },
      { value: 'Cuarto', label: 'Cuarto', galonesPorCaja: 3 },
      { value: 'Galon', label: 'Galón', galonesPorCaja: 4 }
    ],
    CELEBRITY: [
      { value: 'Litro', label: 'Litro', galonesPorCaja: 3.17 },
      { value: 'Pinta', label: 'Pinta', galonesPorCaja: 3 },
      { value: 'Tambor', label: 'Tambor', galonesPorCaja: 55 }
    ]
  };

  // Detectar marca seleccionada (robusto, sin importar mayúsculas/minúsculas ni espacios)
  let presentaciones = [];
  const marcaSeleccionada = selectedProduct?.marca ? selectedProduct.marca.toString().toLowerCase().replace(/\s+/g, '') : '';
  if (marcaSeleccionada.includes('oiltec')) {
    presentaciones = presentacionesPorMarca.OILTEC;
  } else if (marcaSeleccionada.includes('celebrity') || marcaSeleccionada.includes('celerity')) {
    presentaciones = presentacionesPorMarca.CELEBRITY;
  }

  // Resetear formulario cuando se abre el pop-up
  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(null);
      setPresentacion('');
      setCajas('');
      setVolumenCalculado(0);
      setPrecioReal('');
    }
  }, [isOpen]);


  // Calcular galones según presentación y cajas
  useEffect(() => {
    if (presentacion && cajas) {
      const presentacionData = presentaciones.find(p => p.value === presentacion);
      if (presentacionData) {
        const volumen = parseFloat(cajas) * presentacionData.galonesPorCaja;
        setVolumenCalculado(volumen);
      }
    } else {
      setVolumenCalculado(0);
    }
  }, [presentacion, cajas, selectedProduct]);

  // Ya no se usa productosPerCaja, el cálculo es directo por cajas

  const handleSelectProduct = (producto) => {
    setSelectedProduct(producto);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !presentacion || !cajas || !precioReal) {
      alert('Por favor completa todos los campos');
      return;
    }
    const presentacionData = presentaciones.find(p => p.value === presentacion);
    const productoData = {
      nombre: selectedProduct.nombre || selectedProduct.descripcion,
      marca: selectedProduct.marca || 'Terpel',
      imagen: selectedProduct.imagen,
      presentacion: presentacionData.label,
      cajas: parseInt(cajas),
      galones: volumenCalculado,
      pvpSugerido: selectedProduct.precio_sugerido || 0,
      precioReal: parseFloat(precioReal),
      presentacionData: presentacionData
    };
    onAddProduct(productoData);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="asesor-popup-overlay" onClick={handleBackdropClick}>
      <div className="asesor-popup-container">
        <div className="asesor-popup-header">
          <h2>Agregar Producto</h2>
          <button className="asesor-popup-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="asesor-popup-content">
          {/* Carrusel de productos */}
          <div className="asesor-popup-carousel-section">
            <h3>Selecciona un producto</h3>
            <ProductCarousel 
              productos={productos} 
              onSelectProduct={handleSelectProduct}
              selectedProduct={selectedProduct}
            />
          </div>

          {/* Formulario */}
          <form className="asesor-popup-form" onSubmit={handleSubmit}>
            <div className="asesor-popup-form-row">
              <div className="asesor-popup-form-group">
                <label>Presentación:</label>
                <select
                  value={presentacion}
                  onChange={(e) => setPresentacion(e.target.value)}
                  required
                  disabled={!selectedProduct || presentaciones.length === 0}
                >
                  <option value="">Selecciona presentación</option>
                  {selectedProduct && presentaciones.length > 0 && presentaciones.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="asesor-popup-form-group">
                <label>Número de cajas:</label>
                <input
                  type="number"
                  value={cajas}
                  onChange={(e) => setCajas(e.target.value)}
                  min="1"
                  required
                  disabled={!presentacion}
                />
              </div>
            </div>

            <div className="asesor-popup-form-row">
              <div className="asesor-popup-form-group">
                <label>Galones totales:</label>
                <input
                  type="text"
                  value={volumenCalculado.toFixed(2)}
                  readOnly
                  className="asesor-popup-readonly-input"
                />
              </div>
            </div>

            <div className="asesor-popup-form-row">
              <div className="asesor-popup-form-group">
                <label>PRECIO DE VENTA Sugerido:</label>
                <input
                  type="text"
                  value={selectedProduct?.precio_sugerido ? `$${selectedProduct.precio_sugerido.toLocaleString()}` : ''}
                  readOnly
                  className="asesor-popup-readonly-input"
                />
              </div>

              <div className="asesor-popup-form-group">
                <label>Precio real unitario:</label>
                <input
                  type="number"
                  value={precioReal}
                  onChange={(e) => setPrecioReal(e.target.value)}
                  placeholder="Precio por unidad"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="asesor-popup-form-actions">
              <button type="button" className="asesor-popup-cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="asesor-popup-add-btn"
                disabled={!selectedProduct || !presentacion || !cajas || !precioReal}
              >
                Agregar Producto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPopup;
