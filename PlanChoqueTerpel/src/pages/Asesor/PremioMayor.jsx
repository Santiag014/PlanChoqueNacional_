import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import '../../styles/Asesor/premioMayor.css';
// Reemplaza las rutas de las imágenes por las reales
import img1 from '../../assets/Img/premio_cartagena.jpg';
import img2 from '../../assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg';

const slides = [
  {
    img: img1,
    titulo: "Viaje a Cartagena",
    descripcion: "Planta de Lubricantes Terpel",
    recuadro: (
      <>
        <div className="premio-mayor-recuadro-titulo">
          Estadía: 2 días y 1 noche, todo incluido
        </div>
        <div className="premio-mayor-recuadro-texto">
          <strong>Día 1:</strong>
          <ul className="premio-mayor-recuadro-lista">
            <li>Llegada al Hotel Las Américas Cartagena</li>
            <li>Ingreso a planta de lubricantes Terpel</li>
            <li>Almuerzo y tarde libre en instalaciones del hotel</li>
            <li>Cena en restaurante exclusivo (Ciudad Amurallada)</li>
          </ul>
          <strong>Día 2:</strong>
          <ul className="premio-mayor-recuadro-lista">
            <li>Desayuno en hotel</li>
            <li>Recorrido histórico: Las calles Terpel (historia, cultura y gastronomía)</li>
            <li>Almuerzo en restaurante típico</li>
            <li>Check out y regreso a ciudad de origen</li>
          </ul>
        </div>
        <div className="premio-mayor-recuadro-footer">
          Total ganadores: 38 asesores de ventas a nivel nacional
        </div>
      </>
    )
  },
  {
    img: img2,
    titulo: "Premio Nro. 2",
    descripcion: "¡Pronto anunciaremos más detalles!",
    recuadro: (
      <>
        <div className="premio-mayor-recuadro-titulo">
          Detalles próximamente
        </div>
        <div className="premio-mayor-recuadro-texto">
          Mantente atento a las novedades en esta sección.
        </div>
        <div className="premio-mayor-recuadro-footer">
          ¡Sigue participando!
        </div>
      </>
    )
  }
];

export default function PremioMayor() {
  const [current, setCurrent] = useState(0);
  // Variables para swipe
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const next = () => setCurrent((current + 1) % slides.length);
  const prev = () => setCurrent((current - 1 + slides.length) % slides.length);

  // Handlers para swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 40) { // Sensibilidad del swipe
        if (diff > 0) {
          next();
        } else {
          prev();
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <DashboardLayout>
      <div className="premio-mayor-container">
        {/* Intro */}
        <div className="premio-mayor-intro">
          <p className="premio-mayor-intro-text">
            Los dos asesores por AC con el mayor sobre cumplimiento de KPIs al finalizar la actividad, se ganarán como premio mayor:
          </p>
        </div>
        
        {/* Carrusel */}
        <div className="premio-mayor-carrusel">
          <div
            className="premio-mayor-slide"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Imagen */}
            <img
              src={slides[current].img}
              alt={slides[current].titulo}
              className="premio-mayor-slide-img"
            />
          </div>
          
          {/* Puntos */}
          <div className="premio-mayor-dots">
            {slides.map((_, idx) => (
              <span 
                key={idx} 
                className={`premio-mayor-dot ${idx === current ? 'active' : 'inactive'}`}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
        </div>
        
        {/* Info dinámica */}
        <div className="premio-mayor-info">
          <div className="premio-mayor-titulo">
            {slides[current].titulo}
          </div>
          <div className="premio-mayor-descripcion">
            {slides[current].descripcion}
          </div>
          <div className="premio-mayor-recuadro">
            {slides[current].recuadro}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}