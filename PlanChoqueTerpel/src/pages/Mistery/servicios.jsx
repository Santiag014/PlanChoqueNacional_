import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

// Puedes ajustar la URL base según tu entorno
const API_BASE = 'http://localhost:3001/api';

export default function Servicios() {
  const [pdvs, setPdvs] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [foto, setFoto] = useState(null);
  const [hallazgos, setHallazgos] = useState('');
  const [nroVisita, setNroVisita] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroCodigo, setFiltroCodigo] = useState('');

  // Obtener lista de PDVs desde la API
  useEffect(() => {
    const fetchPDVs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/pdvs`);
        const data = await res.json();
        setPdvs(data.data || []);
      } catch (e) {
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
      const res = await fetch(`${API_BASE}/pdv-detalle?id_registro_pdv=${id_registro_pdv}`);
      const data = await res.json();
      setDetalle(data);
    } catch (e) {
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
    formData.append('pdv_id', detalle.id);
    formData.append('user_id', userId);
    formData.append('hallazgos', hallazgos);
    if (nroVisita) formData.append('nro_visita', nroVisita);
    if (foto) formData.append('foto', foto);

    await fetch(`${API_BASE}/guardar-hallazgo`, {
      method: 'POST',
      body: formData
    });
    alert('Guardado!');
    setDetalle(null);
    setFoto(null);
    setHallazgos('');
    setNroVisita('');
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
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 2px 12px #0001',
            padding: '28px 18px 24px 18px',
            margin: '30px auto 0 auto',
            minHeight: 420,
            position: 'relative'
          }}>
            <button
              onClick={() => setDetalle(null)}
              style={{
                position: 'absolute',
                top: 18,
                left: -10, // Mueve el botón más a la izquierda fuera del contenido
                background: '#fff',
                borderRadius: 8,
                padding: '6px 10px',
                color: '#e30613',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                minHeight: 0,
                zIndex: 2,
                boxShadow: '0 2px 8px #e3061322'
              }}
              aria-label="Volver"
            >
              <svg width="40" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M14 18L8 11L14 4" stroke="#e30613" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* Espacio para que el botón no tape el contenido */}
            <div style={{ height: 10 }} />
            {/* AGENTE COMERCIAL */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 10 }}>
              <label style={{ fontWeight: 700, color: '#888', fontSize: 15, minWidth: 150 }}>
                AGENTE COMERCIAL
              </label>
              <div style={{
                background: '#e30613',
                color: '#fff',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 16,
                minWidth: 120,
                textAlign: 'center'
              }}>
                {detalle.agente}
              </div>
            </div>
            {/* NOMBRE DEL ASESOR */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 10 }}>
              <label style={{ fontWeight: 700, color: '#888', fontSize: 15, minWidth: 150 }}>
                NOMBRE DEL ASESOR
              </label>
              <div style={{
                background: '#e30613',
                color: '#fff',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 16,
                minWidth: 120,
                textAlign: 'center'
              }}>
                {detalle.asesor}
              </div>
            </div>
            {/* DIRECCIÓN DEL PDV */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 10 }}>
              <label style={{ fontWeight: 700, color: '#888', fontSize: 15, minWidth: 150 }}>
                DIRECCIÓN DEL PDV
              </label>
              <div style={{
                background: '#f4f4f4',
                color: '#222',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 600,
                fontSize: 15,
                minWidth: 120,
                textAlign: 'center'
              }}>
                {detalle.direccion}
              </div>
            </div>
            {/* MAPA DEL PDV + Nro. Visita */}
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={{ fontWeight: 700, color: '#888', fontSize: 15, display: 'block', marginBottom: 4 }}>MAPA DEL PDV</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <iframe
                  title="Mapa PDV"
                  width="100%"
                  height="180"
                  frameBorder="0"
                  style={{ borderRadius: 10, border: '1.5px solid #e30613' }}
                  src={`https://www.google.com/maps?q=${detalle.lat},${detalle.lng}&z=17&output=embed&markers=color:red%7C${detalle.lat},${detalle.lng}`}
                  allowFullScreen
                ></iframe>
                {/* Nombre PDV abajo a la izquierda */}
                <div style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 8,
                  background: 'rgba(255,255,255,0.95)',
                  color: '#888',
                  fontSize: 13,
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontWeight: 600,
                  boxShadow: '0 1px 4px #0001'
                }}>
                  {detalle.nombrePDV}
                </div>
                {/* Nro. Visita badge rojo abajo a la derecha */}
                {detalle.nro_visita && (
                  <div style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 8,
                    background: '#e30613',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 18,
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px #e3061322'
                  }}>
                    {detalle.nro_visita}
                  </div>
                )}
              </div>
            </div>
            {/* CARGA TU REPORTE (textarea y botón rojo abajo) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 700, color: '#888', fontSize: 15, display: 'block', marginBottom: 4 }}>CARGA TU REPORTE</label>
              <div
                style={{
                  background: '#f4f4f4',
                  borderRadius: 10,
                  padding: '16px 8px 0 8px',
                  marginBottom: 0,
                  maxWidth: 340,
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
              >
                <textarea
                  placeholder="Inserte texto aquí"
                  value={hallazgos}
                  onChange={e => setHallazgos(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 80,
                    borderRadius: 8,
                    border: '2px dashed #e30613',
                    padding: 12,
                    fontSize: 15,
                    background: '#fff',
                    resize: 'vertical',
                    marginBottom: 0,
                    outline: 'none',
                    color: '#222'
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  id="foto-input"
                  style={{ display: 'none' }}
                  onChange={handleFoto}
                />
                <button
                  type="button"
                  style={{
                    background: '#e30613',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 0',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: 12,
                    marginBottom: 0,
                    letterSpacing: 0.2
                  }}
                  onClick={() => document.getElementById('foto-input').click()}
                >
                  {foto ? foto.name : "Adjuntar archivo"}
                </button>
              </div>
            </div>
            <button
              onClick={handleGuardar}
              style={{
                background: '#e30613',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 38px',
                fontWeight: 'bold',
                fontSize: 18,
                cursor: 'pointer',
                marginTop: 10,
                boxShadow: '0 2px 8px #e3061322'
              }}
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}