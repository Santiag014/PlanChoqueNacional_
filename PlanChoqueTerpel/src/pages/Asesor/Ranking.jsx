import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import '../../styles/Asesor/Ranking.css';

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
];

export default function Ranking() {
  const [filtro, setFiltro] = useState('GENERAL');

  return (
    <DashboardLayout>
      <div className="ranking-container">
        {/* Botones de filtro */}
        <div className="filtro-buttons">
          {['GENERAL', 'REGIONAL', 'ZONA'].map(btn => (
            <button
              key={btn}
              onClick={() => setFiltro(btn)}
              className={`filtro-button ${filtro === btn ? 'active' : ''}`}
            >
              {btn}
            </button>
          ))}
        </div>
        {/* Podio */}
        <div className="podio-container">
          {/* 2do lugar */}
          <div className="podio-position segundo">
            {/* Cinta */}
            <div className="cinta segundo">
              2do Lugar
            </div>
            <span className="trofeo">{podio[0].trofeo}</span>
            <div className="podio-base segundo">
              <span className="podio-posicion segundo">2do</span>
              <span className="podio-puntos segundo">{podio[0].puntos}</span>
            </div>
            <span className="podio-cita segundo">{podio[0].cita}</span>
          </div>
          {/* 1er lugar */}
          <div className="podio-position primero">
            {/* Cinta */}
            <div className="cinta primero">
              1er Lugar
            </div>
            <span className="trofeo primero">{podio[1].trofeo}</span>
            <div className="podio-base primero">
              <span className="podio-posicion primero">1er</span>
              <span className="podio-puntos primero">{podio[1].puntos}</span>
            </div>
            <span className="podio-cita primero">{podio[1].cita}</span>
          </div>
          {/* 3er lugar */}
          <div className="podio-position tercero">
            {/* Cinta */}
            <div className="cinta tercero">
              3er Lugar
            </div>
            <span className="trofeo">{podio[2].trofeo}</span>
            <div className="podio-base tercero">
              <span className="podio-posicion tercero">3er</span>
              <span className="podio-puntos tercero">{podio[2].puntos}</span>
            </div>
            <span className="podio-cita tercero">{podio[2].cita}</span>
          </div>
        </div>
        {/* Tabla de posiciones */}
        <div className="tabla-ranking">
          {/* Encabezado */}
          <div className="tabla-header">
            <span className="tabla-header-puesto">#</span>
            <span className="tabla-header-nombre">NOMBRE</span>
            <span className="tabla-header-puntos">PTS</span>
          </div>
          {/* Filas */}
          {tabla.map(row => (
            <div key={row.puesto} className="tabla-fila">
              <span className="tabla-fila-puesto">{row.puesto}</span>
              <span className="tabla-fila-nombre">{row.nombre}</span>
              <span className="tabla-fila-puntos">{row.puntos}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
