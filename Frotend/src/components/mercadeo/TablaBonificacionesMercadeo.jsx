
import React, { useMemo } from 'react';
import { useBonificacionesMercadeo } from '../../hooks/mercadeo/useBonificacionesMercadeo';

// Recibe asesor_id y pdv_id como props para filtrar desde los filtros globales
export default function TablaBonificacionesMercadeo({ asesor_id, pdv_id }) {
  const { bonificaciones, loading, error, refetch } = useBonificacionesMercadeo();

  // Filtrar bonificaciones por asesor_id y pdv_id si se reciben
  const bonificacionesFiltradas = useMemo(() => {
    let filtradas = bonificaciones;
    if (asesor_id) {
      filtradas = filtradas.filter(b => String(b.asesor_id) === String(asesor_id));
    }
    if (pdv_id) {
      filtradas = filtradas.filter(b => String(b.pdv_id) === String(pdv_id));
    }
    return filtradas;
  }, [bonificaciones, asesor_id, pdv_id]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 18, padding: 24 }}>
      <h2 style={{ color: '#e30613', marginBottom: 18 }}>Bonificaciones de Asesores</h2>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
      </div>
      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>Cargando bonificaciones...</div>
      ) : error ? (
        <div style={{ color: '#e30613', textAlign: 'center', padding: 24 }}>{error}</div>
      ) : bonificacionesFiltradas.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>No hay bonificaciones registradas.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: '#f7f7f7' }}>
                <th style={thStyle}>Asesor</th>
                <th style={thStyle}>Reto Bonificador</th>
                <th style={thStyle}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {bonificacionesFiltradas.map((b, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{b.asesor}</td>
                  <td style={tdStyle}>{b.descripcion}</td>
                  <td style={{ ...tdStyle, color: '#f7941d', fontWeight: 700 }}>{b.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#e30613', borderBottom: '2px solid #e30613' };
const tdStyle = { padding: '8px 8px', textAlign: 'left' };
