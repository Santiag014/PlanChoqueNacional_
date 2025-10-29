import React, { useMemo, useState } from 'react';
import { useBonificacionesMercadeo } from '../../hooks/mercadeo/useBonificacionesMercadeo';
import TablaBonificacionesMercadeo from '../../components/mercadeo/TablaBonificacionesMercadeo'


// Recibe asesor_id y pdv_id como props
export default function KPIBonificacionesMercadeo({ asesor_id, pdv_id }) {
  const { bonificaciones, loading, error } = useBonificacionesMercadeo();
  const [modalOpen, setModalOpen] = useState(false);

  // Sumar todos los puntos de bonificaciones (ya filtrados si aplica)
  const totalPuntos = useMemo(() => {
    let filtradas = bonificaciones;
    if (asesor_id) filtradas = filtradas.filter(b => String(b.asesor_id) === String(asesor_id));
    if (pdv_id) filtradas = filtradas.filter(b => String(b.pdv_id) === String(pdv_id));
    return (filtradas || []).reduce((sum, b) => sum + (b.puntos || 0), 0);
  }, [bonificaciones, asesor_id, pdv_id]);

  return (
    <>
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 2px 12px #eee',
          width: '100%',
          margin: '0 auto',
          cursor: 'pointer',
          position: 'relative',
          transition: 'box-shadow 0.2s',
          textAlign: 'center',
        }}
        onClick={() => setModalOpen(true)}
        title="Ver detalle de bonificaciones"
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#e30613',
          color: '#fff',
          fontWeight: 700,
          fontSize: '12px',
          borderRadius: '18px 0 18px 0',
          padding: '7px 22px 7px 18px',
          letterSpacing: '1px',
          boxShadow: '0 2px 8px #eee',
        }}>
          BONIFICACIONES
        </div>
        <div style={{ marginTop: 32, marginBottom: 3 }}>
          {loading ? (
            <span style={{ color: '#888', fontWeight: 500 }}>Cargando...</span>
          ) : error ? (
            <span style={{ color: '#e30613', fontWeight: 500 }}>{error}</span>
          ) : (
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f7941d' }}>{totalPuntos.toLocaleString()}</span>
          )}
        </div>
        <div style={{ color: '#e30613', fontWeight: 600, fontSize: '0.65rem', marginBottom: 0, letterSpacing: '1px' }}>
          PUNTOS OBTENIDOS
        </div>
        <div style={{ borderTop: '1.5px solid #e30613', margin: '9px 0 0 0' }}></div>
        <div style={{ color: '#888', fontSize: '0.65rem', marginTop: 8, marginBottom: 8 }}>
          Click para ver detalle
        </div>
      </div>

      {/* Modal con la tabla de bonificaciones */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setModalOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 18, padding: 0, minWidth: 340, maxWidth: 900, width: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: 12, right: 18, background: 'none', border: 'none', fontSize: '2rem', color: '#e30613', cursor: 'pointer', zIndex: 2 }}
              title="Cerrar"
            >×</button>
            <TablaBonificacionesMercadeo asesor_id={asesor_id} pdv_id={pdv_id} />
          </div>
        </div>
      )}
    </>
  );
}
