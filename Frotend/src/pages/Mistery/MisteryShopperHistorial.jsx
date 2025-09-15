import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../../config';

// Importa el CSS específico de Mistery
import '../../styles/Mistery/mistery-home.css';

export default function MisteryShopperHistorial() {
  const navigate = useNavigate();
  const [historiales, setHistoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      
      if (!token || !usuario?.id) {
        setError('Usuario no autenticado');
        return;
      }

      const response = await fetch(`${CONFIG.API_URL}/api/mistery-shopper/historial-hallazgos/${usuario.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setHistoriales(result.data || []);
      } else {
        setError(result.message || 'Error al cargar el historial');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (hallazgoId) => {
    navigate(`/misteryShopper/detalle-hallazgo/${hallazgoId}`);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="mistery-dashboard-root">
        <div className="mistery-dashboard-center">
          
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #e30613, #b8050f)', 
            color: 'white',
            padding: '20px',
            borderRadius: '12px 12px 0 0',
            marginBottom: '0'
          }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              📊 Historial de Registros
            </h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
              Consulta todos tus registros de Mystery Shopper
            </p>
          </div>

          {/* Contenido */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minHeight: '400px'
          }}>

            {/* Botón Volver */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => navigate('/misteryShopper')}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ← Volver al Dashboard
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ 
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #e30613',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p>Cargando historial...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <strong>Error:</strong> {error}
                <button
                  onClick={cargarHistorial}
                  style={{
                    background: '#e30613',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '10px',
                    fontSize: '12px'
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Tabla de Historiales */}
            {!loading && !error && (
              <>
                {historiales.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d'
                  }}>
                    <h3>No hay registros aún</h3>
                    <p>Comienza registrando tus primeras visitas de Mystery Shopper</p>
                    <button
                      onClick={() => navigate('/misteryShopper/registrar_visitas')}
                      style={{
                        background: '#e30613',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '15px'
                      }}
                    >
                      Registrar Primera Visita
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Resumen */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '6px',
                      marginBottom: '20px',
                      border: '1px solid #dee2e6'
                    }}>
                      <strong>Total de registros: {historiales.length}</strong>
                    </div>

                    {/* Tabla */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead>
                          <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ 
                              padding: '12px 8px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: '600'
                            }}>Código PDV</th>
                            <th style={{ 
                              padding: '12px 8px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: '600'
                            }}>Nombre PDV</th>
                            <th style={{ 
                              padding: '12px 8px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: '600'
                            }}>Agente</th>
                            <th style={{ 
                              padding: '12px 8px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: '600'
                            }}>Visita #</th>
                            <th style={{ 
                              padding: '12px 8px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: '600'
                            }}>Fecha</th>
                            <th style={{ 
                              padding: '12px 8px', 
                              textAlign: 'center', 
                              borderBottom: '2px solid #dee2e6',
                              fontWeight: '600'
                            }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historiales.map((historial, index) => (
                            <tr key={historial.id} style={{
                              borderBottom: '1px solid #dee2e6',
                              '&:hover': { background: '#f8f9fa' }
                            }}>
                              <td style={{ padding: '12px 8px' }}>
                                <strong style={{ color: '#e30613' }}>
                                  {historial.codigo_pdv}
                                </strong>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <div style={{ fontWeight: '500' }}>
                                  {historial.nombre_pdv}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                  {historial.direccion_pdv}
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                {historial.agente || 'N/A'}
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <span style={{
                                  background: '#e30613',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  #{historial.nro_visita}
                                </span>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                {formatearFecha(historial.fecha_hallazgo)}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => verDetalle(historial.id)}
                                  style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS para la animación de loading */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        tbody tr:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </DashboardLayout>
  );
}
