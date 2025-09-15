import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para obtener métricas de cobertura global de Organización Terpel
 * Los datos ya vienen filtrados desde el backend según permisos del usuario
 * @param {object} filtros - Objeto con los filtros: { asesor_id, pdv_id, compania }
 * @returns {object} { cobertura, loading, error, refetch }
 */
export function useCoberturaOT(filtros = {}) {
  const [cobertura, setCobertura] = useState({
    pdvs: [],
    totalAsignados: 0,
    totalImplementados: 0,
    puntosCobertura: 0,
    porcentaje: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar cobertura desde la API
  const fetchCobertura = async () => {
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //console.log('useCoberturaOT: No hay token de autenticación (ni authToken ni token).');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('useCoberturaOT: Consultando cobertura global con filtros:', filtros);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor) params.append('asesor_id', filtros.asesor);
      if (filtros.pdv) params.append('pdv_id', filtros.pdv);
      if (filtros.compania) params.append('compania', filtros.compania);
      if (filtros.agente) params.append('agente_id', filtros.agente);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/ot/cobertura${queryString ? `?${queryString}` : ''}`;
      
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
        //console.error('useCoberturaOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useCoberturaOT: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useCoberturaOT: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener la cobertura');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        //console.error('useCoberturaOT: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      //console.log('useCoberturaOT: Datos recibidos correctamente', 
      //  `${data.pdvs.length} PDVs, ${data.totalImplementados}/${data.totalAsignados} implementados`);

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

      // Los datos ya vienen filtrados desde el backend según permisos del usuario
      // Usar los totales que vienen del backend en lugar de recalcularlos
      const totalAsignados = data.totalAsignados || cleanPdvs.length;
      const totalImplementados = data.totalImplementados || cleanPdvs.filter(pdv => pdv.estado === 'REGISTRADO').length;
      const puntosCobertura = data.puntosCobertura || cleanPdvs.reduce((sum, pdv) => sum + (pdv.puntos || 0), 0);

      const cleanData = {
        pdvs: cleanPdvs,
        totalAsignados,
        totalImplementados,
        puntosCobertura,
        porcentaje: totalAsignados > 0 ? Math.round((totalImplementados / totalAsignados) * 100) : 0
      };

      setCobertura(cleanData);
      setLoading(false);

    } catch (err) {
      //console.error('useCoberturaOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchCobertura();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchCobertura();
  }, [filtros.asesor, filtros.pdv, filtros.compania, filtros.agente]);

  return {
    cobertura,
    loading,
    error,
    refetch
  };
}
