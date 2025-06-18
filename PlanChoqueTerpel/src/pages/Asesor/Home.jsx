import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

import iconMisMetas from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import RegistroPDV from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import RankingAsesores from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import CatalogosPlan from '../../assets/Iconos/IconosPage/Icono_Page_Catalogos.png';
import PremioMayor from '../../assets/Iconos/IconosPage/Icono_Page_PremioMayor.png';
import TyC from '../../assets/Iconos/IconosPage/Icono_Page_T&C.png';

// Renombrar el componente a DashboardAsesor
export default function DashboardAsesor() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate(); // Inicializa el hook

  // Define los botones de cada página, ahora con propiedad 'to'
  const botonesPaginas = [
    [
      { icon: iconMisMetas, label: 'MIS METAS', to: '/asesor/metas' },
      { icon: RegistroPDV, label: 'REGISTRA TUS PDVS', to: '/asesor/pdvs' },
      { icon: RankingAsesores , label: 'RANKING ASESORES', to: '/asesor/ranking' },
      { icon: CatalogosPlan, label: 'CATÁLOGOS PLAN', to: '/asesor/catalogos' },
      { icon: PremioMayor, label: 'PREMIO MAYOR', to: '/asesor/premio-mayor' },
      { icon: TyC, label: 'T&C', to: '/asesor/tyc' }
    ],
    [
      { icon: '/icon-premio.png', label: 'PREMIOS EXTRAS', to: '/asesor/premios-extras' },
      { icon: '/icon-tyc.png', label: 'AYUDA', to: '/asesor/ayuda' }
    ]
  ];

  return (
    <DashboardLayout>
      <div
        style={{
          width: '100%',
          minHeight: '70vh', // Ocupa toda la altura de la pantalla
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center', // Centra verticalmente
          fontFamily: 'Segoe UI, Arial, sans-serif',
          position: 'relative',
          overflow: 'auto',
          padding: 0, // Elimina padding extra
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 320,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'repeat(3, 1fr) auto',
            gap: 8,
            justifyItems: 'center',
            alignItems: 'center',
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
                  <img src={btn.icon} alt={btn.label} style={{ width: 60, height: 60, objectFit: 'contain' }} />
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
        </div>
      </div>
    </DashboardLayout>
  );
}