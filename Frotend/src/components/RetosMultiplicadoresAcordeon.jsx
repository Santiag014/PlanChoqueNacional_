
import React, { useState, useCallback } from 'react';


// Definición de los retos posibles y su descripción corta
const RETOS_DEFINICIONES = [
  {
    descripcion: 'Ejecución Perfecta',
    detalle: 'Logra 100% en Cobertura y Frecuencia para 1.000 pts extra.'
  },
  {
    descripcion: 'Campeón de Zona',
    detalle: 'Más galones vendidos en tu zona, 1.000 pts extra.'
  },
  {
    descripcion: 'Primero en Actuar',
    detalle: 'Primeros 10 asesores con 100% de meta de Cobertura suman 2.000 pts.'
  },
  {
    descripcion: 'Los quiero todos',
    detalle: 'Vende una nueva referencia Lubs y suma 200 pts por registro válido.'
  }
];

// Agrupa los retos por descripcion y asegura que todos los retos definidos aparecen
function agruparRetosPorDescripcion(retos) {
  const agrupados = {};
  retos.forEach(reto => {
    const clave = reto.descripcion || 'Sin descripción';
    if (!agrupados[clave]) agrupados[clave] = [];
    agrupados[clave].push(reto);
  });
  // Asegura que todos los retos definidos aparecen aunque no tengan registros
  return RETOS_DEFINICIONES.map(r => ({
    descripcion: r.descripcion,
    registros: agrupados[r.descripcion] || [],
    detalle: r.detalle
  }));
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
      boxShadow: '0 12px 48px rgba(227,6,19,0.15)',
      padding: '0 0 18px 0',
      border: '1.5px solid #eaeaea',
      transition: 'box-shadow 0.2s, width 0.2s',
      position: 'relative'
    }}>
      <h3 style={{
        color: '#e30613',
        fontWeight: 700,
        fontSize: '1.32rem',
        marginBottom: '16px',
        textAlign: 'center',
        letterSpacing: '0.5px',
        paddingTop: '18px',
        paddingBottom: '2px',
        borderRadius: '28px 28px 0 0',
        background: 'linear-gradient(90deg, #e30613 80%, #f7941d 100%)',
        // color: '#fff',
        boxShadow: '0 2px 12px rgba(227,6,19,0.10)'
      }}>Detalle • Bonificaciones</h3>
      <div style={{
        background: '#fff',
        borderRadius: '22px',
        boxShadow: '0 8px 32px rgba(227,6,19,0.13)',
        overflow: 'hidden',
        border: '1px solid #eaeaea',
        padding: '18px 0',
        margin: '0 18px',
        minWidth: '504px',
        width: '504px',
        maxWidth: '504px',
        transition: 'width 0.2s'
      }}>
        <div style={{textAlign:'center', color:'#e30613', fontWeight:700, fontSize:'1.08rem', marginBottom:'10px'}}>Retos Multiplicadores</div>
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
      boxShadow: open ? '0 8px 32px rgba(227,6,19,0.13)' : 'none',
      margin: '0 0 2px 0',
      minWidth: '100%',
      width: '100%'
    }}>
      <div
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', cursor: 'pointer', background: open ? '#fff7e6' : '#fff',
          borderLeft: open ? '8px solid #e30613' : '8px solid transparent',
          transition: 'background 0.2s, border-left 0.2s', fontWeight: 600,
          borderRadius: open ? '22px 22px 0 0' : '22px', minHeight: '56px',
          boxShadow: open ? '0 2px 12px rgba(227,6,19,0.10)' : 'none',
          width: '100%'
        }}
      >
        <div style={{display:'flex', flexDirection:'column', flex:1}}>
          <span style={{fontWeight:700, color:'#e30613', fontSize:'1.18rem', letterSpacing:'0.5px'}}>{grupo.descripcion}</span>
          <span style={{fontSize:'1rem', color:'#888', marginTop:'2px'}}>{grupo.registros.length > 0 ? `${grupo.registros.length} registro${grupo.registros.length > 1 ? 's' : ''}` : 'Sin registros aún'}</span>
        </div>
        <span style={{fontWeight:700, color:'#f7941d', fontSize:'1.18rem', marginLeft:'22px'}}>{puntosTotales} pts</span>
        <span style={{fontSize:'1.5rem', color:'#e30613', marginLeft:'28px', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none'}}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          padding:'22px 28px', background:'#fff7e6', borderRadius:'0 0 22px 22px', animation:'fadeIn 0.3s',
          minWidth:'100%', width:'100%'
        }}>
          <div style={{marginBottom:'10px', color:'#e30613', fontWeight:500, fontSize:'1.05rem', textAlign:'left'}}>{grupo.detalle}</div>
          <div style={{display:'flex', flexDirection:'column', gap:'8px', width:'100%'}}>
            {grupo.registros.length > 0 ? (
              grupo.registros.map((reto, idx) => (
                <div key={idx} style={{background:'#fff', borderRadius:'8px', boxShadow:'0 1px 6px rgba(227,6,19,0.07)', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'1rem', width:'100%'}}>
                  {/* Detalle en una sola línea */}
                  <span style={{color:'#333', flex:1}}>
                    {mostrarPDV && reto.pdv_id && (<b style={{color:'#e30613'}}>PDV: {reto.pdv_id}</b>)}
                    {mostrarPDV && reto.pdv_id && ' | '}
                    <b>Agente:</b> {reto.id_agente || reto.uid_agente} | <b>Fecha:</b> {new Date(reto.created).toLocaleDateString()} | <b>Puntos:</b> <span style={{color:'#f7941d'}}>{reto.puntos}</span>
                  </span>
                </div>
              ))
            ) : (
              <div style={{background:'#fff', borderRadius:'8px', boxShadow:'0 1px 6px rgba(227,6,19,0.07)', padding:'8px 12px', color:'#888', fontSize:'1rem', textAlign:'center', width:'100%'}}>Aún no tienes registros para este reto.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
