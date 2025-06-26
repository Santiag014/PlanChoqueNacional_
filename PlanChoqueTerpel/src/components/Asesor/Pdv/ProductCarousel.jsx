import React from 'react';

/**
 * Componente para el carrusel de productos
 */
const ProductCarousel = ({ 
  marcas, 
  marcaActiva, 
  productos, 
  productoActivo, 
  setProductoActivo,
  carruselInicio,
  referenciasVisibles,
  navegarMarcaAnterior,
  navegarMarcaSiguiente,
  navegarCarruselAnterior,
  navegarCarruselSiguiente
}) => {
  return (
    <>
      {/* Selector de marca */}
      <div className="productos-selector flex-center-gap8">
        <button
          type="button"
          className="productos-arrow"
          onClick={navegarMarcaAnterior}
        >
          ◀
        </button>
        <button
          type="button"
          className="productos-marca flex-center-gap8"
        >
          <span>
            {marcas[marcaActiva]?.descripcion || 'Marca'}
          </span>
        </button>
        <button
          type="button"
          className="productos-arrow"
          onClick={navegarMarcaSiguiente}
        >
          ▶
        </button>
      </div>

      {/* Carrusel de productos */}
      <div className="productos-lista-carrusel flex-center-gap0 mt-10">
        {productos.length > 2 ? (
          // Scroll horizontal cuando hay más de 2 productos
          <div className="productos-scroll-container">
            <div className="productos-scroll-inner">
              {productos.map((prod, idx) => {
                const nombreImagen = prod.descripcion ? `${prod.descripcion}.png` : '';
                const imagenSrc = prod.descripcion
                  ? `/storage/img_productos_carrusel/${nombreImagen}`
                  : '/img/logo-prueba.png';
                
                return (
                  <div
                    key={prod.id}
                    className={`producto-item producto-item-custom${productoActivo === idx ? ' selected' : ''}`}
                    onClick={() => setProductoActivo(idx)}
                  >
                    <div className="producto-item-imgbox">
                      <img
                        src={imagenSrc}
                        alt={prod.descripcion}
                        onError={e => { e.target.src = '/img/logo-prueba.png'; }}
                      />
                    </div>
                    <div
                      className={`producto-item-label producto-item-label-custom${productoActivo === idx ? ' producto-item-label-active' : ''}`}
                      title={prod.descripcion}
                    >
                      {prod.descripcion}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Carrusel con flechas cuando hay 2 o menos productos
          <>
            <button
              type="button"
              className={`carrusel-arrow ${productos.length > referenciasVisibles ? 'carrusel-arrow-visible' : 'carrusel-arrow-hidden'}`}
              onClick={navegarCarruselAnterior}
              disabled={carruselInicio === 0}
            >
              <span className="carrusel-arrow-icon">◀</span>
            </button>
            
            {productos.slice(carruselInicio, carruselInicio + referenciasVisibles).map((prod, idx) => {
              const realIdx = carruselInicio + idx;
              const nombreImagen = prod.descripcion ? `${prod.descripcion}.png` : '';
              const imagenSrc = prod.descripcion
                ? `/storage/img_productos_carrusel/${nombreImagen}`
                : '/img/logo-prueba.png';
              
              return (
                <div
                  key={prod.id}
                  className={`producto-item producto-item-custom${productoActivo === realIdx ? ' selected' : ''}`}
                  onClick={() => setProductoActivo(realIdx)}
                >
                  <div className="producto-item-imgbox">
                    <img
                      src={imagenSrc}
                      alt={prod.descripcion}
                      onError={e => { e.target.src = '/img/logo-prueba.png'; }}
                    />
                  </div>
                  <div
                    className={`producto-item-label producto-item-label-custom${productoActivo === realIdx ? ' producto-item-label-active' : ''}`}
                    title={prod.descripcion}
                  >
                    {prod.descripcion}
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              className={`carrusel-arrow ${productos.length > referenciasVisibles ? 'carrusel-arrow-visible' : 'carrusel-arrow-hidden'}`}
              onClick={navegarCarruselSiguiente}
              disabled={carruselInicio >= productos.length - referenciasVisibles}
            >
              <span className="carrusel-arrow-icon">▶</span>
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ProductCarousel;
