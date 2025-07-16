import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de precios globales de Organización Terpel
 * @returns {object} { precios, loading, error, refetch }
 */
export function usePreciosOT() {
  const [precios, setPrecios] = useState({
    pdvs: [],
    totalAsignados: 0,
    totalReportados: 0,
    puntosPrecios: 0,
    porcentaje: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar precios desde la API
  const fetchPrecios = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      console.log('usePreciosOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('usePreciosOT: Consultando precios globales');
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/ot/precios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Verificar tipo de contenido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('usePreciosOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        console.error('usePreciosOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        console.error('usePreciosOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener los precios');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        console.error('usePreciosOT: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      console.log('usePreciosOT: Datos recibidos correctamente', 
        `${data.pdvs.length} PDVs, ${data.totalReportados}/${data.totalAsignados} reportados`);
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = {
        pdvs: Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
          ...pdv,
          codigo: pdv.codigo || '',
          nombre: pdv.nombre || '',
          direccion: pdv.direccion || '',
          estado: pdv.estado || 'NO REPORTADOS',
          puntos: pdv.puntos || 0,
          asesor_nombre: pdv.asesor_nombre || '',
          asesor_email: pdv.asesor_email || ''
        })) : [],
        totalAsignados: data.totalAsignados || 0,
        totalReportados: data.totalReportados || 0,
        puntosPrecios: data.puntosPrecios || 0,
        porcentaje: data.porcentaje || 0
      };

      setPrecios(cleanData);
      setLoading(false);

    } catch (err) {
      console.error('usePreciosOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchPrecios();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPrecios();
  }, []);

  return {
    precios,
    loading,
    error,
    refetch
  };
}
