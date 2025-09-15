import React from 'react';
import '../../../styles/Asesor/asesor-tabla-productos-implementados.css';

/**
 * Componente de tabla para mostrar productos implementados
 */
const ProductosImplementadosTable = ({ productos, onRemoveProduct, loading }) => {
  if (loading) {
    return (
      <div className="productos-implementados-loading">
        <div className="productos-loading-spinner"></div>
        <p>Cargando productos implementados...</p>
      </div>
    );
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="productos-implementados-empty">
        <div className="empty-icon">📦</div>
        <p>No hay productos implementados</p>
        <p className="empty-subtitle">Haz clic en "Agregar Producto" para comenzar</p>
      </div>
    );
  }

  return (
    <div className="productos-implementados-container">
      <h4 className="productos-implementados-title">
        <span className="productos-icon">📋</span>
        Productos Implementados
      </h4>
      
      <div className="productos-implementados-table-wrapper">
        <table className="productos-implementados-table">
          <thead>
            <tr>
              <th>Producto Implementado</th>
              <th>Cantidad Implementada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id} className="producto-implementado-row">
                <td className="producto-nombre">
                  <div className="producto-nombre-wrapper">
                    <span className="producto-text">{producto.nombre || producto.producto_nombre}</span>
                  </div>
                </td>
                <td className="producto-cantidad">
                  <span className="cantidad-badge">{producto.cantidad}</span>
                </td>
                <td className="producto-acciones">
                  <button 
                    className="btn-eliminar-producto"
                    onClick={() => onRemoveProduct(producto.id)}
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="productos-implementados-summary">
        <span className="productos-total">
          Total productos: <strong>{productos.length}</strong>
        </span>
      </div>
    </div>
  );
};

export default ProductosImplementadosTable;
