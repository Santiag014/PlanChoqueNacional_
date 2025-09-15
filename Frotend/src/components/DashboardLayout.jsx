/**
 * @fileoverview Componente de Layout principal del dashboard
 * 
 * Proporciona la estructura base para todas las páginas del dashboard incluyendo:
 * - Header con información del usuario y logout
 * - Menú lateral responsivo con navegación por rol
 * - Área de contenido principal
 * - Gestión de estados de móvil vs desktop
 * - Integración con WhatsApp para soporte
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

// ============================================
// COMPONENTE PRINCIPAL DEL DASHBOARD LAYOUT
// ============================================

/**
 * Layout principal para el dashboard, adaptativo a escritorio y móvil.
 * Gestiona menú lateral, navegación, roles y accesos rápidos.
 * 
 * Características principales:
 * - Responsive design (adapta entre móvil y desktop)
 * - Menú lateral colapsible por rol de usuario
 * - Header con información del usuario autenticado
 * - Botón de logout con confirmación
 * - Integración con WhatsApp para soporte técnico
 * - Detección automática de rol y permisos
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} [props.user] - Usuario autenticado (opcional, puede venir de localStorage)
 * @param {React.ReactNode} props.children - Contenido a renderizar en el área principal
 * @returns {JSX.Element} Estructura completa del dashboard
 */
export default function DashboardLayout({ user, children }) {
  // ============================================
  // ESTADOS LOCALES DEL COMPONENTE
  // ============================================
  
  /**
   * Estado para controlar la visibilidad del menú lateral en móviles
   * @type {boolean}
   */
  const [showMenu, setShowMenu] = useState(false);

  /**
   * Estado para manejar errores en la apertura de WhatsApp
   * @type {string}
   */
  const [waError, setWaError] = useState('');

  /**
   * Estado para controlar el proceso de logout (mostrar loading)
   * @type {boolean}
   */
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ============================================
  // HOOKS DE NAVEGACIÓN Y CONTEXTO
  // ============================================
  
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthContext();

  // ============================================
  // OBTENCIÓN Y NORMALIZACIÓN DE USUARIO
  // ============================================
  
  /**
   * Función para obtener usuario desde localStorage de forma segura
   * Maneja errores de JSON parsing y valores nulos
   */
  const userFromStorage = (() => {
    try {
// Pega esto en la consola del navegador
      //console.log('localStorage user:', JSON.parse(localStorage.getItem('user')));
      return JSON.parse(window.localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  /**
   * Usuario final combinando props y localStorage
   * Prioriza el usuario pasado por props sobre el de localStorage
   */
  const userObj = user || userFromStorage || {};
  
  /**
   * Normalización del rol del usuario
   * Convierte IDs numéricos a strings legibles y maneja múltiples formatos
   */
  let rol = userObj.rol || userObj.tipo || 'ASESOR';
  let IsPromotoria = userObj.IsPromotoria;
  
  // Normalizar el rol a string
  if (rol === 1) {
    rol = 'ASESOR';
  } else if (rol === 2) {
    rol = 'MYSTERY_SHOPPER';
  } else if (rol === 3) {
    rol = 'MERCADEO_AC';
  } else if (rol === 4) {
    rol = 'DIRECTOR';
  } else if (rol === 5) {
    rol = 'ORGANIZACION_TERPEL';
  } else if (rol === 6) {
    rol = 'BACKOFFICE';
  }

  // Validación adicional para PROMOTORIA (DESPUÉS de normalizar)
  // Si el usuario tiene IsPromotoria = 1 y es ASESOR, cambiar a PROMOTORIA
  if (IsPromotoria === 1 && rol === 'ASESOR') {
    rol = 'PROMOTORIA';
  }

  // Si quieres que solo le aparezca a un rol específico (por ejemplo, solo a ASESOR):
  const showWhatsApp = rol === 'ASESOR' || (rol === 'PROMOTORIA');

  // --------------------------
  // Definición de menús por rol
  // --------------------------
  const MENUS = {
    ASESOR: {
      '/asesor/home': 'HOME',
      '/asesor/informe-seguimiento-dashboard': 'INFORME SEGUIMIENTO',
      '/asesor/registro-menu': 'REGISTROS IMPLEMENTACIÓN',
      '/asesor/resultados-auditorias': 'RESULTADOS AUDITORIAS',
      '/asesor/plan-incentivos': 'PLAN DE INCENTIVOS',
    },
    PROMOTORIA: {
      '/asesor/home': 'HOME',
      '/asesor/informe-seguimiento-dashboard': 'REGISTRA TUS VISITAS',
      '/asesor/plan-incentivos': 'PLAN INCENTIVOS',
    },
    MYSTERY_SHOPPER: {
      '/misteryShopper/home': 'HOME',
      '/misteryShopper/registrar_visitas': 'REGISTRA TUS VISITAS',
      // Agrega aquí más rutas si tienes más vistas para este rol
    },
    MERCADEO_AC: {
      '/mercadeo/home': 'HOME',
      '/mercadeo/informe-seguimiento-dashboard': 'INFORME SEGUIMIENTO',
      '/mercadeo/visitas': 'GESTIÓN DE REGISTROS',
      '/mercadeo/plan-incentivos': 'PLAN INCENTIVOS',
      '/mercadeo/powerbi': 'POWER BI',
    },
      DIRECTOR: {
      '/director-zona/home': 'HOME',
    },
      ORGANIZACION_TERPEL: {
      '/organizacion-terpel/home': 'HOME',
      '/organizacion-terpel/powerbi': 'POWER BI',
      '/organizacion-terpel/registro-visitas': 'REGISTRO VISITAS',
      '/organizacion-terpel/historial-visitas': 'HISTORIAL VISITAS',
    },
    BACKOFFICE: {
      '/backoffice/home': 'HOME',
      '/backoffice/visitas': 'GESTIÓN DE REGISTROS',
      '/backoffice/usuarios': 'GESTIÓN DE USUARIOS',
      '/backoffice/puntos-venta': 'GESTIÓN DE PDVs',
    },
    // ...otros roles
  };

  // Selección de menú y ruta principal según rol
  const TITULOS = MENUS[rol] || MENUS['ASESOR'];
  const menuRoutes = Object.keys(TITULOS);
  const mainRoute = menuRoutes[0];

  // --------------------------
  // *** PROTECCIÓN DE RUTAS COMPLETAMENTE DESACTIVADA PARA DESARROLLO ***
  // --------------------------
  useEffect(() => {
    // console.log('🔓 DESARROLLO: Permitiendo acceso a todas las rutas del dashboard');
    
    /* CÓDIGO ORIGINAL COMENTADO PARA DESARROLLO:
    if (!menuRoutes.includes(location.pathname)) {
      console.log('DashboardLayout - Ruta no permitida, redirigiendo de', location.pathname, 'a:', mainRoute);
      navigate(mainRoute, { replace: true });
    }
    */
  }, [rol, location.pathname, menuRoutes, mainRoute, navigate]);

  // --------------------------
  // Obtención del título dinámico según la ruta actual
  // --------------------------
  const titulo = TITULOS[location.pathname] || 'HOME';

  // --------------------------
  // Funciones de navegación y logout
  // --------------------------
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Cerrar menú si está abierto
      setShowMenu(false);
      
      // Logout completo del contexto (sin demoras innecesarias)
      logout();
      
      // Limpiar localStorage manualmente (limpieza extra)
      const keysToRemove = [
        'user', 'authToken', 'userRole', 'sessionData', 'userData',
        'lastActivity', 'loginTime', 'userPreferences', 'sessionId'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Limpiar sessionStorage completamente
      sessionStorage.clear();
      
      // Limpiar cookies de sesión
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Navegar inmediatamente al login
      navigate('/', { replace: true });
      
      // Recarga rápida para limpiar estado residual
      setTimeout(() => {
        window.location.href = '/';
      }, 50);
      
    } catch (error) {
      console.error('Error en logout:', error);
      // En caso de error, forzar limpieza de emergencia
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleNav = (route) => {
    if (route !== location.pathname) {
      navigate(route);
    }
  };

  // --------------------------
  // Función para abrir WhatsApp y detectar bloqueo
  // --------------------------
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    setWaError('');
    const waUrl = 'https://api.whatsapp.com/send/?phone=573133441555&type=phone_number&app_absent=0';
    const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setWaError('No se pudo abrir WhatsApp. Puede estar bloqueado por tu navegador, red o extensión.');
      }
    }, 500);
  };

  // Mostrar WhatsApp solo a un rol específico (por ejemplo, solo ASESOR)
  // Si quieres que le aparezca a otro rol, cambia la condición de showWhatsApp

  // ==========================
  // Renderizado principal
  // ==========================
  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#ececec' }}>
      {/* ==========================
          Header móvil (visible <700px)
         ========================== */}
      <div
        className="dashboard-mobile-header"
        style={{
          display: 'none',
          width: '100%',
          position: 'relative',
          minHeight: 50,
        }}
      >
        {/* Imagen superior */}
        <img
          src="/img_caja_superior_mobil.png"
          alt="Header móvil"
          style={{
            width: '100%',
            height: 160,
            objectFit: 'cover',
            borderRadius: 0,
            display: 'block',
          }}
        />
        {/* Franja roja con menú, título, notificación y WhatsApp */}
        <div
          style={{
            width: '100%',
            background: '#e30613',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
          }}
        >
          {/* Menú hamburguesa */}
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              height: 12
            }}
            title="Menú"
          >
            <svg width="24" height="28" viewBox="0 0 32 32" fill="none">
              <rect y="7" width="32" height="4" rx="2" fill="#fff"/>
              <rect y="14" width="32" height="4" rx="2" fill="#fff"/>
              <rect y="21" width="32" height="4" rx="2" fill="#fff"/>
            </svg>
          </button>
          {/* Título dinámico */}
          <span style={{
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 15,
            letterSpacing: 0.2,
            flex: 1,
            textAlign: 'center',
            marginLeft: -5,
          }}>
            {titulo}
          </span>
          {/* Icono Notificación */}
          {/* <span style={{ marginLeft: -20, marginRight: 25 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" stroke="#fff" strokeWidth="1.5" fill="none"/>
            </svg>
          </span> */}
          {/* Icono WhatsApp */}
          {showWhatsApp && (
            <span style={{ marginLeft: -20, marginRight: 0 }}>
              <a
                href="https://api.whatsapp.com/send/?phone=573133441555&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center' }}
                title="WhatsApp"
                onClick={handleWhatsAppClick}
              >
                <img 
                  src="/whatsApp.jpg" 
                  alt="WhatsApp" 
                  style={{ 
                    width: 22, 
                    height: 22, 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }} 
                />
              </a>
            </span>
          )}
        </div>
        {/* Menú desplegable móvil */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 204,
            width: '100%',
            background: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Opciones del menú */}
            {menuRoutes.map((route) => (
              <button
                key={route}
                onClick={() => {
                  setShowMenu(false);
                  handleNav(route);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: location.pathname === route ? '#e30613' : '#222',
                  fontWeight: location.pathname === route ? 'bold' : 'normal',
                  fontSize: 13, // <--- Cambia aquí de 16 a 13
                  padding: '6px 0',
                  width: '100%',
                  cursor: location.pathname === route ? 'default' : 'pointer',
                  borderBottom: '2px solid #eee'
                }}
                disabled={location.pathname === route}
              >
                {TITULOS[route]}
              </button>
            ))}
            {/* Botón cerrar sesión */}
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#e30613',
                fontWeight: 'bold',
                fontSize: 16,
                padding: '16px 0',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
        {/* Contenido móvil con scroll vertical */}
        <div
          className="dashboard-mobile-scroll"
          style={{
            width: '100%',
            maxHeight: 'calc(100vh - 204px)',
            // overflowY: 'auto',
            overflowX: 'hidden',
            background: '#ececec',
            boxSizing: 'border-box'
          }}
        >
          <div className="dashboard-mobile-content" style={{ padding: 0 }}>
            {children}
          </div>
        </div>
      </div>
      {/* ==========================
          Layout escritorio (visible >=700px)
         ========================== */}
      <div className="dashboard-desktop-layout" style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
        {/* Barra lateral roja */}
        <aside style={{
          width: 120,
          background: '#a1000b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 20,
          color: '#fff',
        }}>
          <img src="/LogoTerpelBlanco.png" alt="Terpel" style={{ width: 100, marginBottom: 20 }} />
          <nav style={{ 
            width: '100%', 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'stretch',
            alignItems: 'center'
          }}>
            {menuRoutes.map((route) => (
              <button
                key={route}
                onClick={() => handleNav(route)}
                style={{
                  width: '100%',
                  background: location.pathname === route ? '#e30613' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginBottom: 10,
                  fontWeight: 'bold',
                  cursor: location.pathname === route ? 'default' : 'pointer',
                  fontSize: 10,
                  opacity: location.pathname === route ? 1 : 0.8,
                  boxShadow: location.pathname === route ? '0 2px 8px #e3061322' : 'none',
                  transition: 'background 0.2s'
                }}
                disabled={location.pathname === route}
              >
                {TITULOS[route]}
              </button>
            ))}
          </nav>
        </aside>
        {/* Contenido principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
          {/* Barra superior */}
          <header style={{
            height: 40,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '6px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            position: 'fixed',
            top: 0,
            left: 120,
            right: 0,
          }}>
            {/* Título dinámico en escritorio */}
            <span style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              textAlign: 'center',
              color: '#e30613',
              fontWeight: 'bold',
              fontSize: 15,
              letterSpacing: 1,
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              {/* {titulo} */}
            </span>
            {/* Iconos y logout */}
            {/* Notificaciones */}
            {/* <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                marginRight: 10,
                cursor: 'pointer',
                position: 'relative',
                padding: 0
              }}
              title="Notificaciones"
            > */}
              {/* <span style={{
                fontSize: 20,
                color: '#e30613',
                display: 'inline-block',
                verticalAlign: 'middle'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" stroke="#e30613" strokeWidth="1.5" fill="none"/>
                </svg>
              </span>
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#ffe259',
                color: '#e30613',
                borderRadius: '50%',
                width: 14,
                height: 14,
                fontSize: 11,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #fff',
                boxShadow: '0 1px 2px #e3061322'
              }}>1</span>
            </button> */}
            {/* Correo */}
            {/* <span style={{
              marginRight: 10,
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="3" stroke="#e30613" strokeWidth="1.5" fill="none"/>
                <path d="M3 7l9 6 9-6" stroke="#e30613" strokeWidth="1.5" fill="none"/>
              </svg>
            </span> */}
            {/* Usuario */}
            {/* <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f4f4f4',
              border: '1.5px solid #e30613',
              color: '#b0b0b0',
              borderRadius: '50%',
              width: 28,
              height: 28,
              marginRight: 10
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#b0b0b0" strokeWidth="1.5" fill="none"/>
                <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke="#b0b0b0" strokeWidth="1.5" fill="none"/>
              </svg>
            </span> */}
            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                marginLeft: 6,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Cerrar sesión"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M16 17L21 12L16 7" stroke="#e30613" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="#e30613" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19C7.58172 19 4 15.4183 4 11C4 6.58172 7.58172 3 12 3" stroke="#e30613" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </header>
          {/* Área central blanca para el contenido */}
          <main
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: 'calc(100vh - 40px)', // Altura completa menos el header
              background: '#ececec',
              paddingBottom: 80, // Aumentado para dar espacio al footer
              paddingTop: 40, // Incrementado para compensar el header fijo
              boxSizing: 'border-box',
              overflowY: 'auto' // Permitir scroll vertical
            }}
          >
            <div
              style={{
                // background: '#fff',
                borderRadius: 16,
                // boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                padding: 18,
                minHeight: 400,
                minWidth: 320,
                width: '90%',
                maxWidth: 1100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start', // Cambio de 'center' a 'flex-start'
                alignItems: 'center',
                marginBottom: 20, // Margen adicional para separar del footer
              }}
            >
              {children}
            </div>
            {/* Botón flotante de WhatsApp solo en escritorio */}
            {showWhatsApp && (
              <a
                href="https://api.whatsapp.com/send/?phone=573133441555&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                style={{
                  position: 'fixed',
                  right: 32,
                  bottom: 90,
                  zIndex: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: '#25D366',
                  boxShadow: '0 4px 16px #25d36655',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                className="whatsapp-desktop-btn"
              >
                <img 
                  src="/whatsApp.jpg" 
                  alt="WhatsApp" 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }} 
                />
              </a>
            )}
          </main>
        </div>
      </div>
      {/* ==========================
          CSS responsivo y scroll personalizado
         ========================== */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { 
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (max-width: 768px) {
            .dashboard-mobile-header { display: block !important; }
            .dashboard-desktop-layout { display: none !important; }
            .whatsapp-desktop-btn { display: none !important; }
            .dashboard-mobile-content {
              padding: 0 !important;
            }
            .dashboard-bar-graph {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch;
            }
            .dashboard-bar-graph svg {
              min-width: 600px !important;
              width: auto !important;
              max-width: none !important;
              height: 180px !important;
              display: block;
            }
            .dashboard-bar-graph svg rect {
              width: 18px !important;
            }
            .kpi-pdv-box, .dashboard-bar-graph, .dashboard-table-box {
              max-width: 98vw !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
            .dashboard-mobile-scroll {
              scrollbar-width: thin;
              scrollbar-color: #e30613 transparent;
              background: transparent !important;
              overflow-x: auto !important;
              overflow-y: auto !important;
            }
            .dashboard-mobile-scroll::-webkit-scrollbar {
              width: 7px;
              background: transparent;
            }
            .dashboard-mobile-scroll::-webkit-scrollbar-thumb {
              background: #e30613;
              border-radius: 8px;
            }
            .dashboard-mobile-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .dashboard-bar-graph > div {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch;
            }
            .dashboard-table-box {
              overflow-x: hidden !important;
            }
          }
          @media (min-width: 769px) {
            .dashboard-mobile-header { display: none !important; }
            .dashboard-desktop-layout { display: flex !important; }
            .whatsapp-desktop-btn { display: flex !important; }
          
          }
        `}
      </style>
      {/* ==========================
          Footer degradado común
         ========================== */}
      <div
        style={{
          width: '100%',
          position: 'fixed',
          left: 0,
          bottom: 0,
          zIndex: 100,
          background: '#fff',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'
        }}
      >
        {/* Borde degradado superior */}
        <div
          style={{
            height: 6,
            width: '100%',
            borderTop: '5px solid',
            borderImage: 'linear-gradient(90deg, #e30613 0%, #ffe259 30%, #ffa751 60%, #e30613 100%) 1',
            borderRadius: '8px 8px 0 0'
          }}
        />
        {/* Contenido del footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 18px 10px 12px',
            minHeight: 32,
            fontSize: 13,
            color: '#222',
            fontWeight: 500,
            letterSpacing: 1,
            background: '#fff'
          }}
        >
          <span style={{
            fontSize: 9,
            color: '#888',
            fontWeight: 500,
            letterSpacing: 1,
          }}>
            © TERPEL 2025. TODOS LOS DERECHOS RESERVADOS.
          </span>
          <img
            src="/icono_completo.png"
            alt="terpel"
            style={{ height: 22, marginLeft: 12 }}
          />
        </div>
      </div>
    </div>
  );
}
