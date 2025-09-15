import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de visitas globales de Organización Terpel
 * Los datos ya vienen filtrados desde el backend según permisos del usuario
 * @param {object} filtros - Objeto con los filtros: { asesor, pdv, compania, agente }
 * @returns {object} { visitas, loading, error, refetch }
 */
export function useVisitasOT(filtros = {}) {
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
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //  console.log('useVisitasOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('useVisitasOT: Consultando visitas globales con filtros:', filtros);

      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor) params.append('asesor_id', filtros.asesor);
      if (filtros.pdv) params.append('pdv_id', filtros.pdv);
      if (filtros.compania) params.append('compania', filtros.compania);
      if (filtros.agente) params.append('agente_id', filtros.agente);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/ot/visitas${queryString ? `?${queryString}` : ''}`;
      
      // Realizar la petición
      const response = await fetch(url, {
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
        //console.error('useVisitasOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useVisitasOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useVisitasOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener las visitas');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        //console.error('useVisitasOT: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      //console.log('useVisitasOT: Datos recibidos correctamente', 
      //  `${data.pdvs.length} PDVs, Meta: ${data.meta_visitas}, Real: ${data.real_visitas}`);

      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanPdvs = Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
        ...pdv,
        codigo: pdv.codigo || '',
        nombre: pdv.nombre || '',
        cantidadVisitas: pdv.cantidadVisitas || 0,
        meta: pdv.meta || 20,
        puntos: pdv.puntos || 0,
        porcentaje: pdv.porcentaje || 0,
        asesor_nombre: pdv.asesor_nombre || '',
        asesor_email: pdv.asesor_email || ''
      })) : [];

      // Los datos ya vienen filtrados desde el backend según permisos del usuario

      // Recalcular totales con datos filtrados
      const filteredMetaVisitas = cleanPdvs.reduce((sum, pdv) => sum + (pdv.meta || 0), 0);
      const filteredRealVisitas = cleanPdvs.reduce((sum, pdv) => sum + (pdv.cantidadVisitas || 0), 0);
      const filteredPuntos = cleanPdvs.reduce((sum, pdv) => sum + (pdv.puntos || 0), 0);
      const filteredPorcentaje = filteredMetaVisitas > 0 ? (filteredRealVisitas / filteredMetaVisitas) * 100 : 0;

      const cleanData = {
        pdvs: cleanPdvs,
        meta_visitas: filteredMetaVisitas,
        real_visitas: filteredRealVisitas,
        puntos: filteredPuntos,
        porcentajeCumplimiento: filteredPorcentaje,
        tiposVisita: Array.isArray(data.tiposVisita) ? data.tiposVisita.map(tipo => ({
          ...tipo,
          tipo: tipo.tipo || '',
          cantidad: tipo.cantidad || 0
        })) : []
      };

      setVisitas(cleanData);
      setLoading(false);

    } catch (err) {
      //console.error('useVisitasOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchVisitas();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchVisitas();
  }, [filtros.asesor, filtros.pdv, filtros.compania, filtros.agente]);

  return {
    visitas,
    loading,
    error,
    refetch
  };
}
