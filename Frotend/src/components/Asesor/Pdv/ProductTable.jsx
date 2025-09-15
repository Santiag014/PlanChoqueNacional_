import React from 'react';
import '../../../styles/Asesor/asesor-tabla-productos.css';

/**
 * Componente de tabla para mostrar productos implementados
 */
const ProductTable = ({ productos, onRemoveProduct }) => {
  if (!productos || productos.length === 0) {
    return (
      <div className="table-empty">
        <p>No hay productos agregados</p>
        <p className="table-empty-subtitle">Haz clic en "Agregar Producto" para comenzar</p>
      </div>
    );
  }

  return (
    <div className="product-table-container">
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentación</th>
              <th>Cajas</th>
              <th>Unidades</th>
              <th>Volumen (Gal)</th>
              <th>PVP Sugerido</th>
              <th>Precio Real</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td>
                  <div className="product-cell">
                    <img 
                      src={producto.imagen || '/img_productos_carrusel/default.png'} 
                      alt={producto.nombre}
                      className="product-mini-image"
                      onError={(e) => {
                        e.target.src = '/img_productos_carrusel/default.png';
                      }}
                    />
                    <div className="product-details">
                      <span className="product-name">{producto.nombre}</span>
                      <span className="product-brand">{producto.marca}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="presentation-badge">
                    {producto.presentacion}
                  </span>
                </td>
                <td className="text-center">
                  <strong>{producto.cajas}</strong>
                </td>
                <td className="text-center">
                  <strong>{producto.cantidad}</strong>
                </td>
                <td className="text-center">
                  <span className="volume-value">
                    {producto.volumenCalculado.toFixed(2)}
                  </span>
                </td>
                <td className="text-right">
                  <span className="price-value">
                    ${producto.pvpSugerido?.toLocaleString()}
                  </span>
                </td>
                <td className="text-right">
                  <span className="price-value price-real">
                    ${producto.precioReal?.toLocaleString()}
                  </span>
                </td>
                <td className="text-right">
                  <span className="price-value price-total">
                    ${(producto.precioReal * producto.cantidad)?.toLocaleString()}
                  </span>
                </td>
                <td>
                  <button
                    className="remove-btn"
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
    </div>
  );
};

export default ProductTable;
