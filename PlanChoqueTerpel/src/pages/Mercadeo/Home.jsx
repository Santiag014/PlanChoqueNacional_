import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMercadeoRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Mercadeo/mercadeo-home-new.css';

// Importar logo de Terpel
// import logoTerpel from '../../assets/Img/logo_terpel.png';

// Renombrar el componente a DashboardAsesor
export default function DashboardAsesor() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useMercadeoRoute();

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // URL del dashboard de PowerBI (puedes cambiar por la URL real)
  const powerBIUrl = "https://app.powerbi.com/view?r=eyJrIjoiNDJhYjNkMDUtZmU5Mi00OWU5LWI0OTgtYjk3YzdmOGJhODNhIiwidCI6Ijk2OWUxYWZhLTM2YWItNGQ5ZS1iYmM2LWU5Y2U3ZWE0N2U5OSIsImMiOjR9";

  return (
    <DashboardLayout user={user}>
      <div className="mercadeo-home-page">
        {/* Banner con imagen de fondo y texto encima - igual al de visitas */}
        <div className="mercadeo-banner">
          <div className="mercadeo-banner-content">
            <h1 className="mercadeo-banner-title">DESEMPEÑO PLAN DE LA MEJOR ENERGÍA</h1>
          </div>
        </div>

        {/* Contenedor del Dashboard PowerBI */}
        <div className="powerbi-container">
          {/* <div className="powerbi-header">
            <h2>Dashboard PowerBI - Jefes de Zona</h2>
          </div> */}
          
          <div className="dashboard-iframe-wrapper">
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando dashboard...</p>
              </div>
            )}
            <iframe
              src={powerBIUrl}
              className="powerbi-iframe"
              title="Dashboard PowerBI Mercadeo"
              onLoad={() => setLoading(false)}
              style={{ display: loading ? 'none' : 'block' }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}