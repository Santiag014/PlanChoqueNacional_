import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Asesor/asesor-registro-menu.css';

// Iconos
import IconHistorico from '../../assets/Iconos/IconosPage/Icono_Page_Historico_Registro.png';
import IconImplementacion from '../../assets/Iconos/IconosPage/iconos_Page_Evaluar.png';

export default function AsesorRegistroMenu() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  const handleHistoricoClick = () => {
    navigate('/asesor/historico-registros');
  };

  const handleImplementacionClick = () => {
    navigate('/asesor/registro-implementacion');
  };

  return (
    <DashboardLayout user={user} pageTitle="REGISTRO IMPLEMENTACIÓN">
      <div className="registro-menu-container">
        <div className="registro-menu-opciones">


          <div 
            className="opcion-card"
            onClick={handleImplementacionClick}
          >
            <div className="opcion-icon">
              <img src={IconImplementacion} alt="Registro Implementación" />
            </div>
            <div className="opcion-content">
              <h3>REGISTRAR IMPLEMENTACIONES</h3>
              <p>Crear nuevos registros de implementaciones</p>
            </div>
          </div>

          <div 
            className="opcion-card"
            onClick={handleHistoricoClick}
          >
            <div className="opcion-icon">
              <img src={IconHistorico} alt="Histórico de Registros" />
            </div>
            <div className="opcion-content">
              <h3>HISTÓRICO DE IMPLEMENTACIONES</h3>
              <p>Ver y gestionar registros históricos de implementaciones</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
