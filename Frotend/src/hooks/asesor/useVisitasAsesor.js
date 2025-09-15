import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de visitas del asesor
 * @param {string|number} userId - ID del usuario asesor
 * @returns {object} { visitas, loading, error, refetch }
 */
export function useVisitasAsesor(userId) {
  const [visitas, setVisitas] = useState({
    pdvs: [],
    meta_visitas: 0,
    real_visitas: 0,
    puntos: 0,
    porcentajeCumplimiento: 0,
    tiposVisita: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar visitas desde la API
  const fetchVisitas = async () => {
    if (!userId) {
      //console.log('useVisitasAsesor: No se ha definido el usuario.');
      setLoading(false);
      setError('No se ha definido el usuario.');
      return;
    }

    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //console.log('useVisitasAsesor: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log(`useVisitasAsesor: Consultando visitas para usuario ${userId}`);

      // Realizar la petición
      const response = await fetch(`${API_URL}/api/asesor/visitas/${userId}`, {
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
        //console.error('useVisitasAsesor: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useVisitasAsesor: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useVisitasAsesor: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener datos de visitas');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        //console.error('useVisitasAsesor: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      // console.log('useVisitasAsesor: Datos recibidos correctamente', 
      //   `${data.pdvs.length} PDVs, ${data.real_visitas}/${data.meta_visitas} visitas`);
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = {
        pdvs: Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
          ...pdv,
          codigo: pdv.codigo || '',
          nombre: pdv.nombre || 'Sin nombre',
          cantidadVisitas: pdv.cantidadVisitas || 0,
          meta: pdv.meta || 0,
          puntos: pdv.puntos || 0,
          porcentaje: pdv.porcentaje || 0,
          // Asegurar que id exista para poder filtrar correctamente
          id: pdv.id || pdv._id || `temp-${Math.random().toString(36).substring(2)}`
        })) : [],
        meta_visitas: data.meta_visitas || 0,
        real_visitas: data.real_visitas || 0,
        puntos: data.puntos || 0,
        porcentajeCumplimiento: data.porcentajeCumplimiento || 0,
        tiposVisita: Array.isArray(data.tiposVisita) ? data.tiposVisita.map(tipo => ({
          ...tipo,
          tipo: tipo.tipo || 'Desconocido',
          cantidad: tipo.cantidad || 0
        })) : []
      };
      
      setVisitas(cleanData);
      setLoading(false);
    } catch (err) {
      //console.error('useVisitasAsesor: Error de excepción', err);
      setError(`Error de red o del servidor: ${err.message}`);
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando cambia el userId
  useEffect(() => {
    //  console.log(`useVisitasAsesor: useEffect activado para userId ${userId}`);
    fetchVisitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { visitas, loading, error, refetch: fetchVisitas };
}
