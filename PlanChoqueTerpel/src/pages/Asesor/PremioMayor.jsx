import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
// Reemplaza las rutas de las imágenes por las reales
import img1 from '../../assets/Img/img_login.png';
import img2 from '../../assets/Img/img_login.png';

const slides = [
  {
    img: img1,
    titulo: "Viaje a Cartagena",
    descripcion: "Planta de Lubricantes Terpel",
    recuadro: (
      <>
        <div style={{
          color: '#e30613',
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 8
        }}>
          Estadia: 2 días y 1 una noche, todo incluido.
        </div>
        <div style={{ fontSize: 14, color: '#222', marginBottom: 8 }}>
          <b>Día 1:</b>
          <ul style={{ margin: '6px 0 10px 18px', padding: 0 }}>
            <li>Llegada al Hotel Las Américas Cartagena.</li>
            <li>Ingreso a planta de lubricantes Terpel.</li>
            <li>Almuerzo y tarde libre en instalaciones del hotel.</li>
            <li>Cena en restaurante exclusivo (Ciudad Amurallada).</li>
          </ul>
          <b>Día 2:</b>
          <ul style={{ margin: '6px 0 10px 18px', padding: 0 }}>
            <li>Desayuno en hotel.</li>
            <li>Recorrido histórico: Las calles Terpel (historia, cultura y gastronomía).</li>
            <li>Almuerzo en restaurante típico.</li>
            <li>Check out y regreso a ciudad de origen.</li>
          </ul>
        </div>
        <div style={{
          color: '#e30613',
          fontWeight: 600,
          fontSize: 12,
          textAlign: 'center',
          marginTop: 8
        }}>
          Total ganadores: 38 asesores de ventas a nivel nacional.
        </div>
      </>
    )
  },
  {
    img: img2,
    titulo: "Premio Sorpresa",
    descripcion: "¡Pronto anunciaremos más detalles!",
    recuadro: (
      <>
        <div style={{
          color: '#e30613',
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 8
        }}>
          Detalles próximamente.
        </div>
        <div style={{ fontSize: 15, color: '#222', marginBottom: 8 }}>
          Mantente atento a las novedades en esta sección.
        </div>
        <div style={{
          color: '#e30613',
          fontWeight: 600,
          fontSize: 14,
          textAlign: 'center',
          marginTop: 8
        }}>
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
      <div style={{
        width: '100%', // Cambiado de '100%' a '100vw'
        minHeight: 'auto',
        background: '#ededed',
        padding: '0 0 18% 0', // Elimina padding horizontal
        overflowX: 'hidden', // Previene overflow horizontal
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Intro */}
        <div style={{
          width: '100%',
          maxWidth: 420,
          margin: '18px 0 10px 0',
          textAlign: 'center',
          boxSizing: 'border-box' // Asegura que el ancho no exceda el contenedor
        }}>
          <p style={{
            color: '#888',
            fontWeight: 400,
            fontSize: 15,
            margin: '10px 30px 20px 45px',
            letterSpacing: -0.2,
            textAlign: 'left',
          }}>
            Los dos asesores por AC con el mayor sobre cumplimiento de KPIs al finalizar la actividad, se ganarán como premio mayor:
          </p>
        </div>
        {/* Carrusel */}
        <div style={{
          width: '95%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 18,
          boxSizing: 'border-box'
        }}>
          <div
            style={{
              width: '100%',
              height: 200,
              borderRadius: 10,
              overflow: 'hidden',
              position: 'relative',
              background: '#fff'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Imagen */}
            <img
              src={slides[current].img}
              alt={slides[current].titulo}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 14
              }}
            />
            {/* Puntos */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 6
            }}>
              {slides.map((_, idx) => (
                <span key={idx} style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: idx === current ? '#e30613' : '#fff',
                  border: '1.5px solid #e30613',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrent(idx)}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Info dinámica */}
        <div style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: 22,
            color: '#e30613',
            textAlign: 'center',
            marginBottom: -5
          }}>
            {slides[current].titulo}
          </div>
          <div style={{
            fontWeight: 400,
            fontSize: 15,
            color: '#222',
            textAlign: 'center',
            marginBottom: 18,
            letterSpacing: 0.5,
          }}>
            {slides[current].descripcion}
          </div>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px #0001',
            padding: '18px 18px 20px 18px',
            width: '80%',
            textAlign: 'left',
          }}>
            {slides[current].recuadro}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}