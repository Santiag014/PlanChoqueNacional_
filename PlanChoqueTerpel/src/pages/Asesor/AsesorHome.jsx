import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Asesor/asesor-home.css';

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

  // Define los 5 botones con el 5to en el centro
  const botonesPaginas = [
    [
      { icon: iconMisMetas, label: 'INFORME SEGUIMIENTO', to: '/asesor/informe-seguimiento-dashboard' },
      { icon: RegistroPDV, label: 'REGISTRO IMPLEMENTACIÓN', to: '/asesor/registro-menu' },
      { icon: RankingAsesores, label: 'PLAN DE INCENTIVOS', to: '/asesor/plan-incentivos' },
      { icon: PremioMayor, label: 'RESULTADOS AUDITORIA', to: '/asesor/home' },
      { empty: true }, // Espacio vacío
    ],
  ];

  // Función para manejar clicks en botones
  const handleButtonClick = (btn) => {
    console.log('🔄 Navegando a:', btn.to);
    navigate(btn.to);
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
      </div>
    </DashboardLayout>
  );
}