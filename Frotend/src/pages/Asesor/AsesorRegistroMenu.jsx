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

  const handleGalonajeClick = () => {
    navigate('/asesor/registro-galonaje');
  };

  const handleVisitasClick = () => {
    navigate('/asesor/registro-visitas');
  };

  return (
    <DashboardLayout user={user} pageTitle="REGISTRO IMPLEMENTACIÓN">
      <div className="registro-menu-container">
        <div className="registro-menu-opciones">

          {/* Botón 1: Reportar Galonaje/Precio */}
          <div 
            className="opcion-card"
            onClick={handleGalonajeClick}
          >
            <div className="opcion-icon">
              <img src={IconImplementacion} alt="Registro Galonaje" />
            </div>
            <div className="opcion-content">
              <h3>REPORTAR GALONAJE/PRECIO</h3>
              <p>Registrar volumen de ventas y precios de productos</p>
            </div>
          </div>

          {/* Botón 2: Ver Visitas/Implementación */}
          <div 
            className="opcion-card"
            onClick={handleVisitasClick}
          >
            <div className="opcion-icon">
              <img src={IconImplementacion} alt="Registro Visitas" />
            </div>
            <div className="opcion-content">
              <h3>REGISTRAR VISITAS/IMPLEMENTACIÓN</h3>
              <p>Registrar visitas de seguimiento a PDVs / implementaciones PDVs</p>
            </div>
          </div>

          {/* Botón 3: Historial Común */}
          <div 
            className="opcion-card"
            onClick={handleHistoricoClick}
          >
            <div className="opcion-icon">
              <img src={IconHistorico} alt="Histórico de Registros" />
            </div>
            <div className="opcion-content">
              <h3>HISTORIAL REGISTROS</h3>
              <p>Ver y gestionar todos los registros históricos</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
