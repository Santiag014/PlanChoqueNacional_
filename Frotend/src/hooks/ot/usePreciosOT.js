import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook para       // Los datos ya vienen filtrados desde el backend según permisos del usuario
      const filteredTotalAsignados = cleanPdvs.length;
      const filteredTotalReportados = cleanPdvs.filter(pdv => pdv.estado === 'REPORTADOS').length;
      const filteredPuntosPrecios = data.puntosPrecios || 0;
      const filteredPorcentaje = filteredTotalAsignados > 0 ? (filteredTotalReportados / filteredTotalAsignados) * 100 : 0;

      const cleanData = {
        pdvs: cleanPdvs,
        totalAsignados: filteredTotalAsignados,
        totalReportados: filteredTotalReportados,
        puntosPrecios: filteredPuntosPrecios,
        porcentaje: filteredPorcentaje
      };

      setPrecios(cleanData);
      setLoading(false);s de precios globales de Organización Terpel
 * Los datos ya vienen filtrados desde el backend según permisos del usuario
 * @param {object} filtros - Objeto con los filtros: { asesor, pdv, compania, agente }
 * @returns {object} { precios, loading, error, refetch }
 */
export function usePreciosOT(filtros = {}) {
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
      //console.log('usePreciosOT: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('usePreciosOT: Consultando precios globales con filtros:', filtros);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor) params.append('asesor_id', filtros.asesor);
      if (filtros.pdv) params.append('pdv_id', filtros.pdv);
      if (filtros.compania) params.append('compania', filtros.compania);
      if (filtros.agente) params.append('agente_id', filtros.agente);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/ot/precios${queryString ? `?${queryString}` : ''}`;
      
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
        //console.error('usePreciosOT: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      // 🔍 LOG 1: Verificar respuesta completa del servidor
      console.log('📊 [PRECIOS OT] Respuesta completa del servidor:', {
        success: data.success,
        totalAsignados: data.totalAsignados,
        totalConCobertura: data.totalConCobertura,
        totalAceptados: data.totalAceptados,
        puntosPrecios: data.puntosPrecios,
        porcentaje: data.porcentaje,
        cantidadPDVs: data.pdvs?.length
      });
      
      if (!response.ok) {
        console.error('❌ [PRECIOS OT] Error de API:', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        console.error('❌ [PRECIOS OT] Respuesta con success=false:', data);
        setError(data.message || 'El servidor reportó un error al obtener los precios');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        console.error('❌ [PRECIOS OT] Datos incorrectos - pdvs no es un array:', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

      // 🔍 LOG 2: Verificar estructura de datos recibidos
      console.log('✅ [PRECIOS OT] Datos recibidos correctamente:', {
        totalPDVs: data.pdvs.length,
        primerPDV: data.pdvs[0],
        totalConCobertura_META: data.totalConCobertura,
        totalAceptados_REAL: data.totalAceptados,
        puntos: data.puntosPrecios
      });
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanPdvs = Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
        ...pdv,
        codigo: pdv.codigo || '',
        nombre: pdv.nombre || '',
        direccion: pdv.direccion || '',
        estado: pdv.estado || 'NO REPORTADOS',
        puntos: pdv.puntos || 0,
        asesor_nombre: pdv.asesor_nombre || '',
        asesor_email: pdv.asesor_email || '',
        cumplimiento: pdv.cumplimiento || null,
        fecha_registro: pdv.fecha_registro || null
      })) : [];

      // 🔍 LOG 3: Verificar estados de los PDVs
      const estadosCount = cleanPdvs.reduce((acc, pdv) => {
        acc[pdv.estado] = (acc[pdv.estado] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 [PRECIOS OT] Distribución de estados:', estadosCount);

      // Usar los datos del API (ya filtrados por el backend según permisos del usuario)
      // NOTA: Ahora totalReportados viene como totalAceptados del backend
      const cleanData = {
        pdvs: cleanPdvs,
        totalAsignados: data.totalAsignados || 0,           // Total de PDVs
        totalConCobertura: data.totalConCobertura || 0,     // META (con cobertura)
        totalReportados: data.totalAceptados || 0,          // REAL (registros aceptados)
        puntosPrecios: data.puntosPrecios || 0,            // Puntos calculados
        porcentaje: data.porcentaje || 0                   // Porcentaje de cumplimiento
      };

      // 🔍 LOG 4: Verificar datos finales procesados
      console.log('🎯 [PRECIOS OT] Datos finales procesados:', cleanData);

      setPrecios(cleanData);
      setLoading(false);

    } catch (err) {
      // console.error('usePreciosOT: Error en la petición', err);
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para refrescar los datos
  const refetch = () => {
    fetchPrecios();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchPrecios();
  }, [filtros.asesor, filtros.pdv, filtros.compania, filtros.agente]);

  return {
    precios,
    loading,
    error,
    refetch
  };
}
