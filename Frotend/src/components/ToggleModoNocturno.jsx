import React, { useState, useEffect } from 'react';
import { 
  obtenerEstadoModoNocturno, 
  alternarModoNocturno, 
  arreglarInputsFecha 
} from '../utils/modoNocturno';

/**
 * Componente de botón para alternar entre modo claro y oscuro
 * 
 * Uso:
 * <ToggleModoNocturno />
 * 
 * O con props personalizadas:
 * <ToggleModoNocturno 
 *   showText={true} 
 *   className="mi-clase-personalizada"
 *   style={{ position: 'fixed', top: '20px', right: '20px' }}
 * />
 */
const ToggleModoNocturno = ({ 
  showText = false, 
  className = '', 
  style = {},
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [modoNocturno, setModoNocturno] = useState(obtenerEstadoModoNocturno);

  useEffect(() => {
    // Sincronizar estado con cambios externos
    const handleStorageChange = () => {
      setModoNocturno(obtenerEstadoModoNocturno());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggle = () => {
    const nuevoEstado = alternarModoNocturno();
    setModoNocturno(nuevoEstado);
    
    // Arreglar inputs de fecha después del cambio
    setTimeout(() => {
      arreglarInputsFecha();
    }, 100);
  };

  // Estilos base del botón
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 20px' : '8px 16px',
    backgroundColor: modoNocturno ? '#2d2d2d' : '#ffffff',
    color: modoNocturno ? '#ffffff' : '#333333',
    border: `2px solid ${modoNocturno ? '#444444' : '#e5e7eb'}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    fontWeight: '600',
    userSelect: 'none',
    outline: 'none',
    ...style
  };

  const hoverStyles = {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${modoNocturno ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  return (
    <button
      onClick={handleToggle}
      className={`modo-nocturno-toggle ${className}`}
      style={baseStyles}
      onMouseEnter={(e) => {
        Object.assign(e.target.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.target.style, baseStyles);
      }}
      title={`Cambiar a modo ${modoNocturno ? 'claro' : 'oscuro'}`}
      aria-label={`Activar modo ${modoNocturno ? 'claro' : 'oscuro'}`}
    >
      {/* Icono */}
      <span style={{ fontSize: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px' }}>
        {modoNocturno ? '☀️' : '🌙'}
      </span>
      
      {/* Texto opcional */}
      {showText && (
        <span>
          {modoNocturno ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
};

/**
 * Componente más avanzado con switch animado
 */
export const SwitchModoNocturno = ({ 
  className = '', 
  style = {},
  showLabels = true 
}) => {
  const [modoNocturno, setModoNocturno] = useState(obtenerEstadoModoNocturno);

  useEffect(() => {
    const handleStorageChange = () => {
      setModoNocturno(obtenerEstadoModoNocturno());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggle = () => {
    const nuevoEstado = alternarModoNocturno();
    setModoNocturno(nuevoEstado);
    setTimeout(() => arreglarInputsFecha(), 100);
  };

  const switchStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...style
  };

  const trackStyles = {
    width: '50px',
    height: '24px',
    backgroundColor: modoNocturno ? '#e31e24' : '#e5e7eb',
    borderRadius: '12px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    border: 'none',
    outline: 'none'
  };

  const thumbStyles = {
    width: '20px',
    height: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: modoNocturno ? '28px' : '2px',
    transition: 'left 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };

  const labelStyles = {
    fontSize: '14px',
    fontWeight: '500',
    color: modoNocturno ? '#ffffff' : '#374151',
    userSelect: 'none'
  };

  return (
    <div className={`switch-modo-nocturno ${className}`} style={switchStyles}>
      {showLabels && (
        <span style={labelStyles}>
          ☀️ Claro
        </span>
      )}
      
      <button
        onClick={handleToggle}
        style={trackStyles}
        aria-label={`Cambiar a modo ${modoNocturno ? 'claro' : 'oscuro'}`}
        title={`Activar modo ${modoNocturno ? 'claro' : 'oscuro'}`}
      >
        <div style={thumbStyles} />
      </button>
      
      {showLabels && (
        <span style={labelStyles}>
          🌙 Oscuro
        </span>
      )}
    </div>
  );
};

/**
 * Hook personalizado para usar en otros componentes
 */
export const useModoNocturno = () => {
  const [modoNocturno, setModoNocturno] = useState(obtenerEstadoModoNocturno);

  const alternar = () => {
    const nuevoEstado = alternarModoNocturno();
    setModoNocturno(nuevoEstado);
    setTimeout(() => arreglarInputsFecha(), 100);
    return nuevoEstado;
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setModoNocturno(obtenerEstadoModoNocturno());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { modoNocturno, alternar };
};

export default ToggleModoNocturno;
