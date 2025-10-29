
import React, { useState, useCallback } from 'react';

// Agrupa los retos por descripcion, usando el detalle que viene del backend
function agruparRetosPorDescripcion(retos) {
  const agrupados = {};
  retos.forEach(reto => {
    const clave = reto.descripcion || 'Sin descripción';
    if (!agrupados[clave]) agrupados[clave] = [];
    agrupados[clave].push(reto);
  });
  // Solo mostrar los retos que realmente tiene el usuario, usando el detalle del primer registro
  return Object.keys(agrupados).map(descripcion => {
    const registros = agrupados[descripcion];
    const detalle = registros[0]?.detalle || '';
    return { descripcion, registros, detalle };
  });
}

export default function RetosMultiplicadoresAcordeon({ retos, mostrarPDV, modoPopup }) {
  const retosAgrupados = agruparRetosPorDescripcion(retos || []);
  return (
    <div style={{
      marginTop: modoPopup ? '0' : '18px',
      maxWidth: '540px',
      minWidth: '540px',
      width: '540px',
      marginLeft: 'auto',
      marginRight: 'auto',
      background: 'linear-gradient(180deg, #fff 80%, #fff7e6 100%)',
      borderRadius: '28px',
      padding: '0 0 18px 0',
      transition: 'box-shadow 0.2s, width 0.2s',
      position: 'relative'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '22px',
        overflow: 'hidden',
        padding: '18px 0',
        margin: '0 18px',
        minWidth: '504px',
        width: '504px',
        maxWidth: '504px',
        transition: 'width 0.2s'
      }}>
        {retosAgrupados.map((grupo, idx) => (
          <AcordeonGrupoReto key={idx} grupo={grupo} mostrarPDV={mostrarPDV} modoPopup={modoPopup} />
        ))}
      </div>
    </div>
  );
}



function AcordeonGrupoReto({ grupo, mostrarPDV, modoPopup }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(o => !o), []);
  // Calcular puntos totales del reto
  const puntosTotales = grupo.registros.reduce((sum, r) => sum + (r.puntos || 0), 0);
  return (
    <div style={{
      borderBottom: '1px solid #eee',
      transition: 'box-shadow 0.2s',
      margin: '0 0 2px 0',
      minWidth: '100%',
      width: '100%'
    }}>
      <div
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px', cursor: 'pointer', background: open ? '#fff7e6' : '#fff',
          borderLeft: open ? '8px solid #e30613' : '8px solid transparent',
          transition: 'background 0.2s, border-left 0.2s', fontWeight: 600,
          borderRadius: open ? '22px 22px 0 0' : '22px', minHeight: '56px',
          boxShadow: open ? '0 2px 12px rgba(227,6,19,0.10)' : 'none',
          width: '100%'
        }}
      >
        <div style={{display:'flex', flexDirection:'column', flex:1}}>
          <span style={{fontWeight:700, color:'#e30613', fontSize:'0.95rem', letterSpacing:'0.5px'}}>{grupo.descripcion}</span>
        </div>
        <span style={{fontWeight:700, color:'#f7941d', fontSize:'1.05rem', marginLeft:'22px'}}>{puntosTotales} pts</span>
        <span style={{fontSize:'1.5rem', color:'#e30613', marginLeft:'28px', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none'}}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          padding:'10px 12px', background:'#fff7e6', borderRadius:'0 0 22px 22px', animation:'fadeIn 0.3s',
          minWidth:'100%', width:'100%'
        }}>
          <div style={{marginBottom:'10px', color:'#e30613', fontWeight:500, fontSize:'0.85rem', textAlign:'center'}}>{grupo.detalle}</div>
          <div style={{display:'flex', flexDirection:'column', gap:'8px', width:'100%'}}>
            {grupo.registros.length > 0 ? (
              grupo.registros.map((reto, idx) => (
                <div key={idx} style={{borderRadius:'8px', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'1rem', width:'100%'}}>
                  {/* Detalle en una sola línea */}
                </div>
              ))
            ) : (
              <div style={{background:'#fff', borderRadius:'8px', boxShadow:'0 1px 6px rgba(227,6,19,0.07)', padding:'8px 12px', color:'#888', fontSize:'0.8rem', textAlign:'center', width:'100%'}}>Aún no tienes registros para este reto.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
