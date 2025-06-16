import { useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { API_URL } from '../../config';

// Degradado de rojos y grises minimalista
const REDS = [
  '#e30613', // rojo principal
  '#a1000b', // rojo oscuro
  '#ff6961', // rojo claro
  '#ffb3b3', // rosa pálido
  '#ffe5e5', // fondo muy claro
  '#b0b0b0', // gris medio
  '#888',    // gris oscuro
  '#222',    // casi negro
  '#f4f4f4', // gris claro
];
function getColor(idx) {
  return REDS[idx % REDS.length];
}

export default function DashboardPage() {
  const location = useLocation();
  const user = location.state?.user;
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showFiltro, setShowFiltro] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/api/visitas-pdv/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setVisitas(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const visitasFiltradas = visitas.filter(v =>
    v.num_pdv.toString().toLowerCase().includes(filtro.toLowerCase())
  );
  const totalVisitas = visitasFiltradas.reduce((sum, v) => sum + v.visitas, 0);
  const totalPDV = visitasFiltradas.length;

  // Nuevo: detectar si es móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parámetros de la gráfica según dispositivo
  const barWidth = isMobile ? 14 : 36;
  const barGap = isMobile ? 18 : 60;
  const svgHeight = isMobile ? 120 : 220;
  const svgTop = isMobile ? 10 : 20;
  const svgBottom = isMobile ? 100 : 200;
  const labelY = isMobile ? svgHeight - 5 : 215;
  const valueYOffset = isMobile ? 8 : 10;
  const barScale = isMobile ? 3.5 : 7; // Factor para altura de barra

  return (
    <DashboardLayout user={user}>
      {/* KPI superior: total de puntos de venta */}
      <div
        className={`kpi-pdv-box${isMobile ? ' mobile' : ''}`}
        style={{
          width: isMobile ? '98vw' : '100%',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: isMobile ? '10px 0 4px 0' : '18px 0 8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: isMobile ? '8px auto 6px auto' : '12px 0 8px 0',
          border: '2px solid #e30613',
          maxWidth: isMobile ? '98vw' : 480,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
        <div
          className={`kpi-pdv-title${isMobile ? ' mobile' : ''}`}
          style={{
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(90deg,#e30613 60%,#ffa751 100%)',
            borderRadius: 8,
            padding: isMobile ? '5px 12px' : '7px 28px',
            fontSize: isMobile ? 13 : 17,
            marginBottom: isMobile ? 6 : 10,
            letterSpacing: 1.2,
            boxShadow: '0 2px 8px #e3061322',
            textAlign: 'center'
          }}>
          PUNTOS DE VENTA
        </div>
        <div
          className={`kpi-pdv-value${isMobile ? ' mobile' : ''}`}
          style={{
            fontSize: isMobile ? 28 : 44,
            fontWeight: 900,
            color: '#e30613',
            letterSpacing: 2,
            marginBottom: 0,
            fontFamily: 'Segoe UI, Arial, sans-serif',
            textAlign: 'center'
          }}>
          {totalPDV}
        </div>
      </div>
      {/* Gráfica de barras */}
      <div
        className={`dashboard-bar-graph${isMobile ? ' mobile' : ''}`}
        style={{
          width: isMobile ? '98vw' : '100%',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '0 0 8px 0',
          margin: isMobile ? '0 auto 8px auto' : '0 auto 12px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: isMobile ? '98vw' : 900,
          overflowX: 'hidden'
        }}>
        <div
          className="dashboard-bar-title"
          style={{
            fontWeight: 700,
            color: '#a1000b',
            margin: isMobile ? '10px 0 6px 0' : '14px 0 8px 0',
            fontSize: isMobile ? 15 : 18,
            letterSpacing: 1.1,
            fontFamily: 'Segoe UI, Arial, sans-serif'
          }}>
          Gráfica de Barras
        </div>
        {visitasFiltradas.length === 0 ? (
          <div style={{ color: '#888', fontWeight: 500, padding: isMobile ? 12 : 24 }}>No hay datos para mostrar.</div>
        ) : (
          <div style={{ width: '100%', overflowX: 'hidden' }}>
            <svg
              width="100%"
              height={svgHeight}
              viewBox={`0 0 ${Math.max(220, visitasFiltradas.length * (barWidth + barGap) + 60)} ${svgHeight}`}
              style={{ marginBottom: 8, display: 'block', height: svgHeight }}
              preserveAspectRatio="none"
            >
              {/* Ejes */}
              <line x1="40" y1={svgTop} x2="40" y2={svgBottom} stroke="#b0b0b0" />
              <line x1="40" y1={svgBottom} x2={Math.max(200, visitasFiltradas.length * (barWidth + barGap) + 40)} y2={svgBottom} stroke="#b0b0b0" />
              {/* Barras */}
              {visitasFiltradas.map((v, i) => {
                const barHeight = Math.max(0, v.visitas * barScale);
                return (
                  <g key={v.num_pdv}>
                    <rect
                      x={50 + i * (barWidth + barGap)}
                      y={svgBottom - barHeight}
                      width={barWidth}
                      height={barHeight}
                      fill="#e30613"
                      rx={isMobile ? 3 : 6}
                    />
                    {/* Valor fuera de la barra */}
                    <text
                      x={50 + i * (barWidth + barGap) + barWidth / 2}
                      y={svgBottom - barHeight - valueYOffset}
                      textAnchor="middle"
                      fontSize={isMobile ? "11" : "15"}
                      fill="#e30613"
                      fontWeight="bold"
                      style={{ fontFamily: 'Segoe UI, Arial, sans-serif', textShadow: '0 1px 4px #fff8' }}
                    >
                      {v.visitas}
                    </text>
                    {/* Nombre PDV debajo */}
                    <text
                      x={50 + i * (barWidth + barGap) + barWidth / 2}
                      y={labelY}
                      textAnchor="middle"
                      fontSize={isMobile ? "10" : "13"}
                      fill="#a1000b"
                      fontWeight="bold"
                      style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                    >
                      {v.num_pdv}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
      {/* Tabla de visitas: solo en desktop */}
      {!isMobile && (
        <div style={{
          width: '100%',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '0 0 8px 0',
          margin: '0 auto 16px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 900
        }}>
          <div style={{
            fontWeight: 700,
            color: '#a1000b',
            margin: '14px 0 8px 0',
            fontSize: 18,
            letterSpacing: 1.1,
            fontFamily: 'Segoe UI, Arial, sans-serif'
          }}>
            Tabla de Visitas
          </div>
          <table style={{
            width: '95%',
            borderCollapse: 'collapse',
            fontSize: 15,
            background: 'transparent',
            fontFamily: 'Segoe UI, Arial, sans-serif'
          }}>
            <thead>
              <tr style={{background: '#ffe5e5'}}>
                <th style={{padding: 8, border: 'none', color: '#a1000b', fontWeight: 700}}>#</th>
                <th style={{padding: 8, border: 'none', color: '#888', fontWeight: 700}}>PDV</th>
                <th style={{padding: 8, border: 'none', color: '#e30613', fontWeight: 700}}>Visitas</th>
                <th style={{padding: 8, border: 'none', color: '#444', fontWeight: 700}}>%</th>
              </tr>
            </thead>
            <tbody>
              {visitasFiltradas.map((v, i) => (
                <tr key={v.num_pdv} style={{background: i % 2 === 0 ? '#f4f4f4' : '#fff'}}>
                  <td style={{padding: 8, border: 'none', color: '#a1000b', fontWeight: 600}}>{i + 1}</td>
                  <td style={{padding: 8, border: 'none', color: '#888', fontWeight: 600}}>{v.num_pdv}</td>
                  <td style={{padding: 8, border: 'none', color: '#e30613', fontWeight: 'bold'}}>{v.visitas}</td>
                  <td style={{padding: 8, border: 'none', color: '#444', fontWeight: 600}}>{totalVisitas ? ((v.visitas / totalVisitas) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              {visitasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} style={{textAlign: 'center', padding: 16, color: '#888', fontWeight: 500}}>Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Filtro flotante */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 12 : 18,
        right: isMobile ? 12 : 18,
        zIndex: 30
      }}>
        <button
          onClick={() => setShowFiltro(v => !v)}
          style={{
            background: '#e30613',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            padding: isMobile ? '14px 28px' : '10px 18px',
            fontWeight: 'bold',
            fontSize: isMobile ? 18 : 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer'
          }}
        >
          Filtros
        </button>
        {showFiltro && (
          <div style={{
            position: 'absolute',
            bottom: isMobile ? 60 : 50,
            right: 0,
            background: '#fff',
            border: '1.5px solid #e30613',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: isMobile ? 10 : 16,
            zIndex: 10,
            minWidth: isMobile ? 170 : 220
          }}>
            <label style={{
              fontWeight: 600,
              color: '#a1000b',
              fontSize: isMobile ? 13 : 15,
              marginBottom: 6,
              marginRight: 6,
              display: 'block'
            }}>Filtrar por número de PDV</label>
            <input
              type="text"
              placeholder="Ej: 123..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? 6 : 8,
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: isMobile ? 13 : 15,
                marginBottom: 4,
                margin: 4,
                background: '#f4f4f4',
                fontFamily: 'Segoe UI, Arial, sans-serif'
              }}
            />
            <button
              style={{
                marginTop: 8,
                background: '#e30613',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: isMobile ? '6px 12px' : '6px 18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? 13 : 15
              }}
              onClick={() => setShowFiltro(false)}
              type="button"
            >Cerrar</button>
          </div>
        )}
      </div>
      <style>
        {`
        @media (max-width: 700px) {
          .kpi-pdv-box, .dashboard-bar-graph {
            max-width: 98vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .dashboard-bar-title {
            font-size: 15px !important;
            margin: 10px 0 6px 0 !important;
          }
          /* Oculta la tabla en móvil */
          .dashboard-table, .dashboard-table * {
            display: none !important;
          }
        }
        `}
      </style>
    </DashboardLayout>
  );
}
