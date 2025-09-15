import React, { useEffect, useState, Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Importar utilidades de modo nocturno
import { inicializarSistemaModoNocturno } from './utils/modoNocturno';

// Importar Analytics
import { useAnalytics } from './hooks/useAnalytics';
import { initGA } from './utils/analytics/analytics';

// Visuales Globales
import HomePage from './pages/HomePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { AuthProvider } from './contexts/AuthContext';
import SecurityAlerts, { useSecurityAlert } from './components/SecurityAlerts';

// Componente de protección de rutas
import ProtectedRoute, { 
  AsesorRoute, 
  MercadeoRoute, 
  DirectorRoute, 
  OTRoute,
  BackOfficeRoute,
  MysteryShopperRoute
  // ImplementacionRoute // DESHABILITADO TEMPORALMENTE
} from './components/ProtectedRoute';

// Visuales para el rol de Asesor
import HomeAsesor from './pages/Asesor/AsesorHome';
import InformeSeguimientoDashboard from './pages/Asesor/AsesorInformeSeguimientoDashboard';
import RegistroImplementacion from './pages/Asesor/AsesorRegistroImplementacion';
import RegistroGalonaje from './pages/Asesor/AsesorRegistroGalonaje';
import RegistroVisitas from './pages/Asesor/AsesorRegistroVisitas';
import AsesorRegistroMenu from './pages/Asesor/AsesorRegistroMenu';
import Ranking from './pages/Asesor/AsesorRanking';
import HistorialRegistros from './pages/Asesor/AsesorHistorialRegistros';
import ResultadosAuditorias from './pages/Asesor/AsesorResultadosAuditorias';

// Visuales para el rol de Mercadeo
import MercadeoInformeSeguimientoDashboard from './pages/Mercadeo/MercadeoInformeSeguimientoDashboard';
import HomeMercadeo from './pages/Mercadeo/MercadeoHome'; // Este es el iframe
import GestionVisitas from './pages/Mercadeo/MercadeoVisitas'; // Esta es la gestión de visitas
import MercadeoPlanIncentivos from './pages/Mercadeo/MercadeoPlanIncentivos';

// Visuales para el rol de Director y OT
import HomeDirector from './pages/Director/DirectorDashboard';
import BulkUploadPage from './pages/Director/BulkUploadPage';
import HomeOT from './pages/OrganizacionTerpel/OrganizacionTerpelDashboard';

// Visuales para el rol de BackOffice
import HomeBackOffice from './pages/BackOffice/BackOfficeHome';
import BackOfficeVisitas from './pages/BackOffice/BackOfficeVisitas';
import BackOfficeUsuarios from './pages/BackOffice/BackOfficeUsuarios';
import BackOfficePuntosVenta from './pages/BackOffice/BackOfficePuntosVenta';

// Visuales para el rol de Mystery Shopper
import MisteryShopperHome from './pages/Mistery/MisteryShopperHome';
import MisteryShopperServicios from './pages/Mistery/MisteryShopperServicios';
import MisteryShopperHistorial from './pages/Mistery/MisteryShopperHistorial';
import MisteryShopperDetalleHallazgo from './pages/Mistery/MisteryShopperDetalleHallazgo';

// Visuales para el rol de Jefe de Zona (rol 5 con verificación especial)
import JefeZonaRegistroVisitas from './pages/OrganizacionTerpel/JefeZona/JefeZonaRegistroVisitas';
import JefeZonaHistorial from './pages/OrganizacionTerpel/JefeZona/JefeZonaHistorial';

// Visuales para el rol de Implementación - DESHABILITADO TEMPORALMENTE
// import ImplementacionHome from './pages/Implementacion/ImplementacionHome';
// import ImplementacionServicios from './pages/Implementacion/ImplementacionServicios';


const MercadeoPowerBILazy = React.lazy(() => import('./pages/Mercadeo/MercadeoPowerBI'));
const OTPowerBILazy = React.lazy(() => import('./pages/OrganizacionTerpel/OTPowerBI'));
const DiagnosticoPowerBILazy = React.lazy(() => import('./pages/DiagnosticoPowerBI'));

// Componente interno para manejar la navegación
function AppContent() {
  const navigate = useNavigate();
  const { alerts, removeAlert } = useSecurityAlert();
  // Inicializar analytics para rastrear navegación
  const analytics = useAnalytics();
  
  // Estado para mostrar el popup de inactividad
  const [showInactiveModal, setShowInactiveModal] = useState(false);

  // Sesión expira tras 15 minutos de inactividad
  useEffect(() => {
    let timeout;
    const handleLogout = () => {
      setShowInactiveModal(true);
    };
    const resetTimer = () => {
      clearTimeout(timeout);
      if (!showInactiveModal) {
        timeout = setTimeout(handleLogout, 30 * 60 * 1000); // 15 minutos
      }
    };
    // Eventos de actividad
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
    // eslint-disable-next-line
  }, [showInactiveModal]);

  const handleModalClose = () => {
    // Agregar una pequeña transición antes de cerrar
    setShowInactiveModal(false);
    
    setTimeout(() => {
      // Limpiar completamente todo tipo de datos de sesión
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpiar cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Redirigir y recargar
      navigate('/', { replace: true });
      window.location.href = '/';
    }, 300);
  };

  return (
    <>
      {/* Alertas de seguridad globales */}
      <SecurityAlerts alerts={alerts} onRemove={removeAlert} />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<HomePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* 🔒 RUTAS PROTEGIDAS DEL ASESOR */}
        <Route path="/asesor/home" element={
          <AsesorRoute>
            <HomeAsesor />
          </AsesorRoute>
        } />
        <Route path="/asesor/informe-seguimiento-dashboard" element={
          <AsesorRoute>
            <InformeSeguimientoDashboard />
          </AsesorRoute>
        } />
        <Route path="/asesor/registro-menu" element={
          <AsesorRoute>
            <AsesorRegistroMenu />
          </AsesorRoute>
        } />
        <Route path="/asesor/registro-implementacion" element={
          <AsesorRoute>
            <RegistroImplementacion />
          </AsesorRoute>
        } />
        <Route path="/asesor/registro-galonaje" element={
          <AsesorRoute>
            <RegistroGalonaje />
          </AsesorRoute>
        } />
        <Route path="/asesor/registro-visitas" element={
          <AsesorRoute>
            <RegistroVisitas />
          </AsesorRoute>
        } />
        <Route path="/asesor/historico-registros" element={
          <AsesorRoute>
            <HistorialRegistros />
          </AsesorRoute>
        } />
        <Route path="/asesor/resultados-auditorias" element={
          <AsesorRoute>
            <ResultadosAuditorias />
          </AsesorRoute>
        } />
        <Route path="/asesor/plan-incentivos" element={
          <AsesorRoute>
            <Ranking />
          </AsesorRoute>
        } />

        {/* 🔒 RUTAS PROTEGIDAS DEL MYSTERY SHOPPER */}
        <Route path="/misteryShopper" element={
          <MysteryShopperRoute>
            <MisteryShopperHome />
          </MysteryShopperRoute>
        } />
        <Route path="/misteryShopper/home" element={
          <MysteryShopperRoute>
            <MisteryShopperHome />
          </MysteryShopperRoute>
        } />
        <Route path="/misteryShopper/registrar_visitas" element={
          <MysteryShopperRoute>
            <MisteryShopperServicios />
          </MysteryShopperRoute>
        } />
        <Route path="/misteryShopper/historial" element={
          <MysteryShopperRoute>
            <MisteryShopperHistorial />
          </MysteryShopperRoute>
        } />
        <Route path="/misteryShopper/detalle-hallazgo/:hallazgoId" element={
          <MysteryShopperRoute>
            <MisteryShopperDetalleHallazgo />
          </MysteryShopperRoute>
        } />

        {/* 🔒 RUTAS PROTEGIDAS DE IMPLEMENTACIÓN - DESHABILITADO TEMPORALMENTE */}
        {/* <Route path="/implementacion/home" element={
          <ImplementacionRoute>
            <ImplementacionHome />
          </ImplementacionRoute>
        } />
        <Route path="/implementacion/registrar_implementaciones" element={
          <ImplementacionRoute>
            <ImplementacionServicios />
          </ImplementacionRoute>
        } /> */}

        {/* 🔒 RUTAS PROTEGIDAS DEL MERCADEO */}
        <Route path="/mercadeo/home" element={
          <MercadeoRoute>
            <HomeMercadeo />
          </MercadeoRoute>
        } />
        <Route path="/mercadeo/informe-seguimiento-dashboard" element={
          <MercadeoRoute>
            <MercadeoInformeSeguimientoDashboard />
          </MercadeoRoute>
        } />
        <Route path="/mercadeo/visitas" element={
          <MercadeoRoute>
            <GestionVisitas />
          </MercadeoRoute>
        } />
        <Route path="/mercadeo/plan-incentivos" element={
          <MercadeoRoute>
            <MercadeoPlanIncentivos />
          </MercadeoRoute>
        } />
        {/* 🔒 NUEVA RUTA POWER BI MERCADEO */}
        <Route path="/mercadeo/powerbi" element={
          <MercadeoRoute>
            <Suspense fallback={<div>Cargando...</div>}>
              <MercadeoPowerBILazy />
            </Suspense>
          </MercadeoRoute>
        } />

        {/* 🔒 RUTAS PROTEGIDAS DEL DIRECTOR */}
        <Route path="/director-zona/home" element={
          <DirectorRoute>
            <HomeDirector />
          </DirectorRoute>
        } />
        <Route path="/director-zona/carga-masiva" element={
          <DirectorRoute>
            <BulkUploadPage />
          </DirectorRoute>
        } />

        {/* 🔒 RUTAS PROTEGIDAS DE ORGANIZACIÓN TERPEL */}
        <Route path="/organizacion-terpel/home" element={
          <OTRoute>
            <HomeOT />
          </OTRoute>
        } />
        {/* 🔒 NUEVA RUTA POWER BI OT */}
        <Route path="/organizacion-terpel/powerbi" element={
          <OTRoute>
            <Suspense fallback={<div>Cargando...</div>}>
              <OTPowerBILazy />
            </Suspense>
          </OTRoute>
        } />

        {/* 🔒 RUTAS PROTEGIDAS DE JEFE DE ZONA */}
        <Route path="/organizacion-terpel/registro-visitas" element={
          <OTRoute>
            <JefeZonaRegistroVisitas />
          </OTRoute>
        } />
        <Route path="/organizacion-terpel/historial-visitas" element={
          <OTRoute>
            <JefeZonaHistorial />
          </OTRoute>
        } />
        
        {/* 🔧 RUTA TEMPORAL DE DIAGNÓSTICO POWERBI */}
        <Route path="/diagnostico-powerbi" element={
          <Suspense fallback={<div>Cargando...</div>}>
            <DiagnosticoPowerBILazy />
          </Suspense>
        } />

        {/* 🔒 RUTAS PROTEGIDAS DE BACKOFFICE */}
        <Route path="/backoffice/home" element={
          <BackOfficeRoute>
            <HomeBackOffice />
          </BackOfficeRoute>
        } />
        <Route path="/backoffice/visitas" element={
          <BackOfficeRoute>
            <BackOfficeVisitas />
          </BackOfficeRoute>
        } />
        <Route path="/backoffice/usuarios" element={
          <BackOfficeRoute>
            <BackOfficeUsuarios />
          </BackOfficeRoute>
        } />
        <Route path="/backoffice/puntos-venta" element={
          <BackOfficeRoute>
            <BackOfficePuntosVenta />
          </BackOfficeRoute>
        } />
        
        {/* Ruta por defecto - redirige al login */}
        <Route path="*" element={<HomePage />} />
      </Routes>
      
      {showInactiveModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.92)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: '38px 32px 28px 32px',
            boxShadow: '0 4px 32px #0008',
            textAlign: 'center',
            maxWidth: 340,
            width: '90%',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#e30613', marginBottom: 12 }}>
              ¡Opss!
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 10 }}>
              Parece que estás inactivo...
            </div>
            <div style={{ fontSize: 15, color: '#888', marginBottom: 24 }}>
              Inicia sesión de nuevo por favor.
            </div>
            <button
              onClick={handleModalClose}
              style={{
                background: '#e30613',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                padding: '10px 38px',
                cursor: 'pointer'
              }}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  // Inicializar sistema de modo nocturno al cargar la aplicación
  useEffect(() => {
    inicializarSistemaModoNocturno();
    // Inicializar Google Analytics
    initGA();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;