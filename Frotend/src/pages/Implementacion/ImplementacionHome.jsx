import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

import iconMisMetas from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import RegistroPDV from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import RankingAsesores from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';

// Importa el CSS específico de Mistery (reutilizamos el mismo)
import '../../styles/Mistery/mistery-home.css';

export default function ImplementacionHome() {
  const navigate = useNavigate();

  const botones = [
    { icon: iconMisMetas, label: 'REGISTRA IMPLEMENTACIONES', to: '/implementacion/registrar_implementaciones' },
    { icon: RegistroPDV, label: 'HISTÓRICO DE IMPLEMENTACIONES', to: '/implementacion/historial' },
    { icon: RankingAsesores , label: 'EVALUAR IMPLEMENTACIONES', to: '/implementacion/evaluaciones' },
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
