import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener los datos de profundidad globales de Organización Terpel
 * Los datos ya vienen filtrados desde el backend según permisos del usuario
 * @param {object} filtros - Objeto con los filtros: { asesor, pdv, compania, agente }
 * @returns {object} { profundidad, loading, error, refetch }
 */
export function useProfundidadOT(filtros = {}) {
  const [profundidad, setProfundidad] = useState({
    pdvs: [],
    totalAsignados: 0,
    totalConProfundidad: 0,
    puntosProfundidad: 0,
    porcentaje: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar profundidad desde la API
  const fetchProfundidad = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //console.log('useProfundidadOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('useProfundidadOT: Consultando profundidad global con filtros:', filtros);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor) params.append('asesor_id', filtros.asesor);
      if (filtros.pdv) params.append('pdv_id', filtros.pdv);
      if (filtros.compania) params.append('compania', filtros.compania);
      if (filtros.agente) params.append('agente_id', filtros.agente);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/ot/profundidad${queryString ? `?${queryString}` : ''}`;
      
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
        //console.error('useProfundidadOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useProfundidadOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useProfundidadOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener la profundidad');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        //console.error('useProfundidadOT: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

        // console.log('useProfundidadOT: Datos recibidos correctamente', 
        //   `${data.pdvs.length} PDVs, ${data.totalConProfundidad}/${data.totalAsignados} con profundidad`);
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanPdvs = Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
        ...pdv,
        codigo: pdv.codigo || '',
        nombre: pdv.nombre || '',
        direccion: pdv.direccion || '',
        estado: pdv.estado || 'NO REGISTRADO',
        puntos: pdv.puntos || 0,
        asesor_nombre: pdv.asesor_nombre || '',
        asesor_email: pdv.asesor_email || ''
      })) : [];

      // Aplicar filtros de usuario OT si es necesario
      const filteredPdvs = filterByCompany(cleanPdvs, 'compania');
      
      if (shouldFilterData) {
          // console.log(`🔒 useProfundidadOT: Aplicando filtros de usuario OT - ${cleanPdvs.length} -> ${filteredPdvs.length} PDVs`, 
          //   `Compañías permitidas: [${allowedCompanies.join(', ')}]`);
      }

      // Recalcular totales con datos filtrados
      const filteredTotalAsignados = filteredPdvs.length;
      const filteredTotalConProfundidad = filteredPdvs.filter(pdv => pdv.estado === 'REGISTRADO').length;
      const filteredPuntosProfundidad = filteredPdvs.reduce((sum, pdv) => sum + (pdv.puntos || 0), 0);
      const filteredPorcentaje = filteredTotalAsignados > 0 ? (filteredTotalConProfundidad / filteredTotalAsignados) * 100 : 0;

      const cleanData = {
        pdvs: filteredPdvs,
        totalAsignados: filteredTotalAsignados,
        totalConProfundidad: filteredTotalConProfundidad,
        puntosProfundidad: filteredPuntosProfundidad,
        porcentaje: filteredPorcentaje
      };

      setProfundidad(cleanData);
      setLoading(false);

    } catch (err) {
      // console.error('useProfundidadOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchProfundidad();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchProfundidad();
  }, [filtros.asesor, filtros.pdv, filtros.compania, filtros.agente]);

  return {
    profundidad,
    loading,
    error,
    refetch
  };
}
