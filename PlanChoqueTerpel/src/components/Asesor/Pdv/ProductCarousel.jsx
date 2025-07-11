import React, { useState, useEffect } from 'react';
import '../../../styles/Asesor/asesor-carrusel-productos.css';

/**
 * Componente del carrusel de productos
 * Muestra los productos disponibles en un carrusel deslizable
 */
const ProductCarousel = ({ productos, onSelectProduct, selectedProduct }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState(3);

  // Ajustar productos visibles según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleProducts(1);
      } else if (window.innerWidth < 1024) {
        setVisibleProducts(2);
      } else {
        setVisibleProducts(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex(prev => 
      prev + visibleProducts >= productos.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex(prev => 
      prev === 0 ? Math.max(0, productos.length - visibleProducts) : prev - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!productos || productos.length === 0) {
    return (
      <div className="carousel-empty">
        <p>No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="product-carousel">
      <div className="carousel-wrapper">
        {productos.length > visibleProducts && (
          <button 
            className="carousel-btn carousel-btn-prev"
            onClick={prevSlide}
            disabled={currentIndex === 0}
          >
            ‹
          </button>
        )}
        
        <div className="carousel-container">
          <div 
            className="carousel-track"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleProducts)}%)`,
              width: `${(productos.length / visibleProducts) * 100}%`
            }}
          >
            {productos.map((producto, index) => (
              <div 
                key={producto.id || index}
                className="carousel-slide"
                style={{ width: `${100 / productos.length}%` }}
              >
                <div 
                  className={`product-card ${selectedProduct?.id === producto.id ? 'selected' : ''}`}
                  onClick={() => onSelectProduct?.(producto)}
                >
                  <div className="product-image">
                    <img 
                      src={producto.imagen || '/storage/img_productos_carrusel/default.png'} 
                      alt={producto.nombre || producto.descripcion}
                      onError={(e) => {
                        e.target.src = '/storage/img_productos_carrusel/default.png';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h4 className="product-name">
                      {producto.nombre || producto.descripcion}
                    </h4>
                    <p className="product-brand">
                      {producto.marca || 'Terpel'}
                    </p>
                    <div className="product-price">
                      <span className="price-label">PVP Sugerido:</span>
                      <span className="price-value">
                        ${producto.precio_sugerido?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {productos.length > visibleProducts && (
          <button 
            className="carousel-btn carousel-btn-next"
            onClick={nextSlide}
            disabled={currentIndex + visibleProducts >= productos.length}
          >
            ›
          </button>
        )}
      </div>
      
      {/* Indicadores */}
      {productos.length > visibleProducts && (
        <div className="carousel-indicators">
          {Array.from({ length: Math.ceil(productos.length / visibleProducts) }).map((_, index) => (
            <button
              key={index}
              className={`indicator ${Math.floor(currentIndex / visibleProducts) === index ? 'active' : ''}`}
              onClick={() => goToSlide(index * visibleProducts)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
