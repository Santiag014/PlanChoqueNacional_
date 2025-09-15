import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../../styles/Asesor/asesor-popup-agregar-producto.css';

/**
 * Modal para agregar productos de implementación
 */
const AgregarProductoModal = ({ 
  isOpen, 
  onClose, 
  productosDisponibles,
  loading,
  onProductoAgregado 
}) => {
  const [error, setError] = useState(null);
  
  // Estado del formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  // Limpiar formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setProductoSeleccionado('');
      setCantidad(1);
      setError(null);
      console.log('🎯 Modal abierto, productos disponibles:', productosDisponibles);
      console.log('🎯 Loading state:', loading);
    }
  }, [isOpen, productosDisponibles, loading]);

  const handleAgregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) {
      setError('Por favor selecciona un producto y una cantidad válida');
      return;
    }

    setAgregando(true);
    setError(null);

    try {
      const producto = productosDisponibles.find(p => p.id.toString() === productoSeleccionado);
      
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      console.log('🎯 Producto seleccionado:', producto);

      const nuevoProducto = {
        id: `temp_${producto.id}_${Date.now()}`, // ID temporal único
        producto_id: producto.id, // ID real del producto
        nombre: producto.nombre_producto,
        cantidad: parseInt(cantidad),
        descripcion: producto.producto_descripcion || '',
        created_at: new Date().toISOString() // Fecha actual para productos temporales
      };

      console.log('✅ Nuevo producto creado:', nuevoProducto);

      onProductoAgregado(nuevoProducto);
      
      // Limpiar formulario
      setProductoSeleccionado('');
      setCantidad(1);
      
    } catch (err) {
      console.error('Error agregando producto:', err);
      setError(err.message);
    } finally {
      setAgregando(false);
    }
  };

  const handleClose = () => {
    setProductoSeleccionado('');
    setCantidad(1);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="agregar-producto-overlay">
      <div className="agregar-producto-modal">
        <div className="agregar-producto-header">
          <h3>Agregar Producto</h3>
          <button className="agregar-producto-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="agregar-producto-content">
          {error && (
            <div className="agregar-producto-error">
              {error}
            </div>
          )}

          <div className="agregar-producto-form">
            <div className="agregar-producto-field">
              <label htmlFor="producto-select">Producto:</label>
              {loading ? (
                <div className="loading-spinner">Cargando productos...</div>
              ) : (
                <select
                  id="producto-select"
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                  disabled={agregando}
                >
                  <option value="">Seleccionar producto...</option>
                  {productosDisponibles.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre_producto}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="agregar-producto-field">
              <label htmlFor="cantidad-input">Cantidad:</label>
              <input
                id="cantidad-input"
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                disabled={agregando}
              />
            </div>
          </div>

          <div className="agregar-producto-actions">
            <button
              className="btn-cancel"
              onClick={handleClose}
              disabled={agregando}
            >
              Cancelar
            </button>
            <button
              className="btn-add"
              onClick={handleAgregarProducto}
              disabled={agregando || !productoSeleccionado || cantidad <= 0 || loading}
            >
              {agregando ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AgregarProductoModal;
