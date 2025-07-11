import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useMercadeoRoute } from '../../hooks/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Mercadeo/mercadeo-registros-implementacion.css';

// Importar iconos
import iconMysteryVisita from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import iconRegistrosAprobar from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';

/**
 * Página intermedia para selección de tipo de registros en Mercadeo
 */
export default function MercadeoRegistrosImplementacion() {
  const navigate = useNavigate();
  
  // Proteger la ruta - solo mercadeo puede acceder
  const { user, loading, isAuthenticated, hasRequiredRole } = useMercadeoRoute();

  console.log('MercadeoRegistrosImplementacion: Estado de autenticación:', {
    user,
    loading,
    isAuthenticated,
    hasRequiredRole,
    userTipo: user?.tipo,
    userRol: user?.rol,
    userRolId: user?.rol_id
  });

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    console.log('MercadeoRegistrosImplementacion: Cargando autenticación...');
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Si no está autenticado o no tiene el rol correcto, el hook ya redirigirá
  if (!isAuthenticated || !hasRequiredRole) {
    console.log('MercadeoRegistrosImplementacion: Sin autenticación o permisos', { isAuthenticated, hasRequiredRole });
    return null;
  }

  // Define los dos botones de selección
  const botonesSeleccion = [
    { 
      icon: iconMysteryVisita, 
      label: 'REGISTROS MYSTERY SHOPPER', 
      to: '/mercadeo/mystery-shopper',
      description: 'Ver y gestionar registros de Mystery Shoppers'
    },
    { 
      icon: iconRegistrosAprobar, 
      label: 'REGISTROS POR APROBAR', 
      to: '/mercadeo/visitas',
      description: 'Aprobar visitas y registros pendientes'
    },
  ];

  // Función para manejar clicks en botones
  const handleButtonClick = (btn) => {
    console.log('🔄 Navegando a:', btn.to);
    navigate(btn.to);
  };

  // Función para volver al home
  const handleGoBack = () => {
    navigate('/mercadeo/home');
  };

  return (
    <DashboardLayout user={user}>
      <div className="mercadeo-registros-implementacion-container">
        {/* Contenedor de botones */}
        <div className="mercadeo-registros-implementacion-menu">
          {botonesSeleccion.map((btn, index) => (
            <button
              key={btn.label}
              className="mercadeo-registros-implementacion-button"
              onClick={() => handleButtonClick(btn)}
            >
              <div className="mercadeo-registros-implementacion-icon-container">
                <div className="mercadeo-registros-implementacion-icon-circle">
                  <img src={btn.icon} alt={btn.label} className="mercadeo-registros-implementacion-icon" />
                </div>
              </div>
              <div className="mercadeo-registros-implementacion-text">
                <span className="mercadeo-registros-implementacion-label">{btn.label}</span>
                <span className="mercadeo-registros-implementacion-description">{btn.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
