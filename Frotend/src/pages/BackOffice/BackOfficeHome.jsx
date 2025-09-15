import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useBackOfficePageProtection } from '../../hooks/auth';
import AuthLoadingScreen from '../../components/shared/AuthLoadingScreen';
import '../../styles/Backoffice/backoffice-home.css';

export default function BackOfficeHome() {
  const navigate = useNavigate();
  
  // Proteger la página - solo backoffice puede acceder
  const { user, pageReady, shouldShowContent } = useBackOfficePageProtection();

  // Pantalla de carga durante autenticación
  if (!pageReady) {
    return <AuthLoadingScreen message="Verificando acceso..." />;
  }

  // Si no debe mostrar contenido, no renderiza nada (el hook maneja la redirección)
  if (!shouldShowContent) {
    return null;
  }

  const handleNavigateToSection = (route) => {
    navigate(route);
  };

  return (
    <DashboardLayout user={user}>
      <div className="back-office-home">
        <div className="page-header">
          <h1>Bienvenido al BackOffice</h1> <br />
          <p>Sistema de gestión y administración completa del sistema Terpel</p>
        </div>
        
        <div className="content-container">
          <div className="welcome-card">
            <h2>Panel de Control BackOffice</h2>
            <p>Gestiona todos los aspectos del sistema desde una interfaz centralizada.</p>
          </div>

          <div className="backoffice-sections">
            <div className="section-card" onClick={() => handleNavigateToSection('/backoffice/visitas')}>
              <div className="section-icon">📋</div>
              <h3>Gestión de Registros</h3>
              <p>Administra y supervisa todos los registros de visitas y actividades.</p>
              <div className="section-actions">
                <span className="action-text">Ver Registros →</span>
              </div>
            </div>

            <div className="section-card" onClick={() => handleNavigateToSection('/backoffice/usuarios')}>
              <div className="section-icon">👥</div>
              <h3>Gestión de Usuarios</h3>
              <p>Administra usuarios del sistema, roles y permisos.</p>
              <div className="section-actions">
                <span className="action-text">Ver Usuarios →</span>
              </div>
            </div>

            <div className="section-card" onClick={() => handleNavigateToSection('/backoffice/puntos-venta')}>
              <div className="section-icon">🏪</div>
              <h3>Gestión de PDVs</h3>
              <p>Administra puntos de venta y sus configuraciones.</p>
              <div className="section-actions">
                <span className="action-text">Ver PDVs →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
