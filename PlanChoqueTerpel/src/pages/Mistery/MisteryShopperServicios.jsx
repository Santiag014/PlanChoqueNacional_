import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { API_URL } from '../../config';

// Puedes ajustar la URL base según tu entorno
const API_BASE = `${API_URL}/api/mistery-shopper`;

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
                value={detalle.agente}
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
                value={detalle.asesor}
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
                value={detalle.direccion}
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
                <iframe
                  title="Mapa PDV"
                  width="100%"
                  height="180"
                  frameBorder="0"
                  src={`https://www.google.com/maps?q=${detalle.lat},${detalle.lng}&z=15&output=embed&markers=color:red%7C${detalle.lat},${detalle.lng}`}
                  allowFullScreen
                ></iframe>
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
                    {detalle.nombrePDV}
                  </span>
                  {/* Nro. visita al PDV a la derecha */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#888', fontWeight: 600, fontSize: 11 }}>No. visita al PDV</span>
                    <input
                      type="number"
                      min={1}
                      value={nroVisita || detalle.nro_visita || ''}
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
            {/* CARGA TU REPORTE (drag & drop y botón de foto) */}
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
                CARGA TU REPORTE
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
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setFoto(e.dataTransfer.files[0]);
                  }
                }}
              >
                {/* Área drag & drop */}
                <label
                  htmlFor="foto-input"
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
                  {foto
                    ? (
                      <>
                        <span style={{ color: '#e30613', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Archivo seleccionado:</span>
                        <span style={{ color: '#222', fontSize: 13, wordBreak: 'break-all' }}>{foto.name}</span>
                      </>
                    )
                    : (
                      <>
                        <span style={{ fontSize: 15, color: '#e30613', fontWeight: 600 }}>Selecciona una foto aquí</span>
                        <span style={{ fontSize: 12, color: '#888', marginTop: 2 }}>o toca para tomar</span>
                      </>
                    )
                  }
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="foto-input"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) setFoto(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
              {/* Textarea de hallazgos */}
              <label style={{
                fontWeight: 600,
                color: '#888',
                fontSize: 12,
                minWidth: 125,
                marginLeft: 2,
                display: 'block',
                margin: '18px 0 4px 2px',
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
                  marginBottom: 0,
                  outline: 'none',
                  color: '#222',
                  boxSizing: 'border-box',
                  maxWidth: 340,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block'
                }}
              />
              {/* Botón de cargar reporte */}
              <button
                onClick={handleGuardar}
                style={{
                  background: '#e30613',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 0',
                  fontWeight: 'bold',
                  fontSize: 17,
                  cursor: 'pointer',
                  marginTop: 18,
                  width: '100%',
                  maxWidth: 340,
                  boxShadow: '0 2px 8px #e3061322',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: 40 // Espacio extra bajo el botón
                }}
              >
                CARGAR REPORTE
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}