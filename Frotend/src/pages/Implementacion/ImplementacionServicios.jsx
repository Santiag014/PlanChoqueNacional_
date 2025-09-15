import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { API_URL } from '../../config';

// URL base para la API de Implementación
const API_BASE = `${API_URL}/api/implementacion`;

export default function ImplementacionServicios() {
  const [pdvs, setPdvs] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [foto, setFoto] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [nroVisita, setNroVisita] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroCodigo, setFiltroCodigo] = useState('');

  // Obtener lista de PDVs desde la API
  useEffect(() => {
    const fetchPDVs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/pdvs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        setPdvs(data.data || []);
      } catch (e) {
        console.error('Error fetching PDVs:', e);
        setPdvs([]);
      }
      setLoading(false);
    };
    fetchPDVs();
  }, []);

  // Obtener detalle de PDV desde la API
  const handleVerDetalles = async (id_registro_pdv) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/pdv-detalle?id_registro_pdv=${id_registro_pdv}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      setDetalle(data);
    } catch (e) {
      console.error('Error fetching PDV details:', e);
      setDetalle(null);
    }
    setLoading(false);
  };

  const handleFoto = (e) => {
    setFoto(e.target.files[0]);
  };

  // Obtener usuario logueado de localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const handleGuardar = async () => {
    const formData = new FormData();
    formData.append('pdv_id', detalle.data.id);
    formData.append('user_id', userId);
    formData.append('observaciones', observaciones);
    if (nroVisita) formData.append('nro_visita', nroVisita);
    if (foto) formData.append('foto', foto);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/guardar-implementacion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        alert('Implementación guardada correctamente!');
        setDetalle(null);
        setFoto(null);
        setObservaciones('');
        setNroVisita('');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar. Intenta de nuevo.');
    }
  };

  // Filtro por código PDV
  const pdvsFiltrados = pdvs.filter(p => 
    p.codigo && p.codigo.toString().toLowerCase().includes(filtroCodigo.toLowerCase())
  );

  return (
    <DashboardLayout>
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
                    <th style={{
                      padding: '14px 10px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#e30613',
                      textAlign: 'left'
                    }}>Código PDV</th>
                    <th style={{
                      padding: '14px 10px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#e30613',
                      textAlign: 'left'
                    }}>Agente</th>
                    <th style={{
                      padding: '14px 10px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#e30613',
                      textAlign: 'center'
                    }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pdvsFiltrados.map((pdv, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: i % 2 === 0 ? '#fff' : '#fafafa'
                      }}
                    >
                      <td style={{
                        padding: '12px 10px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#333'
                      }}>{pdv.codigo}</td>
                      <td style={{
                        padding: '12px 10px',
                        fontSize: 14,
                        color: '#666'
                      }}>{pdv.agente}</td>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => handleVerDetalles(pdv.id_registro_pdv)}
                          style={{
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => e.target.style.background = '#218838'}
                          onMouseOut={e => e.target.style.background = '#28a745'}
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Detalle del PDV */}
        {detalle && (
          <div style={{
            borderRadius: 14,
            boxShadow: '0 2px 12px #0001',
            padding: '20px 15px',
            margin: '30px auto 0 auto',
            background: '#fff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              borderBottom: '2px solid #e30613',
              paddingBottom: 10
            }}>
              <h3 style={{
                margin: 0,
                color: '#e30613',
                fontSize: 18,
                fontWeight: 700
              }}>
                Registro de Implementación - {detalle.data?.codigo || 'PDV'}
              </h3>
              <button
                onClick={() => setDetalle(null)}
                style={{
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Información del PDV */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: '#333', marginBottom: 10, fontSize: 16 }}>Información del PDV:</h4>
              <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <p style={{ margin: '5px 0', fontSize: 14 }}>
                  <strong>Código:</strong> {detalle.data?.codigo}
                </p>
                <p style={{ margin: '5px 0', fontSize: 14 }}>
                  <strong>Nombre:</strong> {detalle.data?.nombrePDV}
                </p>
                <p style={{ margin: '5px 0', fontSize: 14 }}>
                  <strong>Dirección:</strong> {detalle.data?.direccion}
                </p>
                <p style={{ margin: '5px 0', fontSize: 14 }}>
                  <strong>Asesor:</strong> {detalle.data?.asesor}
                </p>
                <p style={{ margin: '5px 0', fontSize: 14 }}>
                  <strong>Agente:</strong> {detalle.data?.agente}
                </p>
              </div>
            </div>

            {/* Formulario de implementación */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: '#333', marginBottom: 15, fontSize: 16 }}>Registro de Implementación:</h4>
              
              <div style={{ marginBottom: 15 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#333'
                }}>
                  Número de Visita (opcional):
                </label>
                <input
                  type="text"
                  value={nroVisita}
                  onChange={e => setNroVisita(e.target.value)}
                  placeholder="Ej: 001, 002..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#333'
                }}>
                  Observaciones de Implementación:
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Describe los hallazgos, implementaciones realizadas, observaciones..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#333'
                }}>
                  Foto de Evidencia:
                </label>
                <input
                  type="file"
                  //accept="image/*"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const maxSize = 8 * 1024 * 1024; // 8MB 

                    const validFiles = files.filter(file => file.size <= maxSize);

                    if (validFiles.length !== files.length) {
                      alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
                    }

                    // Llamar al handler con el primer archivo válido
                    if (validFiles.length > 0) {
                      const fakeEvent = { target: { files: [validFiles[0]] } };
                      handleFoto(fakeEvent);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
                {foto && (
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: 12,
                    color: '#28a745',
                    fontStyle: 'italic'
                  }}>
                    ✓ Foto seleccionada: {foto.name}
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleGuardar}
                  disabled={!observaciones.trim()}
                  style={{
                    background: observaciones.trim() ? '#28a745' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: observaciones.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s'
                  }}
                >
                  💾 Guardar Implementación
                </button>
                <button
                  onClick={() => setDetalle(null)}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
