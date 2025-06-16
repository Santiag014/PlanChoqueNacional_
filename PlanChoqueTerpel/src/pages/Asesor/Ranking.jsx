import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const podio = [
  {
    puesto: 2,
    nombre: '2do',
    puntos: 15483,
    color: '#b0b0b0',
    trofeo: '🥈',
  },
  {
    puesto: 1,
    nombre: '1er',
    puntos: 16847,
    color: '#ffd700',
    trofeo: '🥇',
  },
  {
    puesto: 3,
    nombre: '3er',
    puntos: 12234,
    color: '#cd7f32',
    trofeo: '🥉',
  }
];

const tabla = [
  { puesto: 4, nombre: 'NOMBRE', puntos: 56 },
  { puesto: 5, nombre: 'NOMBRE', puntos: 52 },
  { puesto: 6, nombre: 'NOMBRE', puntos: 50 },
  { puesto: 7, nombre: 'NOMBRE', puntos: 48 },
  { puesto: 8, nombre: 'NOMBRE', puntos: 45 },
  { puesto: 9, nombre: 'NOMBRE', puntos: 43 },
  { puesto: 10, nombre: 'NOMBRE', puntos: 40 },
  { puesto: 11, nombre: 'NOMBRE', puntos: 39 },
  { puesto: 12, nombre: 'NOMBRE', puntos: 36 },
  { puesto: 13, nombre: 'NOMBRE', puntos: 35 }
];

export default function Ranking() {
  const [filtro, setFiltro] = useState('GENERAL');

  return (
    <DashboardLayout>
      <div style={{
        width: '100%',
        margin: '0 auto',
        padding: '18px 25px 70px 25px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#f4f4f4',
        borderRadius: 12,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>
        {/* Botones de filtro */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
          {['GENERAL', 'REGIONAL', 'ZONA'].map(btn => (
            <button
              key={btn}
              onClick={() => setFiltro(btn)}
              style={{
                background: filtro === btn ? '#e30613' : '#f4f4f4',
                color: filtro === btn ? '#fff' : '#e30613',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                padding: '7px 22px',
                cursor: 'pointer',
                boxShadow: filtro === btn ? '0 2px 8px #e3061322' : 'none',
                letterSpacing: 1,
                transition: 'background 0.2s'
              }}
            >
              {btn}
            </button>
          ))}
        </div>
        {/* Podio */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: '100%',
          margin: '0 0 18px 0'
        }}>
          {/* 2do lugar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: 8,
            position: 'relative'
          }}>
            {/* Cinta */}
            <div style={{
              position: 'absolute',
              top: 8,
              left: -12,
              width: 60,
              height: 18,
              background: '#b0b0b0',
              color: '#fff',
              fontWeight: 700,
              fontSize: 11,
              textAlign: 'center',
              lineHeight: '18px',
              transform: 'rotate(-18deg)',
              zIndex: 2,
              boxShadow: '0 2px 6px #0002'
            }}>
              2do Lugar
            </div>
            <span style={{ fontSize: 38 }}>{podio[0].trofeo}</span>
            <div style={{
              background: '#e30613',
              width: 54,
              height: 70,
              borderRadius: '8px 8px 0 0',
              marginTop: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <span style={{ color: '#b0b0b0', fontWeight: 900, fontSize: 22, marginBottom: -2 }}>2do</span>
              <span style={{ color: '#222', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{podio[0].puntos}</span>
            </div>
            <span style={{
              fontSize: 11,
              color: '#b0b0b0',
              fontWeight: 600,
              marginTop: 2,
              textAlign: 'center',
              minHeight: 18
            }}>{podio[0].cita}</span>
          </div>
          {/* 1er lugar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 8px',
            position: 'relative'
          }}>
            {/* Cinta */}
            <div style={{
              position: 'absolute',
              top: 8,
              left: -14,
              width: 68,
              height: 20,
              background: '#ffd700',
              color: '#222',
              fontWeight: 900,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: '20px',
              transform: 'rotate(-18deg)',
              zIndex: 2,
              boxShadow: '0 2px 6px #0002'
            }}>
              1er Lugar
            </div>
            <span style={{ fontSize: 44 }}>{podio[1].trofeo}</span>
            <div style={{
              background: '#e30613',
              width: 62,
              height: 100,
              borderRadius: '8px 8px 0 0',
              marginTop: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <span style={{ color: '#ffd700', fontWeight: 900, fontSize: 26, marginBottom: -2 }}>1er</span>
              <span style={{ color: '#222', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{podio[1].puntos}</span>
            </div>
            <span style={{
              fontSize: 12,
              color: '#ffd700',
              fontWeight: 700,
              marginTop: 2,
              textAlign: 'center',
              minHeight: 18
            }}>{podio[1].cita}</span>
          </div>
          {/* 3er lugar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginLeft: 8,
            position: 'relative'
          }}>
            {/* Cinta */}
            <div style={{
              position: 'absolute',
              top: 8,
              left: -12,
              width: 60,
              height: 18,
              background: '#cd7f32',
              color: '#fff',
              fontWeight: 700,
              fontSize: 11,
              textAlign: 'center',
              lineHeight: '18px',
              transform: 'rotate(-18deg)',
              zIndex: 2,
              boxShadow: '0 2px 6px #0002'
            }}>
              3er Lugar
            </div>
            <span style={{ fontSize: 38 }}>{podio[2].trofeo}</span>
            <div style={{
              background: '#e30613',
              width: 54,
              height: 55,
              borderRadius: '8px 8px 0 0',
              marginTop: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <span style={{ color: '#cd7f32', fontWeight: 900, fontSize: 22, marginBottom: -2 }}>3er</span>
              <span style={{ color: '#222', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{podio[2].puntos}</span>
            </div>
            <span style={{
              fontSize: 11,
              color: '#cd7f32',
              fontWeight: 600,
              marginTop: 2,
              textAlign: 'center',
              minHeight: 18
            }}>{podio[2].cita}</span>
          </div>
        </div>
        {/* Tabla de posiciones */}
        <div style={{
          width: '100%',
          background: '#ededed',
          borderRadius: 10,
          marginTop: 0,
          marginBottom: 10,
          border: '2px solid #d3d3d3',
          overflow: 'hidden'
        }}>
          {/* Encabezado */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ededed',
            borderBottom: '2px solid #d3d3d3',
            padding: '8px 0',
            fontWeight: 900,
            fontSize: 15,
            color: '#e30613',
            textAlign: 'center'
          }}>
            <span style={{ width: 28 }}>#</span>
            <span style={{ flex: 1 }}>NOMBRE</span>
            <span style={{ width: 32 }}>PTS</span>
          </div>
          {/* Filas */}
          {tabla.map(row => (
            <div key={row.puesto} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ededed',
              borderBottom: '1.5px solid #d3d3d3',
              padding: '7px 0',
              fontWeight: 700,
              fontSize: 15,
              color: '#555',
              textAlign: 'center'
            }}>
              <span style={{ width: 28 }}>{row.puesto}</span>
              <span style={{ flex: 1 }}>{row.nombre}</span>
              <span style={{ width: 32 }}>{row.puntos}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
