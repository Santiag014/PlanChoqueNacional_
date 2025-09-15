import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * @fileoverview Hook para gestionar métricas de cobertura del asesor
 * 
 * Este hook proporciona funcionalidades para:
 * - Obtener datos de cobertura de PDVs asignados vs implementados
 * - Calcular puntos de cobertura basado en objetivos
 * - Gestionar estados de carga y errores
 * - Refrescar datos bajo demanda
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

/**
 * Hook para obtener la cobertura real del asesor
 * 
 * Obtiene y calcula métricas de cobertura incluyendo:
 * - Lista de PDVs asignados y su estado de implementación
 * - Total de PDVs asignados vs implementados
 * - Puntos de cobertura calculados según objetivos
 * 
 * @param {string|number} userId - ID del usuario asesor para filtrar datos
 * @returns {object} Objeto con las siguientes propiedades:
 * @returns {object} returns.cobertura - Datos de cobertura del asesor
 * @returns {Array} returns.cobertura.pdvs - Lista de PDVs con su estado
 * @returns {number} returns.cobertura.totalAsignados - Total de PDVs asignados
 * @returns {number} returns.cobertura.totalImplementados - Total de PDVs implementados
 * @returns {number} returns.cobertura.puntosCobertura - Puntos calculados de cobertura
 * @returns {boolean} returns.loading - Estado de carga de la petición
 * @returns {string|null} returns.error - Mensaje de error si existe
 * @returns {function} returns.refetch - Función para recargar los datos
 */
export function useCoberturaAsesor(userId) {
  // ============================================
  // ESTADOS DEL HOOK
  // ============================================
  
  /**
   * Estado principal que contiene los datos de cobertura
   * Estructura predeterminada con valores iniciales
   */
  const [cobertura, setCobertura] = useState({
    pdvs: [],                // Array de PDVs con información de implementación
    totalAsignados: 0,       // Contador total de PDVs asignados al asesor
    totalImplementados: 0,   // Contador total de PDVs implementados
    puntosCobertura: 0      // Puntos calculados según métricas de cobertura
  });

  /**
   * Estado de carga para mostrar indicadores en la UI
   */
  const [loading, setLoading] = useState(true);

  /**
   * Estado de error para manejo de fallos en la petición
   */
  const [error, setError] = useState(null);

  // ============================================
  // FUNCIONES PRINCIPALES
  // ============================================

  /**
   * Función principal para obtener datos de cobertura desde la API
   * Maneja autenticación, validaciones y procesamiento de respuesta
   */
  const fetchCobertura = async () => {
    // Validación de parámetros requeridos
    if (!userId) {
      //console.log('useCoberturaAsesor: No se ha definido el usuario.');
      setLoading(false);
      setError('No se ha definido el usuario.');
      return;
    }

    // ============================================
    // MANEJO DE AUTENTICACIÓN
    // ============================================
    
    // Verificar autenticación - intentar obtener el token de ambas posibles claves
    let token = localStorage.getItem('authToken'); // Primero intentar con authToken (sistema actual)
    if (!token) {
      token = localStorage.getItem('token'); // Si no existe, probar con token (sistema legacy)
    }

    if (!token) {
      //console.log('useCoberturaAsesor: No hay token de autenticación (ni authToken ni token).');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log(`useCoberturaAsesor: Consultando cobertura para usuario ${userId}`);
      
      // Realizar la petición
      const response = await fetch(`${API_URL}/api/asesor/cobertura/${userId}`, {
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
        //console.error('useCoberturaAsesor: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Procesar respuesta
      const data = await response.json();
      
      if (!response.ok) {
        //console.error('useCoberturaAsesor: Error de API', data);
        setError(data.message || `Error del servidor: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!data.success) {
        //console.error('useCoberturaAsesor: Respuesta con success=false', data);
        setError(data.message || 'El servidor reportó un error al obtener la cobertura');
        setLoading(false);
        return;
      }

      // Validar estructura de datos
      if (!Array.isArray(data.pdvs)) {
        //console.error('useCoberturaAsesor: Datos incorrectos - pdvs no es un array', data);
        setError('La estructura de datos recibida del servidor es incorrecta');
        setLoading(false);
        return;
      }

        // console.log('useCoberturaAsesor: Datos recibidos correctamente', 
        //   `${data.pdvs.length} PDVs, ${data.totalImplementados}/${data.totalAsignados} implementados`);
      
      // Asegurarnos de que todos los campos tengan valores válidos
      const cleanData = {
        pdvs: Array.isArray(data.pdvs) ? data.pdvs.map(pdv => ({
          ...pdv,
          codigo: pdv.codigo || '',
          nombre: pdv.nombre || '',
          direccion: pdv.direccion || '',
          estado: pdv.estado || 'NO REGISTRADO',
          puntos: pdv.puntos || 0,
          // Asegurar que id exista para poder filtrar correctamente
          id: pdv.id || pdv._id || `temp-${Math.random().toString(36).substring(2)}`
        })) : [],
        totalAsignados: data.totalAsignados || 0,
        totalImplementados: data.totalImplementados || 0,
        puntosCobertura: data.puntosCobertura || 0
      };
      
      setCobertura(cleanData);
      setLoading(false);
    } catch (err) {
      //console.error('useCoberturaAsesor: Error de excepción', err);
      setError(`Error de red o del servidor: ${err.message}`);
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando cambia el userId
  useEffect(() => {
    //.log(`useCoberturaAsesor: useEffect activado para userId ${userId}`);
    fetchCobertura();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { cobertura, loading, error, refetch: fetchCobertura };
}
