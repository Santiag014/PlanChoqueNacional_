import { API_URL } from '../config';

export async function getVisitasPorPDV(asesorId) {
  if (!asesorId) throw new Error('ID de asesor no definido');
  const res = await fetch(`${API_URL}/api/visitas-pdv/${asesorId}`);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Respuesta inválida del servidor');
  }
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message || 'Error al obtener visitas');
}

// Mock temporal para evitar error de importación en Dashboard.jsx
export function getDashboardData(user) {
  // Devuelve datos de ejemplo
  return {
    ventas: [10, 15, 8, 20, 12, 18],
    meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    meta: 12
  };
}
