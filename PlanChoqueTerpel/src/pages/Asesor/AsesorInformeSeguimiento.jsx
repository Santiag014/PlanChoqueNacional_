import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Importar iconos
import RegistroImplementacion from '../../assets/Iconos/IconosPage/Icono_Page_Registra_PDV.png';
import HistorialRegistros from '../../assets/Iconos/IconosPage/Icono_Page_Mis_Metas.png';
import DashboardIcon from '../../assets/Iconos/IconosPage/Icono_Page_RankingAsesores.png';

/**
 * Página intermedia para Informe de Seguimiento - VERSIÓN FINAL
 */
export default function InformeSeguimiento() {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasRole, loading } = useAuthContext();

  console.log('📋 InformeSeguimiento - Cargando...');

  // Si está cargando la autenticación, mostrar loading
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#e30613' }}>Verificando autenticación...</div>
        </div>
      </div>
    );
  }

  // Verificar autenticación básica
  if (!isAuthenticated()) {
    setTimeout(() => navigate('/', { replace: true }), 1000);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#e30613' }}>No autenticado, redirigiendo...</div>
        </div>
      </div>
    );
  }

  // Verificar rol de asesor
  if (!hasRole(['asesor', 'ASESOR', 1])) {
    setTimeout(() => navigate('/unauthorized', { replace: true }), 1000);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#e30613' }}>Sin permisos de asesor...</div>
        </div>
      </div>
    );
  }

  console.log('✅ InformeSeguimiento - Renderizando componente');

  const handleButtonClick = (route) => {
    console.log('📍 Navegando a:', route);
    navigate(route);
  };

  return (
    <DashboardLayout user={user} pageTitle="INFORME SEGUIMIENTO">
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 15px 100px 15px',
        background: '#f5f5f5',
        minHeight: '70vh'
      }}>
        {/* Título principal */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: '#e30613',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
            fontFamily: 'Terpel-Sans-Bold, Arial, sans-serif'
          }}>
            OPCIONES DE SEGUIMIENTO
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: '0'
          }}>
            Selecciona una opción para continuar
          </p>
        </div>

        {/* Grid de opciones */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '25px',
          justifyItems: 'center'
        }}>
          
          {/* Botón 1: Registro Implementación */}
          <div 
            onClick={() => handleButtonClick('/asesor/registro-implementacion')}
            style={{
              width: '100%',
              maxWidth: '350px',
              background: '#fff',
              borderRadius: '16px',
              padding: '25px 20px',
              boxShadow: '0 4px 12px rgba(227, 6, 19, 0.15)',
              border: '2px solid #e30613',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(227, 6, 19, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(227, 6, 19, 0.15)';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: '#e30613',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src={RegistroImplementacion} 
                alt="Registro Implementación" 
                style={{ width: '45px', height: '45px', filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h3 style={{
              color: '#e30613',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              fontFamily: 'Terpel-Sans-Bold, Arial, sans-serif'
            }}>
              REGISTRO IMPLEMENTACIÓN
            </h3>
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.4'
            }}>
              Registra nuevas implementaciones de PDV y documenta el proceso completo
            </p>
          </div>

          {/* Botón 2: Historial de Registros */}
          <div 
            onClick={() => handleButtonClick('/asesor/historial-registros')}
            style={{
              width: '100%',
              maxWidth: '350px',
              background: '#fff',
              borderRadius: '16px',
              padding: '25px 20px',
              boxShadow: '0 4px 12px rgba(227, 6, 19, 0.15)',
              border: '2px solid #e30613',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(227, 6, 19, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(227, 6, 19, 0.15)';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: '#e30613',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src={HistorialRegistros} 
                alt="Historial de Registros" 
                style={{ width: '45px', height: '45px', filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h3 style={{
              color: '#e30613',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              fontFamily: 'Terpel-Sans-Bold, Arial, sans-serif'
            }}>
              HISTORIAL DE REGISTROS
            </h3>
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.4'
            }}>
              Consulta y revisa todo el historial de implementaciones realizadas
            </p>
          </div>

          {/* Botón 3: Dashboard de Métricas */}
          <div 
            onClick={() => handleButtonClick('/asesor/informe-seguimiento-dashboard')}
            style={{
              width: '100%',
              maxWidth: '350px',
              background: '#fff',
              borderRadius: '16px',
              padding: '25px 20px',
              boxShadow: '0 4px 12px rgba(227, 6, 19, 0.15)',
              border: '2px solid #e30613',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(227, 6, 19, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(227, 6, 19, 0.15)';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: '#e30613',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src={DashboardIcon} 
                alt="Dashboard de Métricas" 
                style={{ width: '45px', height: '45px', filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h3 style={{
              color: '#e30613',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              fontFamily: 'Terpel-Sans-Bold, Arial, sans-serif'
            }}>
              DASHBOARD DE MÉTRICAS
            </h3>
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.4'
            }}>
              Visualiza estadísticas y métricas de rendimiento de implementaciones
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
