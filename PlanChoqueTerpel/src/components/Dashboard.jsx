import { useEffect, useState } from 'react';
import { getDashboardData, getVisitasPorPDV } from '../services/dataService';

export default function Dashboard({ user }) {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const data = getDashboardData(user.user);

  useEffect(() => {
    if (!user.id) return;
    getVisitasPorPDV(user.id)
      .then(setVisitas)
      .catch(() => setVisitas([]))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div>Cargando datos...</div>;

  return (
    <div style={{ background: '#fff', color: '#222', borderRadius: 8, padding: 24, maxWidth: 700, margin: '40px auto' }}>
      <h2>Bienvenido, {user.name}</h2>
      <h3>Ventas por mes</h3>
      <div style={{ width: 600, height: 300 }}>
        <svg width="100%" height="250">
          {/* Ejes */}
          <line x1="50" y1="20" x2="50" y2="220" stroke="#888" />
          <line x1="50" y1="220" x2="580" y2="220" stroke="#888" />
          {/* Barras */}
          {visitas.map((v, i) => (
            <rect
              key={v.num_pdv}
              x={60 + i * 60}
              y={220 - v.visitas * 10}
              width={40}
              height={v.visitas * 10}
              fill="#e30613"
            />
          ))}
          {/* Etiquetas */}
          {visitas.map((v, i) => (
            <text
              key={v.num_pdv + '_label'}
              x={80 + i * 60}
              y={235}
              textAnchor="middle"
              fontSize="12"
            >
              {v.num_pdv}
            </text>
          ))}
          {/* Valores */}
          {visitas.map((v, i) => (
            <text
              key={v.num_pdv + '_value'}
              x={80 + i * 60}
              y={210 - v.visitas * 10}
              textAnchor="middle"
              fontSize="12"
              fill="#222"
            >
              {v.visitas}
            </text>
          ))}
        </svg>
      </div>
      <h3 style={{ marginTop: 32 }}>Ventas por mes</h3>
      <div style={{ width: 600, height: 300 }}>
        <svg width="100%" height="250">
          {/* Ejes */}
          <line x1="50" y1="20" x2="50" y2="220" stroke="#888" />
          <line x1="50" y1="220" x2="580" y2="220" stroke="#888" />
          {/* Barras */}
          {data.ventas.map((v, i) => (
            <rect
              key={i}
              x={60 + i * 60}
              y={220 - v * 10}
              width={40}
              height={v * 10}
              fill={v >= data.meta ? "#e30613" : "#ffe259"}
              stroke="#e30613"
            />
          ))}
          {/* Meta */}
          <line x1="50" y1={220 - data.meta * 10} x2="580" y2={220 - data.meta * 10} stroke="#e30613" strokeDasharray="4" />
          {/* Etiquetas */}
          {data.meses.map((m, i) => (
            <text
              key={i}
              x={80 + i * 60}
              y={235}
              textAnchor="middle"
              fontSize="12"
            >
              {m}
            </text>
          ))}
        </svg>
      </div>
      <p style={{ marginTop: 16 }}>Meta mensual: <b>{data.meta}</b></p>
    </div>
  );
}
