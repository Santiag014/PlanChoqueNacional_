import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

import iconMisMetas from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import RegistroPDV from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import RankingAsesores from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';

// Importa el CSS específico de Mistery
import '../../styles/Mistery/mistery-home.css';

// Renombrar el componente a DashboardAsesor
export default function DashboardAsesor() {
  const navigate = useNavigate();

  const botones = [
    { icon: iconMisMetas, label: 'REGISTRA TUS VISITAS', to: '/misteryShopper/registrar_visitas' },
    { icon: RegistroPDV, label: 'HISTÓRICO DE REGISTROS', to: '/misteryShopper/historial' },
    { icon: RankingAsesores , label: 'EVALUAR LOS PDV', to: '/asesor/ranking' },
  ];

  return (
    <DashboardLayout>
      <div className="mistery-dashboard-root">
        <div className="mistery-dashboard-center">
          <div className="mistery-btn-container">
            {botones.map((btn) => (
              <div
                key={btn.label}
                className="mistery-btn"
                onClick={() => navigate(btn.to)}
              >
                <div className="mistery-btn-inner">
                  <div className="mistery-btn-icon">
                    <img src={btn.icon} alt={btn.label} />
                  </div>
                </div>
                <span className="mistery-btn-label">{btn.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}