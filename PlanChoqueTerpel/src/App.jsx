import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/Asesor/Metas';
import HomeAsesor from './pages/Asesor/Home';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import Metas from './pages/Asesor/Metas';
import Pdvs from './pages/Asesor/Pdvs';
import Ranking from './pages/Asesor/Ranking';
import Catalogos from './pages/Asesor/Catalogos';
import PremioMayor from './pages/Asesor/PremioMayor';
import TyC from './pages/Asesor/TyC';
import PremiosExtras from './pages/Asesor/PremiosExtras';
import Ayuda from './pages/Asesor/Ayuda';
import { useEffect, useState } from 'react';

function App() {
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
        timeout = setTimeout(handleLogout, 15 * 60 * 1000); // 15 segundos para probar
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
    localStorage.removeItem('user');
    setShowInactiveModal(false);
    window.location.href = '/';
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<HomePage />} />
          <Route path="/asesor/dashboard" element={<DashboardPage />} />
          <Route path="/asesor/home" element={<HomeAsesor />} />
          <Route path="/register" element={<Register />} />
          <Route path="/asesor/metas" element={<Metas />} />
          <Route path="/asesor/pdvs" element={<Pdvs />} />
          <Route path="/asesor/ranking" element={<Ranking />} />
          <Route path="/asesor/catalogos" element={<Catalogos />} />
          <Route path="/asesor/premio-mayor" element={<PremioMayor />} />
          <Route path="/asesor/tyc" element={<TyC />} />
          <Route path="/asesor/premios-extras" element={<PremiosExtras />} />
          <Route path="/asesor/ayuda" element={<Ayuda />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
      {showInactiveModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.92)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: '38px 32px 28px 32px',
            boxShadow: '0 4px 32px #0008',
            textAlign: 'center',
            maxWidth: 340,
            width: '90%'
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

export default App;
