import React, { useState } from 'react';
import '../styles/Asesor/login.css';
import logoTerpel from '../assets/Iconos/IconosPage/logoTerpel.png';
import { API_URL } from '../config';

function HomePage() {
  // Estado para el login
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [dataChecked, setDataChecked] = useState(false); // Nuevo estado para el checkbox

  // Mapea el número de rol a string de rol
  const getRolString = (rolNum) => {
    if (rolNum === 1) return 'ASESOR';
    if (rolNum === 2) return 'MYSTERY_SHOPPER';
    // Agrega más si tienes más roles
    return 'ASESOR';
  };

  // Navegación manual (sin useNavigate)
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!dataChecked) {
      setError('Debes aceptar el tratamiento de datos para continuar.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        // Guarda el usuario y rol en localStorage/sessionStorage
        const userWithRolString = {
          ...data.user,
          rol: getRolString(data.user.rol)
        };
        window.localStorage.setItem('user', JSON.stringify(userWithRolString));
        // Redirige según el rol
        if (userWithRolString.rol === 'ASESOR') {
          window.location.href = '/asesor/home';
        } else if (userWithRolString.rol === 'MYSTERY_SHOPPER') {
          window.location.href = '/misteryShopper/home';
        }
        // ...puedes agregar más roles aquí si es necesario...
      } else {
        setError(data.message || 'Error de autenticación');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="login-bg">
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
                tabIndex={0}
              >
                INGRESAR
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