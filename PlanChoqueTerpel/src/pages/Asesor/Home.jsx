import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useHomeNavigation } from '../../hooks/shared';
import { useAsesorRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import NavigationGrid from '../../components/Asesor/Home/NavigationGrid';
import NavigationCarousel from '../../components/Asesor/Home/NavigationCarousel';
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
  // Proteger la ruta - solo asesores pueden acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  const { page, handleNavigation } = useHomeNavigation();
  const { isMobile } = useResponsive();

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Define los botones de navegación - ahora incluye Historial de Registros
  const botonesPaginas = [
    [
      { icon: iconMisMetas, label: 'MIS METAS', to: '/asesor/metas' },
      { icon: RegistroPDV, label: 'REGISTRA TUS PDVS', to: '/asesor/pdvs' },
      { icon: RankingAsesores, label: 'RANKING ASESORES', to: '/asesor/ranking' },
      { icon: CatalogosPlan, label: 'CATÁLOGOS PLAN', to: '/asesor/catalogos' }
    ],
    [
      { icon: PremioMayor, label: 'PREMIO MAYOR', to: '/asesor/premio-mayor' },
      { icon: TyC, label: 'T&C', to: '/asesor/tyc' },
      { icon: RegistroPDV, label: 'HISTORIAL REGISTROS', to: '/asesor/historial-registros' },
      { icon: iconMisMetas, label: 'AYUDA', to: '/asesor/ayuda' }
    ]
  ];

  return (
    <DashboardLayout user={user}>
      {isMobile ? (
        <NavigationCarousel 
          buttonPages={botonesPaginas}
          currentPage={page}
          onNavigate={handleNavigation}
        />
      ) : (
        <NavigationGrid 
          buttons={botonesPaginas[page]}
          onNavigate={handleNavigation}
        />
      )}
    </DashboardLayout>
  );
}