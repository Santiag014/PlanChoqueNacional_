import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Asesor/home.css';

// Importar iconos
import iconMisMetas from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import RegistroPDV from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import RankingAsesores from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';
import CatalogosPlan from '../../assets/Iconos/IconosPage/Icono_Page_Catalogos.png';
import PremioMayor from '../../assets/Iconos/IconosPage/Icono_Page_PremioMayor.png';
import TyC from '../../assets/Iconos/IconosPage/Icono_Page_T&C.png';

/**
 * Página Home del Dashboard del Asesor
 */
export default function DashboardAsesor() {
  const navigate = useNavigate();
  const [paginaActual, setPaginaActual] = useState(0);
  const [animatingPage, setAnimatingPage] = useState(false);
  
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Define los botones en 2 páginas de 6 botones cada una (2x3)
  const botonesPaginas = [
    [
      { icon: iconMisMetas, label: 'MIS METAS', to: '/asesor/metas' },
      { icon: RegistroPDV, label: 'REGISTRA TUS PDVS', to: '/asesor/pdvs' },
      { icon: RankingAsesores, label: 'RANKING ASESORES', to: '/asesor/ranking' },
      { icon: CatalogosPlan, label: 'CATÁLOGOS PLAN', to: '/asesor/catalogos' },
      { icon: PremioMayor, label: 'PREMIO MAYOR', to: '/asesor/premio-mayor' },
      { icon: TyC, label: 'T&C', to: '/asesor/tyc' }
    ],
    [
      { icon: RegistroPDV, label: 'HISTORIAL REGISTROS', to: '/asesor/historial-registros' },
      { icon: iconMisMetas, label: 'AYUDA', to: '/asesor/ayuda' },
      // Botones vacíos para mantener la estructura 2x3
      { icon: null, label: '', to: '', empty: true },
      { icon: null, label: '', to: '', empty: true },
      { icon: null, label: '', to: '', empty: true },
      { icon: null, label: '', to: '', empty: true }
    ]
  ];

  const handleNavigation = (direccion) => {
    if (animatingPage) return;
    
    setAnimatingPage(true);
    
    if (direccion === 'siguiente' && paginaActual < botonesPaginas.length - 1) {
      setPaginaActual(paginaActual + 1);
    } else if (direccion === 'anterior' && paginaActual > 0) {
      setPaginaActual(paginaActual - 1);
    }
    
    setTimeout(() => setAnimatingPage(false), 300);
  };

  const handleCarouselNavigation = (index) => {
    if (animatingPage || index === paginaActual) return;
    
    setAnimatingPage(true);
    setPaginaActual(index);
    setTimeout(() => setAnimatingPage(false), 300);
  };

  // Función para manejar navegación con debug
  const handleButtonClick = (btn) => {
    if (btn.to) {
      // console.log('Navegando a:', btn.to);
      navigate(btn.to);
    } else {
      // console.log('Botón sin ruta definida');
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="home-navigation-container">
        <div className={`home-navigation-grid ${animatingPage ? 'page-transition' : ''}`}>
          {botonesPaginas[paginaActual].map((btn, index) => (
            btn.empty ? (
              <div key={index} className="home-nav-button-empty"></div>
            ) : (
              <button
                key={btn.label}
                className="home-nav-button"
                onClick={() => handleButtonClick(btn)}
              >
                <div className="home-nav-icon-container">
                  <div className="home-nav-icon-circle">
                    <img src={btn.icon} alt={btn.label} className="home-nav-icon" />
                  </div>
                </div>
                <span className="home-nav-label">{btn.label}</span>
              </button>
            )
          ))}
        </div>

        {/* Navegación por puntos simple - como en las imágenes */}
        <div className="home-page-dots">
          {botonesPaginas.map((_, index) => (
            <div
              key={index}
              className={`home-dot ${index === paginaActual ? 'active' : ''}`}
              onClick={() => handleCarouselNavigation(index)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}