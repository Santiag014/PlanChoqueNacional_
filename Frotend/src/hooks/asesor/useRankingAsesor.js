/**
 * @fileoverview Hook para gestionar el ranking de asesores de la empresa
 * Consume el endpoint /api/asesor/ranking-mi-empresa para obtener datos reales
 * del ranking y posicionamiento del asesor logueado
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { API_URL } from '../../config';

/**
 * Hook para obtener y gestionar datos del ranking de asesores de la empresa
 * @returns {Object} Estado y funciones para el manejo del ranking
 */
export const useRankingAsesor = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [filtrosData, setFiltrosData] = useState(null);
  const [filtrosActivos, setFiltrosActivos] = useState({
    departamento: 'todos',
    ciudad: 'todas'
  });

  /**
   * Función para obtener las opciones de filtros desde el API
   */
  const fetchFiltrosData = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/asesor/ranking-filtros`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setFiltrosData(data.filtros);
      }

    } catch (err) {
      //console.error('Error obteniendo filtros:', err);
      // No mostramos error para los filtros, solo lo logueamos
    }
  };

  /**
   * Función para obtener los datos del ranking desde el API
   */
  const fetchRankingData = async () => {
    if (!token) {
      setError('No hay token de autenticación');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/asesor/ranking-mi-empresa`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error desconocido del servidor');
      }

      setRankingData(data);

    } catch (err) {
      //console.error('Error obteniendo ranking:', err);
      setError(err.message || 'Error al cargar datos del ranking');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para preparar datos del podio (top 3) con filtros aplicados
   */
  const getPodiumData = () => {
    const rankingFiltrado = getRankingFiltrado();
    
    if (!rankingFiltrado || rankingFiltrado.length === 0) return [];

    const top3 = rankingFiltrado.slice(0, 3);
    
    // Reorganizar para mostrar en formato podio: 2do, 1ro, 3ro
    const podiumOrder = [];
    
    if (top3.length >= 2) podiumOrder.push({ 
      ...top3[1], 
      puesto: 2, 
      trofeo: '🥈', 
      color: '#b0b0b0',
      nombre: top3[1].name 
    });
    
    if (top3.length >= 1) podiumOrder.push({ 
      ...top3[0], 
      puesto: 1, 
      trofeo: '🥇', 
      color: '#ffd700',
      nombre: top3[0].name,
      puntos: top3[0].total_puntos
    });
    
    if (top3.length >= 3) podiumOrder.push({ 
      ...top3[2], 
      puesto: 3, 
      trofeo: '🥉', 
      color: '#cd7f32',
      nombre: top3[2].name 
    });

    return podiumOrder;
  };

  /**
   * Función para obtener datos de la tabla (posiciones 4 en adelante) con filtros aplicados
   */
  const getTableData = () => {
    const rankingFiltrado = getRankingFiltrado();
    
    if (!rankingFiltrado || rankingFiltrado.length === 0) return [];

    return rankingFiltrado
      .slice(3) // Del 4to en adelante
      .map(asesor => ({
        puesto: asesor.posicion,
        nombre: asesor.name,
        puntos: asesor.total_puntos,
        esUsuarioActual: asesor.es_usuario_actual,
        departamento: asesor.departamento,
        ciudad: asesor.ciudad
      }));
  };

  /**
   * Función para aplicar filtros al ranking
   */
  const getRankingFiltrado = () => {
    if (!rankingData?.ranking) return [];

    let rankingFiltrado = [...rankingData.ranking];

    // Filtrar por departamento
    if (filtrosActivos.departamento !== 'todos') {
      rankingFiltrado = rankingFiltrado.filter(asesor => 
        asesor.departamento_id == filtrosActivos.departamento
      );
    }

    // Filtrar por ciudad
    if (filtrosActivos.ciudad !== 'todas') {
      rankingFiltrado = rankingFiltrado.filter(asesor => 
        asesor.ciudad_id == filtrosActivos.ciudad
      );
    }

    // Recalcular posiciones después del filtrado
    rankingFiltrado.forEach((asesor, index) => {
      asesor.posicion = index + 1;
    });

    return rankingFiltrado;
  };

  /**
   * Función para cambiar filtros
   */
  const setFiltros = (nuevosFiltros) => {
    setFiltrosActivos(prev => ({
      ...prev,
      ...nuevosFiltros
    }));
  };

  /**
   * Función para obtener ciudades disponibles según el departamento seleccionado
   */
  const getCiudadesDisponibles = () => {
    if (!filtrosData) return [];

    if (filtrosActivos.departamento === 'todos') {
      return filtrosData.ciudades;
    }

    return filtrosData.ciudades.filter(ciudad => 
      ciudad.id === 'todas' || ciudad.id_departamento == filtrosActivos.departamento
    );
  };

  /**
   * Función para obtener información del usuario actual en el ranking
   */
  const getMyRankingInfo = () => {
    if (!rankingData) return null;

    return {
      posicion: rankingData.mi_posicion,
      puntos: rankingData.mi_info?.total_puntos || 0,
      nombre: rankingData.mi_info?.name || user?.name || 'Usuario',
      totalAsesores: rankingData.total_asesores,
      empresa: rankingData.empresa_info?.nombre_agente || 'Mi Empresa'
    };
  };

  /**
   * Función para recargar los datos del ranking
   */
  const refetchRanking = () => {
    fetchRankingData();
  };

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    if (user && token) {
      fetchFiltrosData();
      fetchRankingData();
    }
  }, [user, token]);

  // Efecto para recargar datos cuando cambian los filtros
  useEffect(() => {
    if (filtrosActivos.ciudad !== 'todas' && filtrosActivos.departamento !== 'todos') {
      // Si se cambia el departamento, resetear la ciudad si no pertenece al nuevo departamento
      const ciudadesDisponibles = getCiudadesDisponibles();
      const ciudadValida = ciudadesDisponibles.find(c => c.id == filtrosActivos.ciudad);
      
      if (!ciudadValida && filtrosActivos.ciudad !== 'todas') {
        setFiltrosActivos(prev => ({ ...prev, ciudad: 'todas' }));
      }
    }
  }, [filtrosActivos.departamento]);

  return {
    // Estados
    loading,
    error,
    rankingData,
    filtrosData,
    filtrosActivos,
    
    // Datos procesados con filtros
    podiumData: getPodiumData(),
    tableData: getTableData(),
    myRankingInfo: getMyRankingInfo(),
    
    // Funciones de filtros
    setFiltros,
    getCiudadesDisponibles,
    
    // Funciones
    refetchRanking: () => {
      fetchFiltrosData();
      fetchRankingData();
    },
    
    // Datos raw para usos específicos
    rawRanking: getRankingFiltrado(),
    empresaInfo: rankingData?.empresa_info || {},
    
    // Estadísticas con filtros
    totalAsesoresFiltrados: getRankingFiltrado().length
  };
};

export default useRankingAsesor;
