import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
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
  // Memoriza el usuario solo una vez
  const user = useMemo(() => {
    let u = location.state?.user;
    if (!u) {
      try {
        u = JSON.parse(localStorage.getItem('user'));
      } catch {}
    }
    return u;
  }, [location.state?.user]);
  // Si no viene por state, intenta cargarlo de localStorage
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch {}
  }

  // Estado único para todos los datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    visitas: [],
    kpiDashboard: null,
    pdvMetas: [],
    kpiPuntos: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    kpiDashboard: null,
    pdvMetas: null,
    kpiPuntos: null,
  });

  // Popup para mostrar la tabla de todos los PDV
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([
        // Cambia aquí el endpoint de visitas
        fetch(`${API_URL}/api/visitas-pdv-resumen/${user.id}`).then(res => res.json()).catch(() => null),
        fetch(`${API_URL}/api/dashboard-kpi/${user.id}`).then(res => res.json()).catch(() => null),
        fetch(`${API_URL}/api/pdv-metas/${user.id}`).then(res => res.json()).catch(() => null),
        fetch(`${API_URL}/api/kpi-puntos/${user.id}`).then(res => res.json()).catch(() => null),
      ]).then(([visitasRes, kpiRes, metasRes, puntosRes]) => {
        setDashboardData({
          visitas: visitasRes?.success ? visitasRes.data : [],
          kpiDashboard: kpiRes?.success ? kpiRes : null,
          pdvMetas: metasRes?.success ? metasRes.data || [] : [],
          kpiPuntos: puntosRes?.success ? puntosRes.data || [] : [],
        });
        setErrors({
          kpiDashboard: !kpiRes?.success ? 'Hubo un error al cargar el KPI. Inténtelo de nuevo.' : null,
          pdvMetas: !metasRes?.success ? 'Hubo un error al cargar la gráfica de metas. Inténtelo de nuevo.' : null,
          kpiPuntos: !puntosRes?.success ? 'Hubo un error al cargar la gráfica de KPIs. Inténtelo de nuevo.' : null,
        });
        setLoading(false);
      });
    }
  }, [user?.id]); // Solo depende del id, no del objeto user completo

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const visitasFiltradas = dashboardData.visitas;
  const visitas = dashboardData.visitas;
  const kpiDashboard = dashboardData.kpiDashboard;
  const pdvMetas = dashboardData.pdvMetas;
  const kpiPuntos = dashboardData.kpiPuntos;
  const kpiDashboardError = errors.kpiDashboard;
  const pdvMetasError = errors.pdvMetas;
  const kpiPuntosError = errors.kpiPuntos;

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parámetros de la gráfica según dispositivo
  const barMaxHeight = isMobile ? 80 : 160;
  const maxMeta = Math.max(...pdvMetas.map(p => p.meta), 1);
  const kpiColors = ['#e30613', '#1bb934', '#ffa751', '#007bff', '#888'];
  const kpiColor = kpiDashboard?.porcentaje >= 70 ? '#1bb934' : '#e30613';

  // Modal: abrir tabla de todos los PDV
  function openPDVModal() {
    setModalOpen(true);
  }

  // --- NUEVO: Calcular puntos por KPI ---
  const kpiLabels = [
    { id: 1, label: 'VOLUMEN', color: '#e30613' },
    { id: 2, label: 'PRECIO', color: '#a1000b' },
    { id: 3, label: 'VISIBILIDAD', color: '#888' }
  ];
  const puntosPorKPI = kpiLabels.map(kpi => {
    const total = kpiPuntos
      .filter(p => p.kpi_id === kpi.id)
      .reduce((sum, p) => sum + (Number(p.puntos_kpi) || 0), 0);
    return { ...kpi, puntos: total };
  });

  return (
    <DashboardLayout user={user}>
      {/* KPI GRANDE: Solo conteo de puntos de venta (más pequeño) */}
      <div style={{
        width: isMobile ? '90vw' : 260,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: isMobile ? '8px 0 2px 0' : '12px 0 2px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: isMobile ? '18px auto 18px auto' : '10px 0 6px 0',
        maxWidth: isMobile ? '95vw' : 300,
        marginLeft: 'auto',
        marginRight: 'auto',
        position: 'relative',
        minHeight: isMobile ? 60 : 60
      }}>
        {/* Franja roja superior con clip-path */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: 22,
          background: '#e30613',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          clipPath: 'polygon(0 0, 95% 0, 100% 8px, 100% 100%, 0 100%)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 0
        }}>
          <span style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 11,
            padding: '0 12px',
            lineHeight: '22px',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            overflow: 'visible'
          }}>
            PUNTOS DE VENTA
          </span>
        </div>
        {/* Espacio para la franja */}
        <div style={{ height: 15 }} />
        {kpiDashboardError ? (
          <div style={{ color: '#e30613', fontWeight: 700, padding: 10, textAlign: 'center' }}>
            {kpiDashboardError}
          </div>
        ) : kpiDashboard ? (
          <div style={{
            fontSize: isMobile ? 28 : 38,
            fontWeight: 900,
            color: '#888',
            letterSpacing: 2,
            marginBottom: 0,
            fontFamily: 'Segoe UI, Arial, sans-serif',
            textAlign: 'center',
            marginTop: isMobile ? 0 : 4
          }}>
            {kpiDashboard.totalPDVs}
          </div>
        ) : (
          <div style={{ color: '#888', fontWeight: 500, padding: 10, textAlign: 'center' }}>
            Cargando KPI...
          </div>
        )}
      </div>

      {/* GRÁFICA DE BARRAS: Meta vs Real */}
      <div
        style={{
          width: isMobile ? '90vw' : '100%',
          background: '#fff',
          borderRadius: 12,
          // boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '0 0 8px 0',
          margin: isMobile ? '10px auto 15px auto' : '0 auto 12px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: isMobile ? '98vw' : 900,
          overflowX: 'auto',
          position: 'relative'
        }}
      >
        {/* Franja roja superior con clip-path */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: 25,
          background: '#e30613',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          clipPath: 'polygon(0 0, 95% 0, 100% 15px, 100% 100%, 0 100%)'
        }}>
          <span style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            padding: '0 16px',
            lineHeight: '30px',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            overflow: 'visible'
          }}>
            REGISTROS PDVs
          </span>
        </div>
        {/* Espacio para la franja */}
        <div style={{ height: 30 }} />
        {/* Leyenda superior para colores */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          marginBottom: 2,
          marginTop: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-block',
              width: 18,
              height: 10,
              background: '#b0b0b0',
              borderRadius: 3,
              border: '1px solid #bbb',
              marginRight: 3
            }} />
            <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>Meta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-block',
              width: 18,
              height: 10,
              background: '#e30613',
              borderRadius: 3,
              border: '1px solid #e30613',
              marginRight: 3
            }} />
            <span style={{ fontSize: 13, color: '#e30613', fontWeight: 600 }}>Real</span>
          </div>
        </div>
        {pdvMetasError ? (
          <div style={{ color: '#e30613', fontWeight: 700, padding: 16, textAlign: 'center' }}>
            {pdvMetasError}
          </div>
        ) : pdvMetas.length > 0 ? (
          <>
            <div
              style={{ width: '100%', overflowX: 'auto', cursor: 'pointer' }}
              onClick={openPDVModal}
              title="Ver tabla de todos los PDV"
            >
              <svg
                width={Math.max(220, pdvMetas.length * 60)}
                height={barMaxHeight + 40}
                style={{ marginBottom: 8, display: 'block', height: barMaxHeight + 40 }}
              >
                {/* Ejes */}
                <line x1="40" y1={20} x2="40" y2={barMaxHeight + 20} stroke="#b0b0b0" />
                <line x1="40" y1={barMaxHeight + 20} x2={Math.max(200, pdvMetas.length * 60)} y2={barMaxHeight + 20} stroke="#b0b0b0" />
                {/* Barras */}
                {pdvMetas.map((pdv, i) => {
                  const metaH = pdv.meta > 0 ? Math.round((pdv.meta / maxMeta) * barMaxHeight) : 0;
                  const realH = pdv.real > 0 ? Math.round((pdv.real / maxMeta) * barMaxHeight) : 0;
                  // Siempre gris para meta, siempre rojo para real (aunque sobrecumpla)
                  return (
                    <g key={pdv.codigo}>
                      {/* Meta */}
                      <rect
                        x={50 + i * 50}
                        y={barMaxHeight + 20 - metaH}
                        width={18}
                        height={metaH}
                        fill="#b0b0b0"
                        rx={3}
                      />
                      {/* Real */}
                      <rect
                        x={50 + i * 50 + 20}
                        y={barMaxHeight + 20 - realH}
                        width={18}
                        height={realH}
                        fill="#e30613"
                        rx={3}
                      />
                      {/* Etiqueta */}
                      <text
                        x={50 + i * 50 + 9}
                        y={barMaxHeight + 35}
                        textAnchor="middle"
                        fontSize={isMobile ? "10" : "13"}
                        fill="#a1000b"
                        fontWeight="bold"
                      >
                        {pdv.codigo}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 6 }}>
              Haz clic en la gráfica para ver la tabla completa de PDV
            </div>
          </>
        ) : (
          <div style={{ color: '#888', fontWeight: 500, padding: 16, textAlign: 'center' }}>
            Cargando gráfica de metas...
          </div>
        )}
      </div>

      {/* MODAL DETALLE: Tabla de todos los PDV */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              minWidth: 320,
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 24px #0002',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#e30613', cursor: 'pointer'
              }}
              aria-label="Cerrar"
            >×</button>
            <h3 style={{ color: '#e30613', marginBottom: 8 }}>Detalle de todos los PDV</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ background: '#ffe5e5' }}>
                  <th style={{ color: '#888', fontWeight: 700, padding: 8 }}>PDV</th>
                  <th style={{ color: '#a1000b', fontWeight: 700, padding: 8 }}>Meta</th>
                  <th style={{ color: '#1bb934', fontWeight: 700, padding: 8 }}>Real</th>
                  <th style={{ color: '#e30613', fontWeight: 700, padding: 8 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {pdvMetas.map((pdv, i) => {
                  const porcentaje = pdv.meta > 0 ? (pdv.real / pdv.meta) * 100 : 0;
                  const colorPorcentaje = porcentaje >= 70 ? '#1bb934' : '#e30613';
                  return (
                    <tr key={pdv.codigo} style={{ background: i % 2 === 0 ? '#f4f4f4' : '#fff' }}>
                      <td style={{ textAlign: 'center', color: '#888', fontWeight: 600, padding: 8 }}>{pdv.codigo}</td>
                      <td style={{ textAlign: 'center', color: '#a1000b', fontWeight: 600, padding: 8 }}>{pdv.meta}</td>
                      <td style={{ textAlign: 'center', color: '#1bb934', fontWeight: 600, padding: 8 }}>{pdv.real}</td>
                      <td style={{ textAlign: 'center', color: colorPorcentaje, fontWeight: 700, padding: 8 }}>
                        {porcentaje ? porcentaje.toFixed(1) : 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- NUEVO: Caja de KPIs tipo gráfica con franja roja --- */}
      <div style={{
        width: isMobile ? '90vw' : 420,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        margin: '18px auto 60px auto',
        padding: isMobile ? '0 0 16px 0' : '0 0 24px 0',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Franja roja superior */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: 25,
          background: '#e30613',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          clipPath: 'polygon(0 0, 95% 0, 100% 12px, 100% 100%, 0 100%)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 0,
          marginBottom: isMobile ? 50 : 8
        }}>
          <span style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 11, // Letra más pequeña para "KPI's"
            padding: '0 16px',
            lineHeight: '30px',
            letterSpacing: 1,
            whiteSpace: 'nowrap'
          }}>
            KPI's
          </span>
        </div>
        {/* Espacio para la franja */}
        <div style={{ height: 30 }} />
        {/* KPIs alineados y unidos */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          width: '100%',
          gap: 0, // Sin separación para que se vean unidos
          marginTop: isMobile ? 10 : 18
        }}>
          {puntosPorKPI.map((kpi, idx) => (
            <div key={kpi.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minWidth: isMobile ? 80 : 100,
                margin: 0,
                border: 'none', // Sin borde
                borderRight: idx < 2 ? '1px solid #eee' : 'none', // Línea divisoria sutil entre KPIs
                background: '#fff'
              }}>
              {/* "Barra" visual */}
              <div style={{
                width: isMobile ? 80 : 48,
                height: 70 + (kpi.puntos * 2),
                background: '#f4f4f4',
                borderRadius: 8,
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                boxShadow: 'none',
                marginBottom: 8,
                transition: 'height 0.3s'
              }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: kpi.color,
                  marginTop: 8,
                  marginBottom: 2,
                  textAlign: 'center'
                }}>
                  {kpi.puntos}
                </span>
                <span style={{
                  fontSize: 12,
                  color: '#888',
                  fontWeight: 500,
                  marginBottom: 6
                }}>
                  pts
                </span>
              </div>
              {/* Etiqueta */}
              <div style={{
                fontWeight: 700,
                fontSize: 13, // Más pequeña la letra del KPI
                color: kpi.color,
                letterSpacing: 1.1,
                textAlign: 'center',
                marginTop: 2
              }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
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
                  <td style={{padding: 8, border: 'none', color: '#444', fontWeight: 600}}>
                    {v.porcentaje ? v.porcentaje.toFixed(1) : 0}%
                  </td>
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