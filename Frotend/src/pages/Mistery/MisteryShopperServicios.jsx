
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { API_URL } from '../../config';
import { createPortal } from 'react-dom';

// Puedes ajustar la URL base según tu entorno
const API_BASE = `${API_URL}/api/mistery-shopper`;

export default function Servicios() {
  const [pdvs, setPdvs] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [hallazgos, setHallazgos] = useState('');
  const [nroVisita, setNroVisita] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [mapaLoading, setMapaLoading] = useState(false); // Estado para carga del mapa
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null); // 'aceptado' o 'rechazado'
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal de éxito

  // Obtener lista de PDVs desde la API
  useEffect(() => {
    const fetchPDVs = async () => {
      setLoading(true);
      try {
        // Usar el mismo patrón de token que otros módulos
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const res = await fetch(`${API_BASE}/pdvs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          setPdvs(data.data || []);
        } else {
          console.error('Error en respuesta de API:', data.message);
          throw new Error(data.message || 'Error desconocido en la API');
        }
      } catch (e) {
        console.error('Error fetching PDVs:', e);
        
        // Mostrar detalles específicos del error
        if (e.message.includes('401')) {
          alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
        } else if (e.message.includes('403')) {
          alert('No tienes permisos para acceder a esta funcionalidad.');
        } else {
          alert(`Error al cargar PDVs: ${e.message}`);
        }
        
        setPdvs([]);
      }
      setLoading(false);
    };
    fetchPDVs();
  }, []);

  // useEffect para inicializar número de visita cuando se carga el detalle
  useEffect(() => {
    if (detalle && detalle.data) {
      console.log('Inicializando datos del PDV:', detalle.data); // Debug
      
      // Establecer número de visita por defecto a 1 si no existe
      const visitaNumero = detalle.data.nro_visita || '1';
      setNroVisita(visitaNumero);
      
      // Resetear estado seleccionado cuando cambia el detalle
      setEstadoSeleccionado(null);
      setHallazgos('');
      setFotos([]);
      
      console.log('Número de visita establecido:', visitaNumero); // Debug
      
      // Iniciar carga del mapa si hay coordenadas válidas
      if (detalle.data.lat && detalle.data.lng && detalle.data.lat !== 0 && detalle.data.lng !== 0) {
        setMapaLoading(true);
        
        // Fallback: ocultar loading después de 3 segundos máximo
        const timeoutId = setTimeout(() => {
          setMapaLoading(false);
        }, 3000);
        
        // Limpiar timeout si el componente se desmonta
        return () => clearTimeout(timeoutId);
      } else {
        // Si no hay coordenadas válidas, no mostrar loading
        setMapaLoading(false);
      }
    }
  }, [detalle]);

  // Obtener detalle de PDV desde la API
  const handleVerDetalles = async (id_registro_pdv) => {
    setLoading(true);
    try {
      // Usar el mismo patrón de token que otros módulos
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      const res = await fetch(`${API_BASE}/pdv-detalle?id_registro_pdv=${id_registro_pdv}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        console.log('Datos del PDV recibidos:', data); // Debug
        setDetalle(data);
      } else {
        console.error('Error en respuesta de API:', data.message);
        throw new Error(data.message || 'Error desconocido en la API');
      }
    } catch (e) {
      console.error('Error fetching PDV details:', e);
      
      // Mostrar detalles específicos del error
      if (e.message.includes('401')) {
        alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      } else if (e.message.includes('403')) {
        alert('No tienes permisos para acceder a esta funcionalidad.');
      } else {
        alert(`Error al cargar detalles del PDV: ${e.message}`);
      }
      
      setDetalle(null);
    }
    setLoading(false);
  };

  const handleFotos = (e) => {
    const files = Array.from(e.target.files);
    setFotos(prevFotos => [...prevFotos, ...files]);
  };

  const removerFoto = (index) => {
    setFotos(prevFotos => prevFotos.filter((_, i) => i !== index));
  };

  // Función para manejar la carga del mapa
  const handleMapLoad = () => {
    setMapaLoading(false);
  };

  // Funciones para manejar los estados de aceptar/rechazar
  const handleAceptar = () => {
    setEstadoSeleccionado('aceptado');
  };

  const handleRechazar = () => {
    setEstadoSeleccionado('rechazado');
  };

  const handleResetearEstado = () => {
    setEstadoSeleccionado(null);
    setHallazgos('');
    setFotos([]);
  };

  // Obtener usuario logueado de localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const handleGuardar = async () => {
    const formData = new FormData();
    formData.append('pdv_id', detalle?.data?.id);
    formData.append('user_id', userId);
    formData.append('hallazgos', hallazgos);
    formData.append('estado_productos', estadoSeleccionado); // 'aceptado' o 'rechazado'
    if (nroVisita) formData.append('nro_visita', nroVisita);
    
    // Agregar múltiples fotos con el nombre correcto para multer
    fotos.forEach((foto) => {
      formData.append('fotos', foto);
    });

    try {
      // Usar el mismo patrón de token que otros módulos
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      const response = await fetch(`${API_BASE}/guardar-hallazgo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setShowSuccessModal(true); // Mostrar modal de éxito
        setDetalle(null);
        setFotos([]);
        setHallazgos('');
        setNroVisita('1'); // Resetear a 1 por defecto
      } else {
        throw new Error(result.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  // Filtro por código PDV
  const pdvsFiltrados = pdvs.filter(p => 
    p.codigo && p.codigo.toString().toLowerCase().includes(filtroCodigo.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        .pulse-ring {
          animation: pulse 2s infinite;
        }
        
        .pulse-ring-delayed {
          animation: pulse 2s infinite 0.5s;
        }
      `}</style>
      
      <div style={{ padding: 0, maxWidth: 500, margin: '0 auto', width: '100%' }}>
        {!detalle && (
          <div style={{
            borderRadius: 14,
            boxShadow: '0 2px 12px #0001',
            padding: '20px 15px 60px 15px',
            margin: '30px auto 0 auto',
          }}>
            {/* Filtros */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
              justifyContent: 'center'
            }}>
              <input
                type="text"
                placeholder="Filtrar por código PDV"
                value={filtroCodigo}
                onChange={e => setFiltroCodigo(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 15,
                  width: 180
                }}
              />
              <button
                onClick={() => setFiltroCodigo('')}
                style={{
                  background: '#e30613',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 18px',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >Limpiar</button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888', margin: 30 }}>Cargando...</div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px #eee',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ background: '#ffe5e5' }}>
                    {/* Quitar columna ID */}
                    <th style={{ padding: 10, color: '#e30613', fontWeight: 700, fontSize: 14, border: 'none' }}>Código PDV</th>
                    <th style={{ padding: 10, color: '#888', fontWeight: 700, fontSize: 14, border: 'none' }}>Agente Comercial</th>
                    {/* Nueva columna FECHA */}
                    <th style={{ padding: 10, color: '#888', fontWeight: 700, fontSize: 14, border: 'none' }}>Fecha</th>
                    <th style={{ padding: 10, border: 'none' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pdvsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Sin resultados</td>
                    </tr>
                  )}
                  {pdvsFiltrados.map((pdv) => (
                    <tr key={pdv.id_registro_pdv} style={{ background: '#f9f9f9' }}>
                      {/* Quitar columna ID */}
                      <td style={{ padding: 10, color: '#e30613', fontWeight: 700, border: 'none', fontSize: 13 }}>{pdv.codigo}</td>
                      <td style={{ padding: 10, color: '#888', fontWeight: 600, border: 'none', fontSize: 13 }}>{pdv.agente}</td>
                      {/* Mostrar la fecha */}
                      <td style={{ padding: 10, color: '#888', fontWeight: 600, border: 'none', fontSize: 13 }}>
                        {pdv.fecha ? new Date(pdv.fecha).toLocaleDateString() : ''}
                      </td>
                      <td style={{ padding: 10, border: 'none' }}>
                        <button
                          style={{
                            background: '#e30613',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '7px 18px',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #e3061322'
                          }}
                          onClick={() => handleVerDetalles(pdv.id_registro_pdv)}
                        >
                         Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {detalle && (
          <div style={{
            borderRadius: 14,
            padding: '0px 18px 40px 18px', // Aumenta el padding inferior para espacio bajo el botón
            margin: '30px auto 0 auto',
            minHeight: 420,
            position: 'relative'
          }}>
            {/* Botón de volver minimalista */}
            <button
              onClick={() => setDetalle(null)}
              style={{
                position: 'absolute',
                top: -20,
                left: 8,
                width: 25,
                height: 25,
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                cursor: 'pointer',
                padding: 0
              }}
              aria-label="Volver"
            >
              <svg width="50" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M14 18L8 11L14 4" stroke="#e30613" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{ height: 10 }} />
            {/* AGENTE COMERCIAL */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 20 }}>
              <label style={{ fontWeight: 600, color: '#888', fontSize: 12, minWidth: 125 }}>
                AGENTE COMERCIAL
              </label>
              <input
                value={detalle?.data?.agente || 'N/A'}
                disabled
                style={{
                  background: '#e30613',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  width: '100%',
                  textAlign: 'center',
                  maxWidth: 220
                }}
              />
            </div>
            {/* NOMBRE DEL ASESOR */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 20 }}>
              <label style={{ fontWeight: 600, color: '#888', fontSize: 12, minWidth: 125 }}>
                NOMBRE DEL ASESOR
              </label>
              <input
                value={detalle?.data?.asesor || 'N/A'}
                disabled
                style={{
                  background: '#e30613',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  width: '100%',
                  textAlign: 'center',
                  maxWidth: 220
                }}
              />
            </div>
            {/* DIRECCIÓN DEL PDV */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 20 }}>
              <label style={{ fontWeight: 600, color: '#888', fontSize: 12, minWidth: 125 }}>
                DIRECCIÓN DEL PDV
              </label>
              <input
                value={detalle?.data?.direccion || 'N/A'}
                disabled
                style={{
                  background: '#fff',
                  color: '#222',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontWeight: 300,
                  fontSize: 13,
                  border: 'none',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: 220
                }}
              />
            </div>
            {/* MAPA DEL PDV */}
            <div style={{ marginBottom: 0, position: 'relative' }}>
              <div style={{
                position: 'relative',
                width: '95%',
                margin: '0 auto' // Esto centra el mapa horizontalmente
              }}>
                {(mapaLoading || (!detalle?.data?.lat || !detalle?.data?.lng || detalle?.data?.lat === 0 || detalle?.data?.lng === 0)) ? (
                  // Pantalla de carga del mapa
                  <div style={{
                    width: '100%',
                    height: 180,
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                    borderRadius: '10px 10px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Animación de carga */}
                    <div 
                      className="spinner"
                      style={{
                        width: 40,
                        height: 40,
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #e30613',
                        borderRadius: '50%',
                        marginBottom: 12
                      }}
                    ></div>
                    <span style={{
                      color: '#e30613',
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 4
                    }}>
                      {(detalle?.data?.lat && detalle?.data?.lng) ? 'Cargando ubicación...' : 'Ubicación no disponible'}
                    </span>
                    <span style={{
                      color: '#888',
                      fontSize: 12,
                      textAlign: 'center'
                    }}>
                      {(detalle?.data?.lat && detalle?.data?.lng) ? 'Localizando PDV en el mapa' : 'Sin coordenadas GPS registradas'}
                    </span>
                    
                    {/* Efecto de ondas de ubicación */}
                    <div 
                      className="pulse-ring"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: '2px solid #e30613',
                        opacity: 0.3
                      }}
                    ></div>
                    <div 
                      className="pulse-ring-delayed"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        border: '2px solid #e30613',
                        opacity: 0.2
                      }}
                    ></div>
                  </div>
                ) : (
                  // Mapa real
                  <iframe
                    title="Mapa PDV"
                    width="100%"
                    height="180"
                    frameBorder="0"
                    src={`https://www.google.com/maps?q=${detalle?.data?.lat || 0},${detalle?.data?.lng || 0}&z=15&output=embed&markers=color:red%7C${detalle?.data?.lat || 0},${detalle?.data?.lng || 0}`}
                    allowFullScreen
                    style={{ borderRadius: '10px 10px 0 0' }}
                    onLoad={handleMapLoad}
                  ></iframe>
                )}
                {/* Pie de mapa: nombre PDV y nro visita */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                  boxShadow: '0 1px 4px #0001',
                  padding: '10px 10px 10px 10px',
                  marginTop: '-4px'
                }}>
                  {/* Nombre PDV a la izquierda */}
                  <span style={{
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#222',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '60%'
                  }}>
                    {detalle?.data?.nombrePDV || detalle?.data?.codigo || 'PDV'}
                  </span>
                  {/* Nro. visita al PDV a la derecha */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#888', fontWeight: 600, fontSize: 11 }}>No. visita al PDV</span>
                    <input
                      type="number"
                      min={1}
                      value={nroVisita || '1'}
                      onChange={e => setNroVisita(e.target.value)}
                      style={{
                        width: 36,
                        height: 28,
                        borderRadius: 8,
                        border: 'none',
                        background: '#e30613',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 14,
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* TABLA DE PRODUCTOS */}
            {detalle?.data?.productos && detalle.data.productos.length > 0 && (
              <div style={{ marginBottom: 18, marginTop: 18 }}>
                <label style={{
                  fontWeight: 600,
                  color: '#888',
                  fontSize: 12,
                  minWidth: 125,
                  marginLeft: 2,
                  display: 'block',
                  marginBottom: 10,
                  letterSpacing: 0.2,
                  textAlign: 'left'
                }}>
                  PRODUCTOS REGISTRADOS
                </label>
                <div style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '20px',
                  marginBottom: 0,
                  width: '100%',
                  maxWidth: '95%',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflowX: 'auto'
                }}>

                  
                  {/* Tabla con estilo mejorado */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: '350px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {/* Encabezado estilo Terpel */}
                      <thead>
                        <tr>
                          <th style={{
                            background: '#e30613',
                            color: 'white',
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 11,
                            borderRight: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            REFERENCIA
                          </th>
                          <th style={{
                            background: '#e30613',
                            color: 'white',
                            padding: '12px 8px',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: 11,
                            borderRight: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            PRESENTACIÓN
                          </th>
                          <th style={{
                            background: '#e30613',
                            color: 'white',
                            padding: '12px 8px',
                            textAlign: 'right',
                            fontWeight: 600,
                            fontSize: 11,
                            borderRight: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            P. SUGERIDO
                          </th>
                          <th style={{
                            background: '#e30613',
                            color: 'white',
                            padding: '12px 8px',
                            textAlign: 'right',
                            fontWeight: 600,
                            fontSize: 11
                          }}>
                            P. REAL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.data.productos.map((producto, index) => (
                          <tr key={index} style={{
                            borderBottom: index < detalle.data.productos.length - 1 ? '1px solid #eee' : 'none',
                            backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                          }}>
                            <td style={{
                              padding: '12px 8px',
                              fontSize: 11,
                              color: '#333',
                              lineHeight: 1.3,
                              fontWeight: 500,
                              borderRight: '1px solid #eee'
                            }}>
                              <div style={{
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={producto.referencia}>
                                {producto.referencia}
                              </div>
                            </td>
                            <td style={{
                              padding: '12px 8px',
                              textAlign: 'center',
                              fontSize: 11,
                              color: '#666',
                              fontWeight: 500,
                              borderRight: '1px solid #eee'
                            }}>
                              {producto.presentacion}
                            </td>
                            <td style={{
                              padding: '12px 8px',
                              textAlign: 'right',
                              fontSize: 11,
                              color: '#333',
                              fontWeight: 600,
                              borderRight: '1px solid #eee'
                            }}>
                              ${producto.precio_sugerido?.toLocaleString() || '0'}
                            </td>
                            <td style={{
                              padding: '12px 8px',
                              textAlign: 'right',
                              fontSize: 11,
                              color: producto.precio_real > producto.precio_sugerido ? '#28a745' : 
                                     producto.precio_real < producto.precio_sugerido ? '#dc3545' : '#333',
                              fontWeight: 700
                            }}>
                              ${producto.precio_real?.toLocaleString() || '0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Barra horizontal decorativa */}
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #e30613 0%, #ff6b6b 50%, #e30613 100%)',
                    marginTop: '15px',
                    borderRadius: '2px'
                  }}></div>

                  {/* Leyenda de colores */}
                  <div style={{
                    marginTop: 12,
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: 8,
                    fontSize: 10,
                    color: '#666',
                    textAlign: 'center',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ color: '#28a745', fontWeight: 600 }}>●</span> Verde: Precio mayor al sugerido.
                      <span style={{ color: '#dc3545', fontWeight: 600 }}> ●</span> Rojo: Precio menor al sugerido.
                    </div>
                  </div>

                  {/* Botones de Aceptar/Rechazar */}
                  <div style={{
                    marginTop: 15,
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {estadoSeleccionado ? (
                      // Mostrar estado seleccionado y botón de resetear
                      <>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 16px',
                          borderRadius: 8,
                          backgroundColor: estadoSeleccionado === 'aceptado' ? '#d4edda' : '#f8d7da',
                          border: `1px solid ${estadoSeleccionado === 'aceptado' ? '#c3e6cb' : '#f5c6cb'}`,
                          fontSize: 12,
                          fontWeight: 600,
                          color: estadoSeleccionado === 'aceptado' ? '#155724' : '#721c24'
                        }}>
                          <span>{estadoSeleccionado === 'aceptado' ? '✓' : '✗'}</span>
                          <span>{estadoSeleccionado === 'aceptado' ? 'PRODUCTOS ACEPTADOS' : 'PRODUCTOS RECHAZADOS'}</span>
                        </div>
                        <button
                          onClick={handleResetearEstado}
                          style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.target.style.background = '#5a6268'}
                          onMouseLeave={e => e.target.style.background = '#6c757d'}
                        >
                          CAMBIAR
                        </button>
                      </>
                    ) : (
                      // Mostrar botones de selección
                      <>
                        <button
                          onClick={handleAceptar}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 20px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.target.style.background = '#218838';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={e => {
                            e.target.style.background = '#28a745';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>✓</span>
                          <span>ACEPTAR</span>
                        </button>
                        <button
                          onClick={handleRechazar}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 20px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.target.style.background = '#c82333';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={e => {
                            e.target.style.background = '#dc3545';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>✗</span>
                          <span>RECHAZAR</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HALLAZGOS Y CARGA DE FOTOS */}
            <div style={{ 
              marginBottom: 18, 
              marginTop: 18,
              opacity: estadoSeleccionado ? 1 : 0.4,
              pointerEvents: estadoSeleccionado ? 'auto' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <label style={{
                fontWeight: 600,
                color: estadoSeleccionado ? '#888' : '#ccc',
                fontSize: 12,
                minWidth: 125,
                marginLeft: 2,
                display: 'block',
                marginBottom: estadoSeleccionado ? 10 : 5,
                letterSpacing: 0.2,
                textAlign: 'left'
              }}>
                {estadoSeleccionado 
                  ? `CARGA TU REPORTE - ${estadoSeleccionado === 'aceptado' ? 'PRODUCTOS ACEPTADOS' : 'PRODUCTOS RECHAZADOS'}`
                  : 'CARGA TU REPORTE'
                }
              </label>
              
              {/* Mensaje informativo cuando está bloqueado */}
              {!estadoSeleccionado && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 10,
                  fontSize: 11,
                  color: '#856404',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  ⚠️ Primero debes ACEPTAR o RECHAZAR los productos registrados
                </div>
              )}

              {/* HALLAZGOS DEL PDV - PRIMERO */}
              <label style={{
                fontWeight: 600,
                color: '#888',
                fontSize: 12,
                minWidth: 125,
                marginLeft: 2,
                display: 'block',
                margin: '18px 0 8px 2px',
                textAlign: 'left'
              }}>
                HALLAZGOS DEL PDV
              </label>
              <textarea
                placeholder="Describe los hallazgos aquí"
                value={hallazgos}
                onChange={e => setHallazgos(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 90,
                  borderRadius: 10,
                  border: '2px solid #e30613',
                  padding: 12,
                  fontSize: 15,
                  background: '#fff',
                  resize: 'vertical',
                  marginBottom: 20,
                  outline: 'none',
                  color: '#222',
                  boxSizing: 'border-box',
                  maxWidth: 340,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block'
                }}
              />

              {/* FOTOS - SEGUNDO */}
              <label style={{
                fontWeight: 600,
                color: '#888',
                fontSize: 12,
                minWidth: 125,
                marginLeft: 2,
                display: 'block',
                marginBottom: 8,
                letterSpacing: 0.2,
                textAlign: 'left'
              }}>
                FOTOS DEL PDV
              </label>
              
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '12px 8px 10px 8px',
                  marginBottom: 0,
                  width: '100%',
                  maxWidth: 340,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files) {
                    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                    setFotos(prevFotos => [...prevFotos, ...files]);
                  }
                }}
              >
                {/* Área drag & drop */}
                <label
                  htmlFor="fotos-input"
                  style={{
                    width: '90%',
                    minHeight: 80,
                    borderRadius: 10,
                    border: '2px dashed #e30613',
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888',
                    fontSize: 14,
                    cursor: 'pointer',
                    marginBottom: 8,
                    padding: 10,
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: 15, color: '#e30613', fontWeight: 600 }}>Selecciona fotos aquí</span>
                  <span style={{ fontSize: 12, color: '#888', marginTop: 2 }}>o toca para tomar (múltiples fotos)</span>
                  <input
                    type="file"
                    //accept="image/*"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    capture="environment"
                    multiple
                    id="fotos-input"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const maxSize = 8 * 1024 * 1024; // 8MB

                      const validFiles = files.filter(file => file.size <= maxSize);

                      if (validFiles.length !== files.length) {
                        alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
                      }

                      // Llamar al handler con los archivos válidos
                      if (validFiles.length > 0) {
                        const fakeEvent = { target: { files: validFiles } };
                        handleFotos(fakeEvent);
                      }
                    }}
                  />
                </label>

                {/* Lista de fotos seleccionadas */}
                {fotos.length > 0 && (
                  <div style={{
                    width: '90%',
                    marginTop: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: 8,
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#e30613',
                      marginBottom: 8,
                      textAlign: 'center'
                    }}>
                      {fotos.length} foto{fotos.length > 1 ? 's' : ''} seleccionada{fotos.length > 1 ? 's' : ''}
                    </div>
                    {fotos.map((foto, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        backgroundColor: '#fff',
                        borderRadius: 6,
                        marginBottom: 4,
                        border: '1px solid #ddd'
                      }}>
                        <span style={{
                          fontSize: 11,
                          color: '#333',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginRight: 8
                        }}>
                          {foto.name}
                        </span>
                        <button
                          onClick={() => removerFoto(index)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          ✗
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de cargar reporte */}
              <button
                onClick={estadoSeleccionado ? handleGuardar : undefined}
                disabled={!estadoSeleccionado}
                style={{
                  background: estadoSeleccionado ? '#e30613' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 0',
                  fontWeight: 'bold',
                  fontSize: 17,
                  cursor: estadoSeleccionado ? 'pointer' : 'not-allowed',
                  marginTop: 18,
                  width: '100%',
                  maxWidth: 340,
                  boxShadow: estadoSeleccionado ? '0 2px 8px #e3061322' : 'none',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: 40, // Espacio extra bajo el botón
                  transition: 'all 0.3s ease',
                  opacity: estadoSeleccionado ? 1 : 0.6
                }}
              >
                {estadoSeleccionado 
                  ? `CARGAR REPORTE - ${estadoSeleccionado === 'aceptado' ? 'ACEPTADO' : 'RECHAZADO'}`
                  : 'CARGAR REPORTE'
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxWidth: 400,
            width: '90%',
            position: 'relative',
            animation: 'modalSlideIn 0.4s ease-out'
          }}>
            {/* Icono de éxito */}
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 16px rgba(39, 174, 96, 0.3)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 12l2 2 4-4" 
                  stroke="white" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <h2 style={{
              color: '#27ae60', 
              margin: '0 0 12px', 
              fontWeight: 700,
              fontSize: 24
            }}>
              ¡Reporte Enviado!
            </h2>
            
            <p style={{
              color: '#555', 
              margin: '0 0 24px',
              fontSize: 16,
              lineHeight: 1.5
            }}>
              Tu reporte de Mystery Shopper ha sido guardado correctamente. 
              {estadoSeleccionado === 'aceptado' 
                ? ' Los productos fueron ACEPTADOS.' 
                : ' Los productos fueron RECHAZADOS.'
              }
            </p>
            
            <button 
              onClick={() => setShowSuccessModal(false)} 
              style={{
                background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 12,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(39, 174, 96, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
              }}
            >
              Continuar
            </button>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
