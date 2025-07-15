import './App.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Visuales Globales
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DebugAuth from './pages/DebugAuth';
import { AuthProvider } from './contexts/AuthContext';

// Visuales para el rol de Asesor
import HomeAsesor from './pages/Asesor/AsesorHome';
import InformeSeguimientoDashboard from './pages/Asesor/AsesorInformeSeguimientoDashboard';
import RegistroImplementacion from './pages/Asesor/AsesorRegistroImplementacion';
import AsesorRegistroMenu from './pages/Asesor/AsesorRegistroMenu';
import Ranking from './pages/Asesor/AsesorRanking';
import HistorialRegistros from './pages/Asesor/AsesorHistorialRegistros';

// Visuales para el rol de MisteryShopper
import HomeMisteryShopper from './pages/Mistery/MisteryShopperHome';
import RegistrarVisitas from './pages/Mistery/MisteryShopperServicios';

// Visuales para el rol de Mercadeo
import HomeMercadeo from './pages/Mercadeo/MercadeoHome'; // Este es el iframe
import GestionVisitas from './pages/Mercadeo/MercadeoVisitas'; // Esta es la gestión de visitas
import MercadeoInformeSeguimientoDashboard from './pages/Mercadeo/MercadeoInformeSeguimientoDashboard';
import MercadeoPlanIncentivos from './pages/Mercadeo/MercadeoPlanIncentivos';
import MercadeoRegistrosImplementacion from './pages/Mercadeo/MercadeoRegistrosImplementacion';
import MercadeoMysteryShopperVisitas from './pages/Mercadeo/MercadeoMysteryShopperVisitas';

// Visuales para el rol de Director y OT
import HomeDirector from './pages/Director/DirectorDashboard';
import HomeOT from './pages/OrganizacionTerpel/OrganizacionTerpelDashboard';

import { useEffect, useState } from 'react';

// Componente interno para manejar la navegación
function AppContent() {
  const navigate = useNavigate();
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
        timeout = setTimeout(handleLogout, 15 * 60 * 1000); // 15 minutos
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/debug-auth" element={<DebugAuth />} />
        
        {/* Rutas del asesor - protegidas */}
        <Route path="/asesor/home" element={<HomeAsesor />} />
        <Route path="/asesor/informe-seguimiento-dashboard" element={<InformeSeguimientoDashboard />} />
        <Route path="/asesor/registro-menu" element={<AsesorRegistroMenu />} />
        <Route path="/asesor/registro-implementacion" element={<RegistroImplementacion />} />
        <Route path="/asesor/historico-registros" element={<HistorialRegistros />} />
        <Route path="/asesor/plan-incentivos" element={<Ranking />} />

        {/* Rutas del mystery shopper - protegidas */}
        <Route path="/misteryShopper/home" element={<HomeMisteryShopper />} />
        <Route path="/misteryShopper/registrar_visitas" element={<RegistrarVisitas />} />

        {/* Rutas del mercadeo - protegidas */}
        <Route path="/mercadeo/home" element={<HomeMercadeo />} />
        <Route path="/mercadeo/visitas" element={<GestionVisitas />} />
        <Route path="/mercadeo/informe-seguimiento-dashboard" element={<MercadeoInformeSeguimientoDashboard />} />
        <Route path="/mercadeo/plan-incentivos" element={<MercadeoPlanIncentivos />} />
        <Route path="/mercadeo/registros-implementacion" element={<MercadeoRegistrosImplementacion />} />
        <Route path="/mercadeo/mystery-shopper-visitas" element={<MercadeoMysteryShopperVisitas />} />

        {/* Rutas del Directoy y OT - protegidas */}
        <Route path="/director-zona/home" element={<HomeDirector />} />
        <Route path="/organizacion-terpel/home" element={<HomeOT />} />
        
        {/* Ruta por defecto */}
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
