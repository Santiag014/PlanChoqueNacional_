import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

// Renombrar el componente a DashboardAsesor
export default function DashboardAsesor() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate(); // Inicializa el hook

  // Define los botones de cada página, ahora con propiedad 'to'
  const botonesPaginas = [
    [
      { icon: '/icon-metas.png', label: 'MIS METAS', to: '/asesor/metas' },
      { icon: '/icon-pdv.png', label: 'REGISTRA TUS PDVS', to: '/asesor/pdvs' },
      { icon: '/icon-ranking.png', label: 'RANKING ASESORES', to: '/asesor/ranking' },
      { icon: '/icon-catalogo.png', label: 'CATÁLOGOS PLAN', to: '/asesor/catalogos' },
      { icon: '/icon-premio.png', label: 'PREMIO MAYOR', to: '/asesor/premio-mayor' },
      { icon: '/icon-tyc.png', label: 'T&C', to: '/asesor/tyc' }
    ],
    [
      { icon: '/icon-premio.png', label: 'PREMIOS EXTRAS', to: '/asesor/premios-extras' },
    ]
  ];

  return (
    <DashboardLayout>
      <div
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          position: 'relative',
          overflow: 'auto',
          padding: '25px 0', // <--- padding vertical (arriba y abajo)
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 50px - 50px)', // Ajusta 50px según header/footer reales
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: 'repeat(3, 1fr) auto',
              gap: 8,
              justifyItems: 'center',
              alignItems: 'center',
              padding: 25,
            }}
          >
            {botonesPaginas[page].map((btn, i) => (
              <div
                key={btn.label}
                style={{
                  background: 'transparent', // Fondo transparente para el contenedor principal
                  border: 'none',
                  boxShadow: 'none',
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  width: 120,
                  minHeight: 140,
                  marginBottom: 10, // Sin margen inferior
                  justifyContent: 'flex-start',
                  userSelect: 'none'
                }}
                onClick={() => navigate(btn.to)} // Navega al hacer clic
              >
                {/* Recuadro blanco solo para el ícono */}
                <div
                  style={{
                    background: '#fff',
                    boxShadow: '0 2px 10px 0 rgba(0,0,0,0.10)',
                    borderRadius: 22,
                    width: 120,
                    height: 110,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4 // Menos margen inferior
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src={btn.icon} alt={btn.label} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  </div>
                </div>
                {/* Texto rojo debajo del recuadro blanco */}
                <span style={{
                  fontWeight: 700,
                  color: '#e30613',
                  fontSize: 12,
                  textAlign: 'center',
                  letterSpacing: 0.2,
                  lineHeight: 1.1,
                  maxWidth: 100,
                  wordBreak: 'break-word'
                }}>{btn.label}</span>
              </div>
            ))}
            {/* Paginador de home (puntos) en una fila aparte */}
            <div style={{
              gridColumn: '1 / span 2',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 1,
              marginBottom: 5
            }}>
              {[0, 1].map(idx => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: page === idx ? '#e30613' : '#fff',
                    border: page === idx ? 'none' : '1.5px solid #e30613',
                    margin: '0 6px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  aria-label={`Página ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Elimina el footer fijo de aquí, ya que está en DashboardLayout */}
      </div>
    </DashboardLayout>
  );
}
