import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * @fileoverview Hook para gestionar métricas de profundidad de producto para Mercadeo
 * 
 * Este hook proporciona funcionalidades específicas para el área de mercadeo:
 * - Obtiene datos filtrados por id_agente del usuario autenticado
 * - Calcula métricas de profundidad de producto por territorio
 * - Proporciona datos agregados para análisis de mercadeo
 * - Maneja filtros adicionales por asesor y PDV específicos
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

/**
 * Hook para obtener métricas de profundidad filtradas por agente comercial
 * 
 * Características específicas para Mercadeo:
 * - Filtra automáticamente por id_agente del usuario logueado
 * - Proporciona vista agregada de profundidad en el territorio
 * - Permite filtros adicionales por asesor específico y PDV
 * - Calcula porcentajes de cumplimiento y métricas vs objetivos
 * 
 * Estructura de datos retornada:
 * - pdvs: Array de PDVs con métricas de profundidad
 * - data: Alias de pdvs para compatibilidad
 * - puntos: Puntos totales calculados de profundidad
 * - meta: Meta establecida para el territorio
 * - real: Valor real alcanzado
 * - porcentajeCumplimiento: Porcentaje de cumplimiento vs meta
 * 
 * @param {object} filtros - Filtros opcionales para refinar la consulta
 * @param {string} [filtros.asesor_id] - ID específico de asesor a filtrar
 * @param {string} [filtros.pdv_id] - ID específico de PDV a filtrar
 * @returns {object} Objeto con las siguientes propiedades:
 * @returns {object} returns.profundidad - Datos de profundidad del territorio
 * @returns {Array} returns.profundidad.pdvs - Lista de PDVs con métricas
 * @returns {Array} returns.profundidad.data - Alias de pdvs
 * @returns {number} returns.profundidad.puntos - Puntos totales de profundidad
 * @returns {number} returns.profundidad.meta - Meta establecida
 * @returns {number} returns.profundidad.real - Valor real alcanzado
 * @returns {number} returns.profundidad.porcentajeCumplimiento - % de cumplimiento
 * @returns {boolean} returns.loading - Estado de carga de la petición
 * @returns {string|null} returns.error - Mensaje de error si existe
 * @returns {function} returns.refetch - Función para recargar los datos
 */
export function useProfundidadMercadeo(filtros = {}) {
  // ============================================
  // ESTADOS DEL HOOK
  // ============================================
  
  /**
   * Estado principal que contiene los datos de profundidad
   * Estructura optimizada para componentes de mercadeo
   */
  const [profundidad, setProfundidad] = useState({
    pdvs: [],                       // Array principal de PDVs con métricas
    data: [],                       // Alias para compatibilidad con componentes
    puntos: 0,                      // Puntos totales calculados
    meta: 0,                        // Meta establecida para el territorio
    real: 0,                        // Valor real alcanzado
    porcentajeCumplimiento: 0       // Porcentaje de cumplimiento
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
   * Función principal para obtener datos de profundidad desde la API
   * Filtra automáticamente por agente comercial del usuario autenticado
   */
  const fetchProfundidad = async () => {
    // ============================================
    // VALIDACIÓN DE AUTENTICACIÓN
    // ============================================
    
    // Verificar token de autenticación desde múltiples ubicaciones posibles
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('token'); // Fallback para compatibilidad
    }

    if (!token) {
      //console.log('useProfundidadMercadeo: No hay token de autenticación.');
      setLoading(false);
      setError('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      //console.log('useProfundidadMercadeo: Consultando métricas de profundidad');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.asesor_id) params.append('asesor_id', filtros.asesor_id);
      if (filtros.pdv_id) params.append('pdv_id', filtros.pdv_id);
      
      const queryString = params.toString();
      const url = `${API_URL}/api/mercadeo/profundidad${queryString ? `?${queryString}` : ''}`;
      
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
        //console.error('useProfundidadMercadeo: Respuesta no JSON del servidor');
        setError('Respuesta inesperada del servidor. No se recibió JSON.');
        setLoading(false);
        return;
      }

      // Parsear respuesta
      const data = await response.json();
      //console.log('useProfundidadMercadeo: Respuesta recibida:', data);

      if (!response.ok) {
        //console.error('useProfundidadMercadeo: Error en la respuesta del servidor:', data);
        if (response.status === 401) {
          setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        } else if (response.status === 403) {
          setError('No tiene permisos para acceder a esta información.');
        } else {
          setError(data.message || 'Error al cargar métricas de profundidad.');
        }
        setLoading(false);
        return;
      }

      // Verificar estructura de respuesta
      if (!data.success) {
        //console.error('useProfundidadMercadeo: Formato de respuesta inesperado:', data);
        setError('Formato de respuesta inesperado del servidor.');
        setLoading(false);
        return;
      }

      // Estructurar datos como los espera el componente (igual que OT)
      const profundidadData = {
        pdvs: data.pdvs || data.data || [],
        data: data.pdvs || data.data || [],
        puntos: data.puntos || 0,
        meta: data.meta || 0,
        real: data.real || 0,
        porcentajeCumplimiento: data.porcentajeCumplimiento || 0
      };

      //console.log('useProfundidadMercadeo: Métricas de profundidad cargadas exitosamente:', profundidadData);
      setProfundidad(profundidadData);
      setLoading(false);

    } catch (err) {
      //console.error('useProfundidadMercadeo: Error en la petición:', err);
      setError('Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = () => {
    fetchProfundidad();
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchProfundidad();
  }, [filtros.asesor_id, filtros.pdv_id]);

  return {
    profundidad,
    loading,
    error,
    refetch
  };
}
