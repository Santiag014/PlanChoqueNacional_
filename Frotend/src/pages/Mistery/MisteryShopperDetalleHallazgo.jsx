import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { CONFIG } from '../../config';

// Importa el CSS específico de Mistery
import '../../styles/Mistery/mistery-home.css';

export default function MisteryShopperDetalleHallazgo() {
  const navigate = useNavigate();
  const { hallazgoId } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hallazgoId) {
      cargarDetalle();
    }
  }, [hallazgoId]);

  const cargarDetalle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Usuario no autenticado');
        return;
      }

      const response = await fetch(`${CONFIG.API_URL}/api/mistery-shopper/hallazgo-detalles/${hallazgoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setDetalle(result.data);
      } else {
        setError(result.message || 'Error al cargar el detalle');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión al cargar el detalle');
    } finally {
      setLoading(false);
    }
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

  const abrirEnMaps = () => {
    if (detalle?.lat && detalle?.lng) {
      const url = `https://www.google.com/maps?q=${detalle.lat},${detalle.lng}`;
      window.open(url, '_blank');
    }
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
              🔍 Detalle del Hallazgo
            </h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
              Información completa del registro de Mystery Shopper
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
                onClick={() => navigate('/misteryShopper/historial')}
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
                ← Volver al Historial
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
                <p>Cargando detalle...</p>
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
                  onClick={cargarDetalle}
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

            {/* Detalle del Hallazgo */}
            {!loading && !error && detalle && (
              <div style={{ display: 'grid', gap: '20px' }}>
                
                {/* Información del PDV */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h3 style={{ 
                    color: '#e30613', 
                    marginTop: 0, 
                    marginBottom: '15px',
                    fontSize: '18px'
                  }}>
                    📍 Información del PDV
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong>Código:</strong>
                      <div style={{ marginTop: '5px', fontSize: '16px', color: '#e30613', fontWeight: '600' }}>
                        {detalle.codigo_pdv}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Nombre:</strong>
                      <div style={{ marginTop: '5px' }}>{detalle.nombre_pdv}</div>
                    </div>
                    
                    <div>
                      <strong>Dirección:</strong>
                      <div style={{ marginTop: '5px' }}>{detalle.direccion_pdv}</div>
                    </div>
                    
                    <div>
                      <strong>Agente:</strong>
                      <div style={{ marginTop: '5px' }}>{detalle.agente || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <strong>Segmento:</strong>
                      <div style={{ marginTop: '5px' }}>{detalle.segmento || 'N/A'}</div>
                    </div>
                    
                    {detalle.lat && detalle.lng && (
                      <div>
                        <strong>Ubicación:</strong>
                        <div style={{ marginTop: '5px' }}>
                          <button
                            onClick={abrirEnMaps}
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
                            🗺️ Ver en Google Maps
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del Registro */}
                <div style={{
                  background: '#fff3cd',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ffeaa7'
                }}>
                  <h3 style={{ 
                    color: '#856404', 
                    marginTop: 0, 
                    marginBottom: '15px',
                    fontSize: '18px'
                  }}>
                    📋 Información del Registro
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong>Número de Visita:</strong>
                      <div style={{ marginTop: '5px' }}>
                        <span style={{
                          background: '#e30613',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          #{detalle.nro_visita}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <strong>Fecha del Hallazgo:</strong>
                      <div style={{ marginTop: '5px' }}>{formatearFecha(detalle.fecha_hallazgo)}</div>
                    </div>
                    
                    <div>
                      <strong>Mystery Shopper:</strong>
                      <div style={{ marginTop: '5px' }}>
                        {detalle.nombre_usuario}
                        {detalle.email_usuario && (
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {detalle.email_usuario}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {detalle.galonaje && (
                      <div>
                        <strong>Galonaje:</strong>
                        <div style={{ marginTop: '5px' }}>{detalle.galonaje}</div>
                      </div>
                    )}
                    
                    {detalle.puntos_kpi && (
                      <div>
                        <strong>Puntos KPI:</strong>
                        <div style={{ marginTop: '5px' }}>{detalle.puntos_kpi}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hallazgo */}
                <div style={{
                  background: '#d1ecf1',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #bee5eb'
                }}>
                  <h3 style={{ 
                    color: '#0c5460', 
                    marginTop: 0, 
                    marginBottom: '15px',
                    fontSize: '18px'
                  }}>
                    💡 Hallazgo Registrado
                  </h3>
                  
                  <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #b8daff',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    minHeight: '80px'
                  }}>
                    {detalle.hallazgo || 'Sin hallazgo registrado'}
                  </div>
                </div>

                {/* Foto del Reporte */}
                {detalle.foto_reporte && (
                  <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h3 style={{ 
                      color: '#495057', 
                      marginTop: 0, 
                      marginBottom: '15px',
                      fontSize: '18px'
                    }}>
                      📸 Fotografía del Reporte
                    </h3>
                    
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={`${CONFIG.API_URL}${detalle.foto_reporte}`}
                        alt="Foto del reporte"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '8px',
                          border: '2px solid #dee2e6',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div style={{ 
                        display: 'none',
                        color: '#6c757d',
                        padding: '20px',
                        fontSize: '14px'
                      }}>
                        No se pudo cargar la imagen
                      </div>
                    </div>
                  </div>
                )}

                {/* Información Adicional */}
                {(detalle.fecha_actualizacion || detalle.fecha_registro_pdv) && (
                  <div style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    fontSize: '12px',
                    color: '#6c757d'
                  }}>
                    <div><strong>ID del Hallazgo:</strong> {detalle.id}</div>
                    {detalle.fecha_actualizacion && (
                      <div><strong>Última actualización:</strong> {formatearFecha(detalle.fecha_actualizacion)}</div>
                    )}
                    {detalle.fecha_registro_pdv && (
                      <div><strong>Fecha registro PDV:</strong> {formatearFecha(detalle.fecha_registro_pdv)}</div>
                    )}
                  </div>
                )}
              </div>
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
      `}</style>
    </DashboardLayout>
  );
}
