import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMercadeoPageProtection } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import AuthLoadingScreen from '../../components/shared/AuthLoadingScreen';
import '../../styles/Mercadeo/mercadeo-home.css';

// Importar iconos
import iconMisMetas from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import RegistroPDV from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import RankingAsesores from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';

/**
 * Página Home del Dashboard de Mercadeo
 */
export default function MercadeoHome() {
  const navigate = useNavigate();
  
  // Proteger la página - solo mercadeo puede acceder
  const { user, pageReady, shouldShowContent } = useMercadeoPageProtection();

  // console.log('MercadeoHome: Estado de autenticación:', {
  //   user,
  //   pageReady,
  //   shouldShowContent,
  //   userTipo: user?.tipo,
  //   userRol: user?.rol,
  //   userRolId: user?.rol_id
  // });

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!pageReady || !shouldShowContent) {
    //console.log('MercadeoHome: Página no lista o sin contenido visible', { pageReady, shouldShowContent });
    return <AuthLoadingScreen message="Cargando dashboard de mercadeo..." />;
  }

  // Define los tres botones principales para mercadeo
  const botonesMenu = [
    { icon: iconMisMetas, label: 'INFORME SEGUIMIENTO', to: '/mercadeo/informe-seguimiento-dashboard' },
    { icon: RegistroPDV, label: 'GESTIÓN DE REGISTROS', to: '/mercadeo/visitas' },
    { icon: RankingAsesores, label: 'PLAN DE INCENTIVOS', to: '/mercadeo/plan-incentivos' },
  ];

  // Función para manejar clicks en botones
  const handleButtonClick = (btn) => {
    //console.log('🔄 Navegando a:', btn.to);
    navigate(btn.to);
  };

  return (
    <DashboardLayout user={user}>
      <div className="mercadeo-home-navigation-container">
        <div className="mercadeo-home-vertical-menu">
          {botonesMenu.map((btn, index) => (
            <button
              key={btn.label}
              className="mercadeo-home-nav-button"
              onClick={() => handleButtonClick(btn)}
            >
              <div className="mercadeo-home-nav-icon-container">
                <div className="mercadeo-home-nav-icon-circle">
                  <img src={btn.icon} alt={btn.label} className="mercadeo-home-nav-icon" />
                </div>
              </div>
              <span className="mercadeo-home-nav-label">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}