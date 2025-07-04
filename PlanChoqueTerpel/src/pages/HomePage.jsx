import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import EmergencyCleanup from '../components/EmergencyCleanup';
import '../styles/Asesor/login.css';
import logoTerpel from '../assets/Iconos/IconosPage/logoTerpel.png';

function HomePage() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, login } = useAuthContext();
  
  // Estado para el login
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    // Verificar si hay datos de sesión residuales y limpiarlos si es necesario
    const checkAndCleanSession = () => {
      if (isAuthenticated()) {
        const userRole = currentUser?.tipo || currentUser?.rol;
        //console.log('Usuario autenticado detectado, rol:', userRole);
        
        if (userRole === 'ASESOR' || userRole === 'asesor' || userRole === 1) {
          navigate('/asesor/home', { replace: true });
        } else if (userRole === 'MYSTERY_SHOPPER' || userRole === 'mystery_shopper' || userRole === 2) {
          navigate('/misteryShopper/home', { replace: true });
        } else if (userRole === 'MERCADEO_AC' || userRole === 'mercadeo_ac' || userRole === 3 || userRole === 4) {
          navigate('/mercadeo/home', { replace: true });
        } else {
          //console.log('Rol no reconocido:', userRole);
          // Si no reconoce el rol, hacer logout y limpiar
          localStorage.clear();
          sessionStorage.clear();
        }
      } else {
        // Si no está autenticado pero hay datos residuales, limpiar
        const hasResidualData = localStorage.getItem('user') || 
                               localStorage.getItem('authToken') ||
                               sessionStorage.length > 0;
        
        if (hasResidualData) {
          //console.log('Limpiando datos residuales de sesión...');
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    };

    checkAndCleanSession();
  }, [isAuthenticated, currentUser, navigate]);

  // Función de login usando el contexto
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    if (!dataChecked) {
      setError('Debes aceptar el tratamiento de datos para continuar.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Usar el login del contexto de autenticación
      const result = await login({ email: user, password: pass });
      
      if (result.success) {
        setIsLoginSuccess(true);
        
        // Esperar un poco para mostrar el éxito
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Redirigir según el rol del usuario
        const userRole = result.user.tipo || result.user.rol;
        console.log('Login exitoso, redirigiendo usuario con rol:', userRole);
        console.log('Datos completos del usuario:', result.user);
        
        if (userRole === 'ASESOR' || userRole === 'asesor' || userRole === 1) {
          //console.log('Redirigiendo a /asesor/home');
          navigate('/asesor/home', { replace: true });
        } else if (userRole === 'MYSTERY_SHOPPER' || userRole === 'mystery_shopper' || userRole === 2) {
          // console.log('Redirigiendo a /misteryShopper/home');
          navigate('/misteryShopper/home', { replace: true });
        } else if (userRole === 'MERCADEO_AC' || userRole === 'mercadeo_ac' || userRole === 3 || userRole === 4) {
          console.log('Redirigiendo a /mercadeo/home');
          navigate('/mercadeo/home', { replace: true });
        } else {
          console.error('Rol no reconocido después del login:', userRole);
          setError('Rol de usuario no válido');
          setIsLoginSuccess(false);
        }
      } else {
        setError(result.error || 'Error de autenticación');
        setIsLoginSuccess(false);
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión');
      setIsLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <EmergencyCleanup />
      
      {/* Modal de login exitoso */}
      {isLoginSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.4s ease-out',
            minWidth: 280
          }}>
            <div style={{
              width: 60,
              height: 60,
              background: '#28a745',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              animation: 'checkmark 0.6s ease-in-out'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{
              color: '#28a745',
              fontSize: 18,
              fontWeight: 'bold',
              margin: '0 0 8px 0'
            }}>
              ¡Bienvenido!
            </h3>
            <p style={{
              color: '#666',
              fontSize: 14,
              margin: 0
            }}>
              Ingresando al sistema...
            </p>
          </div>
        </div>
      )}

      <div className="login-center-area">
        <div className="login-frame enhanced-login-frame">
          <div className="login-content enhanced-login-content">
            <div className="login-left enhanced-login-left">
              <div className="login-titles enhanced-login-titles">
                {/* Logo solo visible en móvil */}
                <img
                  src={logoTerpel}
                  alt="Terpel"
                  className="logo-terpel logo-terpel-mobile"
                />
                <span className="visionarios-mordida">VISIONARIOS DE LA</span>
                <span className="visionarios-mejor">MEJOR</span>
                <span className="visionarios-energia">ENERGÍA</span>
                <span className="visionarios-meta">JUNTOS LLEGAREMOS A LA META</span>
                {/* Logo solo visible en escritorio */}
                <img
                  src={logoTerpel}
                  alt="Terpel"
                  className="logo-terpel logo-terpel-desktop"
                />
              </div>
            </div>
            <div className="login-right enhanced-login-right">
              <form className="login-form horizontal-login-form" onSubmit={handleSubmit} autoComplete="on">
                <div className="form-group">
                  <label htmlFor="user">CÓDIGO DE USUARIO</label>
                  <input
                    type="text"
                    id="user"
                    name="user"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    required
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pass">CONTRASEÑA</label>
                  <input
                    type="password"
                    id="pass"
                    name="pass"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="data"
                    name="data"
                    checked={dataChecked}
                    onChange={e => {
                      setDataChecked(e.target.checked);
                      if (e.target.checked && error === 'Debes aceptar el tratamiento de datos para continuar.') {
                        setError('');
                      }
                    }}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="data" className="checkbox-label">TRATAMIENTO DE DATOS</label>
                </div>
                {error && (
                  <div className="login-error">{error}</div>
                )}
              </form>
              <button
                type="submit"
                className="login-btn login-btn-outside"
                onClick={handleSubmit}
                disabled={loading}
                tabIndex={0}
              >
                {loading ? 'INGRESANDO...' : 'INGRESAR'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <footer>
        <div className="footer-content">
          <span className="footer-text">
            © TERPEL 2025. TODOS LOS DERECHOS RESERVADOS.
          </span>
          <span className="footer-logo">
            <img src={logoTerpel} alt="Terpel" className="logo-footer" />
          </span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;