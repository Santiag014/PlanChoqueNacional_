import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener bonificaciones de todos los asesores del agente (mercadeo)
 * @returns {object} { bonificaciones, loading, error, refetch }
 */
export function useBonificacionesMercadeo() {
  const [bonificaciones, setBonificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBonificaciones = async () => {
    let token = localStorage.getItem('authToken');
    if (!token) token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/mercadeo/bonificaciones`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || `Error del servidor: ${response.status}`);
        setBonificaciones([]);
        setLoading(false);
        return;
      }
      setBonificaciones(Array.isArray(data.bonificaciones) ? data.bonificaciones : []);
      setLoading(false);
    } catch (err) {
      setError(`Error de red o del servidor: ${err.message}`);
      setBonificaciones([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonificaciones();
  }, []);

  return { bonificaciones, loading, error, refetch: fetchBonificaciones };
}
